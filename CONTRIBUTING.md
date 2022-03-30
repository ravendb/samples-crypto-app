# Contributing

## Running Locally

### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/) (recommended)
- [Azure Functions Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions) for Visual Studio Code
- [Azure Functions Core Tools v3](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v3%2Cwindows%2Ccsharp%2Cportal%2Cbash%2Ckeda#install-the-azure-functions-core-tools)
- [C# Extension](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) for Visual Studio Code
- [.NET Core 5.0 SDK](https://dotnet.microsoft.com/download)
- [.NET Core 3.1 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org) 14 LTS

There is a Visual Studio Code workspace (`ravendb-samples-crypto-app.code-workspace`) that makes it easier to run/debug the sample projects in this repository.

Each project directory contains a README that explains how to run and set up that project locally.

## Deployment

### RavenDB Cloud

The data is kept for 1 year in a [RavenDB Cloud](https://cloud.ravendb.net) database. When setting up your own sample locally, you can adjust the environment variables for the Azure Functions to point to your own local RavenDB instance or another hosted RavenDB instance.

### Netlify

`web` is deployed is deployed statically on [AWS S3 Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html).

The hosted URL is at https://crypto.samples.ravendb.net

#### Build Minutes

Be aware Netlify has a "Build minutes" allotment. Every build uses up time and once you reach your plan's limit, builds will be stopped.

### Azure Functions

Each Azure Function app can be deployed manually through Visual Studio Code.

#### Deploying

Using the [Azure Functions VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions), you can select any Function app listed and deploy it manually to your own Azure account. You would need to do this after any major change you want to see deployed.

Alternatively, you can set up automated continuous deployments [through GitHub Actions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-github-actions?tabs=dotnet).

#### Settings

A `local.settings.json` file is used for local settings, the contents is listed in each Function `README`. The same settings can be provided within the Azure portal.

#### Outbound IP Addresses

For RavenDB Cloud, IP restriction is enabled which means for an Azure Function app you must allow the Function's outbound IP addresses access to the database.

For how to find your Az Function's outbound IPs, see: https://docs.microsoft.com/en-us/azure/azure-functions/ip-addresses?tabs=portal#find-outbound-ip-addresses

#### Configuring RavenDB Certificates (.pfx)

You will need to add RavenDB client certificate through Azure portal.

In the Azure portal on you Azure Function management page from the left navigation of your app, select TLS/SSL settings, then select Private Key Certificates (.pfx).

Add your client certificate and make a note of the certificate thumbprint.

See: https://jan-v.nl/post/loading-certificates-with-azure-functions/

It's recommended to create a least-privilege User-level client certificate [using RavenDB Studio](https://ravendb.net/docs/article-page/5.2/csharp/server/security/authentication/certificate-management) or [the RavenDB CLI](https://ravendb.net/docs/article-page/5.2/csharp/server/security/authentication/client-certificate-usage) for connecting and _not_ an Operator-level or Cluster Admin certificate provided as they provide privileged access.

- `ingestion` requires **Read-Write** access to the database
- `backend` only requires **Read** access to the database

Both Azure Function deployments should use separately scoped certificates with different passphrases.

Additionally in order for the Azure Function application to be able to load the certificate, `WEBSITE_LOAD_CERTIFICATES` environment variable needs to be set to the thumbprint of the client certificate.

#### Specifying Backend URL

When launching the `web` project using `npm start` or `npm start:local`, the environment variable `SNOWPACK_PUBLIC_BACKEND_URL` is passed pointing to the HTTP trigger URL in Azure. You can specify a different value for the variable to change what URL the web frontend will fetch data from.

#### Enabling CORS

When setting up a new Azure Function HTTP trigger, you will need to add a CORS rule to allow `http://localhost:8080` since this is the default URL when running `web` locally.