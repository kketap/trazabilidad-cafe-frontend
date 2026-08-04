// src/api/authStorage.ts

const TOKEN_KEY = "token";
const USER_NAME_KEY = "userName";

export function saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function saveUserName(nombre: string): void {
    localStorage.setItem(USER_NAME_KEY, nombre);
}

export function getUserName(): string | null {
    return localStorage.getItem(USER_NAME_KEY);
}

export function clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
}