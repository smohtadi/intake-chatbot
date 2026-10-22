import Card from "@/components/ui/card/card";
import PriorityBadge from "@/features/intake/priority-badge";
import {
  FIELD_LABELS,
  formatFieldValue,
  INTAKE_FIELDS,
  type IIntakeState,
} from "@/schemas/intake-schema";
import styles from "@/features/intake/styles.module.css";

type Props = Pick<IIntakeState, "data" | "declined" | "missing" | "priority">;

/** Lists the fields the server reports as collected, declined or still missing. */
export default function TicketSidebar({ data, declined, missing, priority }: Props) {
  const fields = INTAKE_FIELDS.filter(
    (field) => data[field] !== undefined || declined.includes(field) || missing.includes(field),
  );

  return (
    <Card as="aside" className={styles.sidebar} aria-labelledby="ticket-details-heading">
      <div className={styles.sidebarHeader}>
        <h2 id="ticket-details-heading" className={styles.sidebarTitle}>
          Ticket details
        </h2>
        {priority && <PriorityBadge priority={priority} />}
      </div>
      <dl className={styles.fieldList}>
        {fields.map((field) => {
          const value = data[field];
          return (
            <div key={field} className={styles.fieldRow}>
              <dt className={styles.fieldName}>{FIELD_LABELS[field]}</dt>
              {value !== undefined ? (
                <dd>{formatFieldValue(field, value)}</dd>
              ) : (
                <dd className={styles.fieldMuted}>
                  {declined.includes(field) ? "Not provided" : "not yet collected"}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
