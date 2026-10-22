import { site } from "@/config/site";
import styles from "@/components/demo-banner/styles.module.css";

export default function DemoBanner() {
  return (
    <p className={styles.banner} role="note">
      {site.demoNotice}
    </p>
  );
}
