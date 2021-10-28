# Ingest Bitcoin Data (C#)

This provides the backing data for the chart. Data is ingested via KuCoin's API, which offers 1m granularity and history for market symbols. They also offer a real-time Web Socket API.

You will need your RavenDB certificate PFX file (`db.pfx`) and the following environment variables set to the correct values:

```
DB_URL=<url to your ravendb host>
DB_NAME=<database name>
DB_PASSWORD=<database password>
```

These can be provided via the `local.settings.json` file _or_ through environment variables.

## Running the Ingestion

To start the ingestion, run:

```sh
dotnet run
```

This will fetch the ticket history (in 1m buckets) from the start of _today_ to now and save it to the database for the BTC-USDT document.

### For more information

See the [Deployment section](../../CONTRIBUTING.md) in CONTRIBUTING documentation.