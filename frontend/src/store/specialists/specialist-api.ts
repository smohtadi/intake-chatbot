import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "@/config/api";
import { axiosBaseQuery } from "@/store/api-base-query";
import type {
  ISpecialist,
  ISpecialistOptions,
  ISpecialistSummary,
  ISpecialistUpdate,
} from "@/schemas/specialist-schema";

const URI = baseUrl("/api/specialists");

export const SPECIALIST_TAG = "specialist" as const;
const LIST_ID = "LIST";

export const specialistApi = createApi({
  reducerPath: "specialistApi",
  baseQuery: axiosBaseQuery({ baseUrl: URI }),
  tagTypes: [SPECIALIST_TAG],
  endpoints: (builder) => ({
    getSpecialists: builder.query<ISpecialistSummary[], void>({
      query: () => ({ url: "", method: "GET" }),
      providesTags: [{ type: SPECIALIST_TAG, id: LIST_ID }],
    }),
    getSpecialistOptions: builder.query<ISpecialistOptions, void>({
      query: () => ({ url: "/options", method: "GET" }),
    }),
    getSpecialist: builder.query<ISpecialist, string>({
      query: (id) => ({ url: `/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: SPECIALIST_TAG, id }],
    }),
    updateSpecialist: builder.mutation<ISpecialist, ISpecialistUpdate & { id: string }>({
      query: ({ id, ...data }) => ({ url: `/${id}`, method: "PUT", data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: SPECIALIST_TAG, id },
        { type: SPECIALIST_TAG, id: LIST_ID },
      ],
    }),
  }),
});

export const {
  useGetSpecialistsQuery,
  useGetSpecialistOptionsQuery,
  useGetSpecialistQuery,
  useUpdateSpecialistMutation,
} = specialistApi;
