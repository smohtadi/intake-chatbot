import clsx from "clsx";
import { LoaderCircleIcon } from "lucide-react";
import styles from "@/components/ui/loader/styles.module.css";

interface Props {
  className?: string;
  label?: string;
}

/**
 * Spinner with a visible label. role="status" lets screen readers announce
 * it; when the loader sits inside content that stays on screen, also mark
 * that region aria-busy.
 */
export default function Loader({ className, label = "Loading…" }: Props) {
  return (
    <span role="status" className={clsx(styles.loader, className)}>
      <LoaderCircleIcon className={styles.icon} />
      {label}
    </span>
  );
}
