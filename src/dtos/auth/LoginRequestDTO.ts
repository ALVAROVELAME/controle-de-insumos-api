import { z } from "zod";

export const LoginRequestDTO = z.object({
  email: z.string().email("E-mail invalido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export type LoginRequestDTOType = z.infer<typeof LoginRequestDTO>;
