const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createPool } = require('./pool');

const STORE_FILE = path.join(__dirname, '..', 'data', 'store.json');
const isoOrNow = (value) => value && !Number.isNaN(Date.parse(value)) ? new Date(value) : new Date();

async function main() {
  const store = JSON.parse(await fs.readFile(STORE_FILE, 'utf8'));
  const pool = createPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const course of store.courses || []) {
      await connection.execute(`INSERT INTO courses (id, title, audience, description, color, progress)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title=VALUES(title), audience=VALUES(audience), description=VALUES(description), color=VALUES(color), progress=VALUES(progress)`,
      [course.id, course.title, course.audience || null, course.description, course.color || 'purple', course.progress || 0]);
      await connection.execute('DELETE FROM course_modules WHERE course_id = ?', [course.id]);
      for (const [index, title] of (course.modules || []).entries()) {
        await connection.execute('INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, ?, ?)', [course.id, title, index + 1]);
      }
    }
    for (const resource of store.resources || []) {
      await connection.execute(`INSERT INTO resources (id, course_id, title, resource_type, url, note)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE course_id=VALUES(course_id), title=VALUES(title), resource_type=VALUES(resource_type), url=VALUES(url), note=VALUES(note)`,
      [resource.id, resource.courseId, resource.title, resource.type || '课堂资料', resource.url, resource.note || null]);
    }
    for (const task of store.tasks || []) {
      await connection.execute(`INSERT INTO tasks (id, course_id, title, status_label, due_label, description)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE course_id=VALUES(course_id), title=VALUES(title), status_label=VALUES(status_label), due_label=VALUES(due_label), description=VALUES(description)`,
      [task.id, task.courseId, task.title, task.status || '新任务', task.due || '待定', task.description]);
      await connection.execute('DELETE FROM task_steps WHERE task_id = ?', [task.id]);
      for (const [index, description] of (task.steps || []).entries()) {
        await connection.execute('INSERT INTO task_steps (task_id, description, sort_order) VALUES (?, ?, ?)', [task.id, description, index + 1]);
      }
    }
    const allPosts = [
      ...(store.posts || []).map((post) => ({ ...post, review_status: 'published' })),
      ...(store.pendingPosts || []).map((post) => ({ ...post, review_status: 'pending' })),
      ...(store.rejectedPosts || []).map((post) => ({ ...post, review_status: 'rejected' }))
    ];
    for (const post of allPosts) {
      await connection.execute(`INSERT INTO community_posts (id, author_name, tag, title, body, reply_count, review_status, created_at, reviewed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE author_name=VALUES(author_name), tag=VALUES(tag), title=VALUES(title), body=VALUES(body), reply_count=VALUES(reply_count), review_status=VALUES(review_status), reviewed_at=VALUES(reviewed_at)`,
      [post.id, post.author, post.tag || '学习交流', post.title, post.body, post.replies || 0, post.review_status, isoOrNow(post.createdAt), post.publishedAt ? isoOrNow(post.publishedAt) : (post.rejectedAt ? isoOrNow(post.rejectedAt) : null)]);
    }
    for (const submission of store.submissions || []) {
      const id = submission.id || randomUUID();
      await connection.execute(`INSERT INTO submissions (id, task_id, student_display_name, work_link, reflection, question, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE work_link=VALUES(work_link), reflection=VALUES(reflection), question=VALUES(question)`,
      [id, submission.taskId, submission.student || '未命名学生', submission.link || null, submission.reflection, submission.question || null, isoOrNow(submission.createdAt)]);
    }
    await connection.commit();
    console.log(`已导入：${(store.courses || []).length} 门课程、${(store.resources || []).length} 条资料、${(store.tasks || []).length} 个任务、${allPosts.length} 条社区帖子、${(store.submissions || []).length} 份提交。`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => { console.error(`JSON 导入失败：${error.message}`); process.exitCode = 1; });
