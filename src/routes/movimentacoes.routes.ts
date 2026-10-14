import { FastifyInstance } from "fastify";
import { MovimentacoesController } from "../controllers/MovimentacoesController";
import { authenticate } from "../middlewares/authenticate";

export async function movimentacoesRoutes(app: FastifyInstance) {
  app.get("/api/movimentacoes", { preHandler: authenticate }, MovimentacoesController.listar);
  app.post("/api/movimentacoes", { preHandler: authenticate }, MovimentacoesController.criar);
  app.put("/api/movimentacoes/:id", { preHandler: authenticate }, MovimentacoesController.atualizar);
  app.delete("/api/movimentacoes/:id", { preHandler: authenticate }, MovimentacoesController.excluir);
  app.delete("/api/movimentacoes", { preHandler: authenticate }, MovimentacoesController.zerar);
}