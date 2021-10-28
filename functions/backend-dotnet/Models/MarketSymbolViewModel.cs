using System;

namespace RavenDbStockDemo.Models
{
  public class MarketSymbolViewModel
  {
    public string Id { get; set; }

    public string Symbol { get; set; }

    public double LastPrice { get; set; }

    public double ChangePrice { get; set; }

    public DateTime? LastUpdated { get; set; }

    public AggregationView Aggregation { get; set; }

    public MarketSymbolTimeBucket[] History { get; set; }
    public bool IsPreMarket { get; internal set; }
  }
}