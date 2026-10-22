import clsx from "clsx";
import styles from "./styles.module.css";

interface IProps {
  className?: string;
}

// Placeholder mark. Replace with the project's own logo (inline SVG or an
// imported asset from src/assets).
export default function Logo({ className }: IProps) {
  return (
    <svg
      className={clsx(styles.logo, className)}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Logo"
    >
      <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.2" />
      <path
        d="M9 22V10h4l3 5 3-5h4v12h-3.5v-6.5L16 19.5l-3.5-4V22z"
        fill="currentColor"
      />
    </svg>
  );
}
