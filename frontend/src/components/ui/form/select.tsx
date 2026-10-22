import clsx from "clsx";
import type { ComponentProps } from "react";
import { useFieldControl } from "@/components/ui/form/use-field-control";
import styles from "@/components/ui/form/styles.module.css";

type Props = ComponentProps<"select">;

// The wrapper draws the arrow, so it follows the text color in every theme.
export default function Select({ className, ...props }: Props) {
  return (
    <span className={styles.selectWrapper}>
      <select
        {...useFieldControl(props)}
        className={clsx(styles.select, className)}
      />
    </span>
  );
}
