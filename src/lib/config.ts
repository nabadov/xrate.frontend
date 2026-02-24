const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function getApiBaseUrl(): string {
  return baseUrl.replace(/\/$/, "");
}

export const API_BASE = getApiBaseUrl();
