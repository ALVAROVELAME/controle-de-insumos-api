import { Usuario, IUsuario } from "../models/Usuario";

export const UsuarioRepository = {
  findById: (id: string) => Usuario.findById(id),

  findByEmail: (email: string) =>
    Usuario.findOne({ email: email.toLowerCase() }),

  findByToken: (token: string) =>
    Usuario.findOne({ tokenConfirmacao: token }),

  definirRecuperacao: (id: string, hash: string, expira: Date) =>
    Usuario.updateOne({ _id: id, ativo: true }, { $set: { recuperacaoHash: hash, recuperacaoExpiraEm: expira } }),

  consumirRecuperacao: (hash: string, senhaHash: string) =>
    Usuario.findOneAndUpdate(
      { recuperacaoHash: hash, recuperacaoExpiraEm: { $gt: new Date() }, ativo: true },
      { $set: { senhaHash }, $unset: { recuperacaoHash: 1, recuperacaoExpiraEm: 1 } }
    ),

  create: (data: Partial<IUsuario>) => Usuario.create(data),

  delete: (usuario: IUsuario) =>
    Usuario.deleteOne({ _id: usuario._id }),
};
