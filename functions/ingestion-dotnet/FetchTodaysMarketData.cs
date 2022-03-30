using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NodaTime;
using Raven.Client.Documents.Session;
using Raven.Demos.CryptoApp.Models;

namespace Raven.Demos.CryptoApp
{
	public static class FetchTodaysMarketData
	{
		const string SYMBOL_TO_FETCH = "BTC-USDT";

		static DateTimeZone MarketTimeZone = DateTimeZoneProviders.Tzdb.GetZoneOrNull("America/New_York");

		[Function("FetchTodaysMarketDataDotNet")]
		public static async Task Run([TimerTrigger("0 15/30 * * * *", RunOnStartup = true)] MyInfo myTimer, FunctionContext context)
		{
			var logger = context.GetLogger("FetchTodaysMarketDataDotNet");

			logger.LogInformation(
			  $"Fetching today's market data for {SYMBOL_TO_FETCH} at {DateTime.Now}"
			);
			logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");

			var now = SystemClock.Instance.GetCurrentInstant();
			var today = now.InZone(MarketTimeZone).Date;

			var startOfDay = MarketTimeZone.AtStartOfDay(today).ToInstant().ToUnixTimeSeconds();
			var endOfDay = MarketTimeZone.AtStartOfDay(today.PlusDays(1)).ToInstant().ToUnixTimeSeconds();

			var buckets = await FetchMarketSymbolCandleBucketsAsync(
			  SYMBOL_TO_FETCH,
			  startOfDay,
			  endOfDay,
			  context
			);

			await SaveMarketSymbolBuckets(SYMBOL_TO_FETCH, buckets, context);

			logger.LogInformation($"Successfully saved entries to MarketSymbols/{SYMBOL_TO_FETCH}");
		}

		private static async Task<KucoinMarketCandleBucket[]> FetchMarketSymbolCandleBucketsAsync(string symbol, long startUnixTime, long endUnixTime, FunctionContext context)
		{
			var kucoinApi = context.InstanceServices.GetService<IKucoinApi>();
			var res = await kucoinApi.GetMarketCandles(symbol, "1min", startUnixTime, endUnixTime);

			if (res.Data != null)
			{
				return res.Data.Select(bucket =>
				{
					return new KucoinMarketCandleBucket()
					{
						Timestamp = long.Parse(bucket[0]),
						OpenPrice = double.Parse(bucket[1]),
						ClosePrice = double.Parse(bucket[2]),
						HighPrice = double.Parse(bucket[3]),
						LowPrice = double.Parse(bucket[4])
					};
				}).ToArray();
			}
			else
			{
				return new KucoinMarketCandleBucket[] { };
			}
		}

		private static async Task SaveMarketSymbolBuckets(string symbol, KucoinMarketCandleBucket[] buckets, FunctionContext context)
		{
			using (var session = context.InstanceServices.GetService<IAsyncDocumentSession>())
			{
				var id = $"MarketSymbols/{symbol}";
				var symbolDoc = await session.LoadAsync<MarketSymbol>(id);

				if (symbolDoc == null)
				{
					symbolDoc = new MarketSymbol()
					{
						Symbol = symbol
					};

					await session.StoreAsync(symbolDoc, null, id);
				}

				var historyTimeSeries = session.TimeSeriesFor<SymbolPrice>(symbolDoc, "history");

				foreach (var bucket in buckets)
				{
					var date = DateTimeOffset.FromUnixTimeSeconds(bucket.Timestamp).UtcDateTime;
					historyTimeSeries.Append(date, new SymbolPrice()
					{
						Open = bucket.OpenPrice,
						Close = bucket.ClosePrice,
						High = bucket.HighPrice,
						Low = bucket.LowPrice
					});
				}

				await session.StoreAsync(symbolDoc);
				await session.SaveChangesAsync();
			}
		}
	}

	public class MyInfo
	{
		public MyScheduleStatus ScheduleStatus { get; set; }

		public bool IsPastDue { get; set; }
	}

	public class MyScheduleStatus
	{
		public DateTime Last { get; set; }

		public DateTime Next { get; set; }

		public DateTime LastUpdated { get; set; }
	}
}
