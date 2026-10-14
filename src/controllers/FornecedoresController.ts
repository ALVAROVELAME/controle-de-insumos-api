import { FastifyReply, FastifyRequest } from "fastify";
import { FornecedorService } from "../services/FornecedorService";
import { CriarFornecedorDTO } from "../dtos/fornecedores/FornecedorDTO";

export const FornecedoresController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const lista = await FornecedorService.listar(usuarioId);
    return reply.send(lista);
  },

  async criar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const dto = CriarFornecedorDTO.parse(request.body);
    const fornecedor = await FornecedorService.criar(dto, usuarioId);
    return reply.status(201).send(fornecedor);
  },

  async atualizar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const { id } = request.params as { id: string };
    const dto = CriarFornecedorDTO.parse(request.body);
    const fornecedor = await FornecedorService.atualizar(id, dto, usuarioId);
    return reply.send(fornecedor);
  },

  async excluir(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const { id } = request.params as { id: string };
    await FornecedorService.excluir(id, usuarioId);
    return reply.status(204).send();
  },

  async zerar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    await FornecedorService.zerar(usuarioId);
    return reply.status(204).send();
  },
};