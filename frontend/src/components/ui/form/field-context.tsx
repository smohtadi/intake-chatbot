import { createContext } from "react";

interface FieldContextValue {
  controlId: string;
  error: string;
  errorId: string;
  // Set only when the Field renders a hint.
  hintId?: string;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue>({
  controlId: "",
  error: "",
  errorId: "",
  required: false,
});
export default FieldContext;
