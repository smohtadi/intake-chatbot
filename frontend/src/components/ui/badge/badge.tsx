import React from "react";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";
import styles from "@/components/ui/badge/styles.module.css";

export default function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
}) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={clsx(
        styles.badge,
        { [styles["badge-" + variant]]: variant },
        className
      )}
      {...props}
    />
  );
}
