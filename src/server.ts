import Fastify from "fastify";
import { env } from "./config/env";
import { conectarMongo } from "./database/mongo";
import { errorHandler } from "./middlewares/errorHandler";
import { authRoutes } from "./routes/auth.routes";
import { usuariosRoutes } from "./routes/usuarios.routes";

const app = Fastify({ logger: true });

app.setErrorHandler(errorHandler);

// Health check
app.get("/", async () => ({ status: "API controle de insumos funcionando" }));

// Rotas
app.register(authRoutes);
app.register(usuariosRoutes);

async function iniciar() {
  try {
    await conectarMongo();

    await app.listen({ host: "0.0.0.0", port: env.port });
    console.log(`API rodando na porta ${env.port}`);
  } catch (erro) {
    app.log.error(erro);
    process.exit(1);
  }
}

iniciar();
