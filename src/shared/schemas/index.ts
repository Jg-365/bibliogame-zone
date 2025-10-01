import { z } from "zod";

// =============================================================================
// AUTHENTICATION SCHEMAS
// =============================================================================

export const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .email("Formato de email inválido")
      .max(255, "Email muito longo"),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .max(128, "Senha muito longa")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número"
      ),
    confirmPassword: z.string(),
    username: z
      .string()
      .min(
        3,
        "Nome de usuário deve ter pelo menos 3 caracteres"
      )
      .max(30, "Nome de usuário muito longo")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Nome de usuário pode conter apenas letras, números, _ e -"
      ),
    fullName: z
      .string()
      .min(
        2,
        "Nome completo deve ter pelo menos 2 caracteres"
      )
      .max(100, "Nome completo muito longo")
      .regex(
        /^[a-zA-ZÀ-ÿ\s'.-]+$/,
        "Nome deve conter apenas letras e espaços"
      ),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Senhas não coincidem",
      path: ["confirmPassword"],
    }
  );

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Formato de email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Formato de email inválido"),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "Nova senha deve ter pelo menos 8 caracteres")
      .max(128, "Nova senha muito longa")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número"
      ),
    confirmNewPassword: z.string(),
  })
  .refine(
    (data) => data.newPassword === data.confirmNewPassword,
    {
      message: "Senhas não coincidem",
      path: ["confirmNewPassword"],
    }
  );

// =============================================================================
// BOOK SCHEMAS
// =============================================================================

export const readingStatusSchema = z.enum([
  "not_started",
  "reading",
  "completed",
  "paused",
  "abandoned",
]);

export const addBookSchema = z
  .object({
    title: z
      .string()
      .min(1, "Título é obrigatório")
      .max(500, "Título muito longo")
      .trim(),
    author: z
      .string()
      .min(1, "Autor é obrigatório")
      .max(200, "Nome do autor muito longo")
      .trim(),
    totalPages: z
      .number()
      .int("Número de páginas deve ser um número inteiro")
      .min(1, "Livro deve ter pelo menos 1 página")
      .max(50000, "Número de páginas muito alto"),
    status: readingStatusSchema.default("not_started"),
    pagesRead: z
      .number()
      .int("Páginas lidas deve ser um número inteiro")
      .min(0, "Páginas lidas não pode ser negativo")
      .default(0),
    coverUrl: z
      .string()
      .url("URL da capa inválida")
      .optional()
      .or(z.literal("")),
    isbn: z
      .string()
      .regex(
        /^(?:ISBN(?:-1[03])?:? )?(?=[-0-9 ]{17}$|[-0-9X ]{13}$|[0-9X]{10}$)(?:97[89][-\s]?)?[0-9]{1,5}[-\s]?(?:[0-9]+[-\s]?){2}[0-9X]$/,
        "ISBN inválido"
      )
      .optional()
      .or(z.literal("")),
    description: z
      .string()
      .max(2000, "Descrição muito longa")
      .optional()
      .or(z.literal("")),
    publishedDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Data deve estar no formato YYYY-MM-DD"
      )
      .optional()
      .or(z.literal("")),
    genres: z
      .array(z.string().min(1).max(50))
      .max(10, "Máximo de 10 gêneros permitidos")
      .optional(),
    rating: z
      .number()
      .min(1, "Avaliação mínima é 1")
      .max(5, "Avaliação máxima é 5")
      .optional(),
    review: z
      .string()
      .max(5000, "Resenha muito longa")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.pagesRead <= data.totalPages, {
    message: "Páginas lidas não pode ser maior que o total",
    path: ["pagesRead"],
  });

export const updateBookSchema = z.object({
  id: z.string().uuid("ID do livro inválido"),
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(500, "Título muito longo")
    .trim()
    .optional(),
  author: z
    .string()
    .min(1, "Autor é obrigatório")
    .max(200, "Nome do autor muito longo")
    .trim()
    .optional(),
  totalPages: z
    .number()
    .int("Número de páginas deve ser um número inteiro")
    .min(1, "Livro deve ter pelo menos 1 página")
    .max(50000, "Número de páginas muito alto")
    .optional(),
  status: readingStatusSchema.optional(),
  pagesRead: z
    .number()
    .int("Páginas lidas deve ser um número inteiro")
    .min(0, "Páginas lidas não pode ser negativo")
    .optional(),
  coverUrl: z
    .string()
    .url("URL da capa inválida")
    .optional()
    .or(z.literal("")),
  isbn: z
    .string()
    .regex(
      /^(?:ISBN(?:-1[03])?:? )?(?=[-0-9 ]{17}$|[-0-9X ]{13}$|[0-9X]{10}$)(?:97[89][-\s]?)?[0-9]{1,5}[-\s]?(?:[0-9]+[-\s]?){2}[0-9X]$/,
      "ISBN inválido"
    )
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(2000, "Descrição muito longa")
    .optional()
    .or(z.literal("")),
  publishedDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Data deve estar no formato YYYY-MM-DD"
    )
    .optional()
    .or(z.literal("")),
  genres: z
    .array(z.string().min(1).max(50))
    .max(10, "Máximo de 10 gêneros permitidos")
    .optional(),
  rating: z
    .number()
    .min(1, "Avaliação mínima é 1")
    .max(5, "Avaliação máxima é 5")
    .optional(),
  review: z
    .string()
    .max(5000, "Resenha muito longa")
    .optional()
    .or(z.literal("")),
});

