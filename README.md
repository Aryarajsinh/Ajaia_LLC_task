# Ajaia Docs — Lightweight Collaborative Document Editor

A fast, pragmatic, full stack document workspace built for the **Ajaia AI-Native Full Stack Product Engineer Assessment**.

## Live Deployment & Walkthrough
- **Live URL:** [INSERT_YOUR_RENDER_URL_HERE]
- **Walkthrough Video:** See `WALKTHROUGH_VIDEO.txt`

## Core Capabilities Implemented
1. **Document Creation & Rich-Text Editing**
   - Create, rename, edit, auto-save (700ms debounce), manual save, delete, and reopen documents.
   - Rich-text formatting toolbar supporting **Bold**, *Italic*, <u>Underline</u>, Headings (`H1`, `H2`, `H3`, `Body`), Bulleted Lists, Numbered Lists, and Clear Formatting.
2. **Dual-Mode File Upload (`.md`, `.txt`, `.docx`)**
   - **Mode A — New Document from File:** Upload a `.md`, `.txt`, or `.docx` file (up to 5MB) and automatically parse it into a rich-text editable document (Markdown via `marked`, Word `.docx` via `mammoth`, plain text paragraph conversion).
   - **Mode B — Import into Active Draft:** Append the formatted contents of an uploaded file directly into an existing document.
   - Includes a sample file (`sample-import-spec.md`) in the repo for quick testing!
3. **Role-Based Sharing & 1-Click Account Switcher**
   - Clear separation in the sidebar between **"My Documents (Owned)"** and **"Shared With Me"**.
   - Owners can grant or revoke access to other team members with **Can Edit (`edit`)** or **View Only (`view`)** permissions.
   - **Zero-Friction Evaluation:** Includes an instant **Active User Switcher** in the top navigation bar pre-seeded with 3 team personas so reviewers can test multi-user sharing and read-only enforcement in one click without login friction.
4. **Transactional File Persistence**
   - Persists `users`, `documents`, and `document_shares` across refreshes and restarts (`data/ajaia_db.json`) with automatic startup seeding and zero native C++ build dependencies.
5. **Automated Integration Tests**
   - End-to-end API & authorization tests (`server.test.js`) using Node's native test runner (`npm test`).

## Seeded Test Accounts (Available via Top Navbar Dropdown)
| User ID | Name | Email | Role | Pre-Seeded Access |
| :--- | :--- | :--- | :--- | :--- |
| `user-1` | **Aryarajsinh Harma** | `harmaaryarajsinh2003@gmail.com` | Full Stack Product Engineer | Owns *Ajaia Q4 AI Product Roadmap*; Can Edit *Engineering Architecture RFC* |
| `user-2` | **Sarah Chen** | `sarah@ajaia.com` | Head of Product | Owns *Engineering Architecture RFC*; Can Edit *Ajaia Q4 AI Product Roadmap* |
| `user-3` | **Alex Rivera** | `alex@ajaia.com` | Staff AI Engineer | View-Only access on *Ajaia Q4 AI Product Roadmap* |

## Local Setup & Run Instructions (Under 30 Seconds)

### Prerequisites
- Node.js 18+ and npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
npm start
```
Open **`http://localhost:3000`** in your browser.

### 3. Run Automated Tests
```bash
npm test
```
