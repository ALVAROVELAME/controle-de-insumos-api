import { criarApp } from "./app";
import { env } from "./config/env";
import { conectarMongo } from "./database/mongo";

async function iniciar() {
  try {
    const app = await criarApp();
    await conectarMongo();
    await app.listen({ host: "0.0.0.0", port: env.port });
    app.log.info(`API rodando na porta ${env.port}`);
    app.log.info(`Swagger disponivel em ${env.appBaseUrl}/docs`);
    app.log.info(`CORS liberado para: ${env.corsOrigin.join(", ")}`);
  } catch (erro) {
    console.error(erro);
    process.exit(1);
  }
}

iniciar();
