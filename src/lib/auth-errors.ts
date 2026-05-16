export const AUTH_ERROR = { error: "Email atau password tidak valid." };
export const GENERIC_REQUEST_ERROR = { error: "Permintaan tidak dapat diproses." };

export function authFail(status = 401) {
    return { body: AUTH_ERROR, status };
}
