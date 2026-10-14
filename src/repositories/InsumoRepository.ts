import mongoose from "mongoose";
import { Insumo, IInsumo } from "../models/Insumo";

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const InsumoRepository = {
  findAllByUsuario: (usuarioId: string) =>
    Insumo.find({ usuarioId }).sort({ nome: 1 }),

  findByIdAndUsuario: (id: string, usuarioId: string) =>
    Insumo.findOne({ _id: id, usuarioId }),

  findByNomeAndUsuario: (nome: string, usuarioId: string) =>
    Insumo.findOne({
      usuarioId,
      nome: { $regex: `^${escaparRegex(nome.trim())}$`, $options: "i" },
    }),

  create: (data: Partial<IInsumo>) => Insumo.create(data),

  setEstoque: (id: string, valor: number) =>
    Insumo.updateOne({ _id: id }, { $set: { quantidadeAtual: valor } }),

  zerarEstoqueDeTodos: (usuarioId: string) =>
    Insumo.updateMany({ usuarioId }, { $set: { quantidadeAtual: 0 } }),

  nullifyFornecedor: (usuarioId: string, fornecedorId: string) =>
    Insumo.updateMany(
      { usuarioId, fornecedorId: new mongoose.Types.ObjectId(fornecedorId) },
      { $set: { fornecedorId: null } }
    ),

  deleteById: (id: string, usuarioId: string) =>
    Insumo.deleteOne({ _id: id, usuarioId }),

  deleteAllByUsuario: (usuarioId: string) => Insumo.deleteMany({ usuarioId }),
};