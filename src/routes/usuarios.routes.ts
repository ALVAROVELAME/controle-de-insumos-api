import { FastifyInstance } from "fastify";
import { UsuariosController } from "../controllers/UsuariosController";
import { authenticate } from "../middlewares/authenticate";

export async function usuariosRoutes(app: FastifyInstance) {
  app.post("/api/usuarios", UsuariosController.cadastrar);
  app.get(
    "/api/usuarios/me",
    { preHandler: authenticate },
    UsuariosController.me
  );
  app.post(
    "/api/usuarios/me/excluir",
    { preHandler: authenticate },
    UsuariosController.excluirConta
  );
}
