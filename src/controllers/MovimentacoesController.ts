import { FastifyReply, FastifyRequest } from "fastify";
import { MovimentacaoService } from "../services/MovimentacaoService";
import { CriarMovimentacaoDTO } from "../dtos/movimentacoes/MovimentacaoDTO";

export const MovimentacoesController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const lista = await MovimentacaoService.listar(usuarioId);
    return reply.send(lista);
  },

  async criar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const dto = CriarMovimentacaoDTO.parse(request.body);
    const mov = await MovimentacaoService.criar(dto, usuarioId);
    return reply.status(201).send(mov);
  },

  async atualizar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const { id } = request.params as { id: string };
    const dto = CriarMovimentacaoDTO.parse(request.body);
    const mov = await MovimentacaoService.atualizar(id, dto, usuarioId);
    return reply.send(mov);
  },

  async excluir(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const { id } = request.params as { id: string };
    await MovimentacaoService.excluir(id, usuarioId);
    return reply.status(204).send();
  },

  async zerar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    await MovimentacaoService.zerar(usuarioId);
    return reply.status(204).send();
  },
};