import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  let status = 500;
  let mensagem = "Erro interno do servidor.";

  if (error instanceof AppError) {
    status = error.statusCode;
    mensagem = error.message;
  } else if (error instanceof ZodError) {
    status = 400;
    mensagem = error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
  } else if (error.name === "ValidationError") {
    status = 400;
    mensagem = error.message;
  }

  if (status >= 500) {
    request.log.error(error, "Erro nao tratado");
  } else {
    request.log.warn(`Erro tratado [${status}]: ${mensagem}`);
  }

  return reply.status(status).send({
    sucesso: false,
    mensagem,
  });
}
