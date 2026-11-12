import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_MESSAGES = 20;
export const MAX_NAME_LENGTH = 100;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export const matchSchema = z.object({
  forChildYouth: z.boolean(),
  messages: z
    .array(messageSchema)
    .min(1)
    .max(MAX_MESSAGES)
    .refine((messages) => messages[0]?.role === "user" && messages.at(-1)?.role === "user", {
      message: "Must start and end with a user message",
    }),
});

export const associateSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
});

export type MatchInput = z.infer<typeof matchSchema>;
export type AssociateInput = z.infer<typeof associateSchema>;
