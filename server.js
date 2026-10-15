const http = require('node:http');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { randomUUID, timingSafeEqual } = require('node:crypto');
const { readDatabaseStore, writeDatabaseStore } = require('./db/data-store');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'store.json');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CONTENT_DIR = path.join(ROOT, 'content');
const UPLOAD_DIR = path.join(ROOT, 'data', 'uploads');
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY_SIZE = 15 * 1024 * 1024;
const DATA_BACKEND = (process.env.DATA_BACKEND || 'json').toLowerCase();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.webp': 'image/webp'
};

async function readJsonStore() { return JSON.parse(await fsp.readFile(DATA_FILE, 'utf8')); }
async function readStore() { return DATA_BACKEND === 'mysql' ? readDatabaseStore() : readJsonStore(); }
async function writeStore(store) {
  if (DATA_BACKEND === 'mysql') return writeDatabaseStore(store);
  const tmp = `${DATA_FILE}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(store, null, 2), 'utf8');
  await fsp.rename(tmp, DATA_FILE);
}
function send(res, status, body, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function fail(res, status, message) { send(res, status, { error: message }); }
function safeText(value, max = 500) { return String(value || '').trim().replace(/[<>]/g, '').slice(0, max); }
function isValidAdminToken(token) {
  if (!ADMIN_TOKEN || !token) return false;
  const expected = Buffer.from(ADMIN_TOKEN);
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
function requireAdmin(req, res) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (isValidAdminToken(token)) return true;
  fail(res, ADMIN_TOKEN ? 401 : 503, ADMIN_TOKEN ? '需要教师访问口令。' : '教师管理尚未在服务器中配置访问口令。');
  return false;
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) { reject(new Error('上传文件不能超过 15MB')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(body, boundary) {
  const result = {};
  for (const part of body.toString('latin1').split(`--${boundary}`)) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = part.slice(0, headerEnd);
    const match = headers.match(/name="([^"]+)"(?:; filename="([^"]*)")?/);
    if (!match) continue;
    const content = part.slice(headerEnd + 4).replace(/\r\n$/, '');
    result[match[1]] = match[2] !== undefined
      ? { filename: match[2], data: Buffer.from(content, 'latin1') }
      : Buffer.from(content, 'latin1').toString('utf8');
  }
  return result;
}

async function handleApi(req, res, url) {
  const route = url.pathname;
  if (req.method === 'GET' && route === '/api/data') {
    const { pendingPosts, rejectedPosts, submissions, ...publicStore } = await readStore();
    return send(res, 200, publicStore);
  }
  if (req.method === 'GET' && route === '/api/health') return send(res, 200, { ok: true, dataBackend: DATA_BACKEND, adminEnabled: Boolean(ADMIN_TOKEN) });
  if (req.method === 'GET' && route === '/api/submissions') {
    if (!requireAdmin(req, res)) return;
    return send(res, 200, (await readStore()).submissions);
  }
  if (req.method === 'GET' && route === '/api/pending-posts') {
    if (!requireAdmin(req, res)) return;
    return send(res, 200, (await readStore()).pendingPosts || []);
  }
  if (req.method !== 'POST') return fail(res, 404, '接口不存在');

  let body;
  try { body = await getBody(req); } catch (error) { return fail(res, 413, error.message); }
  const contentType = req.headers['content-type'] || '';
  let payload = {};
  if (contentType.includes('application/json')) {
    try { payload = JSON.parse(body.toString('utf8')); } catch { return fail(res, 400, '提交内容格式不正确'); }
  }
  const store = await readStore();

  if (!ADMIN_TOKEN && (route === '/api/submissions' || route === '/api/community-posts')) {
    return fail(res, 503, '学生互动功能将在教师完成服务器访问口令配置后开启。');
  }

  if (route === '/api/submissions') {
    const task = store.tasks.find((item) => item.id === payload.taskId);
    if (!task) return fail(res, 400, '没有找到对应任务');
    const submission = {
      id: randomUUID(), taskId: task.id, taskTitle: task.title,
      student: safeText(payload.student, 40), link: safeText(payload.link, 300),
      reflection: safeText(payload.reflection, 1200), question: safeText(payload.question, 600),
      createdAt: new Date().toISOString()
    };
    if (!submission.student || !submission.reflection) return fail(res, 400, '请填写姓名和学习记录');
    store.submissions.unshift(submission); await writeStore(store); return send(res, 201, submission);
  }
  if (route === '/api/community-posts') {
    const post = {
      id: randomUUID(), author: safeText(payload.author, 40), tag: safeText(payload.tag, 30) || '学习交流',
      title: safeText(payload.title, 100), body: safeText(payload.body, 800), createdAt: new Date().toISOString()
    };
    if (!post.author || !post.title || !post.body) return fail(res, 400, '请填写昵称、标题和内容');
    store.pendingPosts ||= [];
    store.pendingPosts.unshift(post);
    await writeStore(store);
    return send(res, 201, post);
  }
  const moderationMatch = route.match(/^\/api\/community-posts\/([^/]+)\/(approve|reject)$/);
  if (moderationMatch) {
    if (!requireAdmin(req, res)) return;
    const [, postId, action] = moderationMatch;
    store.pendingPosts ||= [];
    const postIndex = store.pendingPosts.findIndex((post) => post.id === postId);
    if (postIndex === -1) return fail(res, 404, '没有找到待审核帖子');
    const [post] = store.pendingPosts.splice(postIndex, 1);
    if (action === 'approve') {
      store.posts ||= [];
      const publishedPost = { ...post, replies: 0, publishedAt: new Date().toISOString() };
      store.posts.unshift(publishedPost);
      await writeStore(store);
      return send(res, 200, publishedPost);
    }
    store.rejectedPosts ||= [];
    const rejectedPost = { ...post, rejectedAt: new Date().toISOString(), reason: safeText(payload.reason, 300) || '教师未批准公开' };
    store.rejectedPosts.unshift(rejectedPost);
    await writeStore(store);
    return send(res, 200, rejectedPost);
  }
  if (route === '/api/admin/course') {
    if (!requireAdmin(req, res)) return;
    const course = {
      id: `course-${Date.now()}`, title: safeText(payload.title, 80), audience: safeText(payload.audience, 60),
      description: safeText(payload.description, 300), color: ['purple', 'orange', 'blue'].includes(payload.color) ? payload.color : 'blue',
      progress: 0, modules: safeText(payload.modules, 300).split('、').filter(Boolean)
    };
    if (!course.title || !course.description) return fail(res, 400, '请填写课程名称和简介');
    store.courses.push(course); await writeStore(store); return send(res, 201, course);
  }
  if (route === '/api/admin/resource') {
    if (!requireAdmin(req, res)) return;
    const resource = {
      id: `resource-${Date.now()}`, title: safeText(payload.title, 80), type: safeText(payload.type, 40) || '课堂资料',
      courseId: safeText(payload.courseId, 80), url: safeText(payload.url, 500), note: safeText(payload.note, 300)
    };
    if (!resource.title || !resource.courseId || !resource.url) return fail(res, 400, '请完整填写资源信息');
    store.resources.unshift(resource); await writeStore(store); return send(res, 201, resource);
  }
  if (route === '/api/admin/task') {
    if (!requireAdmin(req, res)) return;
    const task = {
      id: `task-${Date.now()}`, courseId: safeText(payload.courseId, 80), title: safeText(payload.title, 100),
      status: safeText(payload.status, 30) || '新任务', due: safeText(payload.due, 40) || '待定',
      description: safeText(payload.description, 500),
      steps: safeText(payload.steps, 1000).split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 8)
    };
    if (!task.courseId || !task.title || !task.description) return fail(res, 400, '请完整填写任务信息');
    store.tasks.unshift(task); await writeStore(store); return send(res, 201, task);
  }
  if (route === '/api/upload') {
    if (!requireAdmin(req, res)) return;
    const boundary = contentType.match(/boundary=([^;]+)/)?.[1];
    if (!boundary) return fail(res, 400, '请使用表单上传文件');
    const form = parseMultipart(body, boundary); const file = form.file;
    if (!file?.filename || !file.data?.length) return fail(res, 400, '请选择要上传的文件');
    const ext = path.extname(file.filename).toLowerCase();
    if (!['.pdf', '.docx', '.md', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return fail(res, 400, '目前支持 PDF、DOCX、Markdown 和常见图片文件');
    const courseId = safeText(form.courseId, 80);
    if (!courseId) return fail(res, 400, '请选择归属课程');
    await fsp.mkdir(UPLOAD_DIR, { recursive: true });
    const savedName = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    await fsp.writeFile(path.join(UPLOAD_DIR, savedName), file.data);
    const resource = {
      id: `upload-${Date.now()}`, title: safeText(form.title || path.basename(file.filename, ext), 80), type: '上传资料',
      courseId, url: `/uploads/${savedName}`, note: safeText(form.note, 300), download: true
    };
    store.resources.unshift(resource); await writeStore(store); return send(res, 201, resource);
  }
  return fail(res, 404, '接口不存在');
}

async function serveStatic(res, url) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname); }
  catch { return fail(res, 400, '文件路径格式不正确'); }
  if (pathname.includes('..')) return fail(res, 403, '无权访问');
  const isUpload = pathname.startsWith('/uploads/');
  const isContent = pathname.startsWith('/content/');
  const base = isUpload ? UPLOAD_DIR : (isContent ? CONTENT_DIR : PUBLIC_DIR);
  const relative = isUpload ? pathname.slice('/uploads/'.length) : (isContent ? pathname.slice('/content/'.length) : pathname.slice(1));
  const file = path.resolve(base, relative);
  if (!file.startsWith(`${base}${path.sep}`) && file !== base) return fail(res, 403, '无权访问');
  try { send(res, 200, await fsp.readFile(file), MIME[path.extname(file).toLowerCase()] || 'application/octet-stream'); }
  catch { fail(res, 404, '页面不存在'); }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try { if (url.pathname.startsWith('/api/')) await handleApi(req, res, url); else await serveStatic(res, url); }
  catch (error) { console.error(error); fail(res, 500, '服务器暂时无法处理请求'); }
});
server.listen(PORT, () => console.log(`学习平台已启动：http://localhost:${PORT}`));
