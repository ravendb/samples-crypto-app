using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Azure.Functions.Worker.Configuration;
using Raven.Client.Documents;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System;
using Raven.Client.Documents.Session;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using RavenDbStockDemo.Models;

namespace RavenDbStockDemo
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