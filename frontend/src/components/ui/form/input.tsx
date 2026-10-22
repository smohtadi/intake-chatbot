import clsx from "clsx";
import type { ComponentProps } from "react";
import { useFieldControl } from "@/components/ui/form/use-field-control";
import styles from "@/components/ui/form/styles.module.css";

type Props = ComponentProps<"input">;

export default function Input({ className, ...props }: Props) {
  return (
    <input
      {...useFieldControl(props)}
      className={clsx(styles.input, className)}
    />
  );
}
