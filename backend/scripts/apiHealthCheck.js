const http = require('http');
const { io: ioClient } = require('socket.io-client');

const HOST = process.env.HEALTH_HOST || 'http://localhost:5000';

let pass = 0;
let fail = 0;
const log = (...args) => console.log(...args);

function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    log(`  PASS  ${name}${detail ? '  ' + detail : ''}`);
  } else {
    fail++;
    log(`  FAIL  ${name}${detail ? '  ' + detail : ''}`);
  }
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(HOST + path);
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': data.length } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let body = null;
        try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}


async function run() {
  const stamp = Date.now().toString(36).slice(-6);
  const a = {
    name: 'Health A',
    username: `hca_${stamp}`,
    email: `hca_${stamp}@test.com`,
    password: 'pass1234',
  };
  const b = {
    name: 'Health B',
    username: `hcb_${stamp}`,
    email: `hcb_${stamp}@test.com`,
    password: 'pass1234',
  };

  log('================================================================');
  log(' Vibe API Health Check');
  log('================================================================');
  log(' Target:', HOST);
  log('');

  log('[1] Health endpoint');
  let r = await request('GET', '/api/health');
  check('GET /api/health returns 200', r.status === 200, `status=${r.status}`);
  check('  reports db=connected', r.body?.db === 'connected', `db=${r.body?.db}`);

  log('\n[2] Auth: register');
  r = await request('POST', '/api/auth/register', a);
  check('register user A returns 201', r.status === 201, `status=${r.status}`);
  a.token = r.body?.token;
  a.id = r.body?.user?._id;
  check('  user A token issued', Boolean(a.token));
  check('  user A id present', Boolean(a.id));

  r = await request('POST', '/api/auth/register', b);
  check('register user B returns 201', r.status === 201, `status=${r.status}`);
  b.token = r.body?.token;
  b.id = r.body?.user?._id;

  log('\n[3] Auth: login by username');
  r = await request('POST', '/api/auth/login', {
    identifier: b.username,
    password: b.password,
  });
  check('login B returns 200', r.status === 200, `status=${r.status}`);
  check('  login token received', Boolean(r.body?.token));

  r = await request('POST', '/api/auth/login', {
    identifier: a.username,
    password: 'wrongpass',
  });
  check('login with wrong password returns 401', r.status === 401, `status=${r.status}`);

  log('\n[4] Auth: /auth/me');
  r = await request('GET', '/api/auth/me', null, a.token);
  check('GET /api/auth/me returns 200', r.status === 200, `status=${r.status}`);
  check('  returns user A', r.body?._id === a.id);

  r = await request('GET', '/api/auth/me');
  check('GET /api/auth/me without token returns 401', r.status === 401, `status=${r.status}`);

  log('\n[5] Users');
  r = await request('GET', `/api/users/search?q=${encodeURIComponent(b.username)}`, null, a.token);
  check('user search returns 200', r.status === 200);
  check('  finds user B', Array.isArray(r.body) && r.body.some((u) => u._id === b.id));

  r = await request('GET', `/api/users/${b.id}`, null, a.token);
  check('GET /api/users/:id returns 200', r.status === 200, `status=${r.status}`);

  log('\n[6] Chat: permission gating (no follow)');
  r = await request('GET', `/api/chat/messages/${b.id}`, null, a.token);
  check('chat messages without follow returns 403', r.status === 403, `status=${r.status}`);

  r = await request('POST', `/api/chat/messages/${b.id}`, { text: 'hi' }, a.token);
  check('chat send without follow returns 403', r.status === 403, `status=${r.status}`);

  r = await request('GET', '/api/chat/contacts', null, a.token);
  check('chat contacts (no mutuals) returns []', r.status === 200 && Array.isArray(r.body) && r.body.length === 0);

  log('\n[7] Follow: one-way');
  r = await request('PUT', `/api/users/${b.id}/follow`, null, a.token);
  check('A follows B returns 200', r.status === 200, `status=${r.status}`);

  r = await request('GET', `/api/chat/messages/${b.id}`, null, a.token);
  check('chat still 403 with one-way follow', r.status === 403);

  log('\n[8] Mutual follow unlocks chat');
  r = await request('PUT', `/api/users/${a.id}/follow`, null, b.token);
  check('B follows A returns 200', r.status === 200, `status=${r.status}`);

  r = await request('GET', `/api/chat/messages/${b.id}`, null, a.token);
  check('GET messages between mutuals returns 200', r.status === 200, `status=${r.status}`);
  check('  initial message list is empty', Array.isArray(r.body) && r.body.length === 0);

  r = await request('GET', '/api/chat/contacts', null, a.token);
  check('contacts list now contains B', r.status === 200 && r.body?.some((c) => c.user._id === b.id));

  log('\n[9] Chat REST send');
  r = await request('POST', `/api/chat/messages/${b.id}`, { text: 'hello from REST' }, a.token);
  check('POST message returns 201', r.status === 201, `status=${r.status}`);
  const restMessageId = r.body?._id;
  check('  message has id', Boolean(restMessageId));
  check('  text echoed', r.body?.text === 'hello from REST');

  r = await request('POST', `/api/chat/messages/${b.id}`, { text: '' }, a.token);
  check('POST empty message returns 400', r.status === 400, `status=${r.status}`);

  r = await request('GET', '/api/chat/unread-count', null, b.token);
  check('B unread count = 1', r.body?.count === 1, `count=${r.body?.count}`);

  r = await request('GET', `/api/chat/messages/${a.id}`, null, b.token);
  check('B reads thread returns 200', r.status === 200);
  r = await request('GET', '/api/chat/unread-count', null, b.token);
  check('B unread count = 0 after read', r.body?.count === 0, `count=${r.body?.count}`);

  log('\n[10] Posts');
  r = await request('POST', '/api/posts', { text: 'A first post' }, a.token);
  check('create post returns 201', r.status === 201, `status=${r.status}`);
  const postId = r.body?._id;
  check('  post id present', Boolean(postId));

  r = await request('GET', '/api/posts', null, a.token);
  check('GET feed returns 200', r.status === 200);
  check('  feed contains created post', Array.isArray(r.body?.posts) && r.body.posts.some((p) => p._id === postId));

  r = await request('PUT', `/api/posts/${postId}/like`, null, b.token);
  check('B likes the post returns 200', r.status === 200, `status=${r.status}`);

  log('\n[11] Comments');
  r = await request('POST', `/api/posts/${postId}/comments`, { text: 'nice post' }, b.token);
  check('add comment returns 201', r.status === 201, `status=${r.status}`);
  const commentId = r.body?._id;

  r = await request('GET', `/api/posts/${postId}/comments`, null, a.token);
  check('GET comments returns 200', r.status === 200);
  check('  comment present', Array.isArray(r.body) && r.body.some((c) => c._id === commentId));

  log('\n[12] Notifications');
  r = await request('GET', '/api/notifications', null, a.token);
  check('GET notifications returns 200', r.status === 200, `status=${r.status}`);

  log('\n[13] Real-time chat (socket.io)');
  await testSockets(a, b);

  log('\n[14] Cleanup');
  r = await request('PUT', `/api/users/${b.id}/follow`, null, a.token);
  check('A unfollows B (toggle)', r.status === 200);

  log('\n================================================================');
  log(`  RESULTS: ${pass} passed, ${fail} failed`);
  log('================================================================');
  process.exit(fail === 0 ? 0 : 1);
}

