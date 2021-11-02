import dayjs from "dayjs";
import { tickerApi, tickerDataSelector } from "./api";
import { chart } from "./chart";
import { formatCurrency } from "./helpers";
import { store } from "./store";
import { MarketSymbolTimeBucket } from "./types";

const Page = {
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

export default function updateUi() {
  const state = store.getState();

  if (!tickerDataSelector) return;

  const { data, error } = tickerDataSelector(state);

  if (error) {
    console.error(error);
  }

  if (!data) return;

  Page.symbol.innerText = data.symbol;

  updateChangeSummaryState(data.lastPrice, data.changePrice);
  updateAggregationButtonState(data.aggregation);
  updateChartState(data.history, data.aggregation);
  updateUrlState(data.aggregation, data.symbol);
}

function updateAggregationButtonState(aggregation: string) {
  Page.aggregationButtons.forEach((btn) => {
    delete btn.dataset.selected;
  });

  const aggregateByButton = Page.aggregationButton(aggregation);

  aggregateByButton.dataset.selected = "true";
  Page.changeTimespanDisplay.innerText =
    aggregateByButton.dataset.aggregateByText;
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

function updateChangeSummaryState(lastPrice: number, changePrice: number) {
  Page.price.innerText = lastPrice.toFixed(2);

  if (lastPrice === 0) {
    lastPrice = 1;
  }

  Page.changePercentage.innerText =
    ((changePrice / lastPrice) * 100).toFixed(2) + "%";

  if (changePrice > 0) {
    Page.changePrice.innerText = `+${formatCurrency(changePrice)}`;
  } else {
    Page.changePrice.innerText = formatCurrency(changePrice);
  }

  Page.changeSummary.dataset.changeType =
    changePrice > 0 ? "positive" : changePrice === 0 ? "none" : "negative";
}

export function setupAggregationButtonListeners() {
  Page.aggregationButtons.forEach((button) => {
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
  const state = store.getState();

  if (!tickerDataSelector) return;

  const { data } = tickerDataSelector(state);

  if (!data) return;

  updateChangeSummaryState(data.lastPrice, data.changePrice);

  const aggregateByButton = Page.aggregationButton(data.aggregation);

  Page.changeTimespanDisplay.innerText =
    aggregateByButton.dataset.aggregateByText;
}

export function updatePointInTimeState(timestamp: string, amount: number) {
  const state = store.getState();
  const { data } = tickerDataSelector(state);

  if (!data) return;

  const changePrice = amount - data.lastPrice;

  updateChangeSummaryState(data.lastPrice, changePrice);

  Page.changeTimespanDisplay.innerText =
    dayjs(timestamp).format("hh:mm A MMM DD");
}
