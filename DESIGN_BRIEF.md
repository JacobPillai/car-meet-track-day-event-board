# ApexGrid design brief and working checkpoint

Last updated: 21 October 2026
Status: Homepage/shared cards, Browse Events, Event Detail, Explore, and navbar redesigns implemented; 194 automated tests and production/PWA build passing. Desktop dark-theme homepage/listing direction approved; guest detail and Explore screenshots reviewed. New navbar rendered review and broader responsive/light-theme/interaction checks remain open. Footer untouched in the navbar slice.

## Read this first

This file records the user's design decisions and the discussion that led to them. Read it before starting or resuming the redesign, and whenever the work becomes unclear. It is not proof that a feature exists or that validation has passed: inspect the current implementation before acting.

Do not treat a recommendation below as user approval. Preserve existing functionality and user changes. Update the checkpoint at the bottom as work progresses so another session can resume accurately.

## 1. Confirmed direction

The user has confirmed:

- ApexGrid serves casual car-meet attendees, not only track-day drivers or racing enthusiasts.
- The desired personality is motorsport editorial with the friendliness and ease of use of a community platform.
- Photographic atmosphere and a cleaner layout are preferred, combined with confident typography.
- The user also wants a dashboard for monitoring the app's performance and condition. The meaning, scope, and implementation of that monitoring still need clarification; see section 7.
- This file is being created before implementation to prevent confusion and unsupported assumptions during later work.

Working design statement:

> A cinematic, community-first automotive platform. Bold enough to feel like car culture; simple enough to use without being a car expert.

The goal is not simply to make the app look less AI-generated. The goal is stronger hierarchy, authentic content, clearer decisions, and a coherent visual identity.

## 2. Reference designs supplied by the user

The references were attached as images in the conversation. They are NOT currently known to be saved in the repository, and their source URLs and asset licences have not been provided. A future session may need the user to reattach them; do not claim to have the original assets.

### Primary influence: EliteDrive automotive landing page (third reference)

Visual description: atmospheric red sports car in a dark garage; large white left-aligned headline below/overlapping the photographic area; small supporting copy; restrained orange accent; ample dark space; separate desktop and mobile compositions.

Borrow:
- Photography as the main source of atmosphere.
- Clear, spacious compositions and readable supporting text.
- A small number of prominent actions.
- Responsive layouts intentionally composed for mobile, not merely shrunk desktop layouts.

Do not borrow:
- Generic luxury-brand language or showroom positioning.
- Decorative performance statistics, fabricated trust claims, or irrelevant sales features.

### Secondary influence: EMPOWER automotive landing page (first reference)

Visual description: black/red palette; oversized condensed headline with solid and outlined letters; a red sports car overlaps the type; sections have distinct compositions.

Borrow:
- Typographic confidence, strong scale contrast, and deliberate composition.
- A recognizable identity without putting every section in an identical card.

Do not assume approval for:
- Literal EMPOWER lettering, copied logos, or outlined text everywhere.
- A complex cut-out car hero, 3D assets, or heavy animations.

### Supporting reference: Porsche 718 page (second reference)

Visual description: dominant automotive photograph with quiet supporting panels and controls, presented within a laptop mockup against a landscape.

Borrow photographic emphasis and restrained controls where useful. The laptop and landscape are presentation framing, not proposed ApexGrid UI. Avoid dense glass panels over photos where readability suffers.

### Navbar references — 21 October 2026

After reviewing Explore screenshots, the user requested cleaner navigation/footer one at a time and explicitly approved starting with just the navbar. Supplied references show:
- A three-part desktop composition: quiet logo at left, centred rounded link pill with a clearly selected segment, and a separate right-side action.
- A dark rounded mobile dock with icons and an oversized active item against a vivid gradient.
- A light rounded dock with icon/text labels and a contrasting active capsule.

Use their shape, spacing, and active-state hierarchy, not their branding/assets, oversized protruding item, bright backdrop, heavy blur, or neumorphic shadows. Adapt the pills to ApexGrid's warm charcoal/off-white system, restrained vermilion, both themes, and readable labels. Preserve all role-specific destinations, search shortcut, theme toggle, and browser-connectivity semantics. Footer was initially deferred. The user subsequently authorized the footer, Clubs directory and About page together; see the latest checkpoint.

