import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "@/config/api";
import { env } from "@/config/env-config";
import { axiosBaseQuery } from "@/store/api-base-query";
import type { IAuthUser, ILoginForm } from "@/schemas/auth-schema";

const URI = baseUrl(env.AUTH_API_PATH);

// Invalidate this tag after anything that changes the session (e.g. a
// project-specific `login` mutation) so AuthProvider re-reads /me.
export const AUTH_USER_TAG = "authenticated-user" as const;

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: axiosBaseQuery({ baseUrl: URI }),
  tagTypes: [AUTH_USER_TAG],
  endpoints: (builder) => ({
    getAuthUser: builder.query<IAuthUser, void>({
      query: () => ({ url: "/me", method: "GET" }),
      providesTags: [AUTH_USER_TAG],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/logout", method: "POST" }),
      invalidatesTags: [AUTH_USER_TAG],
    }),
    login: builder.mutation<IAuthUser, ILoginForm>({
      query: (data) => ({ url: "/login", method: "POST", data }),
      invalidatesTags: [AUTH_USER_TAG],
    }),
  }),
});

export const { useGetAuthUserQuery, useLoginMutation, useLogoutMutation } = authApi;
