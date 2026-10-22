import type { Request, Response } from "express";
import type { AuthLocals } from "../auth/auth-middleware";
import { computePriority, missingFields } from "../intake/intake-schema";
import { buildSummary } from "../intake/intake-summary";
import type { SessionLocals } from "./session-middleware";
import { createSession, sendMessage, submitSession, type Session } from "./session-service";
import type { SendMessageInput, SubmitInput } from "./session-validator";

export const createSessionHandler = (_req: Request, res: Response<unknown, AuthLocals>) => {
  res.status(201).json(toDto(createSession(res.locals.username)));
};

export const getSessionHandler = (_req: Request, res: Response<unknown, SessionLocals>) => {
  res.status(200).json(toDto(res.locals.session));
};

export const sendMessageHandler = async (
  req: Request<unknown, unknown, SendMessageInput>,
  res: Response<unknown, SessionLocals>,
) => {
  const reply = await sendMessage(res.locals.session, req.body.text);
  res.status(200).json({ reply, ...toStateDto(res.locals.session) });
};

export const submitHandler = (req: Request<unknown, unknown, SubmitInput>, res: Response<unknown, SessionLocals>) => {
  res.status(200).json(toStateDto(submitSession(res.locals.session, req.body.summary)));
};

const toStateDto = (session: Session) => {
  const priority = computePriority(session.data, session.declined);
  const draftSummary =
    session.complete && priority ? buildSummary(session.data, session.declined, priority) : undefined;
  return {
    status: session.status,
    data: session.data,
    declined: session.declined,
    missing: missingFields(session.data, session.declined),
    priority,
    complete: session.complete,
    summary: session.summary ?? draftSummary,
    ticketNumber: session.ticketNumber,
  };
};

const toDto = (session: Session) => ({ messages: session.messages, ...toStateDto(session) });
