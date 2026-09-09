# MovieGenie codebase memory

## Purpose

GenieOfMovie is a single-page Next.js 13 (App Router) application that gives users AI-generated movie or TV-series recommendations. A recommendation is selected by Groq-hosted `openai/gpt-oss-20b` and then enriched and filtered with OMDb data before being displayed.

## Architecture at a glance

```text
Browser (`components/Generator.tsx`)
  ├─ POST /api/generate  → Groq / `openai/gpt-oss-20b` selects 5 title/year/trailer candidates
  └─ POST /api/validate  → OMDb looks up every candidate in parallel,
                            filters it, and returns enriched display data
```

- `app/page.tsx` composes the landing page: `Header`, `HeroIntro`, `HeroSlider`, `Generator`, `Footer`, and JSON-LD (`StructuredData`).
- `app/layout.tsx` owns global metadata, Inter font, global styles, and Google Analytics.
- Tailwind is the styling system. The repository contains many shadcn/Radix UI components under `components/ui`, but the current landing/recommendation experience uses custom Tailwind markup rather than those primitives.
- API routes are forced dynamic, so they do not use static output/caching.

## Recommendation-generation flow

### Client input and state

`components/Generator.tsx` is the main client component. It collects:

- media type: `movie` or `tv`;
- one required mood;
- one or more required genres;
- optional post-year threshold (`2015`, `2010`, `2000`, or `all`);
- optional minimum IMDb rating (0–10); and
- optional free-text custom prompt.

Preferences are retained in `localStorage` as `moviegen-preferences`. The component keeps an in-browser seen-title list in `moviegen-seen` to avoid repeats during "Jumble / Load New" requests. Starting a standard new generation clears that history; reset also clears it. This history is not server-side and is therefore user/device/browser specific.

### Candidate selection: `/api/generate`

The client turns preferences into a natural-language prompt and posts `{ prompt }` to `/api/generate`. The prompt requests five recommendations with a title, year, and a YouTube-search trailer URL. It asks for genre alignment, a strict-after-year condition when selected, an optional rating threshold, custom-preference priority, diversity, and Jumble exclusions.

`app/api/generate/route.ts`:

1. applies the IP rate limit before parsing or calling Groq;
2. checks `GROQ_API_KEY` and `prompt`;
3. calls `groq-sdk` with `openai/gpt-oss-20b`, low hidden reasoning, and strict JSON Schema output requiring `title`, `year`, and `trailerUrl` strings;
4. parses the structured response and returns `{ success: true, data }`.

Groq data is intentionally only a candidate list. It is not displayed until OMDb has verified/enriched it.

### Canonical lookup, validation, and enrichment: `/api/validate`

The client immediately sends Groq candidates plus raw preferences to `/api/validate`.

`app/api/validate/route.ts` runs all candidate lookups through `Promise.all`:

- Maps UI `tv` to OMDb `series`.
- Normalizes model-supplied years such as `2016-2020` or `2022–` to their start year.
- Fetches OMDb by exact title, start year, and type.
- Rejects a candidate if OMDb cannot find it, if none of its OMDb genres intersects a selected genre, if its numeric IMDb rating is below the requested minimum, or if its start year is not strictly after the selected threshold.
- Adds poster, rating, plot, genre, cast, director, awards, runtime, and age rating to accepted candidates.

The UI renders cards, an IMDb badge, a details modal, and trailer links from this enriched response. A zero-result validated response is displayed as an exhausted/no-more-matches state.

## Rate limiting

`lib/rateLimit.ts` implements a fixed-window, in-memory limiter:

- Scope/key: the first IP from `x-forwarded-for`; fallback is `127.0.0.1`.
- Limit: 10 successful passes per IP in a 24-hour window.
- Window: starts when that IP first calls `/api/generate`; it is not a calendar-day reset.
- Enforcement: only `/api/generate`; `/api/validate` has no independent limiter.
- Response: generation returns HTTP 429 once the count has reached 10. The client maps it to “Daily limit reached! Come back tomorrow.”

Important operational limits: the map is local to one server process, loses entries on restart/redeploy, is not shared between horizontally scaled/serverless instances, and has no stale-key cleanup except when a returning IP is checked. `x-forwarded-for` is trusted as received, so correct proxy/header configuration matters. The current code computes `remaining` but does not expose it in the response or show it in the UI.

## Environment and external services

- `GROQ_API_KEY`: required by `/api/generate`. It replaces the former `GEMINI_API_KEY`.
- `OMDB_API_KEY`: read by `/api/validate`; no explicit missing-key guard currently exists.
- Google Analytics is loaded in the root layout (measurement ID is hard-coded).
- OMDb is currently called over `http`, not HTTPS.

Do not commit secrets from `.env.local`.

## Behaviour and implementation notes for future changes

- The client sends a fully constructed prompt. The server validates only that it is present, so a caller can bypass normal UI constraints and submit arbitrary prompt text directly to `/api/generate`.
- The rating and year requirements are present both in the Groq prompt and as the authoritative post-generation OMDb filter. Genre wording says “don't be strict” in the generation prompt, but OMDb validation is strict: at least one genre must intersect.
- Jumble duplicate avoidance is a prompt instruction only; it is not guaranteed by server-side code and can fail if Groq ignores it. The client does not deduplicate the final response itself.
- One generation consumes rate-limit capacity even if request validation, Groq, parsing, or subsequent OMDb validation fails, because the counter runs first. Validation calls do not consume a second token.
- Client error handling intentionally hides most raw backend/provider messages, but `/api/generate` logs the full user prompt on the server and can return stack details in development.
- OMDb lookup depends on title/year/type matching. A good Groq choice may be discarded if the returned title/year is imprecise. There is no fallback title-only OMDb lookup, retry, timeout, cache, or result-count backfill.
- Validation can return fewer than five recommendations; the UI accepts any nonzero count. It only treats an empty validated set as no matches.
- `next.config.js` disables build-time ESLint and enables unoptimized Next images. `npm run typecheck` passed on 2026-09-09. No automated test suite was found in the repository.

## High-value improvement areas

1. Move preference-to-prompt construction and input validation server-side; use typed request/response schemas (for example Zod) at both API boundaries.
2. Replace the process-local IP map with a shared, expiring store or managed rate limiter; return standard rate-limit headers and a precise retry/reset time.
3. Protect `/api/validate` too, or combine generate plus validation into one server endpoint so callers cannot use OMDb work without going through the generation limit.
4. Add HTTPS, missing-key handling, timeouts, retries, response-shape checks, and caching to OMDb integration.
5. Improve candidate quality/reliability through server-side deduplication, validation of Groq output length/type/URLs, and bounded backfill attempts when OMDb filters reduce results.
6. Add unit tests for rate-limit boundaries/IP extraction and integration-style tests for malformed Groq/OMDb responses and filtering rules.
7. Align product copy and implementation: the message says “daily” but the limiter is a rolling 24-hour fixed window, and the “non-strict” genre prompt conflicts with strict post-filtering.
