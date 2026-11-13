import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  MAX_THREAD_MESSAGES,
  type IChatEntry,
  type IChatMessage,
  type IMatchResponse,
  type ITurnError,
} from "@/schemas/match-schema";
import { matchApi } from "@/store/match/match-api";
import type { RootState } from "@/store/store";

export const GREETING = "I can help match you to the right specialist and book an appointment.";

export const QUESTIONS = {
  childYouth: "Are you looking for counselling for children/youth?",
  describe: "Briefly describe what you're looking for.",
};

export const CHOICES = { yes: "Yes", no: "No" };

const THREAD_FULL = "We've reached the end of this chat. For more help, please call our front desk or start over.";

export type ChatStep = "childYouth" | "describe" | "chat" | "done";

interface IChatState {
  isOpen: boolean;
  step: ChatStep;
  entries: IChatEntry[];
  /** The LLM part of the conversation, sent in full with every request. */
  thread: IChatMessage[];
  forChildYouth: boolean;
  /** The message being sent, kept after a failure so it can be retried. */
  pendingText: string | null;
  pendingRequestId: string | null;
  turnError: ITurnError | null;
}

const user = (content: string): IChatMessage => ({ role: "user", content });
const assistant = (content: string): IChatMessage => ({ role: "assistant", content });

const initialState = (): IChatState => ({
  isOpen: false,
  step: "childYouth",
  entries: [assistant(GREETING), assistant(QUESTIONS.childYouth)],
  thread: [],
  forChildYouth: false,
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

function applyReply(state: IChatState, text: string, result: IMatchResponse) {
  state.entries.push(user(text), { ...assistant(result.reply), specialists: result.specialists });
  state.thread.push(user(text), assistant(result.reply));
  const isFull = state.thread.length >= MAX_THREAD_MESSAGES - 1;
  if (isFull) state.entries.push(assistant(THREAD_FULL));
  state.step = isFull ? "done" : "chat";
}

/** Sends the whole LLM thread plus the new message. Nothing is stored server-side. */
export const sendChatMessage = createAsyncThunk.withTypes<{ state: RootState; rejectValue: ITurnError }>()(
  "chat/send",
  async (text: string, { dispatch, getState, rejectWithValue }) => {
    const { thread, forChildYouth } = getState().chat;
    try {
      const messages = [...thread, user(text)];
      return await settle(dispatch(matchApi.endpoints.match.initiate({ forChildYouth, messages })));
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
      if (action.payload?.forChildYouth && state.step === "childYouth") answerChildYouth(state, CHOICES.yes);
    },
    chatClosed(state) {
      state.isOpen = false;
    },
    choiceMade(state, action: PayloadAction<string>) {
      if (state.step === "childYouth") answerChildYouth(state, action.payload);
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
        applyReply(state, action.meta.arg, action.payload);
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        if (state.pendingRequestId !== action.meta.requestId) return;
        state.pendingRequestId = null;
        state.turnError = action.payload ?? toTurnError(action.error);
      });
  },
});

export const { chatOpened, chatClosed, choiceMade, startedOver } = chatSlice.actions;
