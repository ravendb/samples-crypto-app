# RavenDB Crypto App Sample

An end-to-end sample application that showcases Time Series support in RavenDB through a crypto / stock chart inspired by [Robinhood](https://robinhood.com/us/en/) and powered by API data provided by [Kucoin](https://docs.kucoin.com/).

## Live Demo

https://ravendb-samples-crypto-app.netlify.com

## Database Export

You can download a sample export of the RavenDB database [here](#tbd) that you can import into your own RavenDB instance locally or in [RavenDB Cloud](https://cloud.ravendb.net).

## Components

- **web** - A static HTML & TypeScript website front-end to display the crypto chart deployed through [Netlify](https://netlify.com).
- **functions/ingestion-\*** - Node.js and .NET 5 C# [Azure functions](https://www.azure.com) that ingest BTC-USDT symbol data from Kucoin every 35 minutes.
- **functions/backend-\*** - Node.js and .NET 5 C# [Azure functions](https://www.azure.com) that host the HTTP endpoint to return aggregations and crypto symbol data.

The Azure Functions are implemented using both the .NET and Node.js SDKs for RavenDB to showcase working with Time Series APIs.

## Running Locally

See [CONTRIBUTING.md](CONTRIBUTING.md) for information on how to run the app locally or deploy it yourself.