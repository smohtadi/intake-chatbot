import { LogOutIcon } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import Button from "@/components/ui/button/button";
import Logo from "@/components/logo/logo";
import styles from "@/components/layout/app-header/styles.module.css";
import { useAuth } from "@/store/auth/use-auth";
import useLogout from "@/hooks/use-logout";
import { paths } from "@/config/paths";
import { site } from "@/config/site";
import { chatOpened } from "@/store/match/chat-slice";
import { useAppDispatch } from "@/store/useAppDispatch";

const NAV_LINKS = [
  { label: "Home", href: paths.home.getHref(), end: true },
  { label: "Our Team", href: paths.team.getHref(), end: false },
];

export default function AppHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { logout, isLoading } = useLogout(() => navigate(paths.login.getHref(), { replace: true }));

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Logo />
        <h1 className={styles.brandName}>{site.name}</h1>
      </div>
      {user && (
        <nav aria-label="Main" className={styles.nav}>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.end}
              className={({ isActive }) => clsx(styles.navLink, isActive && styles.navLinkActive)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
      {user && (
        <div className={styles.actions}>
          <Button variant="primary" className={styles.bookButton} onClick={() => dispatch(chatOpened())}>
            Book a call
          </Button>
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
