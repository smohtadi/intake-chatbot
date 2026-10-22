import { randomInt } from "node:crypto";
import { runTurn, type IntakeState } from "../intake/intake-turn";
import { anthropicClient } from "../llm/anthropic-client";
import { collection } from "../shared/db";
import { BadGatewayError, ConflictError, NotFoundError } from "../shared/errors";

export const MAX_TURNS = 40;
export const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;
export const GREETING =
  "Hi! I'm the IT intake assistant. I'll collect a few details for a support ticket. What's going wrong?";

export type Session = IntakeState & {
  owner: string;
  status: "collecting" | "submitted";
  turns: number;
  turnInFlight: boolean;
  summary?: string;
  ticketNumber?: string;
  updatedAt: number;
};

const sessionsByOwner = () => collection<Session>("sessions");

export const createSession = (owner: string): Session => {
  const session: Session = {
    owner,
    status: "collecting",
    messages: [{ role: "assistant", content: GREETING }],
    data: {},
    declined: [],
    rejected: [],
    optionalAsked: false,
    complete: false,
    turns: 0,
    turnInFlight: false,
    updatedAt: Date.now(),
  };
  sessionsByOwner().set(owner, session);
  return session;
};

export const getSessionByOwner = (owner: string): Session => {
  const session = sessionsByOwner().get(owner);
  if (!session) throw new NotFoundError("SESSION_NOT_FOUND");
  return session;
};

const assertCanTakeTurn = (session: Session) => {
  if (session.status === "submitted") throw new ConflictError("ALREADY_SUBMITTED");
  if (session.turnInFlight) throw new ConflictError("TURN_IN_PROGRESS");
  if (session.turns >= MAX_TURNS) throw new ConflictError("TURN_LIMIT_REACHED");
};

/** Commits the user message and reply only after the LLM call succeeds, so a retry never duplicates them. */
export const sendMessage = async (session: Session, text: string): Promise<string> => {
  assertCanTakeTurn(session);
  session.turnInFlight = true;
  let result: Awaited<ReturnType<typeof runTurn>>;
  try {
    result = await runTurn(anthropicClient, session, text);
  } catch (error) {
    console.error("LLM turn failed:", error instanceof Error ? error.message : "unknown error");
    throw new BadGatewayError("LLM_ERROR");
  } finally {
    session.turnInFlight = false;
  }
  const { reply, ...state } = result;
  Object.assign(session, state);
  session.messages.push({ role: "user", content: text }, { role: "assistant", content: reply });
  session.turns += 1;
  session.updatedAt = Date.now();
  return reply;
};

export const submitSession = (session: Session, summary: string): Session => {
  if (session.status === "submitted") throw new ConflictError("ALREADY_SUBMITTED");
  if (!session.complete) throw new ConflictError("INTAKE_INCOMPLETE");
  session.status = "submitted";
  session.summary = summary;
  session.ticketNumber = `DEMO-${String(randomInt(10_000)).padStart(4, "0")}`;
  session.updatedAt = Date.now();
  return session;
};

export const deleteIdleSessions = (now = Date.now()): void => {
  for (const [owner, session] of sessionsByOwner()) {
    if (now - session.updatedAt > SESSION_IDLE_MS) sessionsByOwner().delete(owner);
  }
};
