import { configureStore } from "@reduxjs/toolkit";
import {
  createApi,
  fetchBaseQuery,
  setupListeners,
} from "@reduxjs/toolkit/query";
import ApexCharts from "apexcharts";
import dayjs from "dayjs";

import { MarketSymbol, MarketSymbolTimeBucket } from "./types";

const formatCurrency = Intl?.NumberFormat
  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
      .format
  : (amount: number) => `$${amount.toFixed(6)}`;

function formatChange(amount: number) {
  if (amount > 0) {
    return `+${formatCurrency(amount)}`;
  } else {
    return formatCurrency(amount);
  }
}

let tickerDataSelector;

const tickerApi = createApi({
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

const store = configureStore({
  reducer: {
    [tickerApi.reducerPath]: tickerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tickerApi.middleware),
});

setupListeners(store.dispatch);

window.addEventListener("DOMContentLoaded", () => {
  store.dispatch(
    tickerApi.endpoints.getTickerData.initiate({ symbol: "BTC-USDT" })
  );
  document.querySelectorAll(".crypto-timeline-button").forEach((button) => {
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
});

function updateUiState() {
  const state = store.getState();

  if (!tickerDataSelector) return;

  const { data, error } = tickerDataSelector(state);

  if (data) {
    document.getElementById("crypto-symbol").innerText = data.symbol;
    document.getElementById("crypto-price").innerText =
      data.lastPrice.toFixed(2);

    updateChangeSummaryUiState(data.lastPrice, data.changePrice);

    document
      .querySelectorAll<HTMLButtonElement>(".crypto-timeline-button")
      .forEach((btn) => {
        delete btn.dataset.selected;
      });

    const aggregateByButton = document.querySelector<HTMLElement>(
      `[data-aggregate-by="${data.aggregation}"]`
    );

    aggregateByButton.dataset.selected = "true";
    document.getElementById("crypto-change-timespan").innerText =
      aggregateByButton.dataset.aggregateByText;

    renderChart(data.aggregation, data.history);

    // Sync to URL
    if (data.aggregation) {
      window.history.replaceState(
        { aggregation: data.aggregation },
        data.symbol,
        "/?view=" + data.aggregation
      );
    }
  } else if (error) {
    console.error(error);
  }
}

function resetPriceUiState() {
  const state = store.getState();

  if (!tickerDataSelector) return;

  const { data } = tickerDataSelector(state);

  if (data) {
    document.getElementById("crypto-price").innerText =
      data.lastPrice.toFixed(2);

    updateChangeSummaryUiState(data.lastPrice, data.changePrice);

    const aggregateByButton = document.querySelector<HTMLElement>(
      `[data-aggregate-by="${data.aggregation}"]`
    );

    document.getElementById("crypto-change-timespan").innerText =
      aggregateByButton.dataset.aggregateByText;
  }
}

function updateChangeSummaryUiState(lastPrice: number, changePrice: number) {
  if (lastPrice === 0) {
    lastPrice = 1;
  }
  document.getElementById("crypto-change-price").innerText =
    formatChange(changePrice);
  document.getElementById("crypto-change-perc").innerText =
    ((changePrice / lastPrice) * 100).toFixed(2) + "%";

  const changeSummaryElement = document.querySelector(
    ".crypto-change-summary"
  ) as HTMLElement;

  if (changeSummaryElement) {
    changeSummaryElement.dataset.changeType =
      changePrice > 0 ? "positive" : changePrice === 0 ? "none" : "negative";
  }
}

store.subscribe(updateUiState);

var chartOptions = {
  chart: {
    type: "line",
    events: {
      mouseLeave: (event, chartContext, config) => {
        resetPriceUiState();
      },
    },
    toolbar: {
      show: false,
    },
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350,
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  grid: {
    show: false,
  },
  markers: {
    size: 0,
  },
  theme: {
    monochrome: {
      enabled: true,
      color: "rgb(239, 68, 68)",
      shadeTo: "light",
      shadeIntensity: 0.65,
    },
  },
  stroke: {
    width: 3,
    lineCap: "round",
  },
  series: [],
  xaxis: {
    type: "datetime",
    max: dayjs().endOf("day").toDate().getTime(),
    labels: {
      show: false,
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    tooltip: { enabled: false },
  },
  yaxis: {
    labels: {
      show: false,
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  tooltip: {
    theme: "dark",
    x: { show: false },
    y: { formatter: formatCurrency },
    marker: {
      show: false,
    },
    custom: ({ series, seriesIndex, dataPointIndex, ctx }) => {
      if (dataPointIndex >= 0) {
        const amount = series[seriesIndex][dataPointIndex];
        const timestamp = ctx.data.twoDSeriesX[dataPointIndex];

        const state = store.getState();
        const { data } = tickerDataSelector(state);

        if (data) {
          const changePrice = amount - data.lastPrice;

          updateChangeSummaryUiState(data.lastPrice, changePrice);

          document.getElementById("crypto-change-timespan").innerText =
            dayjs(timestamp).format("hh:mm A MMM DD");
          document.getElementById("crypto-price").innerText = amount.toFixed(2);
        }
      }
      return "<span id='chart-hover-marker'></span>";
    },
  },
};

var chart = new ApexCharts(
  document.querySelector(".crypto-chart"),
  chartOptions
);
chart.render();

function onChartMutation(
  mutations: MutationRecord[],
  observer: MutationObserver
) {
  const markers = mutations.filter((mut) =>
    (mut.target as HTMLElement).classList.contains("apexcharts-marker")
  );

  if (
    markers.some(
      (marker) => (marker.target as SVGElement).getAttribute("r") === "0"
    )
  ) {
    resetPriceUiState();
  }
}

var observer = new MutationObserver(onChartMutation);
observer.observe(document.querySelector(".crypto-chart"), {
  subtree: true,
  attributes: true,
  attributeFilter: ["r"],
});

async function renderChart(
  aggregation: string,
  series: MarketSymbolTimeBucket[]
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
