import { z } from "zod";

export const ISSUE_CATEGORIES = ["hardware", "software", "network", "account_access", "other"] as const;
export const IMPACTS = ["just_me", "my_team", "whole_office"] as const;
export const DEVICE_TYPES = ["laptop", "desktop", "phone", "printer", "other"] as const;

export const intakeFields = {
  fullName: z.string().trim().min(2),
  email: z.email(),
  department: z.string().trim().min(1),
  issueCategory: z.enum(ISSUE_CATEGORIES),
  issueDescription: z.string().trim().min(10),
  startedAt: z.string().trim().min(1),
  impact: z.enum(IMPACTS),
  canStillWork: z.boolean(),
  deviceType: z.enum(DEVICE_TYPES),
  operatingSystem: z.string().trim().min(1),
  errorMessage: z.string().trim().min(1),
  stepsTried: z.string().trim().min(1),
};

export const intakeSchema = z.object(intakeFields);

export type Intake = z.infer<typeof intakeSchema>;
export type IntakeField = keyof Intake;
export type IssueCategory = Intake["issueCategory"];
export type Priority = "P1" | "P2" | "P3" | "P4";

export const ALWAYS_REQUIRED_FIELDS = [
  "fullName",
  "email",
  "department",
  "issueCategory",
  "issueDescription",
  "startedAt",
  "impact",
  "canStillWork",
] as const satisfies readonly IntakeField[];

export const DEVICE_FIELDS = ["deviceType", "operatingSystem"] as const satisfies readonly IntakeField[];
export const OPTIONAL_FIELDS = ["errorMessage", "stepsTried"] as const satisfies readonly IntakeField[];
export const REQUIRED_FIELD_NAMES = [...ALWAYS_REQUIRED_FIELDS, ...DEVICE_FIELDS] as const;

export type RequiredField = (typeof REQUIRED_FIELD_NAMES)[number];

export const FIELD_HINTS: Record<IntakeField, string> = {
  fullName: "the user's name",
  email: "a contact email address",
  department: "their team or department",
  issueCategory: "one of hardware, software, network, account_access, other; infer from the description and confirm if unclear",
  issueDescription: "what is going wrong, at least a sentence",
  startedAt: "when the problem started, free text",
  impact: "who is affected: just_me, my_team or whole_office",
  canStillWork: "whether they can still do their job (true/false)",
  deviceType: "which device: laptop, desktop, phone, printer or other",
  operatingSystem: "operating system and version",
  errorMessage: "the exact error text, if any",
  stepsTried: "anything they already tried",
};

const DEVICE_CATEGORIES: readonly IssueCategory[] = ["hardware", "software"];

export const requiredFields = (category?: IssueCategory): RequiredField[] =>
  category && DEVICE_CATEGORIES.includes(category)
    ? [...REQUIRED_FIELD_NAMES]
    : [...ALWAYS_REQUIRED_FIELDS];

export const missingFields = (data: Partial<Intake>, declined: readonly RequiredField[]): RequiredField[] =>
  requiredFields(data.issueCategory).filter(
    (field) => data[field] === undefined && !declined.includes(field),
  );

/** Returns null until impact, canStillWork and issueCategory are each collected or declined. */
export const computePriority = (data: Partial<Intake>, declined: readonly RequiredField[]): Priority | null => {
  const priorityInputs = ["impact", "canStillWork", "issueCategory"] as const;
  const isKnown = priorityInputs.every((field) => data[field] !== undefined || declined.includes(field));
  if (!isKnown) return null;
  if (data.impact === "whole_office") return "P1";
  if (data.impact === "my_team" || data.canStillWork === false) return "P2";
  if (data.issueCategory === "account_access") return "P3";
  return "P4";
};
