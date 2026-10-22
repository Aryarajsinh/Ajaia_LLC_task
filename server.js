const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- PERSISTENCE LAYER (Atomic JSON File Store for 100% Cross-Platform & Render Compatibility) ---
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = process.env.NODE_ENV === 'test'
  ? path.join(DATA_DIR, 'test_db.json')
  : path.join(DATA_DIR, 'ajaia_db.json');

const INITIAL_SEED = {
  users: [
    {
      id: 'user-1',
      name: 'Aryarajsinh Harma',
      email: 'harmaaryarajsinh2003@gmail.com',
      role_title: 'Full Stack Product Engineer',
      avatar_color: '#4F46E5'
    },
    {
      id: 'user-2',
      name: 'Sarah Chen',
      email: 'sarah@ajaia.com',
      role_title: 'Head of Product',
      avatar_color: '#059669'
    },
    {
      id: 'user-3',
      name: 'Alex Rivera',
      email: 'alex@ajaia.com',
      role_title: 'Staff AI Engineer',
      avatar_color: '#D97706'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      title: 'Ajaia Q4 AI Product Roadmap',
      content: '<h1>Ajaia Q4 AI Product Roadmap</h1><p>Welcome to <strong>Ajaia Docs</strong> — a lightweight, AI-native collaborative workspace built for rapid product execution.</p><h2>Core Priorities</h2><ul><li><strong>Real-time Document Workflows:</strong> Fast rich-text editing with zero-friction persistence.</li><li><strong>Seamless File Ingestion:</strong> Upload <u>.md</u>, <u>.txt</u>, or <u>.docx</u> files directly into structured drafts.</li><li><strong>Granular Access Control:</strong> Share documents across team members with <em>Edit</em> or <em>View-Only</em> permissions.</li></ul><h2>Next Steps</h2><ol><li>Review architecture tradeoffs in the sidebar.</li><li>Switch between seeded team accounts in the top navigation bar to test sharing permissions.</li><li>Try uploading a local Markdown or Word document!</li></ol>',
      owner_id: 'user-1',
      source_file_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'doc-2',
      title: 'Engineering Architecture RFC: Agentic Workflows',
      content: '<h1>Engineering Architecture RFC</h1><p>Authored by <strong>Sarah Chen</strong> and shared with Aryarajsinh for technical review.</p><h2>1. Context</h2><p>We need a resilient orchestration layer that combines deterministic validation with LLM-assisted synthesis.</p><h2>2. Proposed Guardrails</h2><ul><li>Strict schema validation on all API boundaries</li><li>Role-based access control at the persistence layer</li></ul>',
      owner_id: 'user-2',
      source_file_name: 'architecture-rfc.md',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  document_shares: [
    { id: 1, document_id: 'doc-1', user_id: 'user-2', permission: 'edit', created_at: new Date().toISOString() },
    { id: 2, document_id: 'doc-1', user_id: 'user-3', permission: 'view', created_at: new Date().toISOString() },
    { id: 3, document_id: 'doc-2', user_id: 'user-1', permission: 'edit', created_at: new Date().toISOString() }
  ]
};

function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_SEED, null, 2), 'utf-8');
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function resetDbForTests() {
  saveDb(JSON.parse(JSON.stringify(INITIAL_SEED)));
}

// Ensure DB is initialized on startup
loadDb();

// Helper: Get current user from header (defaults to user-1)
function getCurrentUserId(req) {
  return req.headers['x-user-id'] || 'user-1';
}

// Helper: Check user permission on a document
function getDocumentAccess(db, docId, userId) {
  const doc = db.documents.find(d => d.id === docId);
  if (!doc) return { doc: null, role: null };
  if (doc.owner_id === userId) return { doc, role: 'owner' };

  const share = db.document_shares.find(
    s => s.document_id === docId && s.user_id === userId
  );
  return { doc, role: share ? share.permission : null };
}

// --- API ROUTES ---

// Health check for Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ajaia-docs', timestamp: new Date().toISOString() });
});

// 1. Get all seeded users
app.get('/api/users', (req, res) => {
  const db = loadDb();
  res.json({ users: db.users });
});

