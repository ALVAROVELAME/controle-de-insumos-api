import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthController } from "../../controllers/conta/AuthController";
import { authenticate } from "../../middlewares/authenticate";

// Limite por processo; em multiplas instancias, use um armazenamento compartilhado.
const tentativas = new Map<string, { total: number; ate: number }>();
async function limitar(request: FastifyRequest, reply: FastifyReply) {
  const agora = Date.now();
  for (const [key, item] of tentativas) if (item.ate <= agora) tentativas.delete(key);
  const chave = `${request.ip}:${request.routeOptions.url}`;
  const item = tentativas.get(chave) ?? { total: 0, ate: agora + 15 * 60 * 1000 };
  item.total++;
  tentativas.set(chave, item);
  if (item.total > 10) return reply.code(429).send({ sucesso: false, mensagem: "Muitas tentativas. Tente novamente mais tarde." });
}
export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/forgot-password", { preHandler: limitar }, AuthController.solicitarRecuperacao);
  app.post("/api/auth/reset-password", { preHandler: limitar }, AuthController.redefinirSenha);
  app.post("/api/auth/login", AuthController.login);
  app.get("/api/auth/me", { preHandler: authenticate }, AuthController.me);
  app.get("/api/auth/confirmar", AuthController.confirmar);
}
