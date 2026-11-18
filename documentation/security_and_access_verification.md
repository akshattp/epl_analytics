# EPL v1.2 – Security & Access Control Verification Report

**Audit Date:** November 18, 2026  
**Methodology:** Live HTTP & WebSocket red-team probing followed by remediation and automated regression testing ([test_v1_2_acceptance_rehearsal.py](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/tests/test_v1_2_acceptance_rehearsal.py)).

---

## 1. Vulnerabilities Discovered During v1.2 Red-Team & Resolved

| ID | Severity | Vulnerability Found | Fix Implemented | Retest Status |
| :--- | :---: | :--- | :--- | :---: |
| **BUG-SEC-01** | **CRITICAL** | Unauthenticated users and rival franchise owners could read, write, and delete another owner's private shortlist (`/api/auction/shortlists/*`) and read rival private dashboards (`/api/auction/dashboard/{team_id}`). | Enforced mandatory Bearer token auth and strict `user.team_id == team_id` isolation in `backend/routers/auction.py`. Private shortlists are strictly restricted to their owning franchise (even Auctioneer receives `403`). | **VERIFIED** |
| **BUG-SEC-02** | **CRITICAL** | `POST /api/auction/admin/reset` had no authentication check, allowing any unauthenticated client or losing owner to wipe the live auction database. | Restricted unconditionally to authenticated `auctioneer` role Bearer tokens (`401` unauthenticated, `403` franchise owner). | **VERIFIED** |
| **BUG-SEC-03** | **HIGH** | `POST /api/advanced/fielding/manual` only validated role if an `Authorization` header was supplied, allowing unauthenticated writes. | Enforced mandatory `auctioneer` Bearer token unconditionally (`401` unauthenticated, `403` non-auctioneer). | **VERIFIED** |
| **BUG-SEC-04** | **HIGH** | `GET /api/auth/accounts` exposed plaintext `"default_pin"` credentials for the Auctioneer and all 6 owners. | Stripped `default_pin` from `/api/auth/accounts`; upgraded `/auction` and `/shortlists` UI to real `<input type="password" />` sign-in forms storing only session tokens in `localStorage`. | **VERIFIED** |

---

## 2. Final Access Control Verification Matrix

| Endpoint / Channel | Unauthenticated | Rival Owner | Own Franchise Owner | Official Auctioneer | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `GET /api/auth/accounts` (No PINs leaked) | `200` (metadata only) | `200` | `200` | `200` | **VERIFIED** |
| `POST /api/auth/login` (6 Owners + Auctioneer) | `200` valid / `401` invalid | — | `200` | `200` | **VERIFIED** |
| `GET /api/auction/shortlists/{team_id}` | `401` | `403` | `200` | `403` (Private) | **VERIFIED** |
| `POST /api/auction/shortlists` | `401` | `403` | `200` | `403` (Private) | **VERIFIED** |
| `DELETE /api/auction/shortlists/{id}` | `401` | `403` | `200` | `403` (Private) | **VERIFIED** |
| `GET /api/auction/dashboard/{team_id}` | `401` | `403` | `200` | `200` (Overview) | **VERIFIED** |
| `PUT /api/auction/config` & `/teams/{id}` | `401` | `403` | `403` | `200` (while unlocked) | **VERIFIED** |
| `POST /api/auction/lifecycle/start|pause|resume` | `401` | `403` | `403` | `200` | **VERIFIED** |
| `POST /api/auction/admin/reset` | `401` | `403` | `403` | `200` | **VERIFIED** |
| `POST /api/advanced/fielding/manual` | `401` | `403` | `403` | `200` | **VERIFIED** |
| `WS /api/auction/ws` `NOMINATE` / `SOLD` / `UNSOLD` | `AUTH_ERROR` | `AUTH_ERROR` | `AUTH_ERROR` | Allowed | **VERIFIED** |
| `WS /api/auction/ws` `BID` (Own vs Rival Team ID) | `AUTH_ERROR` | `AUTH_ERROR` (`Identity violation`) | Allowed (Own ID) | Allowed | **VERIFIED** |
| Public Profile `/players/EPL-P-001?public=1` | Read-only stats only | Read-only stats only | Read-only stats only | Read-only stats only | **VERIFIED** |

---

## 3. Residual Security Limitations (Local LAN Deployment)
- **Transport Encryption (TLS)**: On local Wi-Fi (`http://` / `ws://`), tokens travel over the local LAN unencrypted unless fronted by an HTTPS reverse proxy (e.g., Caddy / Nginx / Cloudflare Tunnel). Classified as **VERIFIED WITH LIMITATIONS** for public internet deployment; fully adequate on a trusted private residential Wi-Fi network.
- **Default Passwords**: Before a real live auction, the auctioneer should rotate default owner PINs directly in the `users` table (PBKDF2-HMAC-SHA256) so owners cannot guess peers' PIN patterns.
