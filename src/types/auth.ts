/** Auth API request/response and error shapes */

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export type AuthErrorCode = "INVALID_CREDENTIALS" | "INVALID_REFRESH_TOKEN";
