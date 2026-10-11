import mongoose, { Schema, Document } from "mongoose";

export interface ICadastroPendente extends Document {
  nome: string;
  email: string;
  senhaHash: string;
  tokenConfirmacao: string;
  tokenExpiraEm: Date;
  criadoEm: Date;
}

const CadastroPendenteSchema = new Schema<ICadastroPendente>(
  {
    nome: { type: String, required: true, maxlength: 150, trim: true },
    email: {
      type: String,
      required: true,
      maxlength: 200,
      unique: true,
      lowercase: true,
      trim: true,
    },
    senhaHash: { type: String, required: true },
    tokenConfirmacao: { type: String, required: true, unique: true },
    tokenExpiraEm: { type: Date, required: true },
    criadoEm: { type: Date, default: () => new Date() },
  },
  { collection: "cadastros_pendentes" }
);

export const CadastroPendente = mongoose.model<ICadastroPendente>(
  "CadastroPendente",
  CadastroPendenteSchema
);
