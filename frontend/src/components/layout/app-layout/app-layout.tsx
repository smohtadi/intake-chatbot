import type { ReactNode } from "react";
import AppHeader from "@/components/layout/app-header/app-header";
import DemoBanner from "@/components/demo-banner/demo-banner";
import styles from "@/components/layout/app-layout/styles.module.css";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <DemoBanner />
      <main className={styles.main}>{children}</main>
    </>
  );
}
