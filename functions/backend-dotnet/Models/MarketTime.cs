using System;
using NodaTime;

namespace RavenDbStockDemo.Models
{
  public class MarketTime
  {
    public ZonedDateTime CurrentTradeOpen { get; internal set; }
    public bool IsBeforeOpen { get; internal set; }
    public DateTime LastTradingOpen { get; internal set; }
  }
}