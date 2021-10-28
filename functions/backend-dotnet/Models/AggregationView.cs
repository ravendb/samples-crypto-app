using System.Text.Json.Serialization;

namespace RavenDbStockDemo.Models
{

  [JsonConverter(typeof(JsonStringEnumConverter))]
  public enum AggregationView
  {
    OneDay = 0,
    OneWeek = 1,
    OneMonth = 2,
    ThreeMonths = 3,
    OneYear = 4,
    FiveYears = 5
  }
}