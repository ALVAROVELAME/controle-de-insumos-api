import { randomUUID } from "crypto";
import { ConflictError, UnauthorizedError } from "../errors/AppError";
import { CadastroPendenteRepository } from "../repositories/CadastroPendenteRepository";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { PasswordHasher } from "./PasswordHasher";
import { EmailService } from "./EmailService";
import { UsuarioCadastroDTOType } from "../dtos/usuarios/UsuarioCadastroDTO";
import { IUsuario } from "../models/Usuario";

export const UsuarioService = {
  async cadastrar(dto: UsuarioCadastroDTOType) {
    const existente = await UsuarioRepository.findByEmail(dto.email);
    if (existente) throw new ConflictError("Email ja cadastrado");

    const pendente = await CadastroPendenteRepository.findByEmail(dto.email);
    if (pendente) throw new ConflictError("Email aguardando confirmacao");

    const senhaHash = PasswordHasher.hash(dto.senha);
    const token = randomUUID();

    const cadastro = await CadastroPendenteRepository.create({
      nome: dto.nome,
      email: dto.email,
      senhaHash,
      tokenConfirmacao: token,
      tokenExpiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await EmailService.enviarEmailConfirmacao(
      cadastro.email,
      cadastro.nome,
      cadastro.tokenConfirmacao
    );

    return cadastro;
  },

  async excluirConta(usuario: IUsuario, senha: string): Promise<void> {
    if (!PasswordHasher.verify(senha, usuario.senhaHash)) {
      throw new UnauthorizedError("Senha incorreta. Exclusao cancelada.");
    }

    const pendente = await CadastroPendenteRepository.findByEmail(usuario.email);
    if (pendente) await CadastroPendenteRepository.delete(pendente);

    await UsuarioRepository.delete(usuario);
  },
};
