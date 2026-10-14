import { Movimentacao, IMovimentacao } from "../models/Movimentacao";
import { Types } from "mongoose";

export const MovimentacaoRepository = {
  findAllByUsuario: (usuarioId: string) =>
    Movimentacao.find({ usuarioId }).sort({ data: -1, criadoEm: -1 }),

  findByIdAndUsuario: (id: string, usuarioId: string) =>
    Movimentacao.findOne({ _id: id, usuarioId }),

  create: (data: Partial<IMovimentacao>) => Movimentacao.create(data),

  updateById: (id: string, usuarioId: string, data: Partial<IMovimentacao>) =>
    Movimentacao.findOneAndUpdate({ _id: id, usuarioId }, data, { new: true }),

  deleteById: (id: string, usuarioId: string) =>
    Movimentacao.deleteOne({ _id: id, usuarioId }),

  deleteAllByUsuario: (usuarioId: string) =>
    Movimentacao.deleteMany({ usuarioId }),

  deleteAllByInsumo: (usuarioId: string, insumoId: string) =>
    Movimentacao.deleteMany({ usuarioId, insumoId }),

  nullifyFornecedor: (usuarioId: string, fornecedorId: string) =>
    Movimentacao.updateMany(
      { usuarioId, fornecedorId: new Types.ObjectId(fornecedorId) },
      { $set: { fornecedorId: null } }
    ),
};