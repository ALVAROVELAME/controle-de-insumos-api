import { FastifyInstance } from "fastify";
import { FornecedoresController } from "../controllers/FornecedoresController";
import { authenticate } from "../middlewares/authenticate";

export async function fornecedoresRoutes(app: FastifyInstance) {
  app.get("/api/fornecedores", { preHandler: authenticate }, FornecedoresController.listar);
  app.post("/api/fornecedores", { preHandler: authenticate }, FornecedoresController.criar);
  app.put("/api/fornecedores/:id", { preHandler: authenticate }, FornecedoresController.atualizar);
  app.delete("/api/fornecedores/:id", { preHandler: authenticate }, FornecedoresController.excluir);
  app.delete("/api/fornecedores", { preHandler: authenticate }, FornecedoresController.zerar);
}