function testSockets(a, b) {
  return new Promise((resolve) => {
    const sockA = ioClient(HOST, { path: '/socket.io', auth: { token: a.token }, transports: ['websocket', 'polling'] });
    const sockB = ioClient(HOST, { path: '/socket.io', auth: { token: b.token }, transports: ['websocket', 'polling'] });

    let aReady = false, bReady = false;
    let aGotOwn = false, bGotPeer = false, bAcked = false, ackError = null;
    let bSentDelivered = false, aGotPeer = false;

    const finish = () => {
      check('socket A connected', aReady);
      check('socket B connected', bReady);
      check('A receives own outgoing message echo', aGotOwn);
      check('B receives peer message in real-time', bGotPeer);
      check('B send ack ok=true', bAcked, ackError ? `error=${ackError}` : '');
      check('A receives B reply in real-time', aGotPeer);
      sockA.disconnect();
      sockB.disconnect();
      resolve();
    };

    const timeout = setTimeout(finish, 8000);

    sockA.on('connect', () => { aReady = true; tryStart(); });
    sockB.on('connect', () => { bReady = true; tryStart(); });
    sockA.on('connect_error', (e) => { ackError = `A: ${e.message}`; });
    sockB.on('connect_error', (e) => { ackError = `B: ${e.message}`; });

    function tryStart() {
      if (!aReady || !bReady) return;

      sockB.on('message:new', (m) => {
        if (m.from === a.id && m.text === 'rt-from-A') bGotPeer = true;
      });
      sockA.on('message:new', (m) => {
        if (m.from === a.id && m.text === 'rt-from-A') aGotOwn = true;
        if (m.from === b.id && m.text === 'rt-reply-B') aGotPeer = true;
      });

      sockA.emit('message:send', { to: b.id, text: 'rt-from-A' }, (ack) => {
        if (!ack?.ok) ackError = ack?.error || 'no-ack';

        setTimeout(() => {
          sockB.emit('message:send', { to: a.id, text: 'rt-reply-B' }, (ack2) => {
            bAcked = Boolean(ack2?.ok);
            if (!ack2?.ok) ackError = ack2?.error || ackError;
            bSentDelivered = true;
            setTimeout(() => {
              clearTimeout(timeout);
              finish();
            }, 400);
          });
        }, 250);
      });
    }
  });
}

run().catch((err) => {
  console.error('Health check crashed:', err);
  process.exit(2);
});
