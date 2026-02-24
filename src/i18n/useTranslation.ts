"use client";

import { useCallback } from "react";
import { messages, type Locale } from "./messages";

const defaultLocale: Locale = "en";

/**
 * Simple i18n hook. Returns t(key) for dotted keys (e.g. "login.title", "errors.INVALID_CREDENTIALS").
 */
export function useTranslation(locale: Locale = defaultLocale) {
  const dict = messages[locale];

  const t = useCallback(
    (key: string): string => {
      const parts = key.split(".");
      let value: unknown = dict;
      for (const part of parts) {
        if (value !== null && typeof value === "object" && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return key;
        }
      }
      return typeof value === "string" ? value : key;
    },
    [dict]
  );

  return { t, locale };
}
