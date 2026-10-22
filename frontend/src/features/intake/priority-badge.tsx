import clsx from "clsx";
import Badge from "@/components/ui/badge/badge";
import type { Priority } from "@/schemas/intake-schema";
import styles from "@/features/intake/styles.module.css";

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge
      variant={priority === "P1" ? "danger" : undefined}
      className={clsx(styles.priority, styles[`priority${priority}`])}
    >
      {priority}
    </Badge>
  );
}
