# HTTP Backend (.NET 5 / C#)

This is an Azure Function HTTP trigger written in .NET 5 and C#.

## Running Locally

### Prerequisites

Follow the guide on [running Functions locally](https://docs.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-csharp?tabs=isolated-process&pivots=programming-runtime-functions-v3) in an `Isolated process` to install all the prerequisite SDKs.

### Starting the Function app

In VS Code, you can use the Debugger to start/run the app with the correct arguments and settings loaded.

The VS Code debug task is (hit F5 to run):

    Attach to .NET Functions (backend-dotnet)

### Settings

To run locally, you will need a `local.settings.json` file like this:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "DB_URL": "<db url>",
    "DB_NAME": "data",
    "DB_CERT_PATH": "./db.pfx",
    "DB_PASSWORD": "<password>"
  }
}
```

### For more information

See the [Deployment section](../../CONTRIBUTING.md) in CONTRIBUTING documentation.