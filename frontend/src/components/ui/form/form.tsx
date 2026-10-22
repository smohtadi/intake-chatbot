import clsx from "clsx";
import type { ComponentProps, KeyboardEvent } from "react";
import Checkbox from "@/components/ui/form/checkbox";
import Field from "@/components/ui/form/field";
import FieldLabel from "@/components/ui/form/field-label";
import Input from "@/components/ui/form/input";
import Select from "@/components/ui/form/select";
import TextArea from "@/components/ui/form/text-area";
import styles from "@/components/ui/form/styles.module.css";

interface Props extends ComponentProps<"form"> {
  // Stops Enter in a text input from submitting the form. Buttons, links and
  // textareas keep their usual Enter behavior.
  preventEnterSubmit?: boolean;
}

const BUTTON_INPUT_TYPES = new Set(["button", "image", "reset", "submit"]);

function Form({ className, onKeyDown, preventEnterSubmit, ...props }: Props) {
  const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (
      preventEnterSubmit &&
      e.key === "Enter" &&
      e.target instanceof HTMLInputElement &&
      !BUTTON_INPUT_TYPES.has(e.target.type)
    ) {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };
  return (
    <form
      {...props}
      className={clsx(styles.form, className)}
      onKeyDown={handleKeyDown}
    />
  );
}

const CForm = Object.assign(Form, {
  Checkbox,
  Field,
  Input,
  Label: FieldLabel,
  Select,
  TextArea,
});

export default CForm;
