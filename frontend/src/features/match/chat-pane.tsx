import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { SendIcon } from "lucide-react";
import clsx from "clsx";
import Button from "@/components/ui/button/button";
import Form from "@/components/ui/form/form";
import SpecialistCard from "@/features/match/specialist-card";
import { looksSensitive } from "@/features/match/sensitive-data";
import type { IChatEntry, ITurnError } from "@/schemas/match-schema";
import styles from "@/features/match/styles.module.css";

export const MAX_MESSAGE_LENGTH = 1000;

interface Props {
  entries: IChatEntry[];
  /** The message being sent, shown until the reply arrives or the send fails. */
  pendingText: string | null;
  isWaiting: boolean;
  error: ITurnError | null;
  onRetry: () => void;
  onSend: (text: string) => void;
  onStartOver: () => void;
  /** Quick-reply buttons shown under the latest message. */
  quickReplies?: ReactNode;
  showInput?: boolean;
}

export default function ChatPane({
  entries,
  pendingText,
  isWaiting,
  error,
  onRetry,
  onSend,
  onStartOver,
  quickReplies,
  showInput = true,
}: Props) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [entries.length, pendingText, isWaiting, error]);

  return (
    <div className={styles.chat}>
      <ol ref={listRef} className={styles.messages} aria-live="polite" aria-busy={isWaiting}>
        {entries.map((entry, index) => (
          <MessageBubble key={index} entry={entry} />
        ))}
        {pendingText !== null && <MessageBubble entry={{ role: "user", content: pendingText }} />}
        {isWaiting && (
          <li className={styles.typing} role="status">
            Assistant is typing…
          </li>
        )}
        {error && (
          <li className={styles.turnError} role="alert">
            {error.message}
            <Button variant="secondary" onClick={error.canRetry ? onRetry : onStartOver}>
              {error.canRetry ? "Retry" : "Start over"}
            </Button>
          </li>
        )}
        {quickReplies && <li>{quickReplies}</li>}
      </ol>
      {showInput && <MessageInput disabled={isWaiting || pendingText !== null} onSend={onSend} />}
    </div>
  );
}

function MessageBubble({ entry }: { entry: IChatEntry }) {
  const isUser = entry.role === "user";
  return (
    <li className={clsx(styles.entry, isUser && styles.userEntry)}>
      <p className={clsx(styles.message, isUser ? styles.userMessage : styles.botMessage)}>
        <span className="sr-only">{isUser ? "You:" : "Assistant:"}</span>
        {entry.content}
      </p>
      {entry.specialists && entry.specialists.length > 0 && (
        <ul className={styles.cards} aria-label="Matching specialists">
          {entry.specialists.map((specialist) => (
            <li key={specialist.id}>
              <SpecialistCard specialist={specialist} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function MessageInput({ disabled, onSend }: { disabled: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const showSensitiveWarning = looksSensitive(text);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <Form className={styles.inputForm} onSubmit={handleSubmit}>
      <Form.Field
        controlId="chat-message"
        className={styles.inputField}
        hint={showSensitiveWarning ? "This looks like a card or ID number. Please don't share personal details." : undefined}
      >
        <Form.Label className="sr-only">Message</Form.Label>
        <Form.Input
          autoComplete="off"
          disabled={disabled}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Type your message"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </Form.Field>
      <Button type="submit" variant="primary" size="icon" aria-label="Send" disabled={disabled || !text.trim()}>
        <SendIcon aria-hidden="true" />
      </Button>
    </Form>
  );
}
