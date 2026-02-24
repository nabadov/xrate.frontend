import { en } from "./en";

export const messages = {
  en,
} as const;

export type Locale = keyof typeof messages;
