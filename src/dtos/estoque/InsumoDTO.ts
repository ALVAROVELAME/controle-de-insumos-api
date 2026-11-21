import { z } from "zod";

export const CriarInsumoDTO = z.object({
  nome: z.string().min(1, "Informe o nome").max(120),
  categoria: z.string().min(1).max(60),
  unidade: z.string().min(1).max(20),
  quantidadeAtual: z.number().min(0),
  quantidadeMinima: z.number().min(0),
  precoCompra: z.number().min(0),
  precoVenda: z.number().min(0),
  fornecedorId: z.string().nullable().optional(),
  observacoes: z.string().max(500).nullable().optional(),
  ativo: z.boolean().optional(),
});

export type CriarInsumoDTOType = z.infer<typeof CriarInsumoDTO>;