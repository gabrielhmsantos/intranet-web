export type PasswordPolicyResult =
  | { ok: true }
  | { ok: false; message: string };

const MIN_LENGTH = 8;

export function validatePassword(password: string): PasswordPolicyResult {
  if (password.length < MIN_LENGTH) {
    return {
      ok: false,
      message: `A palavra-passe deve ter pelo menos ${MIN_LENGTH} caracteres.`,
    };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return {
      ok: false,
      message: "A palavra-passe deve incluir pelo menos uma letra.",
    };
  }

  if (!/\d/.test(password)) {
    return {
      ok: false,
      message: "A palavra-passe deve incluir pelo menos um algarismo.",
    };
  }

  return { ok: true };
}

export const PASSWORD_REQUIREMENTS_HINT =
  "Mínimo 8 caracteres, com pelo menos uma letra e um algarismo.";
