import clsx from "clsx";
import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type ComponentProps,
} from "react";
import { useFieldControl } from "@/components/ui/form/use-field-control";
import styles from "@/components/ui/form/styles.module.css";

type BaseProps = Omit<ComponentProps<"input">, "type"> & {
  type?: "checkbox" | "radio";
  // Only settable from script; renders the "some selected" state.
  indeterminate?: boolean;
};

// Without a visible label (e.g. a table row selector) the checkbox still
// needs an accessible name, so one of the aria props becomes required.
type Props = BaseProps &
  (
    | { label: string }
    | { label?: undefined; "aria-label": string }
    | { label?: undefined; "aria-labelledby": string }
  );

export default function Checkbox({
  className,
  indeterminate = false,
  label,
  ref,
  type = "checkbox",
  ...props
}: Props) {
  const generatedId = useId();
  const control = useFieldControl(props);
  const inputId = control.id ?? generatedId;

  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const input = (
    <input
      {...props}
      {...control}
      ref={inputRef}
      className={clsx(styles.checkbox, className)}
      id={inputId}
      type={type}
    />
  );
  if (!label) return input;
  return (
    <div className={styles.checkboxField}>
      {input}
      <label className={styles.checkboxLabel} htmlFor={inputId}>
        {label}
      </label>
    </div>
  );
}
