# XRate Frontend

Frontend for currency exchange rates and conversions. I built it with Next.js 16, React 19, and TypeScript, using the App Router and Tailwind CSS. It talks to the [XRate backend API](https://github.com/your-org/xrate.backend) for auth, conversion, latest rates, and historical rates. The UI follows a dark slate theme with blue accents—login page is the visual reference for the rest of the app.

---

## Setup

You’ll need **Node.js 20** (or compatible) and **npm**.

**Run locally:**

```bash
git clone <repository-url>
cd xrate.frontend
npm install
cp .env .env.local   # then edit .env.local if needed
npm run dev
```

The app runs at **http://localhost:3000**. It will redirect to the login page if you’re not authenticated. **Test credentials:** username `user`, password `user123`. To run the linter: `npm run lint`.

**Config** lives in `.env` and `.env.local` (the latter overrides for local tweaks). The bits you care about:

- **NEXT_PUBLIC_API_BASE_URL** — Backend API base URL (e.g. `http://localhost:5299`). No trailing slash.
- **NEXT_PUBLIC_ENV** — Optional; use it if you need env-specific behaviour in the client (e.g. `dev` / `prod`).

Point `NEXT_PUBLIC_API_BASE_URL` at your running XRate API. If the API is on another host/port (e.g. Docker on 8080), set it to that. CORS on the backend must allow your frontend origin (e.g. `http://localhost:3000`).

**Docker:**

```bash
docker build -t xrate-frontend --build-arg APP_ENV=local .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=http://host.docker.internal:5299 xrate-frontend
```

The image uses a multi-stage build: it copies `.env.<APP_ENV>` into `.env.local` at build time when you pass `APP_ENV` (e.g. `local`, `production`). At runtime you can override `NEXT_PUBLIC_*` if your runner supports it; for a container talking to an API on the host, `host.docker.internal` (or your host IP) is often useful.

---

## Structure

I kept things flat and predictable so I can find stuff quickly and keep the API layer separate from UI.

**App Router (`src/app/`):**

- **layout.tsx** — Root layout: fonts (Geist), global slate background, gradient and grid overlay, `AuthGuard` around children, Sonner toaster.
- **page.tsx** — Home: converter form, latest rates, and rates history in one scrollable page.
- **login/page.tsx** — Login form (user name + password), validation with Zod, redirect after success (with optional `redirectUrl` query param).

**Components (`src/components/`):**

- **AuthGuard** — Wraps the app; redirects unauthenticated users to `/login` and waits for Zustand rehydration from `localStorage` before deciding. Shows a spinner until ready.
- **Converter** — Conversion form: amount, source/target currency (searchable selects), submit, result and loading/error states. Uses react-hook-form + Zod; handles API validation (e.g. excluded currencies) with clear messages.
- **LatestRates** — Base currency selector and table of latest rates from the API, with loading state.
- **RatesHistory** — Date range (from/to) and paginated history table; page/size aligned with the backend.
- **Shared UI** — `Input`, `Select`, `SearchableSelect`, `DataTable`, `Pagination` in camelCase files; reused so forms and tables look and behave consistently.

**State and data:**

- **Auth** — Zustand store (`src/store/auth.ts`) with `persist` to `localStorage` (tokens). Login calls the auth API and stores access + refresh tokens; `AuthGuard` and API client use them.
- **Forms** — Local state and react-hook-form; validation via Zod and `@hookform/resolvers`. No global form state.
- **API** — Thin services in `src/services/` (e.g. `authApi`, `currenciesApi`, `ratesApi`) and a small `useHttp`-style helper; types and error handling live in `src/lib/` and `src/types/`.

**Conventions I follow:** camelCase for all source files (e.g. `authApi.ts`, `useHttp.ts`). Shared types (e.g. `Currency`, `ExchangeRate`, auth types) in `src/types/`. API base URL from `src/lib/config.ts`. User-facing strings via a simple i18n hook and messages under `src/i18n/`. Buttons and clickable elements use `cursor-pointer`; loading and errors are handled with spinners/skeletons and toasts, no raw API dumps.

---

## How I use AI on this project

I use AI (Cursor) with **project rules**. I run Copilot in **agent mode**, not in auto—so I stay in the loop and every change is reviewed and accepted by me before it lands. so generated code matches how I’ve set things up. The rules live in `.cursor/rules/` — see [xrate-project.mdc](.cursor/rules/xrate-project.mdc) for the main one.

**Where it helps most:**

- **New features** — Adding a new section (e.g. another rates view or a settings page) while reusing existing components, same slate/blue styling, and the same patterns for loading and errors.
- **API integration** — Keeping services, types, and error handling in sync with the backend (e.g. new endpoints, pagination, or validation messages) without leaking HTTP details into components.
- **Forms and validation** — Generating or updating react-hook-form + Zod schemas and handling backend validation (400/422) with user-friendly messages.
- **i18n and copy** — Adding or changing translation keys and making sure copy stays consistent across the app.
- **Docs and README** — Drafting or updating README and setup instructions so they stay in sync with the repo and env vars.

When I add a page or touch the API layer, I point the AI at the rules so it keeps Request/Response types in the right place, uses the existing UI components, and keeps naming (camelCase) and styling (login page as reference) consistent.

---

## Assumptions and trade-offs

- **Auth** — Login is the only way in; there’s no sign-up or password reset in the UI. Tokens are stored in `localStorage` via Zustand persist. Good enough for demos and internal tools; for production you’d consider httpOnly cookies and proper session handling.
- **Single backend** — The app is built around one API base URL. No multi-tenant or backend switching.
- **No SSR for protected data** — Authenticated content is client-rendered so we don’t have to deal with passing tokens into SSR. The layout and shell are still server-rendered.
- **CORS** — The backend is expected to allow the frontend origin (e.g. `http://localhost:3000`). For Docker or other hosts, you need to align CORS and `NEXT_PUBLIC_API_BASE_URL`.

---

## Potential future improvements

- **Refresh token flow** — Call the backend refresh endpoint when the access token expires and retry failed requests instead of sending the user straight to login.
- **Server state library** — Introduce React Query or SWR for rates and history so we get caching, deduplication, and clearer loading/error states.
- **Tests** — Unit tests for stores and validation, and either component tests or E2E for the main flows (login, convert, rates, history).
- **Accessibility** — Audit and improve focus handling, ARIA, and keyboard navigation, especially on the converter and tables.
- **Error boundaries** — Route- or section-level error boundaries with fallback UI and optional reporting.
- **Theme or layout options** — If needed, a simple theme toggle or alternate layout while keeping the login page as the style reference.
