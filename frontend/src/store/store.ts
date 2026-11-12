import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./auth/auth-api";
import { chatSlice } from "./match/chat-slice";
import { matchApi } from "./match/match-api";
import { specialistApi } from "./specialists/specialist-api";

// Register every RTK Query api here: its reducer under `reducerPath` and its
// middleware in the chain.
export const makeStore = () =>
  configureStore({
    reducer: {
      [authApi.reducerPath]: authApi.reducer,
      [chatSlice.reducerPath]: chatSlice.reducer,
      [matchApi.reducerPath]: matchApi.reducer,
      [specialistApi.reducerPath]: specialistApi.reducer,
    },
    middleware: (defaultMiddleware) =>
      defaultMiddleware().concat(authApi.middleware, matchApi.middleware, specialistApi.middleware),
  });

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export default store;
