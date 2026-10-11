import mongoose, { Schema, Document } from "mongoose";

export interface IUsuario extends Document {
  nome: string;
  email: string;
  senhaHash: string;
  ativo: boolean;
  tokenConfirmacao?: string | null;
  tokenExpiraEm?: Date | null;
  emailConfirmadoEm?: Date | null;
  criadoEm: Date;
  ativarConta(): void;
}

const UsuarioSchema = new Schema<IUsuario>(
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
    ativo: { type: Boolean, default: false },
    tokenConfirmacao: { type: String, unique: true, sparse: true, default: null },
    tokenExpiraEm: { type: Date, default: null },
    emailConfirmadoEm: { type: Date, default: null },
    criadoEm: { type: Date, default: () => new Date() },
  },
  { collection: "usuarios" }
);

UsuarioSchema.methods.ativarConta = function (this: IUsuario) {
  this.ativo = true;
  this.emailConfirmadoEm = new Date();
  this.tokenConfirmacao = null;
  this.tokenExpiraEm = null;
};

export const Usuario = mongoose.model<IUsuario>("Usuario", UsuarioSchema);
