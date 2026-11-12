import { ArrowRightIcon, BackpackIcon, BriefcaseIcon, ClipboardListIcon, HeartIcon, UserIcon, UsersIcon } from "lucide-react";
import Button from "@/components/ui/button/button";
import { paths } from "@/config/paths";
import { chatOpened } from "@/store/match/chat-slice";
import { useAppDispatch } from "@/store/useAppDispatch";
import styles from "@/app/routes/home/styles.module.css";

const SUPPORT_TYPES = [
  { id: "individual", title: "Individual", subtitle: "Support for myself", Icon: UserIcon },
  { id: "children", title: "Children & Teens", subtitle: "Support for your child", Icon: BackpackIcon, forChildYouth: true },
  { id: "couples", title: "Couples", subtitle: "Me and my partner", Icon: HeartIcon },
  { id: "family", title: "Family", subtitle: "Support for my family", Icon: UsersIcon },
  { id: "assessment", title: "Assessment", subtitle: "ADHD & learning", Icon: ClipboardListIcon },
  { id: "coaching", title: "Executive Coaching", subtitle: "For leaders & executives", Icon: BriefcaseIcon },
];

export default function HomeRoute() {
  const dispatch = useAppDispatch();

  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <title>{paths.home.getDocTitle()}</title>
      <h2 id="home-title" className={styles.title}>
        Ready to feel <em className={styles.highlight}>better?</em>
      </h2>
      <p className={styles.subtitle}>What type of support are you looking for?</p>
      <ul className={styles.tiles}>
        {SUPPORT_TYPES.map(({ id, title, subtitle, Icon, forChildYouth }) => (
          <li key={id}>
            <article className={styles.tile} aria-labelledby={`tile-${id}`}>
              <Icon className={styles.tileIcon} aria-hidden="true" />
              <div className={styles.tileCaption}>
                <h3 id={`tile-${id}`} className={styles.tileTitle}>
                  {title}
                </h3>
                <p className={styles.tileSubtitle}>{subtitle}</p>
                <Button variant="primary" className={styles.pill} onClick={() => dispatch(chatOpened({ forChildYouth }))}>
                  Get started
                  <ArrowRightIcon aria-hidden="true" />
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
