import { z } from "zod";
import type { ChatMessage, LLMClient } from "../llm/llm-client";
import { buildSystemPrompt, respondTool } from "./intake-prompt";
import {
  intakeFields,
  missingFields,
  OPTIONAL_FIELDS,
  REQUIRED_FIELD_NAMES,
  type Intake,
  type IntakeField,
  type RequiredField,
} from "./intake-schema";

const CONTEXT_MESSAGES = 10;

export type IntakeState = {
  messages: ChatMessage[];
  data: Partial<Intake>;
  declined: RequiredField[];
  rejected: string[];
  optionalAsked: boolean;
  complete: boolean;
};

export type TurnResult = Omit<IntakeState, "messages"> & { reply: string };

const toolOutputSchema = z.object({
  reply: z.string().trim().min(1),
  fields: z.record(z.string(), z.unknown()).catch({}),
  declined: z.array(z.string()).catch([]),
});

const isIntakeField = (key: string): key is IntakeField => Object.hasOwn(intakeFields, key);
const isRequiredField = (key: string): key is RequiredField => (REQUIRED_FIELD_NAMES as readonly string[]).includes(key);

const mergeFields = (state: IntakeState, fields: Record<string, unknown>) => {
  const data: Partial<Intake> = { ...state.data };
  const rejected: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (!isIntakeField(key) || value === null || value === undefined) continue;
    const result = intakeFields[key].safeParse(value);
    if (result.success) {
      Object.assign(data, { [key]: result.data });
    } else {
      rejected.push(`${key}: ${result.error.issues[0]?.message ?? "invalid value"}`);
    }
  }
  return { data, rejected };
};

const mergeDeclined = (previous: readonly RequiredField[], reported: readonly string[], data: Partial<Intake>) =>
  [...new Set([...previous, ...reported.filter(isRequiredField)])].filter((field) => data[field] === undefined);

const recentMessages = (messages: readonly ChatMessage[], userText: string): ChatMessage[] => {
  const recent = [...messages.slice(-CONTEXT_MESSAGES), { role: "user" as const, content: userText }];
  const firstUserIndex = recent.findIndex((message) => message.role === "user");
  return recent.slice(firstUserIndex);
};

export const runTurn = async (llm: LLMClient, state: IntakeState, userText: string): Promise<TurnResult> => {
  const missingBefore = missingFields(state.data, state.declined);
  const system = buildSystemPrompt({ ...state, missing: missingBefore });
  const output = toolOutputSchema.parse(
    await llm.callTool({ system, messages: recentMessages(state.messages, userText), tool: respondTool }),
  );

  const { data, rejected } = mergeFields(state, output.fields);
  const declined = mergeDeclined(state.declined, output.declined, data);
  const requiredDone = missingFields(data, declined).length === 0;
  const optionalDone = OPTIONAL_FIELDS.every((field) => data[field] !== undefined);

  return {
    reply: output.reply,
    data,
    declined,
    rejected,
    optionalAsked: state.optionalAsked || requiredDone,
    complete: requiredDone && (state.optionalAsked || optionalDone),
  };
};
