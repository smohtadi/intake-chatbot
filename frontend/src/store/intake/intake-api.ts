import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "@/config/api";
import { axiosBaseQuery } from "@/store/api-base-query";
import type { IIntakeState, ISession, ITurnResponse } from "@/schemas/intake-schema";

const URI = baseUrl("/api/session");

export const SESSION_TAG = "session" as const;

export const intakeApi = createApi({
  reducerPath: "intakeApi",
  baseQuery: axiosBaseQuery({ baseUrl: URI }),
  tagTypes: [SESSION_TAG],
  endpoints: (builder) => ({
    // A 404 means "no intake yet"; the route starts one instead of toasting.
    getSession: builder.query<ISession, void>({
      query: () => ({ url: "", method: "GET", skipErrorToast: true }),
      providesTags: [SESSION_TAG],
    }),
    createSession: builder.mutation<ISession, void>({
      query: () => ({ url: "", method: "POST" }),
      invalidatesTags: [SESSION_TAG],
    }),
    // Errors are shown inline in the chat with a Retry button.
    sendMessage: builder.mutation<ITurnResponse, string>({
      query: (text) => ({ url: "/messages", method: "POST", data: { text }, skipErrorToast: true }),
      async onQueryStarted(text, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (!data) return;
        const { reply, ...state } = data;
        dispatch(
          intakeApi.util.updateQueryData("getSession", undefined, (session) => {
            Object.assign(session, state);
            session.messages.push({ role: "user", content: text }, { role: "assistant", content: reply });
          }),
        );
      },
    }),
    submit: builder.mutation<IIntakeState, string>({
      query: (summary) => ({ url: "/submit", method: "POST", data: { summary } }),
      invalidatesTags: [SESSION_TAG],
    }),
  }),
});

export const {
  useGetSessionQuery,
  useCreateSessionMutation,
  useSendMessageMutation,
  useSubmitMutation,
} = intakeApi;
