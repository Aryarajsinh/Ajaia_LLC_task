const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { app, resetDbForTests } = require('./server.js');

let server;
let baseUrl;
let createdDocId;

describe('Ajaia Docs Full Stack API & Role-Based Access Control Suite', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    resetDbForTests();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('1. creates a new document owned by user-1 and persists rich-text HTML', async () => {
    const res = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1'
      },
      body: JSON.stringify({
        title: 'Sprint Planning Spec',
        content: '<h1>Sprint Goals</h1><ul><li>Ship MVP</li></ul>'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.title, 'Sprint Planning Spec');
    assert.strictEqual(data.owner_id, 'user-1');
    createdDocId = data.id;
  });

  it('2. blocks unauthorized user-3 from viewing an unshared document (403)', async () => {
    const res = await fetch(`${baseUrl}/api/documents/${createdDocId}`, {
      headers: { 'x-user-id': 'user-3' }
    });
    assert.strictEqual(res.status, 403);
  });

  it('3. allows owner (user-1) to share document with user-3 as view-only and blocks edit attempts', async () => {
    const shareRes = await fetch(`${baseUrl}/api/documents/${createdDocId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-1'
      },
      body: JSON.stringify({ targetUserId: 'user-3', permission: 'view' })
    });
    assert.strictEqual(shareRes.status, 200);

    // user-3 can now view
    const viewRes = await fetch(`${baseUrl}/api/documents/${createdDocId}`, {
      headers: { 'x-user-id': 'user-3' }
    });
    const viewData = await viewRes.json();
    assert.strictEqual(viewRes.status, 200);
    assert.strictEqual(viewData.access_role, 'view');

    // user-3 CANNOT edit
    const editRes = await fetch(`${baseUrl}/api/documents/${createdDocId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-3'
      },
      body: JSON.stringify({ title: 'Unauthorized Rename' })
    });
    assert.strictEqual(editRes.status, 403);
  });

  it('4. converts an uploaded .md file into a formatted HTML document', async () => {
    const formData = new FormData();
    const mdBlob = new Blob(['# Product Launch\n\n- **Bold item**\n- *Italic item*'], { type: 'text/markdown' });
    formData.append('file', mdBlob, 'launch-plan.md');
    formData.append('mode', 'new');

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'x-user-id': 'user-1' },
      body: formData
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.document.title, 'launch plan');
    assert.ok(data.document.content.includes('<h1>Product Launch</h1>'));
    assert.strictEqual(data.document.source_file_name, 'launch-plan.md');
  });
});