## 3. Current implementation: observed issues

These observations came from reading source, NOT from a rendered browser audit. Verify actual appearance at desktop and mobile sizes before drawing layout conclusions.

Relevant files inspected:
- `src/views/HomeView.vue`
- `src/views/EventsListView.vue`
- `src/components/EventCard.vue`
- `src/components/Navbar.vue`
- `src/style.css`

Observed patterns:
- The stylesheet currently describes an F1 telemetry / night-run carbon system, with glass, gradients, grid overlays, glow shadows, card lifts, image zoom, and pulsing indicators.
- The homepage combines a large hero, search, four statistics, an auto-rotating spotlight, a seconds countdown, category tiles, and another featured-events section.
- Event cards give many elements separate emphasis: category/region/status badges, date ticket, price, distance, capacity bar, likes, offline saving, and a Details action.
- Navigation becomes extensive for authenticated organizer/admin roles.
- Technical/racing metaphors appear in everyday controls: Search Grid, My Vault, Telemetry, and Inspect Event & Paddock Pass.

Credibility issues to address deliberately:
- Homepage labels include Sanctioned Events and Verified Clubs; their supporting processes have not been verified.
- EventCard's Selling Fast label currently depends on at least 45% RSVP capacity, not a measured rate of sales.
- Navbar's PWA LIVE indicator is driven by online status; that does not establish service-worker readiness or API health.

Do not replace these with new unsupported claims.

## 4. Proposed visual and interaction system

These are recommendations consistent with the agreed direction, not final approved specifications:

- Near-black/charcoal surfaces, warm off-white text, and one restrained red/vermilion accent. Final tokens require contrast checks.
- A confident display face for major headings, paired with a readable UI sans-serif. Inspect current font loading and dependencies before changing fonts. Do not add fonts merely for novelty.
- Genuine meet/community photography: varied cars, people, locations, and atmosphere. Avoid presenting ApexGrid as exclusive to exotic-car owners.
- Mostly flat surfaces, subtle dividers, fewer nested boxes, restrained shadows.
- Distinct section compositions, consistent alignment, and deliberate whitespace.
- Motion for feedback, not persistent decoration. Prefer a stable hero to automatic rotation. Preserve reduced-motion support.
- Plain language for navigation and actions; personality belongs primarily in imagery and editorial headings.
- Preserve light/dark theme functionality. A dark-led reference does not authorize removing or neglecting light mode.

Possible copy simplifications:

| Existing | Proposed |
| --- | --- |
| Search Grid | Find events |
| My Vault | Saved events |
| Telemetry | Organizer dashboard |
| Inspect Event & Paddock Pass | View event |
| Offline PWA Vault | Saved for offline |

Keep RSVP/attendance and offline-saved concepts distinct even if navigation labels change. Confirm destinations and role visibility before renaming links.

## 5. Proposed public experience

### Homepage

Suggested order:
1. Atmospheric meet photograph, a short confident headline, and a clear discovery action.
2. Accessible search strip: region, event type, date, and Find events.
3. Coming up: relevant event cards ordered by date.
4. Find your scene: Meets, Shows, Cruises, Drift, Track Days, and existing supported categories.
5. Meet the clubs: introduce organizers and communities.
6. A short first-timer introduction explaining how attending works.

Illustrative copy only, not approved final text:

> GOOD CARS. BETTER COMPANY.
>
> Discover car meets, shows and weekend drives across Australia and Malaysia.

Recommendations: remove decorative telemetry counters and the seconds countdown from the public homepage; avoid duplicated featured sections. Reuse current search/category behavior where possible. Do not introduce misleading geographic personalization without supporting location data or consent.

### Event cards

Prioritize: photograph -> title -> date and venue -> price -> save/action.

- Keep attendance as supporting information rather than universal telemetry.
- Reserve conspicuous status treatments for genuinely useful states such as cancellation or full capacity.
- Preserve discoverability of likes and offline saving, even if visually quieter.
- Keep price currency and regional context unambiguous.
- Do not silently change the meaning of likes, RSVP, bookmarks, or offline saving.

### Event detail

Prioritize date/time, venue, entry cost, what to expect, organizer, and RSVP.

Spectator access, parking, whether a car is required, and registration requirements could reduce first-timer uncertainty. These are potential structured-data/product additions, NOT known existing fields. Do not invent values or add unsupported badges. Seek agreement before extending the schema/API.

