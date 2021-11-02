import ApexCharts from "apexcharts";
import dayjs from "dayjs";
import { formatCurrency } from "./helpers";
import { resetPointInTimeState, updatePointInTimeState } from "./state";

const chartOptions = {
  chart: {
    type: "line",
    events: {
      mouseLeave: (event, chartContext, config) => {
        resetPointInTimeState();
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
        const timestamp = ctx.data.twoDSeriesX[dataPointIndex];
        const amount = series[seriesIndex][dataPointIndex];

        updatePointInTimeState(timestamp, amount);
      }
      return "<span id='chart-hover-marker'></span>";
    },
  },
};

const chart = new ApexCharts(
  document.querySelector(".crypto-chart"),
  chartOptions
);
chart.render();

function resetPriceStateOnMutation(mutations: MutationRecord[]) {
  const markers = mutations.filter((mut) =>
    (mut.target as HTMLElement).classList.contains("apexcharts-marker")
  );

  if (
    markers.some(
      (marker) => (marker.target as SVGElement).getAttribute("r") === "0"
    )
  ) {
    resetPointInTimeState();
  }
}

const observer = new MutationObserver(resetPriceStateOnMutation);
observer.observe(document.querySelector(".crypto-chart"), {
  subtree: true,
  attributes: true,
  attributeFilter: ["r"],
});

export { chart };
