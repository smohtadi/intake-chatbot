import { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/card/card";
import Loader from "@/components/ui/loader/loader";
import ChatPane, { type ITurnError } from "@/features/intake/chat-pane";
import SummaryPanel from "@/features/intake/summary-panel";
import TicketSidebar from "@/features/intake/ticket-sidebar";
import { paths } from "@/config/paths";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  useCreateSessionMutation,
  useGetSessionQuery,
  useSendMessageMutation,
  useSubmitMutation,
} from "@/store/intake/intake-api";
import styles from "@/app/routes/intake/styles.module.css";

const REPLACE_EDITS_PROMPT = "Your details changed. Replace your edited summary with a new one?";

function getErrorInfo(error: unknown) {
  const { status, data } = (error ?? {}) as { status?: number; data?: { title?: string } };
  return { status, title: data?.title };
}

function toTurnError(error: unknown): ITurnError {
  const { title } = getErrorInfo(error);
  return {
    message: getApiErrorMessage(title) ?? "Something went wrong. Please try again.",
    canRetry: title === undefined || title === "LLM_ERROR",
  };
}

/** Loads the user's intake session and starts one when none exists. */
function useCurrentSession() {
  const query = useGetSessionQuery(undefined, { refetchOnMountOrArgChange: true });
  const [createSession] = useCreateSessionMutation();
  const hasRequestedCreate = useRef(false);
  const isMissing = getErrorInfo(query.error).status === 404;

  useEffect(() => {
    if (!isMissing || hasRequestedCreate.current) return;
    hasRequestedCreate.current = true;
    createSession();
  }, [isMissing, createSession]);

  return { session: query.data, hasLoadError: query.isError && !isMissing, createSession };
}

export default function IntakeRoute() {
  const { session, hasLoadError, createSession } = useCurrentSession();
  const [sendMessage, { isLoading: isWaiting }] = useSendMessageMutation();
  const [submit, { isLoading: isSubmitting }] = useSubmitMutation();
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [turnError, setTurnError] = useState<ITurnError | null>(null);
  const [isBackInChat, setIsBackInChat] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null);

  const acceptNewSummary = () => {
    if (summaryDraft === null || window.confirm(REPLACE_EDITS_PROMPT)) setSummaryDraft(null);
    setIsBackInChat(false);
  };

  const send = async (text: string) => {
    setPendingText(text);
    setTurnError(null);
    try {
      const result = await sendMessage(text).unwrap();
      setPendingText(null);
      if (result.complete) acceptNewSummary();
    } catch (error) {
      setTurnError(toTurnError(error));
    }
  };

  const startNew = () => {
    setPendingText(null);
    setTurnError(null);
    setIsBackInChat(false);
    setSummaryDraft(null);
    createSession();
  };

  const submitSummary = async (summary: string) => {
    try {
      await submit(summary).unwrap();
    } catch {
      // api-client already shows the error as a toast.
    }
  };

  if (hasLoadError) return <Card className={styles.loadError}>Could not load your intake. Please refresh the page.</Card>;
  if (!session) return <Loader label="Starting your intake…" />;

  const summary = summaryDraft ?? session.summary ?? "";
  const showSummary =
    session.priority !== null && (session.status === "submitted" || (session.complete && !isBackInChat));

  return (
    <div className={styles.layout}>
      <title>{paths.intake.getDocTitle()}</title>
      <ChatPane
        messages={session.messages}
        pendingText={pendingText}
        isWaiting={isWaiting}
        error={turnError}
        onRetry={() => pendingText !== null && send(pendingText)}
        onSend={send}
        onStartNew={startNew}
        footer={
          showSummary && session.priority ? (
            <SummaryPanel
              summary={summary}
              priority={session.priority}
              ticketNumber={session.ticketNumber}
              isSubmitting={isSubmitting}
              onChange={setSummaryDraft}
              onBackToChat={() => setIsBackInChat(true)}
              onSubmit={() => submitSummary(summary)}
              onStartNew={startNew}
            />
          ) : undefined
        }
      />
      <TicketSidebar
        data={session.data}
        declined={session.declined}
        missing={session.missing}
        priority={session.priority}
      />
    </div>
  );
}
