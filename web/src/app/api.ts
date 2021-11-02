import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query";
import { MarketSymbol } from "./types";

export let tickerDataSelector;

export const tickerApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.SNOWPACK_PUBLIC_BACKEND_URL,
  }),
  reducerPath: "tickerApi",
  endpoints: (build) => ({
    getTickerData: build.query<
      MarketSymbol,
      { symbol: string; aggregation?: string }
    >({
      query: ({ symbol, aggregation }) => ({
        url: `MarketSymbol/${symbol}`,
        params: { aggregation },
      }),
      onQueryStarted: (args) => {
        tickerDataSelector = tickerApi.endpoints.getTickerData.select(args);
      },
    }),
  }),
});
