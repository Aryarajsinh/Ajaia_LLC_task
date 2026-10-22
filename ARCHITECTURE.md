# Architecture & Product Prioritization Note

## 1. Product Philosophy & Scope Strategy
The objective was to deliver a cohesive, reliable collaborative document editor within a strict 4-hour timebox. Rather than building shallow placeholders for dozens of Google Docs features, I optimized for **depth and polish across the four core product loops**:
1. **Authoring Loop:** Instant document creation, debounced auto-save, and clean HTML rich-text serialization.
2. **Ingestion Loop:** High-utility file upload supporting both creating a new document from `.md`/`.txt`/`.docx` and importing a file into an active draft.
3. **Collaboration & Governance Loop:** Explicit ownership (`owner_id`) and role-based sharing (`edit` vs. `view`) enforced both in the UI and at the API persistence boundary.
4. **Reviewer Ergonomics:** A 1-click **Active User Switcher** in the top navigation bar so reviewers can verify multi-user permissions in seconds without creating test emails or juggling incognito windows.

## 2. System Architecture
- **Backend (`server.js`):** Node.js + Express REST API handling user context (`x-user-id`), document CRUD, sharing ACL mutations, and multipart file ingestion (`multer`, `marked`, `mammoth`).
- **Persistence Layer (`data/ajaia_db.json`):** Normalized relational collections (`users`, `documents`, `document_shares`) with atomic disk writes and automatic startup seeding. Using pure JavaScript persistence guarantees 100% zero-config portability across Windows, macOS, Linux, and Render.com containers without native C++ compilation failures.
- **Frontend (`public/index.html`):** Single-page reactive workspace with separated "My Documents" vs. "Shared With Me" navigation, formatting toolbar, auto-save status indicator, and contextual read-only banners.

## 3. Deliberate Tradeoffs & What Was Deprioritized
| Decision | Why We Chose It (4-Hour Constraint) | What We Deprioritized |
| :--- | :--- | :--- |
| **Seeded Persona Switcher vs. Full OAuth/JWT** | Lets reviewers immediately test `Owner`, `Can Edit`, and `View Only` states across 3 users with zero signup friction. | Full OAuth2/magic-link email flows and password reset screens. |
| **Debounced Auto-Save REST PUT vs. WebSockets CRDT (Yjs)** | Last-write-wins auto-save (700ms debounce) + manual save covers 95% of async team collaboration with zero infrastructure complexity. | Sub-second multi-cursor operational transformation / Yjs WebSocket server. |
| **Server-Side File Conversion (`.md`, `.txt`, `.docx`)** | Converting uploaded files into editable rich-text HTML makes uploads immediately actionable inside the editor rather than static dead attachments. | Binary image/PDF blob storage in S3. |

## 4. What I Would Build Next (With Another 2–4 Hours)
1. **Real-Time Presence & Cursor Sync:** Integrate Yjs + WebSockets (`y-websocket`) for live multi-cursor editing and active viewer avatars.
2. **Document Version History:** Add a `document_versions` snapshot table triggered on save milestones with 1-click diff and restore.
3. **Inline AI Assistant & Commenting:** Add text-selection commenting and an inline AI command palette (summarize, action items, tone rewrite).
