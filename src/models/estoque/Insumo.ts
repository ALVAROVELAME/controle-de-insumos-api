import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInsumo extends Document {
  usuarioId: Types.ObjectId;
  nome: string;
  categoria: string;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  precoCompra: number;
  precoVenda: number;
  fornecedorId?: Types.ObjectId | null;
  observacoes?: string | null;
  ativo: boolean;
  criadoEm: Date;
}

const InsumoSchema = new Schema<IInsumo>(
  {
    usuarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true, index: true },
    nome: { type: String, required: true, maxlength: 120, trim: true },
    categoria: { type: String, required: true, maxlength: 60, trim: true },
    unidade: { type: String, required: true, maxlength: 20, trim: true },
    quantidadeAtual: { type: Number, default: 0 },
    quantidadeMinima: { type: Number, default: 0 },
    precoCompra: { type: Number, default: 0 },
    precoVenda: { type: Number, default: 0 },
    fornecedorId: { type: Schema.Types.ObjectId, ref: "Fornecedor", default: null },
    observacoes: { type: String, maxlength: 500, default: null },
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: () => new Date() },
  },
  {
    collection: "insumos",
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        const r = ret as unknown as Record<string, unknown>;
        r.id = String(r._id);
        delete r._id;
        return r;
      },
    },
  }
);

InsumoSchema.index({ usuarioId: 1, nome: 1 }, { unique: true });

export const Insumo = mongoose.model<IInsumo>("Insumo", InsumoSchema);