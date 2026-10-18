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

## Next

- [ ] M1 Home page and the first data hook (`useFetch`, race-proof with `AbortController`)
- [ ] M2 Category and section pages, the query cache
- [ ] M3 Entry page, code editor view, tests start
- [ ] M4 Questions and tags
- [ ] M5 Search
- [ ] M6 Public polish and quality

## Notes learned from the API

- Success: `{ success: true, data, meta? }`. Failure: `{ success: false, error: { code, message, details?, requestId? } }`.
- `GET /delivery/questions` returns `data.entries` and `meta: { page, limit, total, totalPages }`.
