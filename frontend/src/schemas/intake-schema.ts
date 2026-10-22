export type Priority = "P1" | "P2" | "P3" | "P4";

export const INTAKE_FIELDS = [
  "fullName",
  "email",
  "department",
  "issueCategory",
  "issueDescription",
  "startedAt",
  "impact",
  "canStillWork",
  "deviceType",
  "operatingSystem",
  "errorMessage",
  "stepsTried",
] as const;

export type IntakeField = (typeof INTAKE_FIELDS)[number];

export type IntakeData = Partial<Record<IntakeField, string | boolean>>;

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface IIntakeState {
  status: "collecting" | "submitted";
  data: IntakeData;
  declined: IntakeField[];
  missing: IntakeField[];
  priority: Priority | null;
  complete: boolean;
  summary?: string;
  ticketNumber?: string;
}

export interface ISession extends IIntakeState {
  messages: IChatMessage[];
}

export interface ITurnResponse extends IIntakeState {
  reply: string;
}

export const FIELD_LABELS: Record<IntakeField, string> = {
  fullName: "Name",
  email: "Email",
  department: "Department",
  issueCategory: "Category",
  issueDescription: "Description",
  startedAt: "Started",
  impact: "Affected",
  canStillWork: "Can still work",
  deviceType: "Device",
  operatingSystem: "Operating system",
  errorMessage: "Error message",
  stepsTried: "Already tried",
};

const VALUE_LABELS: Record<string, string> = {
  hardware: "Hardware",
  software: "Software",
  network: "Network",
  account_access: "Account access",
  other: "Other",
  just_me: "Just me",
  my_team: "My team",
  whole_office: "Whole office",
  laptop: "Laptop",
  desktop: "Desktop",
  phone: "Phone",
  printer: "Printer",
};

const ENUM_FIELDS: readonly IntakeField[] = ["issueCategory", "impact", "deviceType"];

export function formatFieldValue(field: IntakeField, value: string | boolean): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return ENUM_FIELDS.includes(field) ? (VALUE_LABELS[value] ?? value) : value;
}
