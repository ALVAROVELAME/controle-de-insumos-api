import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFornecedor extends Document {
  usuarioId: Types.ObjectId;
  nome: string;
  documento?: string | null;
  telefone?: string | null;
  email?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  criadoEm: Date;
}

const FornecedorSchema = new Schema<IFornecedor>(
  {
    usuarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true, index: true },
    nome: { type: String, required: true, maxlength: 120, trim: true },
    documento: { type: String, maxlength: 24, default: null, trim: true },
    telefone: { type: String, maxlength: 24, default: null, trim: true },
    email: { type: String, maxlength: 120, default: null, lowercase: true, trim: true },
    observacoes: { type: String, maxlength: 500, default: null },
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: () => new Date() },
  },
  {
    collection: "fornecedores",
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

FornecedorSchema.index({ usuarioId: 1, nome: 1 }, { unique: true });

export const Fornecedor = mongoose.model<IFornecedor>("Fornecedor", FornecedorSchema);