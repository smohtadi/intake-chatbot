import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_SUMMARY_LENGTH = 5000;

export const sendMessageSchema = z.object({
  text: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export const submitSchema = z.object({
  summary: z.string().trim().min(1).max(MAX_SUMMARY_LENGTH),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SubmitInput = z.infer<typeof submitSchema>;
