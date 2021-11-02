import {
  EntityObjectLiteralDescriptor,
  TimeSeriesValue,
  TimeSeriesValuesHelper,
} from "ravendb";

export enum AggregationView {
  OneDay = 0,
  OneWeek = 1,
  OneMonth = 2,
  ThreeMonths = 3,
  OneYear = 4,
  FiveYears = 5,
}

export class MarketSymbol {
  constructor(public id: string, public Symbol: string) {}
}

export interface MarketSymbolViewModel {
  id: string;
  symbol: string;
  lastPrice: number;
  changePrice: number;
  lastUpdated?: Date;
  aggregation: AggregationView;
  isPreMarket: boolean;
  history: MarketSymbolTimeBucket[];
}

export interface MarketSymbolTimeBucket {
  timestamp: Date;
  openingPrice: number;
  closingPrice: number;
  highestPrice: number;
  lowestPrice: number;
}

export interface MarketTime {
  currentTradeOpen: Date;
  lastTradingOpen: Date;
  isBeforeOpen: boolean;
}

export class SymbolPrice {
  open: number;
  close: number;
  high: number;
  low: number;

  static TIME_SERIES_VALUES: TimeSeriesValue<SymbolPrice> = [
    { field: "open", name: "Open" },
    { field: "close", name: "Close" },
    { field: "high", name: "High" },
    { field: "low", name: "Low" },
  ];
}
