import { Fornecedor, IFornecedor } from "../models/Fornecedor";

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const FornecedorRepository = {
  findAllByUsuario: (usuarioId: string) =>
    Fornecedor.find({ usuarioId }).sort({ nome: 1 }),

  findByIdAndUsuario: (id: string, usuarioId: string) =>
    Fornecedor.findOne({ _id: id, usuarioId }),

  findByNomeAndUsuario: (nome: string, usuarioId: string) =>
    Fornecedor.findOne({
      usuarioId,
      nome: { $regex: `^${escaparRegex(nome.trim())}$`, $options: "i" },
    }),

  create: (data: Partial<IFornecedor>) => Fornecedor.create(data),

  deleteById: (id: string, usuarioId: string) =>
    Fornecedor.deleteOne({ _id: id, usuarioId }),

  deleteAllByUsuario: (usuarioId: string) =>
    Fornecedor.deleteMany({ usuarioId }),
};