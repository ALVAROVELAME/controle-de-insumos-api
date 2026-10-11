import { Usuario, IUsuario } from "../models/Usuario";

export const UsuarioRepository = {
  findById: (id: string) => Usuario.findById(id),

  findByEmail: (email: string) =>
    Usuario.findOne({ email: email.toLowerCase() }),

  findByToken: (token: string) =>
    Usuario.findOne({ tokenConfirmacao: token }),

  create: (data: Partial<IUsuario>) => Usuario.create(data),

  delete: (usuario: IUsuario) =>
    Usuario.deleteOne({ _id: usuario._id }),
};
