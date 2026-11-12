import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  MAX_THREAD_MESSAGES,
  type IChatEntry,
  type IChatMessage,
  type ISpecialistCard,
  type ITurnError,
} from "@/schemas/match-schema";
import { matchApi } from "@/store/match/match-api";
import type { RootState } from "@/store/store";

export const QUESTIONS = {
  associate:
    "I can help match you to the right specialist and book an appointment. Before we start, do you prefer a specific associate? If so, please enter their name.",
  childYouth: "Are you looking for counselling for children/youth?",
  describe: "Briefly describe what you're looking for.",
};

export const CHOICES = { noPreference: "No preference", yes: "Yes", no: "No" };

const ASSOCIATE_NOT_FOUND = "I couldn't find an associate by that name, but I can still help you find the right fit.";
const THREAD_FULL = "We've reached the end of this chat. For more help, please call our front desk or start over.";

export type ChatStep = "associate" | "childYouth" | "describe" | "chat" | "done";

interface IChatState {
  isOpen: boolean;
  step: ChatStep;
  entries: IChatEntry[];
  /** The LLM part of the conversation, sent in full with every request. */
  thread: IChatMessage[];
  forChildYouth: boolean;
  /** Answers the children/youth question with "Yes" when the chat reaches it. */
  presetChildYouth: boolean;
  /** The message being sent, kept after a failure so it can be retried. */
  pendingText: string | null;
  pendingRequestId: string | null;
  turnError: ITurnError | null;
}

type SendResult =
  | { kind: "associate"; specialists: ISpecialistCard[] }
  | { kind: "reply"; reply: string; specialists: ISpecialistCard[] };

const user = (content: string): IChatMessage => ({ role: "user", content });
const assistant = (content: string): IChatMessage => ({ role: "assistant", content });

const associateFound = (count: number) =>
  count === 1
    ? "Here's the associate I found. You can book with them directly:"
    : "I found a few associates with a similar name. You can book directly with the right one:";

const initialState = (): IChatState => ({
  isOpen: false,
  step: "associate",
  entries: [assistant(QUESTIONS.associate)],
  thread: [],
  forChildYouth: false,
  presetChildYouth: false,
  pendingText: null,
  pendingRequestId: null,
  turnError: null,
});

function toTurnError(error: unknown): ITurnError {
  const title = (error as { data?: { title?: string } } | undefined)?.data?.title;
  return {
    message: getApiErrorMessage(title) ?? "Something went wrong. Please try again.",
    canRetry: title !== "VALIDATION_ERROR",
  };
}

function answerChildYouth(state: IChatState, choice: string) {
  state.forChildYouth = choice === CHOICES.yes;
  state.entries.push(user(choice), assistant(QUESTIONS.describe));
  state.step = "describe";
}

function askChildYouth(state: IChatState) {
  state.entries.push(assistant(QUESTIONS.childYouth));
  state.step = "childYouth";
  if (state.presetChildYouth) answerChildYouth(state, CHOICES.yes);
}

function applyResult(state: IChatState, text: string, result: SendResult) {
  if (result.kind === "associate" && result.specialists.length > 0) {
    state.entries.push(user(text), { ...assistant(associateFound(result.specialists.length)), specialists: result.specialists });
    state.step = "done";
    return;
  }
  if (result.kind === "associate") {
    state.entries.push(user(text), assistant(ASSOCIATE_NOT_FOUND));
    askChildYouth(state);
    return;
  }
  state.entries.push(user(text), { ...assistant(result.reply), specialists: result.specialists });
  state.thread.push(user(text), assistant(result.reply));
  const isFull = state.thread.length >= MAX_THREAD_MESSAGES - 1;
  if (isFull) state.entries.push(assistant(THREAD_FULL));
  state.step = isFull ? "done" : "chat";
}

/**
 * Sends the visitor's text: an associate name on the first step, otherwise the
 * whole LLM thread plus the new message. Nothing is stored server-side.
 */
export const sendChatMessage = createAsyncThunk.withTypes<{ state: RootState; rejectValue: ITurnError }>()(
  "chat/send",
  async (text: string, { dispatch, getState, rejectWithValue }) => {
    const { step, thread, forChildYouth } = getState().chat;
    try {
      if (step === "associate") {
        const { specialists } = await settle(dispatch(matchApi.endpoints.findAssociate.initiate(text)));
        const result: SendResult = { kind: "associate", specialists };
        return result;
      }
      const messages = [...thread, user(text)];
      const { reply, specialists } = await settle(dispatch(matchApi.endpoints.match.initiate({ forChildYouth, messages })));
      const result: SendResult = { kind: "reply", reply, specialists };
      return result;
    } catch (error) {
      return rejectWithValue(toTurnError(error));
    }
  },
);

/** Awaits a mutation and drops its cached result, since the slice keeps what it needs. */
async function settle<T>(request: { unwrap: () => Promise<T>; reset: () => void }): Promise<T> {
  try {
    return await request.unwrap();
  } finally {
    request.reset();
  }
}

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    chatOpened(state, action: PayloadAction<{ forChildYouth?: boolean } | undefined>) {
      state.isOpen = true;
      if (!action.payload?.forChildYouth) return;
      state.presetChildYouth = true;
      if (state.step === "childYouth") answerChildYouth(state, CHOICES.yes);
    },
    chatClosed(state) {
      state.isOpen = false;
    },
    choiceMade(state, action: PayloadAction<string>) {
      if (state.step === "associate") {
        state.entries.push(user(action.payload));
        askChildYouth(state);
      } else if (state.step === "childYouth") {
        answerChildYouth(state, action.payload);
      }
    },
    startedOver(state) {
      return { ...initialState(), isOpen: state.isOpen };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state, action) => {
        state.pendingText = action.meta.arg;
        state.pendingRequestId = action.meta.requestId;
        state.turnError = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        if (state.pendingRequestId !== action.meta.requestId) return;
        state.pendingText = null;
        state.pendingRequestId = null;
        applyResult(state, action.meta.arg, action.payload);
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        if (state.pendingRequestId !== action.meta.requestId) return;
        state.pendingRequestId = null;
        state.turnError = action.payload ?? toTurnError(action.error);
      });
  },
});

export const { chatOpened, chatClosed, choiceMade, startedOver } = chatSlice.actions;
