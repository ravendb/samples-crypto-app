import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";
import {
  IDocumentSession,
  ITimeSeriesQueryBuilder,
  TimeSeriesAggregationResult,
} from "ravendb";
import { openSession } from "./db";
import {
  AggregationView,
  MarketSymbol,
  MarketSymbolTimeBucket,
  MarketSymbolViewModel,
  MarketTime,
  SymbolPrice,
} from "./models";

const MAX_DATE = new Date(8640000000000000);

dayjs.extend(utc);
dayjs.extend(timezone);

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const { marketSymbol } = context.bindingData;
  const { aggregation } = req.query ?? {};
  const view = getAggregationViewFromQuery(aggregation);

  context.log("Loading market data for:", marketSymbol);

  const session = openSession();
  try {
    const viewModel = await getMarketSymbolData(marketSymbol, view, session);

    context.res = {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
      body: viewModel,
    };
  } catch (err) {
    context.log("Encountered exception while fetching market data", err);

    context.res = {
      status: 500,
      headers: {
        "content-type": "application/json",
        "x-invocation-id": context.invocationId,
      },
      body: {
        error: "Could not fetch market data",
      },
    };
  } finally {
    session.dispose();
  }
};

function getAggregationViewFromQuery(
  view: string | undefined
): AggregationView {
  if (!view) return AggregationView.OneDay;
  return AggregationView[view];
}

async function getMarketSymbolData(
  marketSymbol: string,
  aggregation: AggregationView,
  session: IDocumentSession
) {
  const symbol = await session.load<MarketSymbol>(
    `MarketSymbols/${marketSymbol}`
  );

  if (!symbol) {
    return null;
  }

  const viewModel: MarketSymbolViewModel = {
    id: symbol.Id,
    symbol: symbol.Symbol,
    aggregation,
    lastPrice: 0,
    changePrice: 0,
    isPreMarket: false,
    history: [],
  };

  const historyTimeSeries = session.timeSeriesFor(
    symbol,
    "history",
    SymbolPrice
  );
  const latestEntries = await historyTimeSeries.get(
    dayjs().utc().subtract(1, "day").toDate(),
    dayjs().utc().toDate()
  );
  const latestEntry = latestEntries.pop();

  viewModel.lastUpdated = latestEntry?.timestamp;
  viewModel.lastPrice = latestEntry?.value?.close;

  viewModel.history = await getSymbolAggregationBuckets(
    marketSymbol,
    aggregation,
    session
  );

  const firstBucket = viewModel.history?.[0];

  if (firstBucket) {
    var marketTime = getMarketTime();
    viewModel.isPreMarket = marketTime.isBeforeOpen;
    if (marketTime.isBeforeOpen) {
      viewModel.changePrice = 0;
    } else {
      viewModel.changePrice = viewModel.lastPrice - firstBucket.closingPrice;
    }
  }

  return viewModel;
}

async function getSymbolAggregationBuckets(
  marketSymbol: string,
  aggregation: AggregationView,
  session: IDocumentSession
) {
  const groupingActions: Record<AggregationView, string> = {
    [AggregationView.OneDay]: "5 minutes",
    [AggregationView.OneWeek]: "10 minutes",
    [AggregationView.OneMonth]: "1 hour",
    [AggregationView.ThreeMonths]: "24 hours",
    [AggregationView.OneYear]: "24 hours",
    [AggregationView.FiveYears]: "7 days",
  };
  const groupingAction = groupingActions[aggregation];

  const marketTime = getMarketTime();
  const fromDates: Record<AggregationView, Date> = {
    [AggregationView.OneDay]: marketTime.lastTradingOpen,
    [AggregationView.OneWeek]: dayjs().utc().subtract(7, "days").toDate(),
    [AggregationView.OneMonth]: dayjs().utc().subtract(1, "month").toDate(),
    [AggregationView.ThreeMonths]: dayjs().utc().subtract(3, "months").toDate(),
    [AggregationView.OneYear]: dayjs().utc().subtract(1, "year").toDate(),
    [AggregationView.FiveYears]: dayjs().utc().subtract(5, "years").toDate(),
  };
  const fromDate = fromDates[aggregation];

  const symbolId = `MarketSymbols/${marketSymbol}`;
  const SymbolProjection = class extends TimeSeriesAggregationResult {};

  const aggregatedHistoryQueryResult = await session
    .query({
      collection: "MarketSymbol",
    })
    .whereEquals("Id", symbolId)
    .selectTimeSeries(
      (builder) =>
        builder.raw(
          `from history 
          between '${fromDate.toISOString()}' and '${MAX_DATE.toISOString()}' 
          group by '${groupingAction}' 
          select first(), last(), min(), max()`
        ),
      SymbolProjection
    )
    .firstOrNull();

  if (!aggregatedHistoryQueryResult) {
    return [];
  }

  const historyBuckets: MarketSymbolTimeBucket[] = [];
  aggregatedHistoryQueryResult.results.forEach((seriesAggregation) => {
    const symbolPrice =
      seriesAggregation.asTypedEntry<SymbolPrice>(SymbolPrice);

    historyBuckets.push({
      timestamp: symbolPrice.from,
      openingPrice: symbolPrice.first.open,
      closingPrice: symbolPrice.last.close,
      highestPrice: symbolPrice.max.high,
      lowestPrice: symbolPrice.min.low,
    });
  });

  return historyBuckets;
}

function getMarketTime(): MarketTime {
  const zonedNow = dayjs.tz(dayjs(), "America/New_York");
  const startOfTradingDay = zonedNow.startOf("day");
  const tradeStartTime = startOfTradingDay.add(9, "hours").add(30, "minutes");

  const isBeforeOpen = zonedNow.isBefore(tradeStartTime);
  const fromTradeDate = isBeforeOpen
    ? tradeStartTime.subtract(1, "day").utc()
    : tradeStartTime.utc();

  return {
    currentTradeOpen: tradeStartTime.toDate(),
    isBeforeOpen,
    lastTradingOpen: fromTradeDate.toDate(),
  };
}

export default httpTrigger;
