using System;
using System.Threading.Tasks;
using Refit;

namespace Raven.Demos.TimeSeries
{
  public interface IKucoinApi
  {
    [Get("/api/v1/market/candles")]
    Task<KucoinResponseWithData<string[][]>> GetMarketCandles(string symbol, string type, long startAt, long endAt);
  }

  public class KucoinResponseWithData<T>
  {
    public T Data { get; set; }
    public string Code { get; set; }
  }

  public struct KucoinMarketCandleBucket
  {
    public long Timestamp;
    public double OpenPrice;
    public double ClosePrice;
    public double HighPrice;
    public double LowPrice;
  }

  // .NET 6 C# 10
  // public record struct MarketSymbolCandleBucket(long timestamp, double openPrice, double closePrice, double highPrice, double lowPrice);
}