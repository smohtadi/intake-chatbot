import { Link } from "react-router-dom";
import type { ISpecialistSummary } from "@/schemas/specialist-schema";
import styles from "@/features/specialists/styles.module.css";

interface Props {
  specialist: ISpecialistSummary;
  href: string;
}

/** "Dr. Sam O'Brien" → "SO": first and last word, skipping titles such as "Dr.". */
function initials(name: string) {
  const words = name.split(/\s+/).filter((word) => word && !word.endsWith("."));
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picked.map((word) => word[0].toUpperCase()).join("");
}

export default function TeamCard({ specialist, href }: Props) {
  return (
    <Link to={href} className={styles.teamCard}>
      {specialist.photoUrl ? (
        <img className={styles.photo} src={specialist.photoUrl} alt="" loading="lazy" />
      ) : (
        <span className={styles.monogram} aria-hidden="true">
          {initials(specialist.name)}
        </span>
      )}
      <span className={styles.caption}>
        <span className={styles.teamName}>{specialist.name}</span>
        <span className={styles.teamRole}>{specialist.role}</span>
      </span>
    </Link>
  );
}
