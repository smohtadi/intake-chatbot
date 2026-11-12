import Button from "@/components/ui/button/button";
import styles from "@/features/match/styles.module.css";

interface Props {
  choices: readonly string[];
  disabled?: boolean;
  onChoose: (choice: string) => void;
}

export default function ChatChoices({ choices, disabled = false, onChoose }: Props) {
  return (
    <div className={styles.choices}>
      {choices.map((choice) => (
        <Button key={choice} variant="primary" disabled={disabled} onClick={() => onChoose(choice)}>
          {choice}
        </Button>
      ))}
    </div>
  );
}
