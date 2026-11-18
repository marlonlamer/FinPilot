const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "..", ".env.test");
if (!fs.existsSync(envPath)) {
  throw new Error("Missing backend/.env.test; integration tests require the isolated finpilot_test database.");
}

const testConfig = dotenv.parse(fs.readFileSync(envPath));
if (!testConfig.DATABASE_URL) {
  throw new Error("backend/.env.test must define DATABASE_URL.");
}

const databaseUrl = new URL(testConfig.DATABASE_URL);
if (
  databaseUrl.protocol !== "postgresql:" ||
  databaseUrl.hostname !== "127.0.0.1" ||
  databaseUrl.port !== "55432" ||
  databaseUrl.pathname !== "/finpilot_test" ||
  databaseUrl.username !== "finpilot_test"
) {
  throw new Error("Refusing integration tests: DATABASE_URL must target the isolated local finpilot_test database.");
}

process.env.DATABASE_URL = testConfig.DATABASE_URL;
delete process.env.DIRECT_URL;
delete process.env.SHADOW_DATABASE_URL;
process.env.JWT_SECRET = "finpilot-account-deletion-integration-test";
