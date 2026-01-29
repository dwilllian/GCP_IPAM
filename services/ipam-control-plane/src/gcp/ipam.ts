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

const METADATA_TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

async function getAccessToken(): Promise<string> {
  if (config.gcpIpamAccessToken) {
    return config.gcpIpamAccessToken;
  }
  const response = await fetch(METADATA_TOKEN_URL, {
    method: "GET",
    headers: {
      "Metadata-Flavor": "Google"
    }
  });
  if (!response.ok) {
    throw new Error(`Falha ao obter token do metadata server: ${response.status}`);
  }
  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("Token do metadata server não encontrado.");
  }
  return payload.access_token;
}

export async function ipamRequest<T = unknown>(options: IpamRequestOptions): Promise<IpamResponse<T>> {
  if (!config.gcpIpamBaseUrl) {
    throw new Error("GCP_IPAM_BASE_URL não configurado.");
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
