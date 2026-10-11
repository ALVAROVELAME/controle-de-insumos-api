import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: env.mail.port === 465,
  auth: {
    user: env.mail.username,
    pass: env.mail.password,
  },
});

export const EmailService = {
  async enviarEmailConfirmacao(
    email: string,
    nome: string,
    token: string
  ): Promise<void> {
    const link = `${env.appFrontendUrl}/confirmar?token=${token}`;

    await transporter.sendMail({
      from: env.mail.from,
      to: email,
      subject: "Confirmacao de cadastro - Controle de Insumos",
      text: `Ola ${nome},

Seja bem-vindo ao Controle de Insumos!

Para ativar sua conta, clique no link abaixo:

${link}

Este link e valido por 24 horas.

Se voce nao criou esta conta, ignore este email.

Equipe Controle de Insumos`,
    });
  },
};
