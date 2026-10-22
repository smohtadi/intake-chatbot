import { forwardRef } from "react";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import styles from "@/components/ui/card/styles.module.css";

interface Props extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

const Card = forwardRef<HTMLElement, Props>(
  ({ as: Component = "article", children, className, ...props }, ref) => {
    return (
      <Component {...props} ref={ref} className={clsx(styles.card, className)}>
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";
export default Card;
