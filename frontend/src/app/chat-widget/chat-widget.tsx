import { useEffect, useRef, type MouseEvent } from "react";
import { MessageCircleIcon, RotateCcwIcon, XIcon } from "lucide-react";
import Button from "@/components/ui/button/button";
import ChatChoices from "@/features/match/chat-choices";
import ChatPane from "@/features/match/chat-pane";
import {
  chatClosed,
  chatOpened,
  choiceMade,
  CHOICES,
  sendChatMessage,
  startedOver,
  type ChatStep,
} from "@/store/match/chat-slice";
import { useAppDispatch } from "@/store/useAppDispatch";
import { useAppSelector } from "@/store/useAppSelector";
import styles from "@/app/chat-widget/styles.module.css";

const TITLE = "Find a specialist";
const AUTO_OPENED_KEY = "chat-auto-opened";

const CHOICES_BY_STEP: Record<ChatStep, readonly string[]> = {
  childYouth: [CHOICES.yes, CHOICES.no],
  describe: [],
  chat: [],
  done: [],
};

const STEPS_WITH_INPUT: readonly ChatStep[] = ["describe", "chat"];

/** True only the first time it's called in this browser tab. Storage can be blocked, which counts as the first time. */
function isFirstVisitInTab() {
  try {
    if (sessionStorage.getItem(AUTO_OPENED_KEY)) return false;
    sessionStorage.setItem(AUTO_OPENED_KEY, "1");
  } catch {
    // Private mode or blocked storage: open anyway.
  }
  return true;
}

/**
 * Floating button plus the specialist-matching chat in a modal. Opens by itself once per tab.
 * The chat lives in the store, so it survives closing and navigation.
 */
export default function ChatWidget() {
  const dispatch = useAppDispatch();
  const chat = useAppSelector((state) => state.chat);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isWaiting = chat.pendingRequestId !== null;
  const choices = CHOICES_BY_STEP[chat.step];

  useEffect(() => {
    if (isFirstVisitInTab()) dispatch(chatOpened());
  }, [dispatch]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (chat.isOpen && !dialog?.open) dialog?.showModal();
    if (!chat.isOpen && dialog?.open) dialog.close();
  }, [chat.isOpen]);

  const close = () => dispatch(chatClosed());
  const startOver = () => dispatch(startedOver());
  /** The dialog has no padding, so a click whose target is the dialog itself landed on the backdrop. */
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };

  return (
    <>
      <Button variant="primary" className={styles.launcher} onClick={() => dispatch(chatOpened())}>
        <MessageCircleIcon aria-hidden="true" />
        {TITLE}
      </Button>
      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="chat-title" onClose={close} onClick={closeOnBackdrop}>
        <header className={styles.header}>
          <h2 id="chat-title" className={styles.title}>
            {TITLE}
          </h2>
          <div className={styles.headerActions}>
            <Button appearance="ghost" size="icon" aria-label="Start over" title="Start over" onClick={startOver}>
              <RotateCcwIcon aria-hidden="true" />
            </Button>
            <Button appearance="ghost" size="icon" aria-label="Close chat" title="Close" onClick={close}>
              <XIcon aria-hidden="true" />
            </Button>
          </div>
        </header>
        {chat.isOpen && (
          <ChatPane
            entries={chat.entries}
            pendingText={chat.pendingText}
            isWaiting={isWaiting}
            error={chat.turnError}
            onRetry={() => chat.pendingText !== null && dispatch(sendChatMessage(chat.pendingText))}
            onSend={(text) => dispatch(sendChatMessage(text))}
            onStartOver={startOver}
            showInput={STEPS_WITH_INPUT.includes(chat.step)}
            quickReplies={
              choices.length > 0 && (
                <ChatChoices
                  choices={choices}
                  disabled={isWaiting || chat.pendingText !== null}
                  onChoose={(choice) => dispatch(choiceMade(choice))}
                />
              )
            }
          />
        )}
      </dialog>
    </>
  );
}
