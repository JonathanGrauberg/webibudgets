// lib/password.ts
//
// Único lugar con la regla de contraseña — antes vivía copiada y pegada
// en RegisterForm.tsx y LoginForm.tsx (cada una con su propia regex). Se
// deja intacto ese código ya en producción para no arriesgar nada ahí;
// este helper lo usa por ahora el flujo nuevo de recuperación de
// contraseña, con la MISMA regla exacta (mayúscula, minúscula, número,
// carácter especial, 8+ caracteres) para que la experiencia sea idéntica
// en todos los formularios.

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.,\-*@#$%^&+=]).{8,}$/

export const PASSWORD_REQUIREMENTS_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (ej: .,-*).'

export function isValidPassword(password: unknown): password is string {
  return typeof password === 'string' && PASSWORD_REGEX.test(password)
}
