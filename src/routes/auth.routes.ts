import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/AuthController";
import { authenticate } from "../middlewares/authenticate";

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", AuthController.login);
  app.get("/api/auth/me", { preHandler: authenticate }, AuthController.me);
  app.get("/api/auth/confirmar", AuthController.confirmar);
}
