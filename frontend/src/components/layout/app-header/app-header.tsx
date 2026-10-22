import { LogOutIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/button/button";
import Logo from "@/components/logo/logo";
import styles from "@/components/layout/app-header/styles.module.css";
import { useAuth } from "@/store/auth/use-auth";
import useLogout from "@/hooks/use-logout";
import { paths } from "@/config/paths";
import { site } from "@/config/site";

export default function AppHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { logout, isLoading } = useLogout(() => navigate(paths.login.getHref(), { replace: true }));

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Logo />
        <h1 className={styles.brandName}>{site.name}</h1>
      </div>
      {user && (
        <div className={styles.actions}>
          <span className={styles.userInfo}>{user.username}</span>
          <Button appearance="ghost" className={styles.headerBtn} isLoading={isLoading} onClick={logout}>
            <LogOutIcon aria-hidden="true" />
            Log out
          </Button>
        </div>
      )}
    </header>
  );
}
