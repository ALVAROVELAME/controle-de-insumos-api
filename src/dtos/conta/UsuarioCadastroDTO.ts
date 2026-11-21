import { z } from "zod";

export const UsuarioCadastroDTO = z.object({
  nome: z.string().min(3).max(150),
  email: z.string().email().max(200),
  senha: z.string().min(6).max(100),
});

export type UsuarioCadastroDTOType = z.infer<typeof UsuarioCadastroDTO>;