export const updateReadingProgressSchema = z
  .object({
    bookId: z.string().uuid("ID do livro inválido"),
    pagesRead: z
      .number()
      .int("Páginas lidas deve ser um número inteiro")
      .min(0, "Páginas lidas não pode ser negativo"),
    status: readingStatusSchema.optional(),
    sessionNotes: z
      .string()
      .max(1000, "Notas da sessão muito longas")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => {
    // This will be validated against the book's total pages in the hook
    return true;
  });

// =============================================================================
// PROFILE SCHEMAS
// =============================================================================

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(
      3,
      "Nome de usuário deve ter pelo menos 3 caracteres"
    )
    .max(30, "Nome de usuário muito longo")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Nome de usuário pode conter apenas letras, números, _ e -"
    )
    .optional(),
  fullName: z
    .string()
    .min(
      2,
      "Nome completo deve ter pelo menos 2 caracteres"
    )
    .max(100, "Nome completo muito longo")
    .regex(
      /^[a-zA-ZÀ-ÿ\s'.-]+$/,
      "Nome deve conter apenas letras e espaços"
    )
    .optional(),
  bio: z
    .string()
    .max(500, "Bio muito longa")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("URL do avatar inválida")
    .optional()
    .or(z.literal("")),
  favoriteGenres: z
    .array(z.string().min(1).max(50))
    .max(10, "Máximo de 10 gêneros favoritos")
    .optional(),
  readingGoal: z
    .number()
    .int("Meta de leitura deve ser um número inteiro")
    .min(1, "Meta deve ser pelo menos 1 livro")
    .max(365, "Meta muito alta")
    .optional(),
  timezone: z
    .string()
    .min(1, "Fuso horário é obrigatório")
    .optional(),
  notificationPreferences: z
    .object({
      dailyReminders: z.boolean(),
      achievementNotifications: z.boolean(),
      socialUpdates: z.boolean(),
      marketingEmails: z.boolean(),
    })
    .optional(),
});

// =============================================================================
// READING SESSION SCHEMAS
// =============================================================================

export const createReadingSessionSchema = z.object({
  bookId: z.string().uuid("ID do livro inválido"),
  pagesRead: z
    .number()
    .int("Páginas lidas deve ser um número inteiro")
    .min(1, "Deve ler pelo menos 1 página"),
  sessionDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      "Data da sessão inválida"
    ),
  notes: z
    .string()
    .max(2000, "Notas muito longas")
    .optional()
    .or(z.literal("")),
  mood: z
    .enum([
      "excited",
      "calm",
      "focused",
      "tired",
      "distracted",
    ])
    .optional(),
  environment: z
    .enum([
      "home",
      "library",
      "cafe",
      "park",
      "transport",
      "other",
    ])
    .optional(),
});

// =============================================================================
// SEARCH & FILTER SCHEMAS
// =============================================================================

export const bookSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Busca não pode estar vazia")
    .max(200, "Busca muito longa")
    .trim(),
  author: z
    .string()
    .max(200, "Nome do autor muito longo")
    .optional()
    .or(z.literal("")),
  isbn: z
    .string()
    .regex(
      /^[0-9X-\s]*$/,
      "ISBN deve conter apenas números, X e hífens"
    )
    .optional()
    .or(z.literal("")),
  maxResults: z
    .number()
    .int()
    .min(1, "Mínimo 1 resultado")
    .max(40, "Máximo 40 resultados")
    .default(10),
});

export const bookFilterSchema = z.object({
  status: z.array(readingStatusSchema).optional(),
  genres: z.array(z.string().min(1)).optional(),
  rating: z
    .object({
      min: z.number().min(1).max(5).optional(),
      max: z.number().min(1).max(5).optional(),
    })
    .optional(),
  dateRange: z
    .object({
      start: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      end: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    })
    .optional(),
  sortBy: z
    .enum([
      "title",
      "author",
      "dateAdded",
      "dateCompleted",
      "rating",
      "pages",
      "progress",
    ])
    .default("dateAdded"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// =============================================================================
// UTILITY SCHEMAS
// =============================================================================

export const paginationSchema = z.object({
  page: z
    .number()
    .int("Página deve ser um número inteiro")
    .min(1, "Página deve ser pelo menos 1")
    .default(1),
  limit: z
    .number()
    .int("Limite deve ser um número inteiro")
    .min(1, "Limite deve ser pelo menos 1")
    .max(100, "Limite máximo é 100")
    .default(20),
});

export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "Arquivo deve ter no máximo 5MB"
    )
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(
          file.type
        ),
      "Arquivo deve ser uma imagem (JPEG, PNG ou WebP)"
    ),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ResetPasswordFormData = z.infer<
  typeof resetPasswordSchema
>;
export type UpdatePasswordFormData = z.infer<
  typeof updatePasswordSchema
>;

export type AddBookFormData = z.infer<typeof addBookSchema>;
export type UpdateBookFormData = z.infer<
  typeof updateBookSchema
>;
export type UpdateReadingProgressFormData = z.infer<
  typeof updateReadingProgressSchema
>;

export type UpdateProfileFormData = z.infer<
  typeof updateProfileSchema
>;
export type CreateReadingSessionFormData = z.infer<
  typeof createReadingSessionSchema
>;

export type BookSearchFormData = z.infer<
  typeof bookSearchSchema
>;
export type BookFilterFormData = z.infer<
  typeof bookFilterSchema
>;
export type PaginationParams = z.infer<
  typeof paginationSchema
>;
export type ImageUploadFormData = z.infer<
  typeof imageUploadSchema
>;

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validates data against a schema and returns typed result
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: Record<string, string>;
    } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join(".");
    errors[path] = error.message;
  });

  return { success: false, errors };
}

/**
 * Custom hook for form validation with Zod
 */
export function createFormValidator<T>(
  schema: z.ZodSchema<T>
) {
  return {
    validate: (data: unknown) => validateData(schema, data),
    schema,
  };
}
