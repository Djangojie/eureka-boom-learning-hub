const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// One-time, repeatable release patch. Run from the project root on a JSON-backed site.
const suppliedRoot = process.argv.indexOf('--project-root');
const root = suppliedRoot >= 0
  ? path.resolve(process.argv[suppliedRoot + 1])
  : path.resolve(__dirname, '..');
const storePath = path.join(root, 'data', 'store.json');
const resources = [
  {
    id: 'r-neural-agent-water-review-20261014',
    title: '神经网络到 Agent 与水质检测｜课后复习',
    type: '课后复习 PDF', courseId: 'agent-lab',
    url: '/student-materials/neural-to-agent-water-quality-review.pdf',
    note: '用课堂例子串起神经网络、语言模型、Agent 和水质检测。', download: true,
    sha256: '173163D83E5982025D5886C4324732D7475207049E955754856BEBBF201CBEBE'
  },
  {
    id: 'r-dify-makecode-review-20261014',
    title: 'Dify 与 MakeCode｜课后复习 Readings',
    type: '课后复习 PDF', courseId: 'agent-lab',
    url: '/student-materials/dify-makecode-review-readings.pdf',
    note: '回顾 Dify 小助手的回答流程，并练习读懂 MakeCode 示例。', download: true,
    sha256: '01F0DC7DC88EC1AD569469B114F45E0E5E0250F487EC8D1E2EBDA2BE1C70BC15'
  },
  {
    id: 'r-minecraft-makecode-review-20261014',
    title: 'Minecraft MakeCode｜课后复习 Readings',
    type: '课后复习 PDF', courseId: 'minecraft',
    url: '/student-materials/minecraft-makecode-review-readings.pdf',
    note: '四色积木卡、两个短代码实验和一次 V1/V2 复测记录。', download: true,
    sha256: 'E623117CC30AC45A5D7CFB63D823AB0A64ED262D2B2DDC52EF6F420846E2305C'
  }
];

for (const item of resources) {
  const file = path.join(root, 'public', item.url.slice(1));
  if (!fs.existsSync(file)) throw new Error(`Missing PDF: ${file}`);
  const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
  if (actual !== item.sha256) throw new Error(`PDF checksum mismatch: ${file}`);
}

const original = fs.readFileSync(storePath, 'utf8');
const store = JSON.parse(original);
if (!Array.isArray(store.courses) || !Array.isArray(store.resources)) {
  throw new Error('Unexpected store.json structure; nothing was changed');
}
const courseIds = new Set(store.courses.map((course) => course.id));
for (const item of resources) {
  if (!courseIds.has(item.courseId)) throw new Error(`Course not found: ${item.courseId}`);
}
const ids = new Set(resources.map((item) => item.id));
const urls = new Set(resources.map((item) => item.url));
store.resources = [
  ...resources.map(({ sha256, ...item }) => item),
  ...store.resources.filter((item) => !ids.has(item.id) && !urls.has(item.url))
];

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = `${storePath}.before-readings-${stamp}.bak`;
const temp = `${storePath}.readings-${process.pid}.tmp`;
fs.copyFileSync(storePath, backup);
fs.writeFileSync(temp, JSON.stringify(store, null, 2) + '\n', 'utf8');
fs.renameSync(temp, storePath);
console.log(`Published ${resources.length} PDF entries. Total resources: ${store.resources.length}`);
console.log(`Backup: ${backup}`);
