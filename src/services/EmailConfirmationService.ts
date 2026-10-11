import { CadastroPendenteRepository } from "../repositories/CadastroPendenteRepository";
import { UsuarioRepository } from "../repositories/UsuarioRepository";

export const EmailConfirmationService = {
  async confirmarEmail(token: string): Promise<boolean> {
    const cadastro = await CadastroPendenteRepository.findByToken(token);
    if (!cadastro) return false;

    if (cadastro.tokenExpiraEm.getTime() < Date.now()) return false;

    await UsuarioRepository.create({
      nome: cadastro.nome,
      email: cadastro.email,
      senhaHash: cadastro.senhaHash,
      ativo: true,
      emailConfirmadoEm: new Date(),
      tokenConfirmacao: null,
      tokenExpiraEm: null,
    });

    await CadastroPendenteRepository.delete(cadastro);
    return true;
  },
};
