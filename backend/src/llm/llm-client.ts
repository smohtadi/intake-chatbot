export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ToolDefinition = { name: string; description: string; inputSchema: Record<string, unknown> };

export interface LLMClient {
  /** Calls the model with one forced tool and returns that tool's raw input. */
  callTool(args: { system: string; messages: ChatMessage[]; tool: ToolDefinition }): Promise<unknown>;
}
