import { z } from "zod";

export const TipoMovEnum = z.enum(["Compra", "Venda", "Ajuste"]);

export const CriarMovimentacaoDTO = z.object({
  insumoId: z.string().min(1, "Informe o insumo"),
  tipo: TipoMovEnum,
  quantidade: z.number().finite(),
  precoUnitario: z.number().min(0),
  data: z.string().min(1, "Informe a data"),
  fornecedorId: z.string().nullable().optional(),
  cliente: z.string().max(120).nullable().optional(),
  observacoes: z.string().max(500).nullable().optional(),
});

export type CriarMovimentacaoDTOType = z.infer<typeof CriarMovimentacaoDTO>;