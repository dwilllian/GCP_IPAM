import type { Allocation } from "../types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
const normalizedApiBaseUrl = apiBaseUrl.endsWith("/")
  ? apiBaseUrl.slice(0, -1)
  : apiBaseUrl;

type ApiError = {
  message: string;
  requestId?: string;
};

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${normalizedApiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const requestId = response.headers.get("x-request-id") ?? undefined;
    let message = "Falha ao consultar API.";
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      message = payload?.error?.message ?? message;
    } catch {
      // mantém mensagem padrão
    }
    const error: ApiError = { message, requestId };
    throw error;
  }
  return (await response.json()) as T;
}

export async function fetchAllocations(): Promise<Allocation[]> {
  return requestJson<Allocation[]>("/ipam/allocations");
}

export async function fetchHealth(): Promise<{ ok: boolean; service: string; version: string; time: string }> {
  return requestJson<{ ok: boolean; service: string; version: string; time: string }>("/health");
}
