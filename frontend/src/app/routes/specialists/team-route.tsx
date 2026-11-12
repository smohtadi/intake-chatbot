import Card from "@/components/ui/card/card";
import Loader from "@/components/ui/loader/loader";
import TeamCard from "@/features/specialists/team-card";
import { paths } from "@/config/paths";
import { useGetSpecialistsQuery } from "@/store/specialists/specialist-api";
import styles from "@/app/routes/specialists/styles.module.css";

export default function TeamRoute() {
  const { data: specialists, isLoading } = useGetSpecialistsQuery();

  if (isLoading) return <Loader label="Loading our team…" />;
  if (!specialists) return <Card className={styles.panel}>Could not load our team. Please refresh the page.</Card>;

  return (
    <section className={styles.team} aria-labelledby="team-title">
      <title>{paths.team.getDocTitle()}</title>
      <h2 id="team-title" className={styles.teamTitle}>
        Our Team
      </h2>
      <ul className={styles.grid}>
        {specialists.map((specialist) => (
          <li key={specialist.id}>
            <TeamCard specialist={specialist} href={paths.specialistEdit.getHref(specialist.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
