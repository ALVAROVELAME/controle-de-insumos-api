import { FastifyReply, FastifyRequest } from "fastify";
import { JwtTokenGenerator } from "../security/JwtTokenGenerator";
import { UnauthorizedError } from "../errors/AppError";

declare module "fastify" {
  interface FastifyRequest {
    usuario?: { id: string; nome: string; email: string };
  }
}

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token ausente ou mal formatado.");
  }

  const token = header.substring(7);

  try {
    request.usuario = JwtTokenGenerator.verificar(token);
  } catch {
    throw new UnauthorizedError("Token invalido ou expirado.");
  }
}
