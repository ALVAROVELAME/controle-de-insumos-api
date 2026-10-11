import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { PasswordHasher } from "./PasswordHasher";
import { JwtTokenGenerator } from "../security/JwtTokenGenerator";
import { LoginRequestDTOType } from "../dtos/auth/LoginRequestDTO";
import { IUsuario } from "../models/Usuario";

export interface LoginResponse {
  sucesso: boolean;
  mensagem?: string;
  token?: string;
  tipo?: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    ativo: boolean;
  };
}

function toDto(u: IUsuario) {
  return {
    id: String(u._id),
    nome: u.nome,
    email: u.email,
    ativo: u.ativo,
  };
}

export const AuthService = {
  async login(dto: LoginRequestDTOType): Promise<LoginResponse> {
    const usuario = await UsuarioRepository.findByEmail(dto.email);

    if (!usuario || !PasswordHasher.verify(dto.senha, usuario.senhaHash)) {
      return { sucesso: false, mensagem: "E-mail ou senha invalidos." };
    }

    if (!usuario.ativo) {
      return { sucesso: false, mensagem: "Conta ainda nao foi confirmada." };
    }

    const token = JwtTokenGenerator.gerarToken(
      String(usuario._id),
      usuario.email,
      usuario.nome
    );

    return {
      sucesso: true,
      mensagem: "Login realizado com sucesso",
      token,
      tipo: "Bearer",
      usuario: toDto(usuario),
    };
  },

  async obterPorId(id: string) {
    const u = await UsuarioRepository.findById(id);
    return u ? toDto(u) : null;
  },
};
