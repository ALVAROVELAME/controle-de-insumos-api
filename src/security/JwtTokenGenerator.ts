import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const JwtTokenGenerator = {
  gerarToken(usuarioId: string, email: string, nome: string): string {
    const agora = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        sub: email,
        iat: agora,
        id: usuarioId,
        nome,
      },
      env.jwt.secret,
      {
        algorithm: "HS256",
        issuer: env.jwt.issuer,
        audience: env.jwt.audience,
        expiresIn: Math.floor(env.jwt.expiration / 1000),
      }
    );
  },

  verificar(token: string): { id: string; nome: string; email: string } {
    const payload = jwt.verify(token, env.jwt.secret, {
      algorithms: ["HS256"],
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
      clockTolerance: 0,
    }) as jwt.JwtPayload;

    return {
      id: String(payload.id),
      nome: String(payload.nome ?? ""),
      email: String(payload.sub ?? ""),
    };
  },
};
