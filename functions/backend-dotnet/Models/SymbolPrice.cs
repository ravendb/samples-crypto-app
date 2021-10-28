using Raven.Client.Documents.Session.TimeSeries;

namespace RavenDbStockDemo.Models
{
  public struct SymbolPrice
  {
    [TimeSeriesValue(0)] public double Open;
    [TimeSeriesValue(1)] public double Close;
    [TimeSeriesValue(2)] public double High;
    [TimeSeriesValue(3)] public double Low;
  }
}