import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`Variavel de ambiente ${key} nao configurada.`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "Development"),
  port: Number(optional("PORT", "3000")),

  mongoUri: required("MONGO_URI"),

  mail: {
    host: required("MAIL_HOST"),
    port: Number(required("MAIL_PORT")),
    username: required("MAIL_USERNAME"),
    password: required("MAIL_PASSWORD"),
    from: required("MAIL_FROM"),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiration: Number(optional("JWT_EXPIRATION", "86400000")),
    issuer: optional("JWT_ISSUER", "controle-de-insumos-api"),
    audience: optional("JWT_AUDIENCE", "controle-de-insumos-api"),
  },

  corsOrigin: optional("CORS_ORIGIN", "http://localhost:5173"),

  appBaseUrl: optional("APP_BASE_URL", "http://localhost:3000"),
  appFrontendUrl: optional("APP_FRONTEND_URL", "http://localhost:5173"),
};

if (env.jwt.secret.length < 32) {
  throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres.");
}