import { API_BASE } from "@/lib/config";
import { ApiError, parseErrorBody } from "@/lib/apiError";
import { useAuthStore } from "@/store/auth";
import type {
  LoginRequest,
  AuthTokens,
  RefreshRequest,
  ApiErrorBody,
} from "@/types/auth";

const AUTH_PREFIX = `${API_BASE}/api/v1/auth`;

async function handleAuthResponse<T>(res: Response, parse: () => Promise<T>): Promise<T> {
  const body = await parseErrorBody(res);
  if (!res.ok) {
    const code = (body?.code ?? "UNKNOWN") as string;
    const message = body?.message ?? "Request failed";
    throw new ApiError(res.status, message, code, body ?? undefined);
  }
  return parse();
}

/**
 * Login with userName and password. On success, tokens are stored in the auth store.
 */
export async function login(credentials: LoginRequest): Promise<AuthTokens> {
  const res = await fetch(`${AUTH_PREFIX}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const tokens = await handleAuthResponse<AuthTokens>(res, () => res.json());
  useAuthStore.getState().setTokens(tokens);
  return tokens;
}

/**
 * Refresh tokens using current access and refresh token from store.
 * On success, updates the store. On failure, clears the store.
 */
export async function refresh(): Promise<AuthTokens> {
  const { accessToken, refreshToken, clearTokens } = useAuthStore.getState();
  if (!accessToken || !refreshToken) {
    clearTokens();
    throw new ApiError(401, "No tokens", "INVALID_REFRESH_TOKEN");
  }

  const body: RefreshRequest = { accessToken, refreshToken };
  const res = await fetch(`${AUTH_PREFIX}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const errorBody = await parseErrorBody(res);
  if (!res.ok) {
    useAuthStore.getState().clearTokens();
    const code = (errorBody?.code ?? "INVALID_REFRESH_TOKEN") as string;
    const message = errorBody?.message ?? "Session expired";
    throw new ApiError(res.status, message, code, errorBody ?? undefined);
  }

  const tokens = (await res.json()) as AuthTokens;
  useAuthStore.getState().setTokens(tokens);
  return tokens;
}
