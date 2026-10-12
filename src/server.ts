import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env";
import { conectarMongo } from "./database/mongo";
import { errorHandler } from "./middlewares/errorHandler";
import { authRoutes } from "./routes/auth.routes";
import { usuariosRoutes } from "./routes/usuarios.routes";

const app = Fastify({ logger: true });

app.setErrorHandler(errorHandler);

async function iniciar() {
  try {
    // ------------------------------------------------------------
    // 1. CORS (deve ser registrado ANTES das rotas)
    // ------------------------------------------------------------
    await app.register(cors, {
      origin: env.corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    });

    // ------------------------------------------------------------
    // 2. Swagger (deve ser registrado ANTES das rotas)
    // ------------------------------------------------------------
    await app.register(swagger, {
      openapi: {
        openapi: "3.0.3",
        info: {
          title: "Controle de Insumos API",
          description: "API de controle de insumos com autenticacao JWT",
          version: "1.0.0",
        },
        servers: [
          { url: env.appBaseUrl, description: "Servidor atual" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description: "Cole o token JWT (sem o prefixo Bearer).",
            },
          },
        },
      },
    });

    await app.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: true,
      },
      staticCSP: true,
    });

    // ------------------------------------------------------------
    // 3. Health check
    // ------------------------------------------------------------
    app.get(
      "/",
      {
        schema: {
          tags: ["Health"],
          summary: "Health check publico",
          response: {
            200: {
              type: "object",
              properties: {
                status: { type: "string" },
              },
            },
          },
        },
      },
      async () => ({ status: "API controle de insumos funcionando" })
    );

    // ------------------------------------------------------------
    // 4. Rotas
    // ------------------------------------------------------------
    await app.register(authRoutes);
    await app.register(usuariosRoutes);

    // ------------------------------------------------------------
    // 5. Banco + Listen
    // ------------------------------------------------------------
    await conectarMongo();

    await app.listen({ host: "0.0.0.0", port: env.port });
    console.log(`API rodando na porta ${env.port}`);
    console.log(`Swagger disponivel em ${env.appBaseUrl}/docs`);
    console.log(`CORS liberado para: ${env.corsOrigin}`);
  } catch (erro) {
    app.log.error(erro);
    process.exit(1);
  }
}

iniciar();