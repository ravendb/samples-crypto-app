declare global {
  interface ImportMeta {
    env: {
      /**
       * The API backend URL
       */
      SNOWPACK_PUBLIC_BACKEND_URL: string;
    };
  }
}

export interface MarketSymbol {
  symbol: string;
  lastPrice: number | null;
  changePrice: number | null;
  lastUpdated: number | null;
  aggregation: string;
  history: MarketSymbolTimeBucket[];
}

export interface MarketSymbolTimeBucket {
  timestamp: string;
  openingPrice: number;
  closingPrice: number;
  highestPrice: number;
  lowestPrice: number;
}
