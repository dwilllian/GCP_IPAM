import { GoogleAuth } from "google-auth-library";
import { config } from "../utils/config.js";

type IpamRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string>;
  body?: unknown;
};

type IpamResponse<T> = {
  status: number;
  data: T;
};

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"]
});

async function getAccessToken(): Promise<string> {
  if (config.gcpIpamAccessToken) {
    return config.gcpIpamAccessToken;
  }
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token || !token.token) {
    throw new Error("Token do metadata server não encontrado.");
  }
  return token.token;
}

export async function ipamRequest<T = unknown>(options: IpamRequestOptions): Promise<IpamResponse<T>> {
  if (!config.gcpIpamBaseUrl) {
    throw new Error("GCP_IPAM_BASE_URL não configurado.");
  }
  if (config.mockGcp) {
    return { status: 200, data: { mock: true, path: options.path, body: options.body } as T };
  }
  const token = await getAccessToken();
  const url = new URL(options.path, config.gcpIpamBaseUrl);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.gcpIpamTimeoutMs);
  try {
    const response = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
    const text = await response.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // mantém texto bruto quando resposta não é JSON
    }
    if (!response.ok) {
      throw new Error(`Erro no IPAM GCP (${response.status}): ${text}`);
    }
    return { status: response.status, data: data as T };
  } finally {
    clearTimeout(timeout);
  }
}
