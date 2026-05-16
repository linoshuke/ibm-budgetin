import { z } from "zod";

export const CreateTransactionSchema = z.object({
    type: z.enum(["income", "expense"], {
        message: "Tipe transaksi harus 'income' atau 'expense'.",
    }),
    amount: z.number({ message: "Jumlah harus berupa angka." }).positive("Jumlah harus lebih dari 0."),
    categoryId: z.string().uuid("Category ID harus berupa UUID yang valid."),
    walletId: z.string().uuid("Wallet ID harus berupa UUID yang valid."),
    date: z.string().date("Format tanggal harus YYYY-MM-DD."),
    note: z.string().max(500, "Catatan maksimal 500 karakter.").optional().default(""),
    isBill: z.boolean().optional().default(false),
});

export const UpdateTransactionSchema = CreateTransactionSchema;

export const CreateCategorySchema = z.object({
    name: z.string().min(1, "Nama kategori wajib diisi.").max(100, "Nama kategori maksimal 100 karakter."),
    icon: z.string().max(20).optional().default("MISC"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Format warna harus hex (#RRGGBB).").optional().default("#64748b"),
    type: z.enum(["income", "expense", "both"], {
        message: "Tipe kategori harus 'income', 'expense', atau 'both'.",
    }),
});

export const CreateWalletSchema = z.object({
    name: z.string().min(1, "Nama dompet wajib diisi.").max(100, "Nama dompet maksimal 100 karakter."),
    category: z.string().min(1, "Kategori dompet wajib diisi.").max(50, "Kategori dompet maksimal 50 karakter."),
    location: z.string().min(1, "Lokasi dompet wajib diisi.").max(50, "Lokasi dompet maksimal 50 karakter."),
});

export const UpdateWalletSchema = z.object({
    name: z.string().min(1, "Nama dompet wajib diisi.").max(100, "Nama dompet maksimal 100 karakter."),
    category: z.string().min(1, "Kategori dompet wajib diisi.").max(50, "Kategori dompet maksimal 50 karakter.").optional(),
    location: z.string().min(1, "Lokasi dompet wajib diisi.").max(50, "Lokasi dompet maksimal 50 karakter.").optional(),
});

export const UpdateProfileSchema = z.object({
    name: z.string().min(1, "Nama tidak boleh kosong.").max(100, "Nama maksimal 100 karakter.").optional(),
    email: z.string().email("Format email tidak valid.").optional(),
    theme: z.enum(["light", "dark"], {
        message: "Tema harus 'light' atau 'dark'.",
    }).optional(),
});

export const CreateGoalSchema = z.object({
    name: z.string().min(1, "Nama goals wajib diisi.").max(100, "Nama goals maksimal 100 karakter."),
    targetAmount: z
        .number({ message: "Target harus berupa angka." })
        .positive("Target harus lebih dari 0.")
        .max(999_999_999, "Target terlalu besar."),
    currentAmount: z
        .number({ message: "Nominal saat ini harus berupa angka." })
        .min(0, "Nominal saat ini tidak boleh negatif.")
        .max(999_999_999, "Nominal saat ini terlalu besar.")
        .optional()
        .default(0),
    targetDate: z.string().date("Format tanggal harus YYYY-MM-DD.").optional().nullable(),
});

export const UpdateGoalSchema = CreateGoalSchema.partial();

export const PasswordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function validatePassword(password: string) {
    return PasswordPolicy.test(password);
}
