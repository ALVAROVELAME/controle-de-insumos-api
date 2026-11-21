import { z } from "zod";
import { PasswordResetService } from "../../services/conta/PasswordResetService";
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../../services/conta/AuthService";
import { EmailConfirmationService } from "../../services/conta/EmailConfirmationService";
import { LoginRequestDTO } from "../../dtos/conta/LoginRequestDTO";
import { mensagem } from "../../dtos/MensagemResponseDTO";
import { UnauthorizedError } from "../../errors/AppError";

export const AuthController = {
  async solicitarRecuperacao(request: FastifyRequest, reply: FastifyReply) {
    const { email } = z.object({ email: z.string().trim().email().max(200) }).parse(request.body);
    try { await PasswordResetService.solicitar(email); }
    catch (error) { request.log.error(error, "Falha ao solicitar recuperacao"); }
    return reply.send(mensagem("Se o e-mail estiver cadastrado, voce recebera um link de recuperacao."));
  },
  async redefinirSenha(request: FastifyRequest, reply: FastifyReply) {
    const { token, senha } = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), senha: z.string().min(6).max(100).refine(v => v.trim().length > 0) }).parse(request.body);
    const ok = await PasswordResetService.redefinir(token, senha);
    return ok ? reply.send(mensagem("Senha redefinida com sucesso.")) : reply.status(400).send(mensagem("Link invalido ou expirado.", false));
  },
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
