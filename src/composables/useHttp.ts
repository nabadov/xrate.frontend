"use client";

import { useCallback } from "react";
import { API_BASE } from "@/lib/config";
import { ApiError, parseErrorBody } from "@/lib/apiError";
import { useAuthStore } from "@/store/auth";
import { refresh } from "@/services/authApi";
import type { ApiErrorBody } from "@/types/auth";

export interface HttpRequestInit extends Omit<RequestInit, "body"> {
  body?: object | string | null;
  skipAuth?: boolean;
  skipRefreshRetry?: boolean;
}

/**
 * Composable that returns an HTTP client which:
 * - Uses API_BASE for relative paths
 * - Adds Authorization: Bearer <accessToken> when skipAuth is false
 * - On 401: tries refresh once, then retries the request; if refresh fails, clears store and throws
 */
export function useHttp() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearTokens = useAuthStore((s) => s.clearTokens);

  const request = useCallback(
    async <T>(path: string, init: HttpRequestInit = {}): Promise<T> => {
      const {
        body,
        skipAuth = false,
        skipRefreshRetry = false,
        headers: initHeaders = {},
        ...rest
      } = init;

      const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
      const headers = new Headers(initHeaders);
      if (body !== undefined && body !== null && typeof body === "object" && !(body instanceof FormData)) {
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
      }
      const doFetch = async (): Promise<Response> => {
        const reqHeaders = new Headers(headers);
        if (!skipAuth) {
          const token = useAuthStore.getState().accessToken;
          if (token) reqHeaders.set("Authorization", `Bearer ${token}`);
        }
        return fetch(url, {
          ...rest,
          headers: reqHeaders,
          body:
            body === undefined || body === null
              ? undefined
              : typeof body === "string"
                ? body
                : body instanceof FormData
                  ? body
                  : JSON.stringify(body),
        });
      };

      let res = await doFetch();

      if (res.status === 401 && !skipAuth && !skipRefreshRetry) {
        try {
          await refresh();
          res = await doFetch();
        } catch {
          clearTokens();
          const errBody = await parseErrorBody(res.clone());
          throw new ApiError(
            res.status,
            (errBody as ApiErrorBody | null)?.message ?? "Unauthorized",
            (errBody as ApiErrorBody | null)?.code,
            (errBody as ApiErrorBody) ?? undefined
          );
        }
      }

      const errBody = await parseErrorBody(res);
      if (!res.ok) {
        throw new ApiError(
          res.status,
          (errBody as ApiErrorBody | null)?.message ?? `Request failed (${res.status})`,
          (errBody as ApiErrorBody | null)?.code,
          (errBody as ApiErrorBody) ?? undefined
        );
      }

      const contentType = res.headers.get("Content-Type");
      if (contentType?.includes("application/json")) {
        return res.json() as Promise<T>;
      }
      return res.text() as Promise<T>;
    },
    [accessToken, clearTokens]
  );

  return { request };
}
