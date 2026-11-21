import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { authRoutes } from "./routes/conta/auth.routes";
import { usuariosRoutes } from "./routes/conta/usuarios.routes";
import { insumosRoutes } from "./routes/estoque/insumos.routes";
import { fornecedoresRoutes } from "./routes/estoque/fornecedores.routes";
import { movimentacoesRoutes } from "./routes/estoque/movimentacoes.routes";

/** Monta a API sem conectar ao banco nem abrir uma porta. */
export async function criarApp(options: { logger?: boolean } = {}) {
  const app = Fastify({ logger: options.logger ?? true });
  app.setErrorHandler(errorHandler);

  await app.register(cors, {
    origin: env.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  });

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Controle de Insumos API",
        description: "API de controle de insumos com autenticacao JWT",
        version: "1.0.0",
      },
      servers: [{ url: env.appBaseUrl, description: "Servidor atual" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http", scheme: "bearer", bearerFormat: "JWT",
            description: "Cole o token JWT (sem o prefixo Bearer).",
          },
        },
      },
    },
  });
  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: true },
    staticCSP: true,
  });

  app.get("/", {
    schema: {
      tags: ["Health"], summary: "Health check publico",
      response: { 200: { type: "object", properties: { status: { type: "string" } } } },
    },
  }, async () => ({ status: "API controle de insumos funcionando" }));

  await app.register(authRoutes);
  await app.register(usuariosRoutes);
  await app.register(insumosRoutes);
  await app.register(fornecedoresRoutes);
  await app.register(movimentacoesRoutes);
  return app;
}
