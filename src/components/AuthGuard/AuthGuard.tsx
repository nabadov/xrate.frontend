"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth";

const LOGIN_PATH = "/login";
export const REDIRECT_URL_PARAM = "redirectUrl";
const REHYDRATE_TIMEOUT_MS = 200;

export function getLoginUrl(redirectPath: string): string {
  if (!redirectPath || redirectPath === LOGIN_PATH) return LOGIN_PATH;
  return `${LOGIN_PATH}?${REDIRECT_URL_PARAM}=${encodeURIComponent(redirectPath)}`;
}

/** Returns a safe redirect path (starts with /, not //) or null. */
export function getSafeRedirectUrl(redirectUrl: string | null): string | null {
  if (!redirectUrl || typeof redirectUrl !== "string") return null;
  const decoded = decodeURIComponent(redirectUrl.trim());
  if (decoded.startsWith("//") || !decoded.startsWith("/")) return null;
  return decoded;
}

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Redirects to /login when the user is not authenticated.
 * Skips the check on the login page. Waits for store rehydration from localStorage before deciding.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rehydrated = useAuthStore((s) => s._rehydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (rehydrated) {
      setReady(true);
      return;
    }
    const t = setTimeout(() => setReady(true), REHYDRATE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [rehydrated]);

  useEffect(() => {
    if (!ready) return;
    if (pathname === LOGIN_PATH) return;
    if (!isAuthenticated) {
      const returnPath = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      router.replace(getLoginUrl(returnPath));
    }
  }, [ready, pathname, isAuthenticated, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
      </div>
    );
  }

  if (pathname !== LOGIN_PATH && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
}
