import { FastifyReply, FastifyRequest } from "fastify";
import { InsumoService } from "../services/InsumoService";
import { CriarInsumoDTO } from "../dtos/insumos/InsumoDTO";

export const InsumosController = {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const lista = await InsumoService.listar(usuarioId);
    return reply.send(lista);
  },

  async criar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const dto = CriarInsumoDTO.parse(request.body);
    const insumo = await InsumoService.criar(dto, usuarioId);
    return reply.status(201).send(insumo);
  },

  async atualizar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const { id } = request.params as { id: string };
    const dto = CriarInsumoDTO.parse(request.body);
    const insumo = await InsumoService.atualizar(id, dto, usuarioId);
    return reply.send(insumo);
  },

  async excluir(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    const { id } = request.params as { id: string };
    await InsumoService.excluir(id, usuarioId);
    return reply.status(204).send();
  },

  async zerar(request: FastifyRequest, reply: FastifyReply) {
    const usuarioId = request.usuario!.id;
    await InsumoService.zerar(usuarioId);
    return reply.status(204).send();
  },
};