import Fastify from "fastify";
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
    // 1. Swagger (deve ser registrado ANTES das rotas)
    // ------------------------------------------------------------
    await app.register(swagger, {
      openapi: {
        openapi: "3.0.3",
        info: {
          title: "Controle de Insumos API",
          description: "API de controle de insumos com autenticação JWT",
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
              description: "Cole o token JWT (sem o prefixo 'Bearer ').",
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
    // 2. Health check
    // ------------------------------------------------------------
    app.get(
      "/",
      {
        schema: {
          tags: ["Health"],
          summary: "Health check público",
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
    // 3. Rotas
    // ------------------------------------------------------------
    await app.register(authRoutes);
    await app.register(usuariosRoutes);

    // ------------------------------------------------------------
    // 4. Banco + Listen
    // ------------------------------------------------------------
    await conectarMongo();

    await app.listen({ host: "0.0.0.0", port: env.port });
    console.log(`API rodando na porta ${env.port}`);
    console.log(`Swagger disponivel em ${env.appBaseUrl}/docs`);
  } catch (erro) {
    app.log.error(erro);
    process.exit(1);
  }
}

iniciar();