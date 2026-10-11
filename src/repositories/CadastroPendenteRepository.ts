import {
  CadastroPendente,
  ICadastroPendente,
} from "../models/CadastroPendente";

export const CadastroPendenteRepository = {
  findByToken: (token: string) =>
    CadastroPendente.findOne({ tokenConfirmacao: token }),

  findByEmail: (email: string) =>
    CadastroPendente.findOne({ email: email.toLowerCase() }),

  create: (data: Partial<ICadastroPendente>) =>
    CadastroPendente.create(data),

  delete: (cadastro: ICadastroPendente) =>
    CadastroPendente.deleteOne({ _id: cadastro._id }),
};
