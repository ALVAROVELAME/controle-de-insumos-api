export interface MensagemResponseDTO {
  sucesso: boolean;
  mensagem: string;
}

export function mensagem(mensagem: string, sucesso = true): MensagemResponseDTO {
  return { sucesso, mensagem };
}
