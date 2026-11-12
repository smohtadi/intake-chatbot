import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { VoyageAIClient } from "voyageai";
import { config } from "../config";
import { clinicAnswerSchema, SYSTEM_PROMPT, type ClinicAnswer } from "../match/match-prompt";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_OUTPUT_TOKENS = 1024;

let voyage: VoyageAIClient | undefined;
let answerChain: ReturnType<typeof createAnswerChain> | undefined;

const embed = async (input: string[], inputType: "query" | "document"): Promise<number[][]> => {
  voyage ??= new VoyageAIClient({ apiKey: config.VOYAGE_API_KEY });
  const response = await voyage.embed({ input, model: config.EMBEDDING_MODEL, inputType });
  const embeddings = (response.data ?? []).map((item) => item.embedding ?? []);
  if (embeddings.length !== input.length) throw new Error("Voyage returned an unexpected number of embeddings");
  return embeddings;
};

export const embedQuery = async (text: string): Promise<number[]> => (await embed([text], "query"))[0] ?? [];

export const embedDocuments = (texts: string[]): Promise<number[][]> => embed(texts, "document");

const createAnswerChain = () => {
  const model = new ChatAnthropic({
    apiKey: config.ANTHROPIC_API_KEY,
    model: config.LLM_MODEL,
    maxTokens: MAX_OUTPUT_TOKENS,
  });
  const prompt = ChatPromptTemplate.fromMessages([["system", SYSTEM_PROMPT], new MessagesPlaceholder("messages")]);
  return prompt.pipe(model.withStructuredOutput(clinicAnswerSchema, { name: "answer" }));
};

/** Asks the LLM to answer the visitor using only `clinicData`. */
export const chooseSpecialists = async (clinicData: string, messages: ChatMessage[]): Promise<ClinicAnswer> => {
  answerChain ??= createAnswerChain();
  return answerChain.invoke({
    clinicData,
    frontDeskPhone: config.FRONT_DESK_PHONE,
    messages: messages.map((message) =>
      message.role === "user" ? new HumanMessage(message.content) : new AIMessage(message.content),
    ),
  });
};
