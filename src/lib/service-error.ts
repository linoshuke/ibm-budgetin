export class ServiceError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = "ServiceError";
        this.statusCode = statusCode;
    }
}

type DbErrorLike = {
    code?: string;
    message?: string;
    details?: string;
};

const DB_ERROR_MAP: Record<string, { message: string; status: number }> = {
    "23505": { message: "Data sudah ada.", status: 409 },
    "23503": { message: "Referensi tidak valid.", status: 400 },
    "22P02": { message: "Format data tidak valid.", status: 400 },
    "PGRST116": { message: "Data tidak ditemukan.", status: 404 },
    "42501": { message: "Akses ditolak.", status: 403 },
    "PGRST301": { message: "Akses ditolak.", status: 403 },
};

export function isDbErrorLike(error: unknown): error is DbErrorLike {
    return Boolean(error && typeof error === "object" && ("code" in error || "message" in error));
}

export function mapDbError(error: unknown, fallbackMessage = "Terjadi kesalahan pada server."): ServiceError {
    const code = isDbErrorLike(error) && error.code ? String(error.code) : undefined;
    if (code && DB_ERROR_MAP[code]) {
        const { message, status } = DB_ERROR_MAP[code];
        return new ServiceError(message, status);
    }

    return new ServiceError(fallbackMessage, 500);
}

export function handleServiceError(error: unknown): {
    body: { error: string };
    status: number;
} {
    if (error instanceof ServiceError) {
        if (error.statusCode >= 500) {
            console.error("[ServiceError 500]", error.message);
            return {
                body: { error: "Terjadi kesalahan pada server." },
                status: error.statusCode,
            };
        }

        return {
            body: { error: error.message },
            status: error.statusCode,
        };
    }

    if (isDbErrorLike(error)) {
        const mapped = mapDbError(error);
        console.error("[DB Error]", (error as DbErrorLike).message ?? error);
        return {
            body: { error: mapped.message },
            status: mapped.statusCode,
        };
    }

    console.error("[Unexpected Error]", error instanceof Error ? error.message : error);
    return {
        body: { error: "Terjadi kesalahan tak terduga." },
        status: 500,
    };
}
