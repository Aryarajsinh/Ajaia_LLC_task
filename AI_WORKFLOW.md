# AI-Native Workflow Note

## 1. AI Tools Used
- **LLM Architecture & Code Co-Generation (Gemini / Claude / Cursor):** Used for rapid schema prototyping, Express endpoint scaffolding, file parser integration (`mammoth` + `marked`), and generating the automated integration test suite.

## 2. Where AI Materially Accelerated Execution
1. **Boilerplate Compression (~60 mins saved):** Generated the Express REST routes, relational data model initialization, and modal UI states in minutes rather than wiring CRUD handlers manually.
2. **Multi-Format File Ingestion (~30 mins saved):** Rapidly synthesized the buffer parsing pipeline for `.txt`, `.md`, and `.docx` files, including dual-mode support (create new doc vs. append to existing draft).
3. **Test Suite Scaffolding (~25 mins saved):** Generated the initial integration test cases covering document creation, unauthorized `403` rejection, and role-based sharing.

## 3. What AI Output I Changed or Rejected
1. **Rejected Native C++ Addons & Heavy External Auth Dependencies:**
   - *AI Suggestion:* Initially proposed a multi-service NextAuth + external Postgres/native C++ SQLite setup requiring `.env` secrets and `node-gyp` build tools.
   - *My Override:* Replaced it with an atomic, pure-JS relational store (`data/ajaia_db.json`) with automatic startup seeding and a 1-click **Persona Switcher** in the navbar. This guarantees reviewers can run `npm install && npm start` on any OS or deploy to Render in 1 click without build failures.
2. **Fixed Access Control Edge Cases:**
   - *AI Suggestion:* Initial AI route draft only checked if a share record existed before allowing `PUT /api/documents/:id`, which would have allowed `view`-only users to overwrite document content via API calls.
   - *My Override:* Implemented `getDocumentAccess(db, docId, userId)` and explicitly enforced `role === 'owner' || role === 'edit'` on both `PUT /api/documents/:id` and `POST /api/upload` (when appending to an existing document), verified by an automated test.
3. **Refined File Upload Product Behavior:**
   - *AI Suggestion:* Suggested storing uploaded files as static download links attached to a document.
   - *My Override:* Changed file upload to parse `.md`, `.txt`, and `.docx` files directly into editable rich-text HTML (either as a new document or appended into the current draft), which is far more useful in a document editor workflow.

## 4. How I Verified Correctness, UX Quality, and Reliability
- **Automated Boundary Testing:** Ran `npm test` (`server.test.js`) using Node's native test runner to verify `201` creation, `403` unauthorized read/write blocks, `view` vs. `edit` enforcement, and `.md` file upload conversion.
- **Persona Walkthrough Testing:** Switched across `Aryarajsinh (Owner)`, `Sarah (Can Edit)`, and `Alex (View Only)` in the browser, refreshed the page at each step to confirm persistence, and verified that read-only users see the lock banner with editing disabled.
