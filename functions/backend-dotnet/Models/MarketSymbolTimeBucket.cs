using System;

namespace RavenDbStockDemo.Models
{
  public class MarketSymbolTimeBucket
  {
    public DateTime Timestamp { get; set; }

    public double OpeningPrice { get; set; }

    public double ClosingPrice { get; set; }

    public double HighestPrice { get; set; }

    public double LowestPrice { get; set; }

  }
}