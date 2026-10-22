import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./auth/auth-api";
import { intakeApi } from "./intake/intake-api";

// Register every RTK Query api here: its reducer under `reducerPath` and its
// middleware in the chain.
export const makeStore = () =>
  configureStore({
    reducer: {
      [authApi.reducerPath]: authApi.reducer,
      [intakeApi.reducerPath]: intakeApi.reducer,
    },
    middleware: (defaultMiddleware) =>
      defaultMiddleware().concat(authApi.middleware, intakeApi.middleware),
  });

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export default store;
