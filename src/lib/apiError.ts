import type { ApiErrorBody } from "@/types/auth";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly body?: ApiErrorBody
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function parseErrorBody(res: Response): Promise<ApiErrorBody | null> {
  // Use a cloned response so callers can still read the original body (e.g. via res.json()).
  return res
    .clone()
    .json()
    .catch(() => null);
}
