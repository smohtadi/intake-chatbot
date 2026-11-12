import clsx from "clsx";
import styles from "./styles.module.css";

interface IProps {
  className?: string;
}

/** Sprouting leaves on a soft disc. Decorative: the site name sits next to it. */
export default function Logo({ className }: IProps) {
  return (
    <svg className={clsx(styles.logo, className)} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle className={styles.disc} cx="16" cy="16" r="16" />
      <path className={styles.stem} d="M16 27v-9" />
      <path className={styles.leafBack} d="M15.5 19C15 14 11.5 10.5 6 10c.3 5.6 4 9.2 9.5 9Z" />
      <path className={styles.leafFront} d="M16.5 20c.2-6.8 3.7-11.6 10-13.5 1 7.4-3 12.7-10 13.5Z" />
    </svg>
  );
}
