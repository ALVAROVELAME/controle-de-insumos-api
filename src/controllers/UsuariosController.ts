import { FastifyReply, FastifyRequest } from "fastify";
import { UsuarioService } from "../services/UsuarioService";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioCadastroDTO } from "../dtos/usuarios/UsuarioCadastroDTO";
import { ExcluirContaRequestDTO } from "../dtos/usuarios/ExcluirContaRequestDTO";
import { mensagem } from "../dtos/comum/MensagemResponseDTO";
import { NotFoundError, UnauthorizedError } from "../errors/AppError";

export const UsuariosController = {
  async cadastrar(request: FastifyRequest, reply: FastifyReply) {
    const dto = UsuarioCadastroDTO.parse(request.body);
    await UsuarioService.cadastrar(dto);
    return reply
      .status(200)
      .send(
        mensagem(
          "Cadastro iniciado. Verifique seu email para confirmar a conta."
        )
      );
  },

  async me(request: FastifyRequest, reply: FastifyReply) {
    const u = await UsuarioRepository.findById(request.usuario!.id);
    if (!u) throw new NotFoundError("Usuario nao encontrado.");

    return reply.send({
      id: String(u._id),
      nome: u.nome,
      email: u.email,
      ativo: u.ativo,
    });
  },

  async excluirConta(request: FastifyRequest, reply: FastifyReply) {
    const dto = ExcluirContaRequestDTO.parse(request.body);

    const u = await UsuarioRepository.findById(request.usuario!.id);
    if (!u) throw new UnauthorizedError("Usuario nao encontrado.");

    await UsuarioService.excluirConta(u, dto.senha);
    return reply.send(mensagem("Conta excluida com sucesso."));
  },
};
