import { tickerApi } from "./api";
import { store } from "./store";
import updateUi, { setupAggregationButtonListeners } from "./state";

window.addEventListener("DOMContentLoaded", () => {
  store.dispatch(
    tickerApi.endpoints.getTickerData.initiate({ symbol: "BTC-USDT" })
  );

  setupAggregationButtonListeners();
});

store.subscribe(updateUi);
