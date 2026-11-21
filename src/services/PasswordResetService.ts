import { createHash, randomBytes } from "crypto";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { EmailService } from "./EmailService";
import { PasswordHasher } from "./PasswordHasher";

const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export const PasswordResetService = {
  async solicitar(email: string): Promise<void> {
    const usuario = await UsuarioRepository.findByEmail(email.trim().toLowerCase());
    if (!usuario || !usuario.ativo) return;
    const token = randomBytes(32).toString("hex");
    await UsuarioRepository.definirRecuperacao(String(usuario._id), digest(token), new Date(Date.now() + 60 * 60 * 1000));
    await EmailService.enviarEmailRecuperacao(usuario.email, token);
  },
  async redefinir(token: string, senha: string): Promise<boolean> {
    const usuario = await UsuarioRepository.consumirRecuperacao(digest(token), PasswordHasher.hash(senha));
    return !!usuario;
  },
};
