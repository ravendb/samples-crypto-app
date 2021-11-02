using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System;
using System.Security.Cryptography.X509Certificates;
using Raven.Demos.CryptoApp.Models;
using Refit;

namespace Raven.Demos.CryptoApp
{
  public class Program
  {
    public static void Main()
    {
      var host = new HostBuilder()
          .ConfigureFunctionsWorkerDefaults(builder =>
          {
            builder.Services.Configure<JsonSerializerOptions>(jsonSerializerOptions =>
            {
              // Camel-case property name policy
              jsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            });
          })
          .ConfigureServices(services =>
          {
            services.TryAddSingleton<DocumentStore>(provider =>
            {
              var store = new DocumentStore()
              {
                Urls = new string[] {
                  GetEnvironmentVariable("DB_URL")
                },
                Database = GetEnvironmentVariable("DB_NAME"),
                Certificate = new System.Security.Cryptography.X509Certificates.X509Certificate2(
                  GetEnvironmentVariable("DB_CERT_PATH"),
                  GetEnvironmentVariable("DB_PASSWORD"),
                  X509KeyStorageFlags.MachineKeySet),
              };
              store.Initialize();
              store.TimeSeries.Register<MarketSymbol, SymbolPrice>("history");
              return store;

            });

            services.TryAddTransient<IAsyncDocumentSession>(provider =>
            {
              var store = provider.GetService(typeof(DocumentStore)) as DocumentStore;
              return store.OpenAsyncSession();
            });

            services
              .AddRefitClient<IKucoinApi>()
              .ConfigureHttpClient(c => c.BaseAddress = new Uri("https://openapi-v2.kucoin.com"));
          })
          .Build();

      host.Run();
    }

    private static string GetEnvironmentVariable(string name)
    {
      return System.Environment.GetEnvironmentVariable(name, EnvironmentVariableTarget.Process);
    }
  }
}