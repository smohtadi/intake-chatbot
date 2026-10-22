import clsx from "clsx";
import type { ComponentProps } from "react";
import { useFieldControl } from "@/components/ui/form/use-field-control";
import styles from "@/components/ui/form/styles.module.css";

type Props = ComponentProps<"textarea">;

export default function TextArea({ className, ...props }: Props) {
  return (
    <textarea
      {...useFieldControl(props)}
      className={clsx(styles.input, styles.textarea, className)}
    />
  );
}
