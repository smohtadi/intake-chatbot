import clsx from "clsx";
import {
  useId,
  useMemo,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import FieldContext from "@/components/ui/form/field-context";
import styles from "@/components/ui/form/styles.module.css";

interface Props extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  controlId: string;
  error?: string;
  // Help text shown under the control and read as part of its description.
  hint?: ReactNode;
  ref?: Ref<HTMLElement>;
  // Marks the label and the control as required. Validation stays in the
  // form's schema.
  required?: boolean;
}

/**
 * Wraps a label and a control. The control picks up `controlId`, `required`
 * and, as its description, `hint` and `error`. The error is not a live region:
 * on submit react-hook-form focuses the first invalid control, and the screen
 * reader reads its description then.
 */
export default function Field({
  as: Component = "div",
  children,
  className,
  controlId,
  error = "",
  hint,
  required = false,
  ...props
}: Props) {
  const errorId = useId();
  const generatedHintId = useId();
  const hintId = hint ? generatedHintId : undefined;
  const context = useMemo(
    () => ({ controlId, error, errorId, hintId, required }),
    [controlId, error, errorId, hintId, required],
  );
  return (
    <FieldContext.Provider value={context}>
      <Component {...props} className={clsx(styles.field, className)}>
        {children}
        {hint && (
          <span id={hintId} className={styles.fieldHint}>
            {hint}
          </span>
        )}
        {error && (
          <span id={errorId} className={styles.fieldError}>
            {error}
          </span>
        )}
      </Component>
    </FieldContext.Provider>
  );
}
