using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System;
using System.Security.Cryptography.X509Certificates;
using Microsoft.Extensions.Configuration;
using Raven.Demos.CryptoApp.Models;
using Refit;

namespace Raven.Demos.CryptoApp
{
    public class Program
    {
        public static void Main()
        {
            var host = new HostBuilder()
                .ConfigureAppConfiguration(configBuilder => configBuilder.AddEnvironmentVariables())
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
                        var certBytesBase64 = GetEnvironmentVariable("DB_CERT_BASE64");
                        var certificateBytes = Convert.FromBase64String(certBytesBase64);
                        var store = new DocumentStore()
                        {
                            Urls = new string[]
                            {
                                GetEnvironmentVariable("DB_URL")
                            },
                            Database = GetEnvironmentVariable("DB_NAME"),
                            Certificate = GetRavendbCertificate()
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

        private static X509Certificate2 GetRavendbCertificate()
        {
            var certThumb = GetEnvironmentVariable("DB_CERT_THUMBPRINT");

            X509Store certStore = new X509Store(StoreName.My, StoreLocation.CurrentUser);
            certStore.Open(OpenFlags.ReadOnly);

            X509Certificate2Collection certCollection = certStore.Certificates
                .Find(X509FindType.FindByThumbprint, certThumb, false);

            // Get the first cert with the thumbprint
            if (certCollection.Count > 0)
            {
                X509Certificate2 cert = certCollection[0];
                return cert;
            }

            certStore.Close();

            throw new Exception($"Certificate {certThumb} not found.");
        }

        private static string GetEnvironmentVariable(string name)
        {
            var val = System.Environment.GetEnvironmentVariable(name);
            if (string.IsNullOrEmpty(val))
            {
                throw new ArgumentException($"Env var {name} was not passed.");
            }

            return val;
        }
    }
}