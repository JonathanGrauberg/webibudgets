# Coding Rules

Reglas obligatorias para cualquier modificación:

1. No modificar Prisma Schema sin autorización explícita.

2. No modificar autenticación NextAuth sin autorización explícita.

3. No modificar lógica multi-tenant sin autorización explícita.

4. Antes de eliminar componentes, verificar si existen imports activos.

5. Priorizar refactorización antes que reescritura completa.

6. Evitar crear archivos duplicados con prefijos como:

   * bolt-
   * new-
   * copy-
   * temp-

7. Utilizar componentes existentes cuando sea posible.

8. Mantener TypeScript estricto.

9. Mantener compatibilidad con App Router.

10. No introducir dependencias nuevas sin justificar necesidad.

11. Siempre indicar:

    * archivos modificados
    * motivo del cambio
    * posibles riesgos

12. Nunca modificar más archivos de los necesarios.

13. Si existe incertidumbre sobre una implementación:
    detenerse y solicitar confirmación.
