import { readFileSync } from "fs";
import { DocumentStore, IAuthOptions } from "ravendb";
import { MarketSymbol, SymbolPrice } from "./models";

const authOptions: IAuthOptions = {
  certificate: readFileSync(process.env.DB_CERT_PATH),
  password: process.env.DB_PASSWORD,
  type: "pfx",
};
const store = new DocumentStore(
  process.env.DB_URL,
  process.env.DB_NAME,
  authOptions
);
let initialized = false;

export async function initializeDb() {
  if (initialized) return;

  store.initialize();

  store.conventions.registerEntityType(MarketSymbol);
  await store.timeSeries.register(MarketSymbol, SymbolPrice, "history");

  initialized = true;
}

export function openDbSession() {
  if (!initialized)
    throw new Error(
      "DocumentStore is not initialized yet. Must `await initializeDb()` before calling `openDbSession()`."
    );
  return store.openSession();
}
