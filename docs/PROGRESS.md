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

## M2 Category and section pages: in progress

- [x] 2.1 Category page `/:category` with `useFetch`: the topic, its description and its section cards (kind badge, entry count), breadcrumbs, a skeleton, an error with retry, and the **404 page** for an unknown topic (the API's 404 `NOT_FOUND` is detected on the `ApiRequestError`)
- [x] ~~2.2/2.3 hand-written query cache (`useQuery`)~~ built, measured and **removed on purpose**: this app stays on `useFetch`. The code is in git history (commit `2928c18`, 2.2 only; 2.3 was never committed). Lesson kept: a cache keyed by name, with `staleTime`, de-duplication, invalidation, prefetch, `gcTime` and retry, is exactly what TanStack Query provides; see the list below.
- [x] 2.4 Section page `/:category/:section`: header, sidebar (other sections + "On this page" headings with counts, jump links), entries grouped under their heading (kind, difficulty, tags), 404 for an unknown topic or section. Two `useFetch` calls run in parallel (topic, entries). Entry links go to `/:category/:section/:entry` (placeholder until M3). Checked: 45 rows = sum of the 5 heading counts; sidebar switch Concepts (40 rows, 8 headings); unknown section and topic show the 404 page; `SectionPage` 3 renders on load.
- [ ] 2.5 Filters and pagination in the URL (`useSearchParamsState`, `keepPreviousData`)
- [ ] 2.6 Memoised rows and the render budget

2.1 checked in the browser: `/react` shows 2 section cards linking to `/react/concepts` and `/react/interview-questions`; `/no-such-topic` shows
the 404 page (not an error box); static routes (`/questions`, `/dev/ui`) win over the dynamic `/:category`; the same `CategoryPage` is reused when the
slug changes (`/react` to `/javascript`), and when the slug changes quickly (`/react`, `/typescript`, `/node-js`) the **last** one wins (the dependency
on the slug plus the abort and ignore logic of `useFetch`). Render budget: `CategoryPage` 2 renders on load (skeleton, data); a slug change adds 3
(the new slug, loading, data).

**The pain, measured:** Home to React to Home to React sent 3 new requests (`/categories/react`, `/categories`, `/categories/react`): every visit
requests again, even though nothing changed. This is accepted in the pure-React version; the TanStack version fixes it.

### What we get with TanStack Query (to build and compare in the second app)
| Pain in the `useFetch` app | TanStack Query |
|---|---|
| Revisiting a page refetches and shows a skeleton | cached data shown at once, refreshed in the background (`staleTime`) |
| Two components, same data = two requests | de-duplicated by query key |
| No way to refresh after a change | `invalidateQueries` |
| Click waits for the request | `prefetchQuery` on hover |
| Stale tab on return | `refetchOnWindowFocus` |
| Unused data stays or is lost | `gcTime` cleanup |
| One network blip shows an error | automatic `retry` with backoff |
| `reload` counter, manual `loading/error/success` state | `status`, `isFetching`, `isPending`, `refetch` |
| Filters and pages flash a skeleton | `placeholderData: keepPreviousData` |
| Writes need hand-made state | `useMutation`, optimistic updates |
| Long lists | `useInfiniteQuery` |
| Debugging a cache | React Query DevTools |

## Next
- [ ] M2 Category and section pages
- [ ] M3 Entry page, code editor view, tests start
- [ ] M4 Questions and tags
- [ ] M5 Search
- [ ] M6 Public polish and quality

## Notes learned from the API

- Success: `{ success: true, data, meta? }`. Failure: `{ success: false, error: { code, message, details?, requestId? } }`.
- `GET /delivery/questions` returns `data.entries` and `meta: { page, limit, total, totalPages }`.
