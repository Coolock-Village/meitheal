# Changelog

## [0.1.60] — 2026-03-05

### Changed
- Phase 58: DDD CSS Architecture extraction (single `global.css` split into 14 domain partials)
- Accessibility: Enhanced Touch target visibility for `.bento-card-actions`
- Fixed HA Ingress FOUC (Flash of Unstyled Content) by moving class injection to the Astro Locals edge
- Dark mode: Migrated toast notifications to semantic CSS variables
- Hardened Modals with solid backwards-compatible backdrop filters

## [0.1.0] — 2026-03-01

### Added
- Initial release of Meitheal Hub as a Home Assistant add-on
- Astro SSR with Node adapter for HA runtime
- DDD monorepo with 5 bounded contexts
- SQLite + libsql persistence with migration pipeline
- HA OS add-on with ingress authentication
- Vikunja-compatible API (7 routes)
- Calendar sync via HA service calls
- PWA with offline-first architecture
- Kanban / List / Table / Calendar / Today / Upcoming views
- Strategic Lens framework evaluation (RICE, DRICE, HEART, KCS, DDD)
- Multi-language support (English + Irish)
- CSV/JSON task export + raw DB download
- Settings import/export for portability
- Structured JSON logging with redaction
- A2A / MCP / WebMCP agent protocol support
- Custom confirm dialogs with keyboard navigation
- Icon component system for consistent UI
