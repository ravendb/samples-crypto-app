import dayjs from "dayjs";
import { tickerApi, tickerDataSelector } from "./api";
import { chart } from "./chart";
import { formatCurrency } from "./helpers";
import { store } from "./store";
import { MarketSymbolTimeBucket } from "./types";

const Ui = {
  get symbol() {
    return document.getElementById("crypto-symbol");
  },
  get price() {
    return document.getElementById("crypto-price");
  },
  get changePrice() {
    return document.getElementById("crypto-change-price");
  },
  get changePercentage() {
    return document.getElementById("crypto-change-perc");
  },
  get changeTimespanDisplay() {
    return document.getElementById("crypto-change-timespan");
  },
  get changeSummary() {
    return document.querySelector<HTMLElement>(".crypto-change-summary");
  },
  get aggregationButtons() {
    return document.querySelectorAll<HTMLButtonElement>(
      ".crypto-timeline-button"
    );
  },
  aggregationButton(aggregation: string) {
    return document.querySelector<HTMLElement>(
      `[data-aggregate-by="${aggregation}"]`
    );
  },
};

function getCryptoApiData() {
  const state = store.getState();

  if (!tickerDataSelector) return;

  const { data, error } = tickerDataSelector(state);

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export default function updateUi() {
  const data = getCryptoApiData();
  if (!data) return;

  Ui.symbol.innerText = data.symbol;

  updateUrlState(data.aggregation, data.symbol);
  updatePriceState(data.lastPrice, data.changePrice);
  updateAggregationState(data.aggregation);
  updateChartState(data.history, data.aggregation);
}

function updateUrlState(aggregation: string, symbol: string) {
  if (aggregation) {
    window.history.replaceState(
      { aggregation },
      symbol,
      "/?view=" + aggregation
    );
  }
}

function updatePriceState(lastPrice: number, changePrice: number) {
  Ui.price.innerText = lastPrice.toFixed(2);

  if (lastPrice === 0) {
    lastPrice = 1;
  }

  Ui.changePercentage.innerText =
    ((changePrice / lastPrice) * 100).toFixed(2) + "%";

  if (changePrice > 0) {
    Ui.changePrice.innerText = `+${formatCurrency(changePrice)}`;
  } else {
    Ui.changePrice.innerText = formatCurrency(changePrice);
  }

  Ui.changeSummary.dataset.changeType =
    changePrice > 0 ? "positive" : changePrice === 0 ? "none" : "negative";
}

function updateAggregationState(aggregation: string) {
  Ui.aggregationButtons.forEach((btn) => {
    delete btn.dataset.selected;
  });

  const aggregateByButton = Ui.aggregationButton(aggregation);

  aggregateByButton.dataset.selected = "true";
  Ui.changeTimespanDisplay.innerText =
    aggregateByButton.dataset.aggregateByText;
}

function updateChartState(
  series: MarketSymbolTimeBucket[],
  aggregation: string
) {
  chart.updateSeries(
    [
      {
        name: "Price",
        data: series.map((bucket) => ({
          x: bucket.timestamp,
          y: bucket.closingPrice,
        })),
      },
    ],
    true
  );
  chart.clearAnnotations();
  if (aggregation === "OneDay") {
    chart.addYaxisAnnotation({
      y: series[0].closingPrice,
      borderColor: "#666",
      strokeDashArray: 1,
      opacity: 0.5,
    });
  }
}

export function setupAggregationButtonListeners() {
  Ui.aggregationButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const aggregation = (e.target as HTMLElement).dataset.aggregateBy;

      store.dispatch(
        tickerApi.endpoints.getTickerData.initiate(
          {
            symbol: "BTC-USDT",
            aggregation,
          },
          { forceRefetch: true }
        )
      );
    });
  });
}

export function resetPointInTimeState() {
  const data = getCryptoApiData();
  if (!data) return;

  updatePriceState(data.lastPrice, data.changePrice);

  const aggregateByButton = Ui.aggregationButton(data.aggregation);

  Ui.changeTimespanDisplay.innerText =
    aggregateByButton.dataset.aggregateByText;
}

export function updatePointInTimeState(timestamp: string, amount: number) {
  const data = getCryptoApiData();
  if (!data) return;

  const changePrice = amount - data.lastPrice;

  updatePriceState(data.lastPrice, changePrice);

  Ui.changeTimespanDisplay.innerText =
    dayjs(timestamp).format("hh:mm A MMM DD");
}
