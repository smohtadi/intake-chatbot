import type { Intake, IntakeField, Priority, RequiredField } from "./intake-schema";

const NOT_PROVIDED = "Not provided";
const TITLE_DESCRIPTION_LENGTH = 60;

const CATEGORY_LABELS: Record<Intake["issueCategory"], string> = {
  hardware: "Hardware",
  software: "Software",
  network: "Network",
  account_access: "Account access",
  other: "Other",
};

const IMPACT_LABELS: Record<Intake["impact"], string> = {
  just_me: "Just me",
  my_team: "My team",
  whole_office: "Whole office",
};

const DEVICE_LABELS: Record<Intake["deviceType"], string> = {
  laptop: "Laptop",
  desktop: "Desktop",
  phone: "Phone",
  printer: "Printer",
  other: "Other",
};

type SummaryLine = [label: string, field: IntakeField, format?: (value: never) => string];

const SECTIONS: [heading: string, lines: SummaryLine[]][] = [
  ["Requester", [["Name", "fullName"], ["Email", "email"], ["Department", "department"]]],
  [
    "Problem",
    [
      ["Category", "issueCategory", (value: Intake["issueCategory"]) => CATEGORY_LABELS[value]],
      ["Description", "issueDescription"],
      ["Started", "startedAt"],
      ["Error message", "errorMessage"],
    ],
  ],
  [
    "Environment",
    [
      ["Device", "deviceType", (value: Intake["deviceType"]) => DEVICE_LABELS[value]],
      ["Operating system", "operatingSystem"],
    ],
  ],
  [
    "Impact",
    [
      ["Affected", "impact", (value: Intake["impact"]) => IMPACT_LABELS[value]],
      ["Can still work", "canStillWork", (value: boolean) => (value ? "Yes" : "No")],
    ],
  ],
  ["Already tried", [["Steps", "stepsTried"]]],
];

const formatLine = (
  [label, field, format]: SummaryLine,
  data: Partial<Intake>,
  declined: readonly RequiredField[],
): string | null => {
  const value = data[field];
  if (value !== undefined) return `${label}: ${format ? format(value as never) : String(value)}`;
  if ((declined as readonly IntakeField[]).includes(field)) return `${label}: ${NOT_PROVIDED}`;
  return null;
};

const buildTitle = (data: Partial<Intake>, priority: Priority): string => {
  const category = data.issueCategory ? CATEGORY_LABELS[data.issueCategory] : "IT issue";
  const description = data.issueDescription ?? NOT_PROVIDED;
  const shortDescription =
    description.length > TITLE_DESCRIPTION_LENGTH
      ? `${description.slice(0, TITLE_DESCRIPTION_LENGTH).trimEnd()}...`
      : description;
  return `[${priority}] ${category}: ${shortDescription}`;
};

export const buildSummary = (
  data: Partial<Intake>,
  declined: readonly RequiredField[],
  priority: Priority,
): string => {
  const blocks = [buildTitle(data, priority), `Priority\n${priority}`];
  for (const [heading, lines] of SECTIONS) {
    const formatted = lines
      .map((line) => formatLine(line, data, declined))
      .filter((line): line is string => line !== null);
    if (formatted.length > 0) blocks.push(`${heading}\n${formatted.join("\n")}`);
  }
  return blocks.join("\n\n");
};
