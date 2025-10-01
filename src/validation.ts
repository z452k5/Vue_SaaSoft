import { z } from "zod";

export const accountTypeSchema = z.union([
    z.literal("LDAP"),
    z.literal("Локальная"),
]);

// метки вводятся строкой; валидируем, что каждая часть <= 50
export const labelInputSchema = z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .superRefine((val, ctx) => {
        if (!val) return;
        const parts = val
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean);
        const tooLong = parts.find((p) => p.length > 50);
        if (tooLong) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Каждая метка — максимум 50 символов",
            });
        }
    });

export const editableAccountSchema = z
    .object({
        id: z.string().min(1),
        type: accountTypeSchema,
        login: z
            .string()
            .trim()
            .min(1, "Логин обязателен")
            .max(100, "Максимум 100 символов"),
        password: z.union([z.string(), z.null()]),
        labelInput: labelInputSchema,
    })
    .superRefine((val, ctx) => {
        if (val.type === "Локальная") {
            const pwd = (val.password ?? "").toString().trim();
            if (!pwd) {
                ctx.addIssue({
                    path: ["password"],
                    code: z.ZodIssueCode.custom,
                    message: "Пароль обязателен",
                });
            } else if (pwd.length > 100) {
                ctx.addIssue({
                    path: ["password"],
                    code: z.ZodIssueCode.custom,
                    message: "Максимум 100 символов",
                });
            }
        }
        // при LDAP пароль должен быть null, но UI сам ставит null —
        // здесь просто допустим null или пустую строку, а при сохранении проставим null
    });

// helper: преобразование строки меток в массив объектов { text }
export function toLabelTags(input: string | undefined) {
    const parts = (input ?? "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
    return parts.map((text) => ({ text }));
}
