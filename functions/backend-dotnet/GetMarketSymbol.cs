using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using NodaTime;
using Raven.Client.Documents;
using Raven.Client.Documents.Queries;
using Raven.Client.Documents.Queries.TimeSeries;
using Raven.Client.Documents.Session;
using RavenDbStockDemo.Models;

namespace RavenDbStockDemo
{
  public class GetMarketSymbol
  {
    private readonly IAsyncDocumentSession _session;

    public GetMarketSymbol(IAsyncDocumentSession session)
    {
      _session = session;
    }

    [Function("GetMarketSymbol")]
    public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "MarketSymbol/{marketSymbol}")] HttpRequestData req,
        string marketSymbol,
        string aggregation,
        FunctionContext executionContext)
    {
      var logger = executionContext.GetLogger("GetMarketSymbol");
      logger.LogInformation("Loading market data for: " + marketSymbol);

      AggregationView view = AggregationView.OneDay;
      if (!string.IsNullOrEmpty(aggregation))
      {
        view = (AggregationView)AggregationView.Parse(typeof(AggregationView), aggregation);
      }

      var response = req.CreateResponse(HttpStatusCode.OK);
      var viewModel = await GetMarketSymbolData(marketSymbol, view);

      await response.WriteAsJsonAsync(viewModel);

      return response;
    }

    public async Task<MarketSymbolViewModel> GetMarketSymbolData(
      string marketSymbol, AggregationView aggregation)
    {
      var symbol = await _session.LoadAsync<MarketSymbol>(
        $"MarketSymbols/{marketSymbol}", includes =>
          includes.IncludeTimeSeries("history",
            from: DateTime.UtcNow.AddDays(-1), to: DateTime.UtcNow));

      if (symbol == null)
      {
        return null;
      }

      var viewModel = new MarketSymbolViewModel()
      {
        Id = symbol.Id,
        Symbol = symbol.Symbol,
        Aggregation = aggregation
      };

      // Get latest price
      var historyTimeSeries = _session.TimeSeriesFor<SymbolPrice>(symbol, "history");
      var latestEntries = await historyTimeSeries.GetAsync(
        from: DateTime.UtcNow.AddDays(-1), to: DateTime.UtcNow);

      var latestEntry = latestEntries.LastOrDefault();

      viewModel.LastUpdated = latestEntry?.Timestamp;
      viewModel.LastPrice = latestEntry?.Value.Close ?? 0;

      // Get historically aggregated price
      viewModel.History = await GetSymbolAggregationBucketsAsync(marketSymbol, aggregation);
      var firstBucket = viewModel.History.FirstOrDefault();

      if (firstBucket != null)
      {
        var marketTime = GetMarketTime();
        viewModel.IsPreMarket = marketTime.IsBeforeOpen;
        if (marketTime.IsBeforeOpen)
        {
          viewModel.ChangePrice = 0;
        }
        else
        {
          viewModel.ChangePrice = viewModel.LastPrice - firstBucket.ClosingPrice;
        }
      }

      return viewModel;
    }

    private MarketTime GetMarketTime()
    {
      var estTradeTimeZone = DateTimeZoneProviders.Tzdb["America/New_York"];
      var now = SystemClock.Instance.GetCurrentInstant();
      var zonedNow = now.InZone(estTradeTimeZone);
      var startOfTradingDay = estTradeTimeZone.AtStartOfDay(zonedNow.Date);
      var tradeStartTime = startOfTradingDay.PlusHours(9).PlusMinutes(30);

      var isBeforeMarketOpen = now < tradeStartTime.ToInstant();
      var fromTradeDate = isBeforeMarketOpen ? tradeStartTime.PlusHours(-24).ToDateTimeUtc() : tradeStartTime.ToDateTimeUtc();

      return new MarketTime()
      {
        CurrentTradeOpen = tradeStartTime,
        IsBeforeOpen = isBeforeMarketOpen,
        LastTradingOpen = fromTradeDate
      };
    }

    private async Task<MarketSymbolTimeBucket[]> GetSymbolAggregationBucketsAsync(string marketSymbol, AggregationView aggregation)
    {
      Action<ITimePeriodBuilder> groupingAction = aggregation switch
      {
        AggregationView.OneDay => builder => builder.Minutes(5),
        AggregationView.OneWeek => builder => builder.Minutes(10),
        AggregationView.OneMonth => builder => builder.Hours(1),
        AggregationView.ThreeMonths => builder => builder.Hours(24),
        AggregationView.OneYear => builder => builder.Hours(24),
        AggregationView.FiveYears => builder => builder.Days(7),
      };

      var marketTime = GetMarketTime();
      var fromDate = aggregation switch
      {
        AggregationView.OneDay => marketTime.LastTradingOpen,
        AggregationView.OneWeek => DateTime.UtcNow.AddDays(-7),
        AggregationView.OneMonth => DateTime.UtcNow.AddMonths(-1),
        AggregationView.ThreeMonths => DateTime.UtcNow.AddMonths(-3),
        AggregationView.OneYear => DateTime.UtcNow.AddYears(-1),
        AggregationView.FiveYears => DateTime.UtcNow.AddYears(-5)
      };

      var symbolId = "MarketSymbols/" + marketSymbol;
      var aggregatedHistoryQueryResult = await _session.Query<MarketSymbol>()
        .Where(c => c.Id == symbolId)
        .Select(c => RavenQuery.TimeSeries<SymbolPrice>(c, "history")
          .Where(s => s.Timestamp > fromDate)
          .GroupBy(groupingAction)
          .Select(g => new
          {
            First = g.First(),
            Last = g.Last(),
            Min = g.Min(),
            Max = g.Max()
          })
          .ToList()
        ).ToListAsync();


      var aggregatedHistory = aggregatedHistoryQueryResult.FirstOrDefault();

      if (aggregatedHistory == null)
      {
        return new MarketSymbolTimeBucket[0];
      }

      var historyBuckets = new List<MarketSymbolTimeBucket>();
      foreach (var seriesAggregation in aggregatedHistory.Results)
      {
        historyBuckets.Add(new MarketSymbolTimeBucket()
        {
          Timestamp = seriesAggregation.From,
          OpeningPrice = seriesAggregation.First.Open,
          ClosingPrice = seriesAggregation.Last.Close,
          HighestPrice = seriesAggregation.Max.High,
          LowestPrice = seriesAggregation.Min.Low,
        });
      }

      return historyBuckets.ToArray();
    }
  }
}
