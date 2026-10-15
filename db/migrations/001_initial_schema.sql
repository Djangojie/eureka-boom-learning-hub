CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  login_name VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(254) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  status ENUM('active', 'invited', 'disabled') NOT NULL DEFAULT 'invited',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE student_profiles (
  user_id CHAR(36) PRIMARY KEY,
  guardian_note VARCHAR(300) NULL,
  CONSTRAINT fk_student_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE parent_student_links (
  parent_user_id CHAR(36) NOT NULL,
  student_user_id CHAR(36) NOT NULL,
  relationship_label VARCHAR(40) NOT NULL DEFAULT '家长',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (parent_user_id, student_user_id),
  CONSTRAINT fk_parent_link_parent FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_parent_link_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE courses (
  id VARCHAR(80) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  audience VARCHAR(120) NULL,
  description TEXT NOT NULL,
  color VARCHAR(24) NOT NULL DEFAULT 'purple',
  progress TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_course_progress CHECK (progress <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE course_modules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL,
  UNIQUE KEY uq_course_module_order (course_id, sort_order),
  CONSTRAINT fk_course_module_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE enrollments (
  user_id CHAR(36) NOT NULL,
  course_id VARCHAR(80) NOT NULL,
  enrollment_status ENUM('active', 'completed', 'archived') NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id),
  CONSTRAINT fk_enrollment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE resources (
  id VARCHAR(100) PRIMARY KEY,
  course_id VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  resource_type VARCHAR(60) NOT NULL DEFAULT '课堂资料',
  url VARCHAR(1024) NOT NULL,
  note VARCHAR(500) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_resources_course (course_id),
  CONSTRAINT fk_resource_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_resource_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tasks (
  id VARCHAR(100) PRIMARY KEY,
  course_id VARCHAR(80) NOT NULL,
  title VARCHAR(180) NOT NULL,
  status_label VARCHAR(40) NOT NULL DEFAULT '新任务',
  due_label VARCHAR(60) NOT NULL DEFAULT '待定',
  description TEXT NOT NULL,
  published_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tasks_course (course_id),
  CONSTRAINT fk_task_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_publisher FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE task_steps (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL,
  UNIQUE KEY uq_task_step_order (task_id, sort_order),
  CONSTRAINT fk_task_step_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE files (
  id CHAR(36) PRIMARY KEY,
  owner_user_id CHAR(36) NULL,
  course_id VARCHAR(80) NULL,
  storage_provider ENUM('oss') NOT NULL DEFAULT 'oss',
  object_key VARCHAR(1024) NOT NULL UNIQUE,
  original_filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  byte_size BIGINT UNSIGNED NOT NULL,
  access_scope ENUM('private', 'course') NOT NULL DEFAULT 'private',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_files_course (course_id),
  CONSTRAINT fk_file_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_file_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE submissions (
  id CHAR(36) PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL,
  student_user_id CHAR(36) NULL,
  student_display_name VARCHAR(80) NOT NULL,
  work_link VARCHAR(1024) NULL,
  reflection TEXT NOT NULL,
  question VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_submissions_task (task_id),
  KEY idx_submissions_student (student_user_id),
  CONSTRAINT fk_submission_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE community_posts (
  id CHAR(36) PRIMARY KEY,
  author_user_id CHAR(36) NULL,
  author_name VARCHAR(80) NOT NULL,
  tag VARCHAR(60) NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  reply_count INT UNSIGNED NOT NULL DEFAULT 0,
  review_status ENUM('pending', 'published', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_by CHAR(36) NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_posts_review_status (review_status, created_at),
  CONSTRAINT fk_post_author FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_post_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE moderation_events (
  id CHAR(36) PRIMARY KEY,
  post_id CHAR(36) NOT NULL,
  teacher_user_id CHAR(36) NULL,
  action ENUM('approved', 'rejected') NOT NULL,
  reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_moderation_post (post_id),
  CONSTRAINT fk_moderation_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_moderation_teacher FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  actor_user_id CHAR(36) NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id VARCHAR(100) NULL,
  detail_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_actor_time (actor_user_id, created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
