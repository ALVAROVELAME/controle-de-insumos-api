import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/AuthService";
import { EmailConfirmationService } from "../services/EmailConfirmationService";
import { LoginRequestDTO } from "../dtos/auth/LoginRequestDTO";
import { mensagem } from "../dtos/comum/MensagemResponseDTO";
import { UnauthorizedError } from "../errors/AppError";

export const AuthController = {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const dto = LoginRequestDTO.parse(request.body);
    const resposta = await AuthService.login(dto);

    if (!resposta.sucesso) return reply.status(401).send(resposta);
    return reply.send(resposta);
  },

  async me(request: FastifyRequest, reply: FastifyReply) {
    const usuario = await AuthService.obterPorId(request.usuario!.id);
    if (!usuario) throw new UnauthorizedError("Usuario nao encontrado.");
    return reply.send(usuario);
  },

  async confirmar(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.query as { token?: string };
    if (!token) throw new UnauthorizedError("Token nao informado.");

    const ok = await EmailConfirmationService.confirmarEmail(token);
    if (!ok) {
      return reply.status(400).send(mensagem("Token invalido ou expirado", false));
    }

    return reply.send(mensagem("E-mail confirmado com sucesso"));
  },
};
