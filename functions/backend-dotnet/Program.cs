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
using Raven.Demos.CryptoApp.Models;

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
				      var certificate = GetRavendbCertificate();
				      var url = GetEnvironmentVariable("DB_URL");
				      var db = GetEnvironmentVariable("DB_NAME");
				      var store = new DocumentStore()
				      {
					      Urls = new string[] { url },
					      Database = db,
					      Certificate = certificate
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

		private static X509Certificate2 GetRavendbCertificate()
		{
			var certThumb = Environment.GetEnvironmentVariable("DB_CERT_THUMBPRINT");

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
				throw new ArgumentException($"Environment variable '{name}' is required.");
			return val;
		}

	}
}