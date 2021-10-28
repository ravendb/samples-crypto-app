# Web Frontend

This web frontend is deployed statically to Netlify at https://ravendb-stock-demo.netlify.app

## Running Locally

```
npm install
npm start
```

The local app will call the Azure Functions backend API.

### Use local Azure Functions HTTP backend

When starting a local Azure Function (see backend guides), you can pass the API URL through
a [Snowpack environment variable](https://www.snowpack.dev/reference/environment-variables):

Use the `start:local` NPM script to automatically pass the default `http://localhost:7071` URL.
You can also pass `SNOWPACK_PUBLIC_BACKEND_URL` yourself to `npm start`.

```
npm install

# Use http://localhost:7071 Azure Functions backend
npm run start:local

# Use custom URL for Azure Functions backend
SNOWPACK_PUBLIC_BACKEND_URL=http://xxx npm start
```