## 6. Scope and preservation rules

Recommended first implementation slice: homepage + shared event card, with only the shared styling/navigation adjustments needed to support them. Confirm this slice before implementation; the user has requested planning documentation so far, not explicitly authorized a full redesign.

Preserve:
- Existing routes and role-based access controls.
- Authentication and guest/member/organizer/admin behavior.
- Search, filters, pagination, RSVP, likes, and offline saving.
- Map/calendar, organizer analytics, club management, and moderation functionality.
- Existing accessibility provisions and light/dark themes.

Keep work focused. Avoid a framework migration, backend rewrite, dependency additions, or deleting working features merely to simplify the visuals. Do not manually edit generated `dist/` output. Inspect the working tree before edits; do not commit, push, or deploy without explicit instruction.

## 7. Dashboard: unresolved product distinction

The existing project reports describe organizer analytics: RSVPs, likes, and event categories. Those are engagement metrics, not operational monitoring. The dashboard implementation and data sources have not been audited in this discussion.

The user's request for monitoring app performance and condition could mean:
- Organizer/event performance;
- App health: availability, errors, response times, and data freshness;
- Both, in separate views or sections.

Clarify this before changing dashboard behavior. A reasonable proposal is to retain organizer analytics and make operational health admin-only, but access rules and scope are not yet agreed.

Real operational monitoring needs defined measurements and instrumentation. Do not fabricate latency, uptime, system health, or historical charts. Distinguish browser connectivity from API availability and service-worker readiness. Any telemetry collection needs consideration of privacy, retention, hosting compatibility, and potential service costs.

## 8. Questions to resolve before implementation

Resolve only what blocks the next slice; do not turn every design detail into a question.

1. Confirm homepage + event card as the first implementation scope.
2. Identify usable, appropriately licensed photography. Check existing assets first; ask for preferred images if necessary. Record sources/attribution. User-supplied reference screenshots do not grant rights to their embedded images.
3. Inspect the running app or obtain screenshots at mobile and desktop sizes to establish a baseline.
4. Clarify dashboard intent before dashboard work; it need not block a homepage-only slice.

Exact font choice, spacing scale, component radii, and final copy can be proposed during the first slice and reviewed together.

## 9. Implementation and validation workflow

Before editing:
- Read this brief and inspect current working-tree changes.
- Check for applicable project instructions and inspect relevant code/config/tests.
- Establish what is implemented versus merely described in reports.
- State the slice being worked on and any consequential assumptions.

Suggested sequence:
1. Establish baseline screenshots and asset choices.
2. Define a restrained token/type system without globally breaking other views.
3. Implement homepage and shared event-card hierarchy.
4. Review desktop/mobile and both themes with the user.
5. Extend the agreed system to navigation, listings, and event detail.
6. Address dashboard work only after its purpose and data sources are clear.

Check after changes:
- Use actual scripts from `package.json` for tests/build; inspect them first.
- Test keyboard navigation, visible focus, form labels, image/text contrast, touch targets, and reduced motion.
- Check small-phone widths, tablet, desktop, long titles, missing images, empty results, and loading/error states.
- Check guest and authenticated role navigation, RSVP/like actions, offline saving, and light/dark modes as relevant to the slice.
- Avoid making the hero image an unnecessary performance cost: appropriate image dimensions/formats and responsive crops; do not lazy-load the primary above-the-fold image without justification.
- Report exactly what was run and observed. Diagnostics are not a substitute for tests, a build, or visual inspection.

Earlier session limitations:
- Editor diagnostics reported no errors/warnings at that time, before redesign changes.
- Git inspection and `npx vitest run` failed because the Windows bash process could not fork (`Resource temporarily unavailable`). Tests/build were not verified in that discussion.
- Existing reports claim 13 passing tests; that claim was not independently reproduced here.
- Recheck the environment rather than assuming that the terminal failure persists or that old test results still apply.

## 10. When confused or resuming midway

1. Re-read confirmed decisions in section 1.
2. Inspect actual code and the working diff before continuing.
3. Separate facts, proposals, and assumptions explicitly.
4. If a decision affects scope, data, permissions, or feature semantics, ask rather than silently choosing.
5. Record newly agreed decisions and update the checkpoint below.
6. Do not interpret an unchecked plan item as completed work.

