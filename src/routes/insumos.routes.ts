import { FastifyInstance } from "fastify";
import { InsumosController } from "../controllers/InsumosController";
import { authenticate } from "../middlewares/authenticate";

export async function insumosRoutes(app: FastifyInstance) {
  app.get("/api/insumos", { preHandler: authenticate }, InsumosController.listar);
  app.post("/api/insumos", { preHandler: authenticate }, InsumosController.criar);
  app.put("/api/insumos/:id", { preHandler: authenticate }, InsumosController.atualizar);
  app.delete("/api/insumos/:id", { preHandler: authenticate }, InsumosController.excluir);
  app.delete("/api/insumos", { preHandler: authenticate }, InsumosController.zerar);
}