# Submission Manifest — HARMA ARYARAJSINH

- **Candidate:** Aryarajsinh Harma (`harmaaryarajsinh2003@gmail.com`)
- **Role:** AI-Native Full Stack Product Engineer (Ajaia LLC)
- **Live Deployed Application URL:** [INSERT_YOUR_RENDER_URL_HERE]
- **Walkthrough Video URL (3–5 min):** [INSERT_YOUR_VIDEO_URL_HERE]
- **Google Drive Folder URL:** [INSERT_YOUR_GOOGLE_DRIVE_FOLDER_URL_HERE]

## Included Deliverables in This Folder
1. **`server.js` & `public/index.html`:** Complete full stack Node.js + Express + Rich-Text Editor application.
2. **`server.test.js`:** Automated integration test suite (`npm test`).
3. **`README.md`:** Local setup instructions, seeded user personas, and feature overview.
4. **`ARCHITECTURE.md`:** Architecture decisions, scope prioritization, and deliberate tradeoffs.
5. **`AI_WORKFLOW.md`:** Detailed breakdown of AI leverage, rejected/modified AI outputs, and verification steps.
6. **`SUBMISSION.md`:** This manifest and feature status summary.
7. **`WALKTHROUGH_VIDEO.txt`:** Direct link to the 3–5 minute video walkthrough.
8. **`sample-import-spec.md`:** Sample Markdown file to test the 1-click file upload & conversion workflow.

## Feature Completeness Matrix
| Requirement | Status | Notes |
| :--- | :--- | :--- |
| **Create, Rename, Edit, Save & Reopen Docs** | ✅ Complete | Auto-saves on typing (700ms debounce) + manual Save button + persistent storage across refreshes. |
| **Rich-Text Formatting** | ✅ Complete | Bold, Italic, Underline, H1/H2/H3/Body, Bullet Lists, Numbered Lists, Clear Formatting. |
| **File Upload Workflow** | ✅ Complete | Supports `.txt`, `.md`, and `.docx` (up to 5MB). Can create a new editable doc or append to current draft. |
| **Sharing & Ownership Model** | ✅ Complete | Distinct "My Documents" vs. "Shared With Me" sections; Owner can grant/revoke `Can Edit` or `View Only` roles. |
| **Persistence** | ✅ Complete | Transactional persistence (`users`, `documents`, `document_shares`) with automatic initial seed data. |
| **Engineering Quality & Automated Tests** | ✅ Complete | Input/file validation, role-based API guards, and automated test suite (`npm test`). |
| **Optional Stretch Included** | ✅ Complete | Role-based sharing permissions (`Can Edit` vs. `View Only`) + HTML export + Dual-mode file import. |

## What I Would Build Next With Another 2–4 Hours
- **Real-Time Multi-Cursor Collaboration:** WebSocket/Yjs presence indicators showing active collaborators in real time.
- **Version History & Restore:** Point-in-time document snapshots with visual diffing.
- **Inline Comments & AI Rewrite:** Highlight text to leave a comment thread or trigger an LLM rewrite.
