function storedList(key) { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
const state = { data: null, pendingPosts: [], submissions: [], filter: 'all', resourceView: localStorage.getItem('eurekaBoomResourceView') || 'gallery', missionMode: localStorage.getItem('eurekaBoomMissionMode') || 'scan', growthMarks: storedList('eurekaBoomGrowthMarks'), parentSignals: storedList('eurekaBoomParentSignals'), sparkIndex: Number(sessionStorage.getItem('eurekaBoomSparkIndex') || 0), adminToken: sessionStorage.getItem('eurekaBoomAdminToken') || '' };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
const courseName = (id) => state.data.courses.find((course) => course.id === id)?.title || '未分类课程';
const courseById = (id) => state.data.courses.find((course) => course.id === id);
const missionModes = {
  scan: { icon: '◌', label: '观察模式', title: '先像工程师一样发现问题', text: '选择一个工具或任务，写下：它要解决什么？我怎样判断它有没有做好？', action: '打开工具箱', href: '#/resources' },
  build: { icon: '⌘', label: '建造模式', title: '把想法做成第一个可运行版本', text: '不追求一次做对。先让它完成一件最小的事，再观察结果。', action: '进入任务中心', href: '#/tasks' },
  play: { icon: '✦', label: '试玩模式', title: '请别人测试，再把作品变好', text: '找一位同学试玩，记录一个困惑点，然后只改一个地方重新测试。', action: '查看作品区', href: '#/showcase' }
};
const roadmapStages = [
  { number:'01', term:'第一学期', title:'入门与第一个智能体', role:'AI 体验者', color:'blue', loop:'感知 → 判断 → 行动', focus:['AI 启蒙与核心概念','Minecraft AI 与 MakeCode','完成第一次团队挑战'] },
  { number:'02', term:'第二学期', title:'把问题做深', role:'AI 项目构建者', color:'green', loop:'数据驱动 → 方案设计 → 验证优化', focus:['真实问题探索','数据与方案设计','项目迭代与展示'] },
  { number:'03', term:'第三学期', title:'真实开发与系统集成', role:'AI 系统集成者', color:'orange', loop:'感知接入 → 系统组合 → 产品落地', focus:['图像、声音与动作识别','硬件、App 与开发工具','测试与持续优化'] },
  { number:'04', term:'第四学期', title:'独立开发与正式参赛', role:'AI 社会创新者', color:'purple', loop:'独立选题 → 创作实现 → 展示影响', focus:['独立选题与系统开发','性能优化与作品集','答辩、参赛与社会价值'] }
];
const growthSkills = [
  { id:'notice', icon:'◉', title:'发现问题', hint:'我能说清楚它要解决什么。' },
  { id:'plan', icon:'⌘', title:'设计办法', hint:'我能画出输入、判断和行动。' },
  { id:'test', icon:'↺', title:'完成测试', hint:'我会用证据检查作品。' },
  { id:'repair', icon:'✦', title:'修改一次', hint:'我知道哪里没做好，并改了它。' },
  { id:'share', icon:'◎', title:'讲给别人听', hint:'我能展示作品和一个改动。' }
];
const parentObservations = [
  { id:'ask', title:'主动提问', note:'能把“我不懂”说成一个具体问题。' },
  { id:'test', title:'愿意测试', note:'会先试，再根据结果判断。' },
  { id:'retry', title:'愿意修改', note:'遇到错误后能继续调整。' },
  { id:'explain', title:'能够表达', note:'能用自己的话讲清作品。' }
];
const sparkChallenges = [
  { icon:'⚡', title:'30 秒观察任务', text:'找一个你每天会用的工具：它接收什么输入？它做了什么判断？' },
  { icon:'✦', title:'最小建造任务', text:'只让作品完成一件事：移动、分类或提示。先别做全部。' },
  { icon:'↺', title:'错误侦探任务', text:'故意给作品一个边界情况，记录它在哪里失灵。' },
  { icon:'◎', title:'试玩交换任务', text:'请一位同学试玩 2 分钟，只记下一个困惑点。' }
];
const mlVisualizations = [
  { group:'看懂模型怎样学习', title:'TensorFlow Playground', type:'神经网络 · 入门首选', url:'https://playground.tensorflow.org/', note:'调节数据、特征、隐藏层和学习率，观察分类边界与 loss 怎样变化。', task:'螺旋挑战：先只用 X₁、X₂ 训练，再加入 sin(X₁)、sin(X₂)；记录哪种输入更容易学会螺旋。' },
  { group:'看懂模型怎样学习', title:'R2D3：机器学习可视化入门', type:'决策树 · 偏差与方差', url:'https://r2d3.us/visual-intro-to-machine-learning-part-1/', note:'用交互图解展示决策树如何一步步切分数据，并通过后续章节理解模型太简单或太复杂的影响。', task:'观察树的每次分叉：它依据哪个条件把样本分开？' },
  { group:'看懂模型怎样学习', title:'Embedding Projector', type:'向量 · 降维', url:'https://projector.tensorflow.org/', note:'把高维向量投影到二维或三维空间，搜索相近点并切换 PCA、t-SNE、UMAP。', task:'找一组词向量，看看意思相近的词是否靠在一起；换降维方法后，邻居会不会改变？' },
  { group:'拆开看看深度学习', title:'CNN Explainer', type:'图像识别 · 卷积神经网络', url:'https://poloclub.github.io/cnn-explainer/', note:'沿着图像输入、卷积、激活、池化到分类输出逐层观察 CNN。', task:'追踪一张图片经过网络时的变化，找找哪些层开始出现更大的形状或物体线索。' },
  { group:'拆开看看深度学习', title:'GAN Lab', type:'生成式模型 · GAN', url:'https://poloclub.github.io/ganlab/', note:'可视化生成器与判别器的对抗训练，看生成数据如何逐渐接近真实分布。', task:'观察训练过程：生成器和判别器分别在努力做什么？两边失衡时会出现什么现象？' },
  { group:'拆开看看深度学习', title:'Transformer Explainer', type:'大语言模型 · 注意力与生成', url:'https://poloclub.github.io/transformer-explainer/', note:'输入文本，观察 token、注意力、中间计算和下一个词的概率；调 temperature、top-k 或 top-p。', task:'输入同一句话，分别调高和调低 temperature，比较输出概率和生成结果。' },
  { group:'自己采集数据训练', title:'Teachable Machine', type:'图像 · 声音 · 姿态分类', url:'https://teachablemachine.withgoogle.com/', note:'无需写代码，收集例子、训练模型并即时测试；支持图像、声音和姿态。', task:'训练“张手 / 握拳”分类器，然后换背景或光线测试：模型学到的是手势，还是背景？' },
  { group:'自己采集数据训练', title:'ml5.js 示例库', type:'浏览器 AI · 创意编程', url:'https://ml5js.github.io/ml5-examples/public/', note:'从可运行示例开始，用网页和 JavaScript 尝试图像分类、姿态估计等浏览器 AI。', task:'先运行一个手部或姿态识别例子，再改变页面反馈方式，做成自己的小互动。' },
  { group:'继续探索与调试', title:'Google PAIR 可解释性工具', type:'模型分析 · 公平性与调试', url:'https://pair.withgoogle.com/tools/', note:'了解 What-If Tool、LIT 等工具如何检查模型预测、数据样本和群体差异。', task:'提出一个“如果只改变这个特征，预测会怎样”的问题，并思考模型是否对不同人群表现一致。' },
  { group:'继续探索与调试', title:'Distill：特征可视化', type:'卷积网络 · 特征解释', url:'https://distill.pub/2017/feature-visualization/', note:'通过交互式可视化观察网络不同层倾向响应边缘、纹理、部件还是物体。', task:'比较浅层和深层神经元偏好的图案，描述网络的“观察重点”怎样逐步变化。' }
];

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '操作没有完成，请稍后再试。');
  return data;
}
function adminApi(url, options = {}) {
  if (!state.adminToken) return Promise.reject(new Error('请先输入教师访问口令。'));
  return api(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${state.adminToken}` } });
}
function route() {
  const raw = decodeURIComponent(location.hash.slice(1) || '/dashboard');
  return raw.startsWith('/') ? raw : '/dashboard';
}
function go(path) { location.hash = path; }
function setMessage(selector, message, isError = false) { const element = $(selector); if (!element) return; element.textContent = message; element.style.color = isError ? '#ffaaa1' : ''; }
function formToObject(form) { return Object.fromEntries(new FormData(form).entries()); }
function pageHeading(kicker, title, intro = '') { return `<div class="page-top"><div><p class="page-kicker">${kicker}</p><h1 class="page-title">${title}</h1>${intro ? `<p class="page-intro">${intro}</p>` : ''}</div></div>`; }
function courseCards() {
  return state.data.courses.map((course, index) => `<a class="course-card ${escapeHtml(course.color)}" href="#/courses/${escapeHtml(course.id)}"><span class="card-code">TRACK 0${index + 1} · ${escapeHtml(course.audience)}</span><h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.description)}</p><div class="pills">${(course.modules || []).map((module) => `<span>${escapeHtml(module)}</span>`).join('')}</div><div class="progress"><i style="width:${Math.min(Number(course.progress) || 0, 100)}%"></i></div><div class="card-footer"><span>课程进度</span><strong>${course.progress || 0}%</strong></div></a>`).join('');
}
function taskRows(tasks, limit = Infinity) {
  return tasks.slice(0, limit).map((task) => `<article class="task-row"><div class="row-meta"><span class="status">${escapeHtml(task.status)}</span><span>${escapeHtml(courseName(task.courseId))}</span><span class="due">截止：${escapeHtml(task.due)}</span></div><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(task.description)}</p>${task.steps?.length ? `<ul class="task-steps">${task.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul>` : ''}</article>`).join('') || '<p class="muted">这里暂时还没有任务。</p>';
}
function fileFormat(resource) {
  const match = String(resource.url || '').split('?')[0].match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toUpperCase() : resource.type || 'FILE';
}
function resourceCards(resources) {
  return resources.map((resource) => {
    const image = resource.image ? `<figure class="resource-visual"><img src="${escapeHtml(resource.image)}" alt="${escapeHtml(resource.imageAlt || resource.title)}" /></figure>` : '';
    const action = resource.download
      ? `<a class="resource-action" href="${escapeHtml(resource.url)}" download>下载 ${escapeHtml(fileFormat(resource))} ↓</a>`
      : `<a class="resource-action" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">打开资料 ↗</a>`;
    return `<article class="resource-card ${image ? 'has-image' : ''}">${image}<span class="card-code">${escapeHtml(resource.type)} · ${escapeHtml(courseName(resource.courseId))}</span><h3>${escapeHtml(resource.title)}</h3><p>${escapeHtml(resource.note || '点击进入课堂资料。')}</p><div class="card-footer">${action}<strong>${resource.download ? 'STUDENT FILE' : 'TOOL LINK'}</strong></div></article>`;
  }).join('') || '<p class="muted">这个分类暂时还没有资料。</p>';
}
function toggleStoredMark(stateKey, storageKey, id) {
  const marks = new Set(state[stateKey]);
  marks.has(id) ? marks.delete(id) : marks.add(id);
  state[stateKey] = [...marks];
  localStorage.setItem(storageKey, JSON.stringify(state[stateKey]));
}
function renderDashboard() {
  const nextTask = state.data.tasks[0];
  const mode = missionModes[state.missionMode] || missionModes.scan;
  const spark = sparkChallenges[state.sparkIndex % sparkChallenges.length];
  return `<section class="home-hero"><div class="home-copy"><p class="page-kicker">EUREKA BOOM · FUTURE ENGINEERING</p><h1>从好奇，<br />到真正能运行的<em>作品。</em></h1><p>观察一个问题，做出第一个版本，再让它变好。</p><div class="home-actions"><a class="button neon" href="#/tasks">开始今日任务</a><a class="text-link" href="#/growth">查看我的成长 →</a></div></div><aside class="home-orbit"><figure class="dash-logo"><img src="/eureka-boom-logo.jpg" alt="Eureka Boom：We Engineer The Future" /></figure><div class="orbit-tag orbit-one">OBSERVE</div><div class="orbit-tag orbit-two">BUILD</div><div class="orbit-tag orbit-three">TEST</div><div class="dash-stage-bar"><span class="pulse"></span>STUDIO ONLINE <b>EB · 01</b></div></aside></section><section class="home-grid"><article class="today-card"><p class="panel-label">TODAY'S MISSION</p><h2>${escapeHtml(nextTask?.title || '准备下一项工程挑战')}</h2><p>${escapeHtml(nextTask?.description || '从一个小问题开始。')}</p><a class="mini-link" href="#/tasks">进入任务卡 →</a></article><article class="spark-card"><span>${spark.icon}</span><p class="panel-label">SPARK ARCADE</p><h2>${escapeHtml(spark.title)}</h2><p>${escapeHtml(spark.text)}</p><button id="spark-challenge" class="spark-button" type="button">换一个挑战</button></article><a class="progress-card" href="#/growth"><span class="progress-orb">${state.growthMarks.length}/5</span><div><p class="panel-label">GROWTH TRACK</p><h2>把一次进步留下来</h2><p>点亮你的工程习惯。</p></div><b>→</b></a></section><section class="launch-panel"><div class="launch-head"><div><p class="panel-label">CHOOSE YOUR MODE</p><h2>选一种方式开始。</h2></div><span class="launch-chip">本机保存</span></div><div class="mode-switcher">${Object.entries(missionModes).map(([id, item]) => `<button class="mode-choice ${state.missionMode === id ? 'active' : ''}" data-mission-mode="${id}" type="button"><span>${item.icon}</span>${item.label}</button>`).join('')}</div><article class="mode-result"><span class="mode-icon">${mode.icon}</span><div><p class="panel-label">${escapeHtml(mode.label)}</p><h3>${escapeHtml(mode.title)}</h3><p>${escapeHtml(mode.text)}</p></div><a class="button neon" href="${mode.href}">${escapeHtml(mode.action)}</a></article></section><section class="home-route"><div><p class="panel-label">LONG-TERM JOURNEY</p><h2>四学期，从体验到创造。</h2></div><a class="button dark" href="#/roadmap">查看学习计划</a><a class="text-link" href="#/parents">家长观察台 →</a></section>`;
}
function renderPath() {
  const steps = [
    ['01 / EXPLORE', '探索与表达', '从真实兴趣和问题出发，理解 AI、计算与设计。', 'AI 基础 · Prompt · 数据观察'],
    ['02 / DESIGN', '智能体与自动化', '设计目标、输入、判断、行动与人工求助的边界。', 'Agent · Tool · Skill · Workflow'],
    ['03 / BUILD', '工程创作与调试', '用 Minecraft、代码和网页原型，把方案做出来、测出来。', 'MakeCode · Vibe Coding · Eval'],
    ['04 / SHOW', '展示与真实挑战', '整理作品证据，完成试玩、答辩与团队协作。', '作品集 · 路演 · 黑客松']
  ];
  return `${pageHeading('01 / LEARNING MAP', '未来工程学习路径', '每一次课程都回到同一条工程主线：发现问题、设计方案、做出原型、测试修改，再向别人讲清楚。')}<section class="path-stack">${steps.map((step) => `<article class="path-step"><b>${step[0]}</b><div><h3>${step[1]}</h3><p>${step[2]}</p></div><small>${step[3]}</small></article>`).join('')}</section>`;
}
function renderRoadmap() {
  return `${pageHeading('01 / FOUR-TERM PLAN', '四学期学习计划', '从体验 AI，到完成真实项目，再到独立开发与展示。')}<section class="roadmap-board">${roadmapStages.map((stage) => `<article class="roadmap-card ${stage.color}"><div class="roadmap-card-top"><span>${stage.number}</span><p>${escapeHtml(stage.term)}</p></div><h2>${escapeHtml(stage.title)}</h2><b>${escapeHtml(stage.role)}</b><p class="roadmap-loop">${escapeHtml(stage.loop)}</p><ul>${stage.focus.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article>`).join('')}</section><section class="plan-loop"><div><p class="panel-label">ONE ENGINEERING LOOP</p><h2>感知 → 表示 → 判断 → 行动 → 反馈</h2><p>每个阶段都留下一份能看得见的证据：实验记录、作品版本、测试结果或展示讲解。</p></div><a class="button neon" href="#/downloads">下载学习资料</a></section>`;
}
function renderGrowth() {
  const completed = state.growthMarks.length;
  const next = growthSkills.find((skill) => !state.growthMarks.includes(skill.id)) || growthSkills[growthSkills.length - 1];
  return `${pageHeading('02 / GROWTH TRACK', '我的成长轨迹', '不是积分排名，而是把“我怎样变得更会做作品”留下来。')}<section class="growth-hero"><div><p class="panel-label">ENGINEERING HABITS</p><h2>${completed}/5 个成长徽章已点亮</h2><p>每完成一次真实尝试，就点亮一个徽章。记录保存在当前设备，之后可接入教师审核记录。</p></div><span class="growth-score">${completed}<small>/5</small></span></section><section class="growth-grid">${growthSkills.map((skill, index) => `<button class="growth-skill ${state.growthMarks.includes(skill.id) ? 'done' : ''}" data-growth-mark="${skill.id}" type="button"><span class="skill-index">0${index + 1}</span><span class="skill-icon">${skill.icon}</span><strong>${escapeHtml(skill.title)}</strong><small>${escapeHtml(skill.hint)}</small><i>${state.growthMarks.includes(skill.id) ? '已点亮' : '点亮徽章'}</i></button>`).join('')}</section><section class="next-growth"><span>${next.icon}</span><div><p class="panel-label">NEXT SMALL STEP</p><h2>${escapeHtml(next.title)}</h2><p>${escapeHtml(next.hint)}</p></div><a class="button neon" href="#/tasks">去做任务</a></section>`;
}
function renderCourses() { return `${pageHeading('01 / COURSE LIBRARY', '课程实验室', '每个实验室都有自己的任务、工具与作品方向。请选择一个入口继续深入。')}<section class="card-grid">${courseCards()}</section>`; }
function renderCourseDetail(course) {
  const tasks = state.data.tasks.filter((task) => task.courseId === course.id);
  const resources = state.data.resources.filter((resource) => resource.courseId === course.id);
  const color = escapeHtml(course.color || 'purple');
  return `<a class="text-link" href="#/courses">← 返回课程库</a><section class="course-hero ${color}"><div><p class="page-kicker">${escapeHtml(course.audience)} · FUTURE ENGINEERING TRACK</p><h1>${escapeHtml(course.title)}</h1><p>${escapeHtml(course.description)}</p><div class="pills">${(course.modules || []).map((module) => `<span>${escapeHtml(module)}</span>`).join('')}</div></div><div class="course-hero-stats"><div><b>${tasks.length}</b><span>关联任务</span></div><div><b>${resources.length}</b><span>课堂资料</span></div><div><b>${course.progress || 0}%</b><span>当前课程进度</span></div><div><b>01</b><span>当前学习赛道</span></div></div></section><section class="detail-grid"><article class="panel"><p class="panel-label">COURSE MODULES</p><h2>你会在这里完成什么</h2><div class="module-list">${(course.modules || []).map((module, index) => `<div class="module-item"><span>0${index + 1}</span><b>${escapeHtml(module)}</b></div>`).join('')}</div></article><article class="panel"><p class="panel-label">RELATED TOOLS</p><h2>进入课堂工具</h2>${resources.map((resource) => `<div class="resource-row"><span class="card-code">${escapeHtml(resource.type)}</span><h3><a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.title)} ↗</a></h3><p>${escapeHtml(resource.note || '')}</p></div>`).join('') || '<p class="muted">教师尚未添加资料。</p>'}</article></section><section class="detail-grid"><article class="panel"><p class="panel-label">ACTIVE TASKS</p><h2>当前任务</h2>${taskRows(tasks)}</article><article class="panel"><p class="panel-label">ENGINEERING LOOP</p><h2>每个作品都要留下证据</h2><div class="module-list"><div class="module-item"><span>01</span><b>我的目标是什么？</b></div><div class="module-item"><span>02</span><b>我怎样测试它？</b></div><div class="module-item"><span>03</span><b>哪里错了，怎样改？</b></div><div class="module-item"><span>04</span><b>我能怎样解释作品？</b></div></div></article></section>`;
}
function renderTasks() { return `${pageHeading('02 / WORKBENCH', '任务中心', '从任务卡开始，留下测试、修改和解释。作品可以不完美，但学习过程需要真实。')}<section class="work-grid"><article class="panel"><p class="panel-label">ACTIVE MISSIONS</p><h2>正在进行的任务</h2>${taskRows(state.data.tasks)}</article><aside class="form-card"><p class="panel-label">SUBMIT YOUR WORK</p><h2>提交学习记录</h2><p>请告诉老师：你做了什么、测试后怎样修改，以及还卡在哪里。</p><form id="submission-form"><label>选择任务<select id="submission-task" name="taskId" required>${state.data.tasks.map((task) => `<option value="${escapeHtml(task.id)}">${escapeHtml(task.title)}</option>`).join('')}</select></label><label>你的名字<input name="student" maxlength="40" placeholder="例如：小林" required /></label><label>作品链接（可选）<input name="link" type="url" placeholder="https://..." /></label><label>我做了什么？我怎么修改的？<textarea name="reflection" rows="5" maxlength="1200" required placeholder="第一次测试时……后来我把……改成了……"></textarea></label><label>我还想问的问题（可选）<textarea name="question" rows="2" maxlength="600" placeholder="请说清楚你已尝试什么。"></textarea></label><button class="button neon wide" type="submit">提交学习记录</button><p id="submission-message" class="form-message" role="status"></p></form></aside></section>`; }
function renderResources() {
  const resources = state.filter === 'all' ? state.data.resources : state.data.resources.filter((resource) => resource.courseId === state.filter);
  return `${pageHeading('02 / WORKBENCH', '课堂工具箱', '每一个入口都连接到一个真实任务。课件资料可以直接下载；在线工具会在新窗口打开。')}<div class="tool-toolbar"><div class="filter-row"><button class="filter ${state.filter === 'all' ? 'active' : ''}" data-filter="all">全部</button>${state.data.courses.map((course) => `<button class="filter ${state.filter === course.id ? 'active' : ''}" data-filter="${escapeHtml(course.id)}">${escapeHtml(course.title)}</button>`).join('')}</div><div class="view-switch" aria-label="工具箱视图"><a class="download-center-link" href="#/downloads">课程下载中心 ↓</a><button class="${state.resourceView === 'gallery' ? 'active' : ''}" data-resource-view="gallery" type="button">卡片</button><button class="${state.resourceView === 'list' ? 'active' : ''}" data-resource-view="list" type="button">清单</button></div></div><section class="card-grid resource-grid ${escapeHtml(state.resourceView)}">${resourceCards(resources)}</section>`;
}
function renderMLLab() {
  const groups = [...new Set(mlVisualizations.map((item) => item.group))];
  return `${pageHeading('02 / VISUAL AI LAB', '可视化 AI 实验室', '从拖动参数到训练自己的模型：边玩边观察，留下猜想、现象和解释。')}<section class="growth-hero"><div><p class="panel-label">HOW TO EXPLORE</p><h2>一次只改一个条件。</h2><p>先猜结果，再动手实验；记下你改了什么、看到了什么，以及你的解释。在线实验会在新标签页打开。</p></div><span class="growth-score">10<small>个实验</small></span></section>${groups.map((group) => `<section class="ml-lab-group"><div class="page-top compact"><div><p class="panel-label">EXPLORE / ${escapeHtml(group.toUpperCase())}</p><h2>${escapeHtml(group)}</h2></div></div><div class="card-grid">${mlVisualizations.filter((item) => item.group === group).map((item) => `<article class="resource-card ml-lab-card"><span class="card-code">${escapeHtml(item.type)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.note)}</p><div class="ml-lab-task"><b>试一试</b><p>${escapeHtml(item.task)}</p></div><div class="card-footer"><a class="resource-action" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">打开实验 ↗</a><strong>INTERACTIVE</strong></div></article>`).join('')}</div></section>`).join('')}<section class="plan-loop"><div><p class="panel-label">KEEP THE EVIDENCE</p><h2>把观察变成一次小实验。</h2><p>记录实验目标、改变的变量、观察到的结果和自己的解释。完成后，可以到任务中心提交学习记录。</p></div><a class="button neon" href="#/tasks">去提交实验记录</a></section>`;
}
function downloadRows(resources) {
  return resources.map((resource) => `<article class="download-row"><div><span class="card-code">${escapeHtml(fileFormat(resource))} · ${escapeHtml(resource.type)}</span><h3>${escapeHtml(resource.title)}</h3><p>${escapeHtml(resource.note || '学生公开课程资料。')}</p></div><div class="download-actions"><a class="button neon" href="${escapeHtml(resource.url)}" download>下载</a><a class="text-link" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">预览 ↗</a></div></article>`).join('');
}
function renderDownloads() {
  const downloads = state.data.resources.filter((resource) => resource.download && String(resource.url || '').startsWith('/'));
  const groups = state.data.courses.map((course) => {
    const items = downloads.filter((resource) => resource.courseId === course.id);
    if (!items.length) return '';
    return `<section class="download-group"><div class="download-group-head"><div><p class="panel-label">${escapeHtml(course.title)}</p><h2>${items.length} 份学生资料</h2></div><a class="text-link" href="#/courses/${escapeHtml(course.id)}">查看课程 →</a></div>${downloadRows(items)}</section>`;
  }).join('');
  return `${pageHeading('02 / STUDENT LIBRARY', '课程下载中心', '这里的文件已按课程整理，学生可以直接下载；PDF 适合预览或打印，DOCX/Markdown 可继续编辑。')}<section class="download-hero"><span>↓</span><div><p class="panel-label">READY FOR STUDENTS</p><h2>${downloads.length} 份公开学习资料</h2><p>请优先下载老师指定的版本。资料仅用于 Eureka Boom 课堂学习，请勿将同学信息、作业内容或链接转发到公开平台。</p></div></section>${groups || '<p class="muted">公开下载资料正在整理中。</p>'}`;
}
function renderShowcase() { return `${pageHeading('02 / BUILDING FLOOR', '作品体验区', '这里将逐步沉淀学生真正能运行、能试玩、能讲解的作品，而不只是最终截图。')}<section class="card-grid"><a class="showcase-card purple" href="#/courses/agent-lab"><span class="card-code">01 / AGENT</span><h3>我的第一个<br />会判断的 Agent</h3><p>让“会回答”变成一个会完成小任务的方案。</p><div class="card-footer"><span>探索任务</span><strong>进入课程</strong></div></a><a class="showcase-card orange" href="#/courses/minecraft"><span class="card-code">02 / BUILD</span><h3>方块世界<br />自动建造实验室</h3><p>让代码真的在世界里留下痕迹，再检查是否按规则运行。</p><div class="card-footer"><span>建造任务</span><strong>进入课程</strong></div></a><a class="showcase-card blue" href="#/courses/vibe-coding"><span class="card-code">03 / PLAYTEST</span><h3>让同学试玩，<br />再把作品改好</h3><p>好游戏不是一次写完的，而是在一次次试玩中变得更好。</p><div class="card-footer"><span>创作任务</span><strong>进入课程</strong></div></a></section><section class="panel" style="margin-top:18px"><p class="panel-label">COMING NEXT</p><h2>学生个人作品页</h2><p class="page-intro">下一阶段会为每个学生建立可筛选的作品档案：项目目标、访问链接、测试记录、修改版本和教师反馈都会留在同一个页面。</p></section>`; }
function renderCommunity() { return `${pageHeading('03 / COMMUNITY', '学生社区', '提问前先写下“我想完成什么”和“我已试过什么”。帖子会先进入教师审核，再对班级公开。')}<section class="work-grid"><aside class="form-card"><p class="panel-label">POST FOR REVIEW</p><h2>提交一条帖子</h2><form id="post-form"><label>你的昵称<input name="author" maxlength="40" placeholder="例如：小林" required /></label><label>发布类型<select name="tag"><option>调试求助</option><option>作品展示</option><option>创意分享</option><option>学习交流</option></select></label><label>标题<input name="title" maxlength="100" placeholder="例如：我不知道怎么让角色回到起点" required /></label><label>内容<textarea name="body" rows="5" maxlength="800" placeholder="我想完成什么？我已经试过什么？现在卡在哪里？" required></textarea></label><button class="button neon wide" type="submit">提交给教师审核</button><p id="post-message" class="form-message" role="status"></p></form></aside><article class="panel"><p class="panel-label">CLASS STUDIO</p><h2>已发布的讨论</h2>${state.data.posts.map((post) => `<article class="post-row"><div class="row-meta"><span class="card-code">${escapeHtml(post.tag)}</span><span>${escapeHtml(post.author)}</span><span class="reply">${post.replies} 条回应</span></div><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.body)}</p></article>`).join('') || '<p class="muted">教师审核后的帖子会出现在这里。</p>'}</article></section>`; }
function renderParents() {
  const picked = parentObservations.filter((item) => state.parentSignals.includes(item.id));
  const summary = picked.length ? `本周可重点观察：${picked.map((item) => item.title).join('、')}。下次可以问孩子：“这一次你试过什么？后来改了哪里？”` : '先点选你观察到的行为，生成一条简短的亲子对话提示。';
  return `${pageHeading('03 / PARENT OBSERVATORY', '家长观察台', '看见孩子怎样思考、测试和修改，而不只看结果。')}<section class="parent-observatory"><div><p class="page-kicker">EUREKA BOOM · FAMILY VIEW</p><h1>看见过程，<br />也看见<em>成长。</em></h1><p>AI、Minecraft 与代码是载体；真正被练习的是发现问题、设计方案、测试修改与表达。</p><div class="parent-actions"><a class="button neon" href="#/growth">查看成长轨迹</a><a class="text-link" href="#/roadmap">查看四学期计划 →</a></div></div><aside class="parent-scope"><span>01</span><b>本期位置</b><h2>AI 体验者</h2><p>正在把“好奇”变成第一次可运行的智能体与工程作品。</p></aside></section><section class="parent-observe-grid"><article class="observation-panel"><div class="panel-heading"><div><p class="panel-label">OBSERVE, DON'T LABEL</p><h2>这周你看见了什么？</h2></div><span>${picked.length}/4</span></div><div class="observation-options">${parentObservations.map((item) => `<button class="observation-chip ${state.parentSignals.includes(item.id) ? 'active' : ''}" data-parent-signal="${item.id}" type="button"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.note)}</small></button>`).join('')}</div><button id="parent-summary" class="button dark" type="button">生成观察提示</button></article><aside class="parent-summary"><p class="panel-label">CONVERSATION CARD</p><h2>今晚可以这样聊</h2><p id="parent-summary-text">${escapeHtml(summary)}</p><small>这是亲子沟通草稿，不替代教师评价，也不为孩子贴标签。</small></aside></section><section class="parent-minis"><article><span>◎</span><b>看什么</b><p>目标、尝试、测试与修改。</p></article><article><span>↺</span><b>怎么问</b><p>“哪里没成功？你后来怎么改？”</p></article><article><span>✦</span><b>下一步</b><p>让孩子展示一个版本和一次改动。</p></article></section>`;
}
function courseSelectOptions() { return '<option value="" selected disabled>请选择课程</option>' + state.data.courses.map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.title)}</option>`).join(''); }
function submissionList() { return state.submissions?.length ? state.submissions.map((item) => `<article class="submission-row"><b>${escapeHtml(item.student)} · ${escapeHtml(item.taskTitle)}</b><small>${new Date(item.createdAt).toLocaleString('zh-CN', { hour12:false })}</small><p>${escapeHtml(item.reflection)}</p>${item.link ? `<a class="text-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">查看作品链接 ↗</a>` : ''}${item.question ? `<p><b>想问：</b>${escapeHtml(item.question)}</p>` : ''}</article>`).join('') : '<p class="muted">还没有学生提交，或尚未完成教师授权。</p>'; }
function pendingList() { return state.pendingPosts?.length ? state.pendingPosts.map((post) => `<article class="submission-row moderation-row"><b>${escapeHtml(post.author)} · ${escapeHtml(post.tag)}</b><small>${new Date(post.createdAt).toLocaleString('zh-CN', { hour12:false })}</small><p><b>${escapeHtml(post.title)}</b><br />${escapeHtml(post.body)}</p><div class="moderation-actions"><button class="button approve" data-moderation="approve" data-post-id="${escapeHtml(post.id)}" type="button">批准公开</button><button class="button reject" data-moderation="reject" data-post-id="${escapeHtml(post.id)}" type="button">不公开</button></div></article>`).join('') : '<p class="muted">没有待审核帖子。</p>'; }
function renderTeacher() { const select = courseSelectOptions(); const access = state.adminToken ? `<p class="muted">教师授权已保存在当前浏览器会话中。<button id="clear-admin-access" class="text-button" type="button">退出教师授权</button></p>` : `<form id="admin-access-form" class="admin-access"><label>教师访问口令<input name="adminToken" type="password" autocomplete="current-password" required /></label><button class="button dark" type="submit">解锁教师控制台</button><p class="muted">口令只保存在当前浏览器会话，不会写入课程数据。</p></form>`; return `${pageHeading('03 / TEACHER CONSOLE', '教师控制台', '教师操作需要服务器设置的访问口令。学生只能浏览公开资料，不能查看提交箱或发布内容。')}<section class="panel teacher-access">${access}</section><section class="teacher-grid"><details open><summary>新建课程</summary><form id="course-form" class="admin-form"><label>课程名称<input name="title" required /></label><label>适合对象<input name="audience" placeholder="例如：五年级—初中生" /></label><label>课程简介<textarea name="description" rows="3" required></textarea></label><label>模块（用“、”分隔）<input name="modules" placeholder="目标、任务、测试" /></label><label>颜色<select name="color"><option value="purple">紫色</option><option value="orange">橙色</option><option value="blue">蓝色</option></select></label><button class="button dark" type="submit">发布课程</button></form></details><details><summary>添加资源链接</summary><form id="resource-form" class="admin-form"><label>资源名称<input name="title" required /></label><label>归属课程<select name="courseId" required>${select}</select></label><label>资源类型<input name="type" placeholder="课堂工具 / 模板 / 视频" /></label><label>链接<input name="url" type="url" required placeholder="https://..." /></label><label>给学生的说明<textarea name="note" rows="3"></textarea></label><button class="button dark" type="submit">发布资源</button></form></details><details><summary>上传可下载课程文件</summary><form id="upload-form" class="admin-form"><label>文件（PDF、DOCX、Markdown、PNG、JPG、WEBP，最大 15MB）<input name="file" type="file" accept=".pdf,.docx,.md,.png,.jpg,.jpeg,.webp" required /></label><label>归属课程<select name="courseId" required>${select}</select></label><label>显示名称<input name="title" /></label><label>给学生的说明<textarea name="note" rows="3"></textarea></label><button class="button dark" type="submit">上传并公开下载</button></form></details><details><summary>布置新任务</summary><form id="task-form" class="admin-form"><label>任务名称<input name="title" required /></label><label>归属课程<select name="courseId" required>${select}</select></label><label>状态<input name="status" value="新任务" /></label><label>截止时间<input name="due" placeholder="例如：本周日" /></label><label>任务说明<textarea name="description" rows="3" required></textarea></label><label>完成步骤（每行一项）<textarea name="steps" rows="4"></textarea></label><button class="button dark" type="submit">发布任务</button></form></details></section><section class="inbox"><p class="panel-label">WORK SUBMISSIONS</p><h2>学生提交箱</h2>${submissionList()}</section><section class="inbox"><p class="panel-label">COMMUNITY REVIEW</p><h2>待审核的社区帖子</h2><p class="muted">审核后再公开给班级同学，避免学生个人信息或无关内容直接展示。</p>${pendingList()}</section><p id="admin-message" class="form-message" role="status"></p>`; }
function renderNotFound() { return `${pageHeading('404', '这个页面还没有建好', '请从左侧课程树选择一个入口。')}<a class="button neon" href="#/dashboard">返回工作台</a>`; }
function renderCurrentPage() {
  const current = route(); const parts = current.split('/').filter(Boolean); let html;
  if (current === '/dashboard') html = renderDashboard();
  else if (current === '/path') html = renderPath();
  else if (current === '/roadmap') html = renderRoadmap();
  else if (current === '/courses') html = renderCourses();
  else if (parts[0] === 'courses' && parts[1]) html = courseById(parts[1]) ? renderCourseDetail(courseById(parts[1])) : renderNotFound();
  else if (current === '/tasks') html = renderTasks();
  else if (current === '/growth') html = renderGrowth();
  else if (current === '/resources') html = renderResources();
  else if (current === '/ml-lab') html = renderMLLab();
  else if (current === '/downloads') html = renderDownloads();
  else if (current === '/showcase') html = renderShowcase();
  else if (current === '/community') html = renderCommunity();
  else if (current === '/parents') html = renderParents();
  else if (current === '/teacher') html = renderTeacher();
  else html = renderNotFound();
  const host = $('#app'); host.classList.remove('page-enter'); host.innerHTML = html; void host.offsetWidth; host.classList.add('page-enter'); renderNavigation(current); bindPageEvents(current); window.scrollTo(0, 0);
}
function renderNavigation(current) {
  $('#course-tree').innerHTML = state.data.courses.map((course) => `<a data-route="/courses/${escapeHtml(course.id)}" href="#/courses/${escapeHtml(course.id)}">${escapeHtml(course.title)}</a>`).join('');
  document.querySelectorAll('[data-route]').forEach((link) => { const target = link.dataset.route; link.classList.toggle('active', current === target || (target === '/courses' && current.startsWith('/courses/'))); });
  const course = current.startsWith('/courses/') ? courseById(current.split('/')[2]) : null;
  const labels = { '/dashboard':'工作台首页', '/path':'学习地图 / 未来工程路径', '/roadmap':'学习地图 / 四学期学习计划', '/courses':'学习地图 / 课程库', '/tasks':'工作台 / 任务中心', '/growth':'工作台 / 我的成长轨迹', '/resources':'工作台 / 课堂工具箱', '/ml-lab':'工作台 / 可视化 AI 实验室', '/downloads':'工作台 / 课程下载中心', '/showcase':'工作台 / 作品体验区', '/community':'社区与支持 / 学生社区', '/parents':'社区与支持 / 家长观察台', '/teacher':'社区与支持 / 教师控制台' };
  $('#breadcrumb').textContent = `Eureka Boom / ${course ? `课程库 / ${course.title}` : (labels[current] || '工作台首页')}`;
}
function bindForm(formId, endpoint, message) { const form = $(formId); if (!form) return; form.addEventListener('submit', async (event) => { event.preventDefault(); try { await adminApi(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formToObject(form)) }); form.reset(); await reload(); setMessage('#admin-message', message); } catch (error) { setMessage('#admin-message', error.message, true); } }); }
function bindPageEvents(current) {
  if (current === '/dashboard') {
    document.querySelectorAll('[data-mission-mode]').forEach((button) => button.addEventListener('click', () => { state.missionMode = button.dataset.missionMode; localStorage.setItem('eurekaBoomMissionMode', state.missionMode); renderCurrentPage(); }));
    $('#spark-challenge')?.addEventListener('click', () => { state.sparkIndex = (state.sparkIndex + 1) % sparkChallenges.length; sessionStorage.setItem('eurekaBoomSparkIndex', String(state.sparkIndex)); renderCurrentPage(); });
  }
  if (current === '/growth') document.querySelectorAll('[data-growth-mark]').forEach((button) => button.addEventListener('click', () => { toggleStoredMark('growthMarks', 'eurekaBoomGrowthMarks', button.dataset.growthMark); renderCurrentPage(); }));
  if (current === '/tasks') { $('#submission-form')?.addEventListener('submit', async (event) => { event.preventDefault(); try { await api('/api/submissions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formToObject(event.currentTarget)) }); event.currentTarget.reset(); await reload(); setMessage('#submission-message', '已提交！老师会看到你的作品和学习记录。'); } catch (error) { setMessage('#submission-message', error.message, true); } }); }
  if (current === '/resources') { document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.filter; renderCurrentPage(); })); document.querySelectorAll('[data-resource-view]').forEach((button) => button.addEventListener('click', () => { state.resourceView = button.dataset.resourceView; localStorage.setItem('eurekaBoomResourceView', state.resourceView); renderCurrentPage(); })); }
  if (current === '/parents') {
    document.querySelectorAll('[data-parent-signal]').forEach((button) => button.addEventListener('click', () => { toggleStoredMark('parentSignals', 'eurekaBoomParentSignals', button.dataset.parentSignal); renderCurrentPage(); }));
    $('#parent-summary')?.addEventListener('click', () => { const selected = parentObservations.filter((item) => state.parentSignals.includes(item.id)); setMessage('#parent-summary-text', selected.length ? `观察提示：${selected.map((item) => item.title).join('、')}。今晚可以问孩子：“这一次你试过什么？后来改了哪里？”` : '先点选一项真实观察，再生成沟通提示。'); });
  }
  if (current === '/community') { $('#post-form')?.addEventListener('submit', async (event) => { event.preventDefault(); try { await api('/api/community-posts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formToObject(event.currentTarget)) }); event.currentTarget.reset(); await reload(); setMessage('#post-message', '已提交给教师审核，审核后才会展示在班级社区。'); } catch (error) { setMessage('#post-message', error.message, true); } }); }
  if (current === '/teacher') { $('#admin-access-form')?.addEventListener('submit', async (event) => { event.preventDefault(); state.adminToken = new FormData(event.currentTarget).get('adminToken').trim(); sessionStorage.setItem('eurekaBoomAdminToken', state.adminToken); try { await reload(); } catch (error) { state.adminToken = ''; sessionStorage.removeItem('eurekaBoomAdminToken'); renderCurrentPage(); setMessage('#admin-message', error.message, true); } }); $('#clear-admin-access')?.addEventListener('click', () => { state.adminToken = ''; state.pendingPosts = []; state.submissions = []; sessionStorage.removeItem('eurekaBoomAdminToken'); renderCurrentPage(); }); bindForm('#course-form', '/api/admin/course', '课程已发布。'); bindForm('#resource-form', '/api/admin/resource', '资源已发布到工具箱。'); bindForm('#task-form', '/api/admin/task', '任务已发布。'); $('#upload-form')?.addEventListener('submit', async (event) => { event.preventDefault(); try { await adminApi('/api/upload', { method:'POST', body:new FormData(event.currentTarget) }); event.currentTarget.reset(); await reload(); setMessage('#admin-message', '课件已上传并发布。'); } catch (error) { setMessage('#admin-message', error.message, true); } }); document.querySelectorAll('[data-moderation]').forEach((button) => button.addEventListener('click', async () => { const action = button.dataset.moderation; const postId = button.dataset.postId; button.disabled = true; try { await adminApi(`/api/community-posts/${encodeURIComponent(postId)}/${action}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({}) }); await reload(); setMessage('#admin-message', action === 'approve' ? '帖子已公开到学生社区。' : '帖子未公开，已移入审核记录。'); } catch (error) { button.disabled = false; setMessage('#admin-message', error.message, true); } })); }
}
async function reload() { state.data = await api('/api/data'); if (route() === '/teacher' && state.adminToken) { state.submissions = await adminApi('/api/submissions'); state.pendingPosts = await adminApi('/api/pending-posts'); } renderCurrentPage(); }
async function init() { try { await reload(); } catch (error) { $('#app').innerHTML = `<section>${pageHeading('SYSTEM', '平台暂时无法加载', escapeHtml(error.message))}</section>`; return; } window.addEventListener('hashchange', () => { reload().catch((error) => { $('#app').innerHTML = `<section>${pageHeading('SYSTEM', '平台暂时无法加载', escapeHtml(error.message))}</section>`; }); }); }
init();
