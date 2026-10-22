import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";
import type { ComponentProps, MouseEvent } from "react";
import styles from "@/components/ui/button/styles.module.css";

interface Props extends ComponentProps<"button"> {
  appearance?: "ghost" | "outline";
  // Renders the single child (e.g. a router Link) with the button's styles.
  asChild?: boolean;
  // Shows a spinner and ignores clicks. Not shown with asChild, since Slot
  // takes a single child.
  isLoading?: boolean;
  // Square button for a lone icon; give it an aria-label.
  size?: "icon";
  variant?: "accent" | "danger" | "primary" | "secondary";
}

export default function Button({
  appearance,
  asChild = false,
  children,
  className,
  disabled = false,
  isLoading = false,
  onClick,
  size,
  type = "button",
  variant,
  ...props
}: Props) {
  // A loading button stays enabled so it keeps focus, and a link has no
  // disabled attribute; both are marked aria-disabled and ignore clicks.
  const isInert = isLoading || (asChild && disabled);
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (isInert) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  const shared = {
    ...props,
    "aria-disabled": isInert || undefined,
    className: clsx(styles.btn, className),
    "data-appearance": appearance,
    "data-size": size,
    "data-variant": variant,
    onClick: handleClick,
  };

  if (asChild) {
    return (
      <Slot {...shared} tabIndex={disabled ? -1 : props.tabIndex}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      {...shared}
      aria-busy={isLoading || undefined}
      disabled={disabled}
      type={type}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
