# EPL Platform Release Register & Governance Index

**Governing Standard:** IEEE 829 Software Release Documentation Standard & SemVer 2.0.0  
**Current Release Status:** `2.1-dev` (Sprint Active)  
**Permanent Rule:** Every code modification must map to a tracked release register entry.

---

## 1. Master Release Register

| Release ID | SemVer Tag | Codename | Date | Author / Lead | Verification Gate |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **REL-010** | **`2.1-dev`** | Four-Tier Player Intelligence & Premium Auction Portal | 2026-11-21 | Cricket Data Scientist, Principal UI/UX Architect & Lead Full-Stack Engineer | 90 Backend Tests (100%), Next.js Build 27/27 Routes, 73-Player 4-Tier Leaderboard Verification, PBKDF2 RBAC Audit |
| **REL-009** | `2.0.1-dev` | Luxury Creative Direction & 3D WebGL Transformation | 2026-11-19 | Creative Director, Principal UI/UX Architect & Lead Engineer | 79 Backend Tests (100%), Next.js Build 21/21 Routes, 73-Player Classification Audit, 10 Viewport Screenshot Suite |
| **REL-008** | `2.0.0` | Signature Design Experience | 2026-11-19 | Creative Director & Frontend Lead | 69 Backend Tests, 21 Routes, 6 Viewport Screenshots |
| **REL-007** | `1.5.0` | Global Dual-Theme Redesign | 2026-11-19 | Frontend Architect | 55 Backend Tests, 19 Compiled Routes |
| **REL-006** | `1.4.0` | Premium Dark UI Modernization | 2026-11-19 | Senior Product Designer | 55 Backend Tests, Route Health Checks |
| **REL-005** | `1.3.0` | Advanced Cricket Analytics Engine | 2026-11-19 | Sports Analytics Lead | 69 Unit & API Tests |
| **REL-004** | `1.2.0` | System Acceptance & Concurrency Hardening | 2026-11-18 | Security Architect & QA Lead | 55 Pytests, WebSocket Concurrency Tests |
| **REL-003** | `1.1.0` | Advanced Analytics & Auction Lifecycle | 2026-11-18 | Full-Stack Architect | 55 Pytests, PDF Chromium Exports |
| **REL-002** | `1.0.2` | Phase 2 Verification & Live Auction | 2026-11-17 | Security Architect | 36 Pytests, Role Isolation Audit |
| **REL-001** | `1.0.0` | Initial Delivery & Scorecard Extraction | 2026-11-17 | Extraction & Data Engineer | 18 Baseline Pytests |

---

## 2. Release Categorization Rules

* **MAJOR (`X.0.0`)**: Comprehensive design system, brand identity, or core architecture overhauls (e.g. v2.0.0).
* **MINOR (`x.Y.0`)**: Backwards-compatible analytical models, new dashboards, or auction workflows (e.g. v1.1.0, v1.3.0).
* **PATCH (`x.y.Z`)**: Bug fixes, statistical reconciliation, and visual refinements (e.g. v1.0.1, v2.0.1).
* **DEVELOPMENT (`x.y.z-dev`)**: Active development branches or unreleased staging modifications. Must never be labeled official release until all QA criteria pass.

---

## 3. Mandatory Pre-Release Verification Checklist

Prior to promoting any development build to an official release:
1. `tests/` automated test suite must run with 100% pass rate.
2. `frontend/` production build (`npm run build`) must compile all routes with 0 errors.
3. Database row counts must reconcile exactly with ground-truth records (27 matches, 56 innings, 73 players).
4. All modified files must be recorded in `CHANGELOG.md` and `RELEASE_REGISTER.md`.
5. Visual verification screenshots must be refreshed in `documentation/screenshots/`.
