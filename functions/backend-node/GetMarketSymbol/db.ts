import { readFileSync } from "fs";
import { DocumentStore, IAuthOptions } from "ravendb";

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

store.initialize();

export function openSession() {
  return store.openSession();
}
