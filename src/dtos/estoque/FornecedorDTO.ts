import { z } from "zod";

export const CriarFornecedorDTO = z.object({
  nome: z.string().min(1, "Informe o nome").max(120),
  documento: z.string().max(24).nullable().optional(),
  telefone: z.string().max(24).nullable().optional(),
  email: z
    .union([z.string().email("E-mail invalido").max(120), z.literal(""), z.null()])
    .optional(),
  observacoes: z.string().max(500).nullable().optional(),
  ativo: z.boolean().optional(),
});

export type CriarFornecedorDTOType = z.infer<typeof CriarFornecedorDTO>;