## 11. Working checkpoint

### Completed
- [x] Discussed why the current design can feel template-like.
- [x] Reviewed user-provided automotive design references.
- [x] Confirmed photographic atmosphere + clean layout + confident typography.
- [x] Recorded the design direction and guardrails in this file.

### Implementation checkpoint — 21 October 2026
- [x] Homepage and shared event cards implemented before this continuation; user reports homepage implementation/testing complete.
- [x] Inspected working-tree status and package scripts. Preserved existing changes to homepage, cards, navbar, index, Vite configuration, and existing tests.
- [x] Continued one page at a time with Browse Events (`src/views/EventsListView.vue`). Matched the homepage’s scoped warm charcoal/off-white and vermilion palette, editorial heading, flat filter section, and responsive spacing. Preserved light mode, routes, organizer visibility, all seven filter controls, pagination, likes, and shared offline-save controls.
- [x] Added separate loading/error/retry/empty treatments and independent category loading. Clarified local-currency price limits and location-denial fallback copy; no new data fields, dependencies, assets, or monitoring claims.
- [x] Added `tests/unit/EventsListView.spec.js`: eight regression tests for discovery filters, role visibility, filtering, pagination, failure states, guest/member likes, and geolocation fallback.
- [x] Full suite verified: **76 tests passed across seven files**, using `node node_modules/vitest/vitest.mjs run` via shell `exec` to bypass the failing npm shell path.
- [x] Production build and PWA generation passed using `node node_modules/vite/bin/vite.js build`. Existing large-chunk warning remains non-blocking. Generated `dist/` was not manually edited.
- [x] Editor diagnostics: no errors/warnings in the listing view or new test file. `git diff --check` completed with line-ending notices but no whitespace errors.
- [x] User supplied desktop dark-theme homepage and Browse Events screenshots and said “yes its good”; visual direction approved for those shown states.
- [ ] Remaining Browse Events review: small phone/tablet, light theme, keyboard focus, native date/select interaction, full results/pagination, and failure states. Screenshots do not establish interactive behavior.
- [ ] Verify existing homepage photography licensing/attribution; not established by this continuation.
- [x] User requested the next page; implemented Event Detail (`src/views/EventDetailView.vue`) with photographic emphasis, editorial title, flat information sections, responsive RSVP summary, both themes, and accessible action controls. Browse Events rendered review remains pending rather than assumed complete.
- [x] Preserved RSVP/cancellation, likes, protected address/contact, map, comments/optional ratings, owner/admin management, and offline saving. Replaced fabricated “official” session details and “sanctioned” copy with organizer-provided start/end times and plain-language information. No schema/API/dependency changes.
- [x] Isolated comments errors, added event/comments retry, inline action errors and duplicate-request guards, labeled offline snapshots, and guarded stale event/comments/action completions across route changes and unmount. Snapshot comments composer is hidden because comments are not part of the saved event.
- [x] Added `tests/unit/EventDetailView.spec.js`: **28 tests**; latest full suite **104/104 across eight files** (Vitest 2.1.9, 8.99s). Production/PWA build passed (Vite 5.4.21, 93 modules, 12.86s); main JS 981.82 kB / 310.45 kB gzip, existing large-chunk warning remains. One runner launch failed before execution with Windows process exit 3221225794; identical separate retry passed.
- [x] Reviewed user-supplied desktop dark-theme guest screenshots at `/#/events/1`: heading/photo, guest address/contact gate, rendered venue map, public comments, and right-hand RSVP/price/offline summary are visible with no obvious overlap in the supplied frames. This is screenshot review, not direct browser interaction.
- [ ] Remaining Event Detail review: small phone/tablet, light theme, image fallback, actual sticky behavior, keyboard order/focus, and signed-in/account-role actions. Component tests stub the map/API; screenshots do not establish deployed-backend or interaction correctness.
- [x] User supplied `/#/explore` baseline showing older telemetry wording, bright accents, and nested cards, then explicitly requested “Alright redesign that page next.” Implemented Explore as the next focused slice.
- [x] Redesigned `src/views/ExploreView.vue`: editorial heading, flat shared category/region/layout controls, map/calendar/combined modes, photographic preview, responsive workspace, both-theme scoped styles, focus indicators, empty/error/retry states and independent category loading. Preserve marker/list preview and calendar/detail navigation; preview/list also available in calendar-only mode.
- [x] Selection follows visible results; all API event pages load before a complete count is shown. Kuching venue-name and Sepang Malaysia-wide matching retained with explicit explanatory copy. Guard duplicate pending retries and post-unmount completions. No schema/API/dependency/new-asset changes.
- [x] `EventMap.vue` watches external region changes, retains its other consumers' quick-jump controls, avoids parent-echo animation, and honors reduced motion. `EventCalendar.vue` gets flat theme-aware styling, responsive toolbar, Month/List/Today labels, and actual current-date initialization instead of the fixed October 2026 date.
- [x] Added 17 Explore, 18 map, and 10 calendar tests. Final full run: **149/149 tests across 11 files**, Vitest 2.1.9, 10.24s. Production/PWA build: Vite 5.4.21, 95 modules, 14.99s; main JS 985.82 kB / 312.10 kB gzip; 12 precache entries (1850.21 KiB). Existing chunk warning remains; shell startup warnings did not prevent final success. Checked Explore/map/calendar and Explore-test diagnostics clean; whitespace check passed with line-ending notices.
- [x] Confirmed and fixed Explore's scoped light-theme selector via Vue compiler; added compilation regression. Debugging/test-harness notes in `PROGRESS_REPORT.md` DBG-07/08.
- [x] User supplied desktop dark-theme Explore screenshots showing the new heading/filters, rendered map tiles/markers, photographic preview/list, and October 2026 month calendar with Today/Month/List controls. No obvious overlap in supplied frames. About/Clubs screenshots still show the older design; not redesigned or treated as approved next-page scope.
- [ ] Remaining Explore review: small phone/tablet, light theme, keyboard focus/order, real map regions/zoom/marker interaction, preview/detail links, and calendar month/list/Today behavior. Screenshots/stubbed tests do not establish real interactions, contrast, live backend, or real-device offline behavior.
- [x] User approved navbar-only work and supplied desktop/mobile pill-navigation references. Implemented `src/components/Navbar.vue` with a centred public-link pill, quieter wordmark, grouped role-aware account disclosure, search/theme controls, and a floating rounded mobile dock. Footer unchanged.
- [x] Preserved public routes, guest sign-in/registration, profile/My RSVPs & saved events, organizer dashboard/host actions, admin moderation, sign-out, saved-for-offline count, and role-home dock destinations. Account links are grouped in the disclosure rather than repeated across the desktop row. Browser online status is quiet inside the menu; offline remains visible without claiming API/PWA health.
- [x] Vue-controlled disclosure supports Escape with focus return, outside click/focus dismissal, route/auth-change dismissal, scrollable short-screen content, and listener cleanup. Search returns focus to its opener on dismissal; Ctrl/Cmd+K has one owner in Navbar (removed duplicate modal shortcut listener, retaining Escape). Mobile clearance/safe area is reserved through navbar-owned CSS; no footer/global stylesheet edits.
- [x] Added `tests/unit/Navbar.spec.js`: **45 tests**, including real memory-router and actual search-modal integration plus CSS compilation checks. Final full suite **194/194 across 12 files**, Vitest 2.1.9, 11.15s. Production/PWA build: Vite 5.4.21, 95 modules, 13.24s; JS 983.75 kB / 312.13 kB gzip; 12 precache entries (1856.45 KiB), existing chunk warning remains. Navbar/modal/spec diagnostics clean.
- [x] Reviewed latest user-supplied desktop dark-theme Clubs/About screenshots with the new navbar: centred navigation, correct active segments and separate right-side actions show no obvious crowding in those frames. This is not mobile/light/signed-in interaction validation.
- [ ] Review navbar mobile/light-theme and signed-in states, 320px/short landscape widths, long names, menu scrolling/focus, search shortcut, dock clearance/safe area and role-specific actions. Tests do not prove rendered accessibility or real-device layout.
- [x] User authorized “footer next, and clubs and about page UI as well.” Redesigned `Footer.vue`, `ClubsListView.vue` and `AboutView.vue` only, with scoped responsive dark/light styling, quieter branding and editorial hierarchy. Club Detail remains unchanged.
- [x] Footer retains all discovery/account destinations, browser-provided install prompt, reactive saved-for-offline count, credits disclosure and confirmed local seed reset. Added install pending/error feedback, credits Escape/focus return and precise reset impact copy. Removed unsupported verification/telemetry/deployment-ready labels; retained academic/team/source information and noted unresolved homepage-image attribution.
- [x] Clubs retains live search, region filtering, profile navigation and organizer/admin creation; adds request-generation/unmount guards, isolated load/create errors, retry/empty/loading states, photo fallbacks, pending-submit protection and form focus handling. No API/schema/auth/dependency changes.
- [x] About retains architecture/team, proposed roadmap and accessibility sections; flat layouts, linked tab/panel semantics and Arrow/Home/End keyboard navigation. Roadmap concepts and accessibility/deployment goals are not presented as shipped features or certifications.
- [x] Added 12 Footer + 19 Clubs + 26 About tests. Final full suite **251/251 across 15 files**, Vitest 2.1.9, 14.70s. Production/PWA build passed: Vite 5.4.21, 98 modules, 22.06s; JS 983.60 kB / 313.28 kB gzip, CSS 400.14 kB / 64.39 kB gzip, 12 precache entries (1876.10 KiB). Existing chunk warning persists. Six new/changed code/test files have clean diagnostics.
- [x] Reviewed supplied desktop dark-theme Clubs, footer and About screenshots: directory heading/filter/photo hierarchy, three footer columns/resources/team credits and About heading/context/tabs/team are visible without obvious overlap in the supplied frames. First Clubs frame is at 80% browser zoom; do not infer a size defect from cross-frame scale. A contrasting blank band before the footer remains visible as spacing between page and footer; no layout adjustment was requested.
- [ ] Remaining footer/Clubs/About QA: tablet/320px, light theme, keyboard/focus, footer/dock clearance, credits/install/reset, club filters/create/profile and About tabs. Screenshots are not direct interaction or live-backend validation.
- [x] User authorized sign-in and Join ApexGrid (registration) next. Redesigned `LoginView.vue` and `RegisterView.vue` with matching editorial split layouts, plain-language account copy, scoped responsive dark/light styles and no new assets/dependencies. Removed licence/sanctioning/telemetry/compliance claims.
- [x] Preserved login credentials/minimum length, protected-route notice, requested destination or post-auth role-home routing, all four seeded account quick-fills and reference details. Demo disclosure now starts closed; filling does not sign in. Preserved registration fields/defaults, member/organizer choices, exact payload, password rules and role-home routing. Local submission errors replace stale cross-page store errors; pending guards, error focus, inline confirmation feedback and post-unmount UI guards added. Auth store/backend/route guards unchanged.
- [x] Added 20 Login + 21 Register tests; full suite **292/292 across 17 files**, Vitest 2.1.9, 15.38s. Production/PWA build passed: Vite 5.4.21, 100 modules, 22.29s; JS 981.24 kB / 312.97 kB gzip, CSS 413.36 kB / 65.92 kB gzip; 12 precache entries (1886.67 KiB). Four code/spec files have clean diagnostics. Initial unsupported assertion helper corrected; see report DBG-11.
- [ ] Review sign-in/registration desktop/mobile in both themes, native validation, autofill, keyboard/error focus, demo quick-fill, mismatch correction, pending/error states, protected-event return and member/organizer destinations against the real backend.
- [ ] Audit/fix the same scoped `:global()` theme-selector pattern in earlier Home/Browse/Detail files. Navbar's old selector was replaced with safe theme selectors in this navbar slice; the remaining page files are untouched.
- [ ] Clarify and scope operational dashboard monitoring before changing dashboards.

Next action: Review the new sign-in (`/#/login`) and Join ApexGrid (`/#/register`) on desktop/mobile in both themes, including native validation/autofill, error/mismatch focus, demo quick-fill and actual authentication/navigation. Desktop dark-theme Clubs/footer/About screenshots reviewed; their other QA remains open. Club Detail was not redesigned. Keep navbar signed-in/mobile/light QA, earlier page QA, homepage-image attribution and the Home/Browse/Detail theme-selector follow-up open. Dashboard monitoring remains unscoped until clarified.

For future updates, record: date, files changed, decisions confirmed, outstanding assumptions/blockers, validation actually run, and the exact next action. Keep this section factual and concise.
