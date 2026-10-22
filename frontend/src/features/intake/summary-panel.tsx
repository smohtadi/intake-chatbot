import Button from "@/components/ui/button/button";
import Form from "@/components/ui/form/form";
import PriorityBadge from "@/features/intake/priority-badge";
import type { Priority } from "@/schemas/intake-schema";
import styles from "@/features/intake/styles.module.css";

export const MAX_SUMMARY_LENGTH = 5000;

interface Props {
  summary: string;
  priority: Priority;
  ticketNumber?: string;
  isSubmitting: boolean;
  onChange: (summary: string) => void;
  onBackToChat: () => void;
  onSubmit: () => void;
  onStartNew: () => void;
}

export default function SummaryPanel({
  summary,
  priority,
  ticketNumber,
  isSubmitting,
  onChange,
  onBackToChat,
  onSubmit,
  onStartNew,
}: Props) {
  const isSubmitted = ticketNumber !== undefined;

  return (
    <section className={styles.summary} aria-labelledby="summary-heading">
      <div className={styles.summaryHeader}>
        <h2 id="summary-heading" className={styles.summaryTitle}>
          Ticket summary
        </h2>
        <PriorityBadge priority={priority} />
      </div>
      {isSubmitted && (
        <p className={styles.confirmation} role="status">
          Submitted as <strong>{ticketNumber}</strong>. A technician will follow up.
        </p>
      )}
      <Form.Field controlId="ticket-summary" hint={isSubmitted ? undefined : "Edit anything before submitting."}>
        <Form.Label>Summary</Form.Label>
        <Form.TextArea
          className={styles.summaryText}
          maxLength={MAX_SUMMARY_LENGTH}
          readOnly={isSubmitted}
          rows={14}
          value={summary}
          onChange={(event) => onChange(event.target.value)}
        />
      </Form.Field>
      <div className={styles.summaryActions}>
        {isSubmitted ? (
          <Button variant="primary" onClick={onStartNew}>
            Start new intake
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onBackToChat} disabled={isSubmitting}>
              Back to chat
            </Button>
            <Button variant="primary" onClick={onSubmit} isLoading={isSubmitting} disabled={!summary.trim()}>
              Submit
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
