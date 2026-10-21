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
- [x] 2.5 Filters and pagination in the URL: `?page=2&difficulty=HARD&search=fib`. `useListParams` (reads and repairs the URL, a filter change goes back to page 1), `EntryFilters` (difficulty buttons, search box with a 300 ms pause, writes with `replace` so Back is not full of half-typed words), `Pagination` (real links), `useKeepPrevious` (the old page stays on screen, dimmed, while the next loads; dropped when the section changes). Checked: 20 per page (45 = 3 pages), page 2 shows 21 to 40, Hard = 11, 3 keystrokes = 1 request, Back restores the URL and the box, `?page=abc&difficulty=x` repaired, `?page=99` shows a message. **Bug found and fixed in `useFetch`:** for one render after `deps` changed it still returned the OLD data (a section switch showed the old section's rows under the new title). It now stores the deps with the result and reports "loading" until they match.
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

**Side panel redone to match the existing PrepHub web app:** `SectionLayout` is a layout route (`:category/:section`) that stays mounted across the list page and the entry pages; it loads the topic and all entries (limit 100) and shows `SectionNav`: an "All interview questions" link, then every entry title under its heading (`navGroups`: entries without a heading come first as "General"), the open entry highlighted from the URL, sticky and scrollable on desktop, an "In this section" disclosure on mobile, hidden for a section with fewer than 2 entries. The page inside (`SectionPage`) gets the topic through the outlet context (no second fetch) and shows flat cards, filters and pagination. Checked: 45 titles under 5 headings, the panel element survives clicking an entry and going back, the highlight follows the URL, 404 for an unknown section.

**Review of 2.4 (decision):** two anti-patterns were spotted. (1) Passing slugs down as props: fixed. `EntryRow` builds its link from the entry's own `categorySlug` and `sectionSlug`; `SectionSidebar` reads the open topic and section with `useParams` (the URL is already the single source of truth, so it is not copied into a store). (2) Refetching on every revisit: **kept on purpose** in this pure-React app and fixed by TanStack Query in the second app. A Zustand store was considered and not used for server data: it would rebuild the query cache (staleness, in-flight de-duplication, invalidation, races). Zustand is for client state (theme, auth user later).

### Render tracking: what is counted and why (`useRenderCount`, read with `window.__renders` in dev)

Only components that tell us something are counted. Small UI pieces (Badge, Button, Skeleton, Container, cards for 6 items, error and not-found pages, the dev pages) are not: their numbers are noise.

| Component | Why it is tracked | Measured | Verdict |
|---|---|---|---|
| `RootLayout`, `Header` | the shell must not re-render when a page changes | 1 render on load, 0 on every navigation | good |
| `HomePage`, `CategoryPage` | a page's budget: loading, then data | 2 renders each | good (the minimum) |
| `SectionLayout` | the frame around the list and the entries | 2 on load, 1 per navigation | good |
| `SectionPage` | the list page | 2 on load, **2** per page or filter change (was 3: `useFetch` no longer sets "loading" a second time) | good (the minimum: dimmed old list, then data) |
| `EntryRow` (20 per page) | the biggest list | after refresh 20, after clicking Easy 29 (**was 69**): `memo`, works because `useFetch` keeps the same `entry` objects | fixed with `memo` |
| `SectionNav` (45 links, desktop and mobile copies) | the biggest panel | 2 on load, **0** on a filter or page change, 2 when the open entry changes (needed) | fixed: `memo`, `useMemo` for the `groups` array, and the open entry passed as a prop (not `useParams` inside) |
| `Pagination` | rebuilt on every list change | after clicking Easy +2 (was +3): `memo`, and its link builder `to` comes from `useCallback` (stable until the URL changes) | fixed |
| `EntryFilters` | the filter bar | +2 per change | fine, tiny. Not memoised: same pattern as `Pagination` (`useCallback` on `onDifficulty` and `onSearch`) if it is ever needed |

Decision: `memo` on `EntryRow` and the panel, `useMemo` for the panel's `groups`, and a one-line `useFetch` change were applied again after the section page numbers were reviewed (the same set as the reverted 2.6 commit `7b67060`, plus `memo` on `Pagination` with stable link-builder functions from `useListParams`). `SectionPage` itself is not memoised on purpose: it is a route page with no props, and its renders come from its own state (URL and request), which `memo` cannot skip; 2 per change is the minimum (dimmed old list, then data).

## M3 Entry page, code view, tests start: in progress

The entry endpoint (`GET /delivery/categories/{c}/sections/{s}/entries/{slug}`) sends the body as **HTML** (`bodyHtml`, built by the API from markdown; tags used: `p`, `ul`, `li`, `table`, `strong`, `a`, `code`, `pre` with `class="language-js"`), plus `meta` (`followUps`, `readingMinutes`), `related`, `category`, `section`, dates. An unknown slug gives a 404 `NOT_FOUND`.

- [x] 3.1 Entry page shell `/:category/:section/:entry`: header (breadcrumbs, kind, difficulty, title, reading time, updated date, tags), summary, previous and next in side-panel order (`EntryPager`, fed by `entryOrder` from the layout's outlet context), 404, skeleton. Checked: the panel element is the same after clicking Next (the layout stays mounted), the highlight follows, the first entry has only Next, an unknown entry shows 404 with the panel kept, a concept entry has no difficulty badge.
- [x] 3.2 Safe body: `EntryBody` shows `bodyHtml` after `sanitizeHtml` (DOMPurify 3.2.6, **allow-list** of tags and attributes; `class` kept only as `language-*`; no `style`, `data-*` or event handlers; links to other sites get `target="_blank"` and `rel="noopener noreferrer"`). Sanitised once per body with `useMemo`. Clicks on links to our own pages go through the router (one click handler on the container, no reload). Styles by tag in `index.css` (`.entry-body`); wide tables and code scroll inside the page. Checked: 12 attack strings neutralised (`script`, `onerror`, `javascript:` and `data:` links, `svg onload`, `iframe`, `form`, `style` attribute, `onclick`, free `class`, `data-*`, a mutation-XSS payload) and `window.__pwned` never set; three real entries come out with the same element and text counts; no sideways page scroll at 375px on Home, topic, section and entry (this needed a tighter header: `gap-3 sm:gap-6`, link padding `px-2 sm:px-3`).
- [ ] 3.3 Tests start: Vitest and React Testing Library (sanitiser, `list-params`, `navGroups`, `useDebouncedValue`, `useFetch`, `Pagination`) *(deferred by the owner: decide later)*
- [x] 3.4 Code blocks: `htmlToReact` sanitises the API's HTML and walks it into React elements (no more `dangerouslySetInnerHTML` for the body); each `<pre><code class="language-x">` becomes `CodeBlock` (language label, Copy button with a "Copied" message and a live region, scrollable and focusable code box). Highlighting is **lazy**: `highlight.js` core plus one grammar file per language, fetched with `import()` only when a page has code (checked: nothing from the highlighter loads on the list page; an entry with JavaScript loads the core and `javascript` only; the production build has `highlight` (21.8 kB) and 11 small grammar chunks apart from the main bundle). The plain code shows at once and is highlighted a moment later, so there is no wait and no jump. Own-page links are router `Link`s, other links keep `target="_blank"` and `rel`. Content facts: 611 code blocks in 703 entries, 14 language tags (`js`, `tsx`, `text`, `ts`, `bash`, `jsx`, `sql`, `json`, `dockerfile`, `http`, `yaml`, `html`, `css`, `lua`); `text` or no language shows plain. Checked: all 13 distinct language cases render, the shown code equals the API text, copy writes exactly the shown code (clipboard stubbed; this embedded browser refuses real clipboard access, which shows "Could not copy" and resets), attack strings through the converter leave no `on*`, `style` or `javascript:` props, no sideways scroll at 375px, `yarn build` passes.
- [x] 3.5 Code editor view, mirroring the Next.js site: JavaScript and TypeScript samples (`js`, `jsx`, `ts`, `tsx`) in the **React** and **Coding Round** topics and the **JavaScript / coding-questions** section show in a read-only CodeMirror 6 editor (`CodeView`: line numbers, colours, selectable) with Copy and, for plain runnable JavaScript, **Open in playground** (`playground-link.ts`: the code goes in the URL hash `#code=<base64url>`; code that needs a page, React or imports is not offered; `// result` calls are wrapped in `console.log`). Everywhere else samples keep the highlight.js colours. The editor is a **lazy** `React.lazy` file with the plain code as the Suspense fallback: the production build has `CodeView` (375 kB, 129 kB gzip) apart from the main bundle (414 kB, unchanged); nothing of CodeMirror loads on the list page or on a Docker entry. The editor follows the site theme (`useTheme().resolved`). The playground address is `VITE_PLAYGROUND_URL` (default `http://localhost:5173`). Checked: label and editor per rule (React concepts with tsx and bash: editor plus highlight.js; JavaScript interview-questions: highlight.js; coding-questions: editor with 4 playground links), shown text equals the API text, copy equals the shown code (clipboard stubbed), the link's hash decodes to the shown code with the playground's own decoding, light and dark colours (4 and 8 token colours), no sideways scroll at 375px, `yarn build` passes. The playground app itself was not running, so the click-through to it was not tested.
  **Lesson (a silent bug):** the editor first showed NO syntax colours although the syntax tree was right. Five CodeMirror packages had their own nested copy of `@codemirror/view` (6.43.15) next to ours (6.43.14); two copies of that library cannot share plugins, so highlighting silently never ran. Fix: `resolutions` in `package.json` forcing one version of `@codemirror/view`, `state` and `language`, then deleting `node_modules/.vite` so Vite rebuilt its pre-bundled dependencies (it had cached the duplicates).
- [ ] 3.6 Entry extras: follow-up questions, related entries, tags as links
- [ ] 3.7 Route polish: document title per page, scroll and focus after navigation

## Next
- [ ] M2 Category and section pages
- [ ] M3 Entry page, code editor view, tests start (3.1, 3.2 and 3.4 done; 3.3 tests deferred)
- [ ] M4 Questions and tags
- [ ] M5 Search
- [ ] M6 Public polish and quality

## Notes learned from the API

- Success: `{ success: true, data, meta? }`. Failure: `{ success: false, error: { code, message, details?, requestId? } }`.
- `GET /delivery/questions` returns `data.entries` and `meta: { page, limit, total, totalPages }`.
