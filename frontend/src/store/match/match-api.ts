import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "@/config/api";
import { axiosBaseQuery } from "@/store/api-base-query";
import type { IAssociateResponse, IMatchRequest, IMatchResponse } from "@/schemas/match-schema";

const URI = baseUrl("/api/match");

// Errors are shown inline in the chat with a Retry button, so no toasts.
export const matchApi = createApi({
  reducerPath: "matchApi",
  baseQuery: axiosBaseQuery({ baseUrl: URI }),
  endpoints: (builder) => ({
    findAssociate: builder.mutation<IAssociateResponse, string>({
      query: (name) => ({ url: "/associate", method: "POST", data: { name }, skipErrorToast: true }),
    }),
    match: builder.mutation<IMatchResponse, IMatchRequest>({
      query: (data) => ({ url: "", method: "POST", data, skipErrorToast: true }),
    }),
  }),
});

