import bcrypt from "bcryptjs";

const SALT_ROUNDS = 11;

export const PasswordHasher = {
  hash: (senhaPlana: string): string => {
    if (!senhaPlana?.trim()) throw new Error("Senha nao pode ser vazia.");
    return bcrypt.hashSync(senhaPlana, SALT_ROUNDS);
  },

  verify: (senhaPlana: string, hashArmazenado: string): boolean => {
    if (!senhaPlana || !hashArmazenado) return false;
    try {
      return bcrypt.compareSync(senhaPlana, hashArmazenado);
    } catch {
      return false;
    }
  },
};
