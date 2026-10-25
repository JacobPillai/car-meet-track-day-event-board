# ApexGrid Workspace Rules (`D:\ApexGrid`)

1. **Always Run Commands from `D:\ApexGrid`:** Set working directory to `D:\ApexGrid` when running `npm` or `git` commands for this project.
2. **Preserve Vitest UI & Payload Contracts (17 Spec Files / 293 Tests):**
   - In `src/views/LoginView.vue`: Do not introduce banned jargon (`/telemetry|sanctioned|paddock access|JWT|WCAG/i`) into the default visible text of `LoginView.vue`.
   - In `src/views/RegisterView.vue`: Keep the 8 default visible form controls (`#role-member`, `#role-organizer`, `#reg-name`, `#reg-region`, `#reg-email`, `#reg-password`, `#reg-confirm`, `#reg-bio`) and keep `authStore.register()` payload keys as `{ name, email, password, role, region, bio }`. Any extra helper tools (such as the NHTSA vehicle lookup) must remain inside a collapsed toggle (`v-if="showVehicleLookup"`).
   - In `src/components/EventCard.vue`: Preserve `aria-label` on the like button and existing card semantics tested by `tests/unit/EventCard.spec.js`.
3. **Swinburne Mercury & MySQL/MariaDB 5.5 Compatibility:**
   - Keep all PHP files in `api/*.php` compatible with PHP 5.4+ (use `array()`, `isset()`, and `ini_set('memory_limit', '16M')`).
   - Keep `database/schema.sql`, `database/seed.sql`, `src/data/seedData.js`, `api/index.php`, and `src/services/localDb.js` synchronized whenever modifying tables or endpoints.
