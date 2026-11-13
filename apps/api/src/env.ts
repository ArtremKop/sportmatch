import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  accessSecret: must("JWT_ACCESS_SECRET"),
  refreshSecret: must("JWT_REFRESH_SECRET"),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
