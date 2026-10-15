const { createPool } = require('./pool');

const asIso = (value) => value instanceof Date ? value.toISOString() : value || undefined;
const groupBy = (rows, key) => rows.reduce((result, row) => {
  (result[row[key]] ||= []).push(row);
  return result;
}, {});

async function readDatabaseStore() {
  const pool = createPool();
  try {
    const [[courses], [modules], [resources], [tasks], [steps], [posts], [submissions]] = await Promise.all([
      pool.query('SELECT id, title, audience, description, color, progress FROM courses ORDER BY created_at'),
      pool.query('SELECT course_id, title FROM course_modules ORDER BY course_id, sort_order'),
      pool.query('SELECT id, course_id, title, resource_type, url, note FROM resources ORDER BY created_at DESC'),
      pool.query('SELECT id, course_id, title, status_label, due_label, description FROM tasks ORDER BY created_at DESC'),
      pool.query('SELECT task_id, description FROM task_steps ORDER BY task_id, sort_order'),
      pool.query('SELECT id, author_name, tag, title, body, reply_count, review_status, created_at, reviewed_at FROM community_posts ORDER BY created_at DESC'),
      pool.query('SELECT id, task_id, student_display_name, work_link, reflection, question, created_at FROM submissions ORDER BY created_at DESC')
    ]);
    const modulesByCourse = groupBy(modules, 'course_id');
    const stepsByTask = groupBy(steps, 'task_id');
    const toPost = (post) => ({
      id: post.id, author: post.author_name, tag: post.tag, title: post.title, body: post.body,
      replies: post.reply_count, createdAt: asIso(post.created_at),
      ...(post.review_status === 'published' ? { publishedAt: asIso(post.reviewed_at) } : {}),
      ...(post.review_status === 'rejected' ? { rejectedAt: asIso(post.reviewed_at) } : {})
    });
    return {
      courses: courses.map((course) => ({ ...course, modules: (modulesByCourse[course.id] || []).map((module) => module.title) })),
      resources: resources.map((resource) => ({ id: resource.id, courseId: resource.course_id, title: resource.title, type: resource.resource_type, url: resource.url, note: resource.note })),
      tasks: tasks.map((task) => ({ id: task.id, courseId: task.course_id, title: task.title, status: task.status_label, due: task.due_label, description: task.description, steps: (stepsByTask[task.id] || []).map((step) => step.description) })),
      posts: posts.filter((post) => post.review_status === 'published').map(toPost),
      pendingPosts: posts.filter((post) => post.review_status === 'pending').map(toPost),
      rejectedPosts: posts.filter((post) => post.review_status === 'rejected').map(toPost),
      submissions: submissions.map((submission) => ({ id: submission.id, taskId: submission.task_id, student: submission.student_display_name, link: submission.work_link, reflection: submission.reflection, question: submission.question, createdAt: asIso(submission.created_at) }))
    };
  } finally {
    await pool.end();
  }
}

async function writeDatabaseStore(store) {
  const pool = createPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const course of store.courses || []) {
      await connection.execute(`INSERT INTO courses (id, title, audience, description, color, progress) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title=VALUES(title), audience=VALUES(audience), description=VALUES(description), color=VALUES(color), progress=VALUES(progress)`,
      [course.id, course.title, course.audience || null, course.description, course.color || 'purple', course.progress || 0]);
      await connection.execute('DELETE FROM course_modules WHERE course_id = ?', [course.id]);
      for (const [index, module] of (course.modules || []).entries()) await connection.execute('INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, ?, ?)', [course.id, module, index + 1]);
    }
    for (const resource of store.resources || []) {
      await connection.execute(`INSERT INTO resources (id, course_id, title, resource_type, url, note) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE course_id=VALUES(course_id), title=VALUES(title), resource_type=VALUES(resource_type), url=VALUES(url), note=VALUES(note)`,
      [resource.id, resource.courseId, resource.title, resource.type || '课堂资料', resource.url, resource.note || null]);
    }
    for (const task of store.tasks || []) {
      await connection.execute(`INSERT INTO tasks (id, course_id, title, status_label, due_label, description) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE course_id=VALUES(course_id), title=VALUES(title), status_label=VALUES(status_label), due_label=VALUES(due_label), description=VALUES(description)`,
      [task.id, task.courseId, task.title, task.status || '新任务', task.due || '待定', task.description]);
      await connection.execute('DELETE FROM task_steps WHERE task_id = ?', [task.id]);
      for (const [index, step] of (task.steps || []).entries()) await connection.execute('INSERT INTO task_steps (task_id, description, sort_order) VALUES (?, ?, ?)', [task.id, step, index + 1]);
    }
    const posts = [
      ...(store.posts || []).map((post) => ({ ...post, reviewStatus: 'published', reviewedAt: post.publishedAt || new Date().toISOString() })),
      ...(store.pendingPosts || []).map((post) => ({ ...post, reviewStatus: 'pending', reviewedAt: null })),
      ...(store.rejectedPosts || []).map((post) => ({ ...post, reviewStatus: 'rejected', reviewedAt: post.rejectedAt || new Date().toISOString() }))
    ];
    for (const post of posts) {
      await connection.execute(`INSERT INTO community_posts (id, author_name, tag, title, body, reply_count, review_status, created_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE author_name=VALUES(author_name), tag=VALUES(tag), title=VALUES(title), body=VALUES(body), reply_count=VALUES(reply_count), review_status=VALUES(review_status), reviewed_at=VALUES(reviewed_at)`,
      [post.id, post.author, post.tag || '学习交流', post.title, post.body, post.replies || 0, post.reviewStatus, post.createdAt ? new Date(post.createdAt) : new Date(), post.reviewedAt ? new Date(post.reviewedAt) : null]);
    }
    for (const submission of store.submissions || []) {
      await connection.execute(`INSERT INTO submissions (id, task_id, student_display_name, work_link, reflection, question, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE work_link=VALUES(work_link), reflection=VALUES(reflection), question=VALUES(question)`,
      [submission.id, submission.taskId, submission.student || '未命名学生', submission.link || null, submission.reflection, submission.question || null, submission.createdAt ? new Date(submission.createdAt) : new Date()]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

module.exports = { readDatabaseStore, writeDatabaseStore };
