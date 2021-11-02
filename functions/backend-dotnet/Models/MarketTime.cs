using System;
using NodaTime;

namespace Raven.Demos.CryptoApp.Models
{
  public class MarketTime
  {
    public ZonedDateTime CurrentTradeOpen { get; internal set; }
    public bool IsBeforeOpen { get; internal set; }
    public DateTime LastTradingOpen { get; internal set; }
  }
}