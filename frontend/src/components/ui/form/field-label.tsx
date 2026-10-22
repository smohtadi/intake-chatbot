import clsx from "clsx";
import { useContext, type ComponentProps } from "react";
import FieldContext from "@/components/ui/form/field-context";
import styles from "@/components/ui/form/styles.module.css";

type Props = ComponentProps<"label">;

export default function FieldLabel({ className, htmlFor, ...props }: Props) {
  const { controlId, required } = useContext(FieldContext);
  return (
    <label
      {...props}
      className={clsx(
        styles.fieldLabel,
        required && styles.fieldLabelRequired,
        className,
      )}
      htmlFor={htmlFor ?? (controlId || undefined)}
    />
  );
}
