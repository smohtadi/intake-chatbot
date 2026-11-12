import type { ComponentProps } from "react";
import { CalendarIcon, ExternalLinkIcon } from "lucide-react";
import Button from "@/components/ui/button/button";
import Card from "@/components/ui/card/card";
import type { ISpecialistCard } from "@/schemas/match-schema";
import { PLACEHOLDER_LINK } from "@/schemas/specialist-schema";
import styles from "@/features/match/styles.module.css";

/** Real links open in a new tab; placeholder links do nothing. */
function linkProps(url: string): ComponentProps<"a"> {
  if (url === PLACEHOLDER_LINK) return { href: url, onClick: (event) => event.preventDefault() };
  return { href: url, target: "_blank", rel: "noopener noreferrer" };
}

export default function SpecialistCard({ specialist }: { specialist: ISpecialistCard }) {
  return (
    <Card className={styles.card} aria-label={specialist.name}>
      <h3 className={styles.cardName}>{specialist.name}</h3>
      <p className={styles.cardRole}>{specialist.role}</p>
      <p className={styles.cardDescription}>{specialist.description}</p>
      <dl className={styles.cardFacts}>
        <dt>Session format</dt>
        <dd>{specialist.sessionFormats.join(", ")}</dd>
        <dt>Areas of practice</dt>
        <dd>{specialist.areasPractice.join(", ")}</dd>
        <dt>Credentials</dt>
        <dd>{specialist.credentials.join(", ")}</dd>
      </dl>
      <div className={styles.cardActions}>
        <Button asChild variant="primary">
          <a {...linkProps(specialist.bookingUrl)}>
            <CalendarIcon aria-hidden="true" />
            Book on Jane
          </a>
        </Button>
        <Button asChild appearance="outline">
          <a {...linkProps(specialist.profileUrl)}>
            <ExternalLinkIcon aria-hidden="true" />
            View profile
          </a>
        </Button>
      </div>
    </Card>
  );
}
