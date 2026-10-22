import { useContext, type AriaAttributes } from "react";
import FieldContext from "@/components/ui/form/field-context";

interface ControlProps {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  "aria-required"?: AriaAttributes["aria-required"];
}

/**
 * Links a control to its enclosing Form.Field: the id the label points at,
 * the required and invalid states, and the hint and error message as the
 * accessible description. Returns the props with those filled in; values the
 * caller passes win over the Field's.
 */
export function useFieldControl<P extends ControlProps>(props: P) {
  const { controlId, error, errorId, hintId, required } =
    useContext(FieldContext);
  const describedBy = [
    props["aria-describedby"],
    hintId,
    error ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    ...props,
    id: props.id ?? (controlId || undefined),
    "aria-describedby": describedBy || undefined,
    "aria-invalid": props["aria-invalid"] ?? (error ? true : undefined),
    // aria-required rather than required, so the browser's own validation
    // never runs ahead of the form's schema.
    "aria-required": props["aria-required"] ?? (required || undefined),
  };
}
