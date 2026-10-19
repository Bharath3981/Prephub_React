# Progress

The plan: build the public pages first (M0 to M6), then auth and admin, then the labs, then a second version with TanStack.
Each module is done in small steps. Master list of React questions: `../Prephub/docs/REACT-INTERVIEW-QUESTIONS.md` (the numbers below are its numbers).

## M0 Foundation and app shell: done

- [x] 0.1 Folder structure, Tailwind tokens (colours, dark mode through `data-theme`), `@` import alias
- [x] 0.2 Router (React Router, library mode), layout route with header, footer and `<Outlet />`, 404 page
- [x] 0.3 UI primitives: `Button` (and `buttonClass` for links), `Badge`, `Container`, `Skeleton`, `cn`
- [x] 0.4 Theme toggle: an external store plus `useSyncExternalStore`, Light, Dark and System, applied before first paint
- [x] 0.5 Error boundaries: a global class boundary and two router `errorElement`s (layout level and page level)
- [x] 0.6 API client (`api()`, `ApiRequestError`, query strings, abort support, cookies)

Checked in the browser: the theme cycles Light, Dark, System, is remembered after a reload and causes **0 extra renders** of `RootLayout` and
`HomePage` (counts stayed at 2, which is the development Strict Mode double mount); an error in a page keeps the header and footer;
unknown URLs show the 404 page; the API client returns data, throws `ApiRequestError` (status, code, request id) and supports abort.

Concepts covered: JSX and composition (#33, #35), props and `children`, variants, routing and nested layouts (#28), `useSyncExternalStore`,
external stores, theming without re-renders (#43), error boundaries (#25), project structure (#42), accessibility basics (skip link,
`aria-current`, labels) (#44).

## M1 Home page and the first data hook: done

- [x] 1.1 Types and Zod schemas for `/delivery/categories` (`features/catalog/types.ts`), `parseResponse()` turns a wrong shape into an `ApiRequestError`
- [x] 1.2 `useFetch` (`shared/hooks/useFetch.ts`): a request is one state (`loading`, `success` with data, or `error`), the cleanup aborts the old request, a late result is ignored, `reload()` runs it again
- [x] 1.3 The race condition and its fix, shown on `/dev/race` (development only)
- [x] 1.4 Home page: category cards from the API, a skeleton while loading, an error with "Try again", an empty state
- [x] 1.5 A dev-only render panel (bottom right) that shows `window.__renders`, and the first render budget

Checked in the browser: 13 topic cards from the real API; the skeleton (with a screen reader "Loading topics...") while a slow request is
pending; the three error cases (server not reachable, an unexpected response shape, an API error with its reference id) and "Try again"
recovering; on `/dev/race`, clicking Slow then Fast ended with the **slow** result in the version without cleanup (the bug) and with the **fast**
result in the `useFetch` version.

**Render budget, Home page:** production 2 renders of `HomePage` (loading, then success) and 1 of `RootLayout` (it never renders again).
Strict Mode was removed from `main.tsx` on request, so development shows the same numbers as production: `HomePage: 2`, `RootLayout: 1`. (With Strict Mode on, the panel showed 3 and 2, because the mount effect runs twice in development.)

Concepts covered: `useState`, `useEffect` and its cleanup (#4, #5), the dependency array (#6), race conditions and `AbortController` (#23, #48),
a custom hook (#12), lists and `key` (#2), conditional rendering by state, the state-updater bail-out (`current.status === "loading" ? current : ...`),
validating server data with Zod, accessible loading and error states (#44).

Pain to notice (this is why M2 adds a cache): go to another page and back, and the topics are requested again.

## M2 Category and section pages, and the query cache: in progress

- [x] 2.1 Category page `/:category` with `useFetch`: the topic, its description and its section cards (kind badge, entry count), breadcrumbs, a skeleton, an error with retry, and the **404 page** for an unknown topic (the API's 404 `NOT_FOUND` is detected on the `ApiRequestError`)
- [x] 2.2 Query cache v1 (`useQuery`: keys, de-duplication, `staleTime`, `isFetching`) in `src/shared/query/`. Measured: Home → React → Home → React = 2 requests in total (was 4+); two calls for one key = 1 request.
- [ ] 2.3 Cache v2 (invalidate, prefetch on hover, refetch on focus, `gcTime`)
- [ ] 2.4 Section layout, sidebar grouped by heading, entry list
- [ ] 2.5 Filters and pagination in the URL (`useSearchParamsState`, `keepPreviousData`)
- [ ] 2.6 Memoised rows and the render budget

2.1 checked in the browser: `/react` shows 2 section cards linking to `/react/concepts` and `/react/interview-questions`; `/no-such-topic` shows
the 404 page (not an error box); static routes (`/questions`, `/dev/ui`) win over the dynamic `/:category`; the same `CategoryPage` is reused when the
slug changes (`/react` to `/javascript`), and when the slug changes quickly (`/react`, `/typescript`, `/node-js`) the **last** one wins (the dependency
on the slug plus the abort and ignore logic of `useFetch`). Render budget: `CategoryPage` 2 renders on load (skeleton, data); a slug change adds 3
(the new slug, loading, data).

**The pain, measured:** Home to React to Home to React sent 3 new requests (`/categories/react`, `/categories`, `/categories/react`): every visit
requests again, even though nothing changed. Step 2.2 adds the cache.

## Next
- [ ] M2 Category and section pages, the query cache
- [ ] M3 Entry page, code editor view, tests start
- [ ] M4 Questions and tags
- [ ] M5 Search
- [ ] M6 Public polish and quality

## Notes learned from the API

- Success: `{ success: true, data, meta? }`. Failure: `{ success: false, error: { code, message, details?, requestId? } }`.
- `GET /delivery/questions` returns `data.entries` and `meta: { page, limit, total, totalPages }`.
