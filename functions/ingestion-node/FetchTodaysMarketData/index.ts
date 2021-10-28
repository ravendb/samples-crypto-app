import { AzureFunction, Context } from "@azure/functions";
import { readFileSync } from "fs";
import { DocumentStore } from "ravendb";
import * as dotenv from "dotenv";
import fetch from "node-fetch";
import dayjs from "dayjs";

dotenv.config();

const db = new DocumentStore(process.env.DB_URL, process.env.DB_NAME, {
  type: "pfx",
  certificate: readFileSync(process.env.DB_PATH),
  password: process.env.DB_PASSWORD,
});
db.initialize();

const timerTrigger: AzureFunction = async function (
  context: Context,
  _myTimer: any
): Promise<void> {
  const timeStamp = new Date().toISOString();
  const SYMBOL_TO_FETCH = "BTC-USDT";

  context.log(
    "Fetching today's market data for",
    SYMBOL_TO_FETCH,
    "at",
    timeStamp
  );

  const startOfDay = dayjs(Date.now()).startOf("day").unix();
  const endOfDay = dayjs(Date.now()).endOf("day").unix();

  const buckets = await fetchMarketSymbolCandleBuckets(
    SYMBOL_TO_FETCH,
    startOfDay,
    endOfDay
  );

  await saveMarketSymbolBuckets(SYMBOL_TO_FETCH, buckets);
};

export default timerTrigger;

async function fetchMarketSymbolCandleBuckets(
  marketSymbol: string,
  startAtInSeconds: number,
  endAtInSeconds: number
) {
  // See: https://docs.kucoin.com/#get-klines
  const candleUrl = `https://openapi-v2.kucoin.com/api/v1/market/candles?type=1min&symbol=${marketSymbol}&startAt=${startAtInSeconds}&endAt=${endAtInSeconds}`;
  console.log("Making GET request:", candleUrl);
  const res = await fetch(candleUrl);
  const { data: buckets } = await res.json();

  console.info("Fetched", buckets.length, "candle buckets for", marketSymbol);

  return buckets;
}

async function saveMarketSymbolBuckets(
  marketSymbol: string,
  buckets: number[][]
) {
  const session = db.openSession();

  try {
    let symbolDoc = await session.load(`MarketSymbols/${marketSymbol}`);

    if (!symbolDoc) {
      symbolDoc = {
        symbol: marketSymbol,
        "@metadata": {
          "@collection": "MarketSymbols",
        },
      };
    }

    const timeSeries = session.timeSeriesFor(symbolDoc, "history");

    for (const bucket of buckets) {
      const [startTime, openPrice, closePrice, highPrice, lowPrice] = bucket;
      const ts = dayjs.unix(startTime);

      timeSeries.append(
        ts.toDate(),
        [openPrice, closePrice, highPrice, lowPrice]
      );
    }

    await session.store(symbolDoc, `MarketSymbols/${marketSymbol}`);
    await session.saveChanges();

    console.info(`Successfully saved entries to MarketSymbols/${marketSymbol}`);
  } catch (err) {
    console.error(err);
  } finally {
    session.dispose();
  }
}
