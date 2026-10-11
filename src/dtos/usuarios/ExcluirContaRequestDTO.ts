import { z } from "zod";

export const ExcluirContaRequestDTO = z.object({
  senha: z.string().min(6),
});

export type ExcluirContaRequestDTOType = z.infer<typeof ExcluirContaRequestDTO>;