// 2. List documents accessible to current user (Owned vs Shared)
app.get('/api/documents', (req, res) => {
  const db = loadDb();
  const userId = getCurrentUserId(req);

  const owned = db.documents
    .filter(d => d.owner_id === userId)
    .map(d => {
      const owner = db.users.find(u => u.id === d.owner_id) || {};
      const shareCount = db.document_shares.filter(s => s.document_id === d.id).length;
      return {
        ...d,
        owner_name: owner.name,
        owner_email: owner.email,
        access_role: 'owner',
        share_count: shareCount
      };
    })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  const shared = db.document_shares
    .filter(s => s.user_id === userId)
    .map(s => {
      const d = db.documents.find(doc => doc.id === s.document_id);
      if (!d) return null;
      const owner = db.users.find(u => u.id === d.owner_id) || {};
      const shareCount = db.document_shares.filter(sh => sh.document_id === d.id).length;
      return {
        ...d,
        owner_name: owner.name,
        owner_email: owner.email,
        access_role: s.permission,
        share_count: shareCount
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  res.json({ owned, shared });
});

// 3. Get single document with sharing metadata
app.get('/api/documents/:id', (req, res) => {
  const db = loadDb();
  const userId = getCurrentUserId(req);
  const { doc, role } = getDocumentAccess(db, req.params.id, userId);

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (!role) return res.status(403).json({ error: 'Access denied. You do not have permission to view this document.' });

  const owner = db.users.find(u => u.id === doc.owner_id);
  const shares = db.document_shares
    .filter(s => s.document_id === doc.id)
    .map(s => {
      const u = db.users.find(usr => usr.id === s.user_id) || {};
      return {
        user_id: s.user_id,
        permission: s.permission,
        name: u.name,
        email: u.email,
        avatar_color: u.avatar_color,
        role_title: u.role_title
      };
    });

  res.json({
    ...doc,
    access_role: role,
    owner,
    shares
  });
});

// 4. Create new document
app.post('/api/documents', (req, res) => {
  const db = loadDb();
  const userId = getCurrentUserId(req);
  const title = (req.body.title !== undefined ? req.body.title : 'Untitled Document').trim();
  const content = req.body.content !== undefined ? req.body.content : '<h1>Untitled Document</h1><p>Start typing here...</p>';
  const sourceFileName = req.body.source_file_name || null;

  if (!title || title.length > 200) {
    return res.status(400).json({ error: 'Document title is required and must be under 200 characters.' });
  }

  const newDoc = {
    id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    title,
    content,
    owner_id: userId,
    source_file_name: sourceFileName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.documents.push(newDoc);
  saveDb(db);

  res.status(201).json({ ...newDoc, access_role: 'owner', shares: [] });
});

// 5. Update document (Rename or Edit Content)
app.put('/api/documents/:id', (req, res) => {
  const db = loadDb();
  const userId = getCurrentUserId(req);
  const { doc, role } = getDocumentAccess(db, req.params.id, userId);

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (!role || role === 'view') {
    return res.status(403).json({ error: 'Read-only access: You do not have permission to edit this document.' });
  }

  const newTitle = req.body.title !== undefined ? req.body.title.trim() : doc.title;
  const newContent = req.body.content !== undefined ? req.body.content : doc.content;

  if (!newTitle) {
    return res.status(400).json({ error: 'Document title cannot be empty.' });
  }

  doc.title = newTitle;
  doc.content = newContent;
  doc.updated_at = new Date().toISOString();
  saveDb(db);

  res.json({ ...doc, access_role: role });
});

// 6. Delete document (Owner only)
app.delete('/api/documents/:id', (req, res) => {
  const db = loadDb();
  const userId = getCurrentUserId(req);
  const { doc, role } = getDocumentAccess(db, req.params.id, userId);

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (role !== 'owner') {
    return res.status(403).json({ error: 'Only the document owner can delete this document.' });
  }

  db.documents = db.documents.filter(d => d.id !== doc.id);
  db.document_shares = db.document_shares.filter(s => s.document_id !== doc.id);
  saveDb(db);

  res.json({ success: true });
});

// 7. Share document with another user (Owner only)
app.post('/api/documents/:id/share', (req, res) => {
  const db = loadDb();
  const userId = getCurrentUserId(req);
  const { doc, role } = getDocumentAccess(db, req.params.id, userId);

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (role !== 'owner') {
    return res.status(403).json({ error: 'Only the document owner can manage sharing permissions.' });
  }

  const { targetUserId, permission } = req.body;
  if (!targetUserId || !['view', 'edit'].includes(permission)) {
    return res.status(400).json({ error: 'Valid targetUserId and permission ("view" or "edit") are required.' });
  }
  if (targetUserId === doc.owner_id) {
    return res.status(400).json({ error: 'Cannot share a document with its owner.' });
  }

  const targetUser = db.users.find(u => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found.' });
  }

  const existingShare = db.document_shares.find(
    s => s.document_id === doc.id && s.user_id === targetUserId
  );

  if (existingShare) {
    existingShare.permission = permission;
  } else {
    db.document_shares.push({
      id: Date.now(),
      document_id: doc.id,
      user_id: targetUserId,
      permission,
      created_at: new Date().toISOString()
    });
  }

  saveDb(db);

  const shares = db.document_shares
    .filter(s => s.document_id === doc.id)
    .map(s => {
      const u = db.users.find(usr => usr.id === s.user_id) || {};
      return {
        user_id: s.user_id,
        permission: s.permission,
        name: u.name,
        email: u.email,
        avatar_color: u.avatar_color,
        role_title: u.role_title
      };
    });

  res.json({ shares });
});

// 8. Revoke share access (Owner only)
app.delete('/api/documents/:id/share/:targetUserId', (req, res) => {
  const db = loadDb();
  const userId = getCurrentUserId(req);
  const { doc, role } = getDocumentAccess(db, req.params.id, userId);

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (role !== 'owner') {
    return res.status(403).json({ error: 'Only the document owner can revoke access.' });
  }

  db.document_shares = db.document_shares.filter(
    s => !(s.document_id === doc.id && s.user_id === req.params.targetUserId)
  );
  saveDb(db);

  const shares = db.document_shares
    .filter(s => s.document_id === doc.id)
    .map(s => {
      const u = db.users.find(usr => usr.id === s.user_id) || {};
      return {
        user_id: s.user_id,
        permission: s.permission,
        name: u.name,
        email: u.email,
        avatar_color: u.avatar_color,
        role_title: u.role_title
      };
    });

  res.json({ shares });
});

// 9. File Upload (.txt, .md, .docx) -> Convert to New Document or Import into Existing Document
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const db = loadDb();
    const userId = getCurrentUserId(req);
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided.' });
    }

    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    const allowed = ['.txt', '.md', '.docx'];

    if (!allowed.includes(ext)) {
      return res.status(400).json({
        error: `Unsupported file type (${ext}). Supported formats: .txt, .md, .docx`
      });
    }

    let htmlContent = '';
    if (ext === '.txt') {
      const rawText = req.file.buffer.toString('utf-8');
      htmlContent = rawText
        .split(/\r?\n\r?\n/)
        .map(para => `<p>${para.replace(/\r?\n/g, '<br/>')}</p>`)
        .join('');
    } else if (ext === '.md') {
      const rawMd = req.file.buffer.toString('utf-8');
      htmlContent = marked.parse(rawMd);
    } else if (ext === '.docx') {
      const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
      htmlContent = result.value || '<p>(Empty Word document)</p>';
    }

    const mode = req.body.mode || 'new'; // 'new' or 'append'
    const targetDocId = req.body.documentId;

    if (mode === 'append' && targetDocId) {
      const { doc, role } = getDocumentAccess(db, targetDocId, userId);
      if (!doc) return res.status(404).json({ error: 'Target document not found.' });
      if (!role || role === 'view') {
        return res.status(403).json({ error: 'You do not have edit permission to import into this document.' });
      }
      doc.content = `${doc.content}<hr/><p><em>Imported from ${originalName}:</em></p>${htmlContent}`;
      doc.updated_at = new Date().toISOString();
      saveDb(db);
      return res.json({ document: { ...doc, access_role: role }, mode: 'append' });
    }

    const cleanTitle = path.basename(originalName, ext).replace(/[-_]/g, ' ');
    const newDoc = {
      id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: cleanTitle,
      content: htmlContent,
      owner_id: userId,
      source_file_name: originalName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.documents.push(newDoc);
    saveDb(db);

    res.status(201).json({ document: { ...newDoc, access_role: 'owner', shares: [] }, mode: 'new' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process uploaded file.' });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Ajaia Docs running at http://localhost:${PORT}`);
  });
}

module.exports = { app, resetDbForTests };
