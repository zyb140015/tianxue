# 前端面试 App 数据库表设计

## 1. 目标

当前前端已经具备：

- 用户登录
- 题库浏览
- 收藏
- 已学习
- 未掌握
- 最近浏览
- 模拟面试记录
- 学习统计

因此后端数据库需要优先支持：

1. 用户体系
2. 题库内容
3. 用户题目状态
4. 浏览记录
5. 模拟面试记录
6. 统计所需查询

建议先使用 **MySQL**。

---

## 2. 命名约定

- 表名：`snake_case`
- 主键：`id`，推荐 `bigint unsigned` 或 `varchar(36)`
- 时间字段：
  - `created_at`
  - `updated_at`
- 软删除如需要：`deleted_at`

---

## 3. 核心表

## 3.1 users

用户表。

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NULL UNIQUE,
  phone VARCHAR(30) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

说明：

- `status`：1 启用，0 禁用
- 登录可先支持邮箱/手机号二选一

---

## 3.2 categories

题目分类表。

```sql
CREATE TABLE categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

示例：

- javascript
- typescript
- react
- react-native

---

## 3.3 tags

题目标签表。

```sql
CREATE TABLE tags (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 3.4 questions

题目主表。

```sql
CREATE TABLE questions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  source_type VARCHAR(50) NULL,
  source_url VARCHAR(500) NULL,
  source_name VARCHAR(150) NULL,
  review_status TINYINT NOT NULL DEFAULT 1,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_questions_category FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

字段说明：

- `source_type`：manual / imported / crawled
- `review_status`：1 可用，0 待审核
- `source_url`：抓取来源地址

---

## 3.5 question_tags

题目与标签多对多关系表。

```sql
CREATE TABLE question_tags (
  question_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (question_id, tag_id),
  CONSTRAINT fk_question_tags_question FOREIGN KEY (question_id) REFERENCES questions(id),
  CONSTRAINT fk_question_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

---

## 3.6 user_question_states

用户题目状态表，统一存：

- 是否收藏
- 是否已学习
- 是否未掌握
- 最近学习时间

```sql
CREATE TABLE user_question_states (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  is_favorite TINYINT NOT NULL DEFAULT 0,
  is_learned TINYINT NOT NULL DEFAULT 0,
  needs_review TINYINT NOT NULL DEFAULT 0,
  last_learned_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_question_state (user_id, question_id),
  CONSTRAINT fk_user_question_states_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_question_states_question FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

说明：

- 这个表足够支撑前端当前所有题目状态交互

---

## 3.7 user_view_histories

用户浏览记录表。

```sql
CREATE TABLE user_view_histories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  viewed_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_view_histories_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_view_histories_question FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

说明：

- 如果你只想保留“最近浏览”，也可以后端按 `(user_id, question_id)` 做覆盖更新
- 当前前端更像保留一个最近列表，建议保留多条，再按时间取最近 N 条

---

## 3.8 mock_interview_records

模拟面试记录表。

```sql
CREATE TABLE mock_interview_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  duration INT NOT NULL,
  started_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mock_interview_records_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_mock_interview_records_question FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

---

## 4. 推荐索引

```sql
CREATE INDEX idx_questions_category_id ON questions(category_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_user_question_states_user_id ON user_question_states(user_id);
CREATE INDEX idx_user_question_states_question_id ON user_question_states(question_id);
CREATE INDEX idx_user_view_histories_user_viewed_at ON user_view_histories(user_id, viewed_at DESC);
CREATE INDEX idx_mock_interview_records_user_started_at ON mock_interview_records(user_id, started_at DESC);
```

如果题量变大，建议再加：

- `questions(title)` 全文索引或搜索引擎方案

---

## 5. 可选扩展表

## 5.1 import_jobs

用于题库抓取/导入任务记录。

```sql
CREATE TABLE import_jobs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  source_name VARCHAR(150) NOT NULL,
  source_url VARCHAR(500) NULL,
  status ENUM('pending', 'running', 'success', 'failed') NOT NULL DEFAULT 'pending',
  total_count INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 5.2 question_sources

如果后续希望跟踪多来源原始数据，可拆这张表。

---

## 6. 当前最小落地建议

如果你想尽快接后端，第一版只建下面 8 张表即可：

1. users
2. categories
3. tags
4. questions
5. question_tags
6. user_question_states
7. user_view_histories
8. mock_interview_records

---

## 7. 与前端现状的对应关系

- 首页统计 → `user_question_states` + `mock_interview_records`
- 题库列表 → `questions` + `categories` + `tags` + `user_question_states`
- 收藏页 → `user_question_states.is_favorite = 1`
- 未学习 → `user_question_states.is_learned = 0`
- 未掌握 → `user_question_states.needs_review = 1`
- 最近浏览 → `user_view_histories`
- 模拟面试 → `mock_interview_records`

---

## 8. 后续建议

如果题库数据要从网上抓：

1. 先做抓取源管理
2. 再做导入任务表
3. 题目入库前做清洗和去重
4. 保留 `source_url` 和 `source_name`

这样后面更好维护。
