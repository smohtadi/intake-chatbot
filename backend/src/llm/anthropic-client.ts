import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import type { LLMClient } from "./llm-client";

const MAX_OUTPUT_TOKENS = 1024;

let anthropic: Anthropic | undefined;

export const anthropicClient: LLMClient = {
  async callTool({ system, messages, tool }) {
    anthropic ??= new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: config.LLM_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system,
      messages,
      tools: [{ name: tool.name, description: tool.description, input_schema: { type: "object", ...tool.inputSchema } }],
      tool_choice: { type: "tool", name: tool.name, disable_parallel_tool_use: true },
    });
    const toolUse = response.content.find((block) => block.type === "tool_use" && block.name === tool.name);
    if (!toolUse || toolUse.type !== "tool_use") throw new Error(`Model did not call ${tool.name}`);
    return toolUse.input;
  },
};
