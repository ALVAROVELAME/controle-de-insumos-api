import mongoose, { Schema, Document, Types } from "mongoose";

export type TipoMov = "Compra" | "Venda" | "Ajuste";

export interface IMovimentacao extends Document {
  usuarioId: Types.ObjectId;
  insumoId: Types.ObjectId;
  tipo: TipoMov;
  quantidade: number;
  precoUnitario: number;
  total: number;
  data: Date;
  fornecedorId?: Types.ObjectId | null;
  cliente?: string | null;
  observacoes?: string | null;
  criadoEm: Date;
}

const MovimentacaoSchema = new Schema<IMovimentacao>(
  {
    usuarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true, index: true },
    insumoId: { type: Schema.Types.ObjectId, ref: "Insumo", required: true, index: true },
    tipo: { type: String, enum: ["Compra", "Venda", "Ajuste"], required: true },
    quantidade: { type: Number, required: true },
    precoUnitario: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    data: { type: Date, required: true, index: true },
    fornecedorId: { type: Schema.Types.ObjectId, ref: "Fornecedor", default: null },
    cliente: { type: String, maxlength: 120, default: null, trim: true },
    observacoes: { type: String, maxlength: 500, default: null },
    criadoEm: { type: Date, default: () => new Date() },
  },
  {
    collection: "movimentacoes",
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

MovimentacaoSchema.index({ usuarioId: 1, data: -1 });

export const Movimentacao = mongoose.model<IMovimentacao>("Movimentacao", MovimentacaoSchema);