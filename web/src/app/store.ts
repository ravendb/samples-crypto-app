import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { tickerApi } from "./api";

const store = configureStore({
  reducer: {
    [tickerApi.reducerPath]: tickerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tickerApi.middleware),
});

setupListeners(store.dispatch);

export { store }