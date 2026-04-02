# 后端开发清单

## P0：基础工程

- [ ] 选择后端技术栈（建议 Go + Gin + GORM + MySQL）
- [ ] 初始化项目结构
- [ ] 配置环境变量
- [ ] 配置日志
- [ ] 配置数据库连接
- [ ] 配置迁移工具
- [ ] 配置基础错误处理
- [ ] 配置统一响应格式

---

## P1：数据库与模型

- [ ] 建 users 表
- [ ] 建 categories 表
- [ ] 建 tags 表
- [ ] 建 questions 表
- [ ] 建 question_tags 表
- [ ] 建 user_question_states 表
- [ ] 建 user_view_histories 表
- [ ] 建 mock_interview_records 表
- [ ] 补基础索引

---

## P2：鉴权与用户接口

- [ ] 登录接口 `/auth/login`
- [ ] 获取当前用户 `/users/me`
- [ ] token 校验中间件

---

## P3：题库接口

- [ ] 题目列表 `/questions`
- [ ] 题目详情 `/questions/:id`
- [ ] 分类列表 `/questions/categories`
- [ ] 标签列表 `/questions/tags`
- [ ] 相关推荐 `/questions/:id/related`

题目列表需支持：

- [ ] search
- [ ] category
- [ ] difficulty
- [ ] tag
- [ ] favoriteOnly
- [ ] unlearnedOnly
- [ ] needsReviewOnly
- [ ] sort

---

## P4：学习状态接口

- [ ] 收藏题目
- [ ] 取消收藏
- [ ] 标记已学习
- [ ] 标记未掌握
- [ ] 取消未掌握

---

## P5：记录接口

### 浏览记录

- [ ] 获取最近浏览
- [ ] 新增浏览记录
- [ ] 删除单条浏览记录
- [ ] 清空浏览记录

### 模拟面试记录

- [ ] 获取练习记录
- [ ] 新增练习记录
- [ ] 删除单条练习记录
- [ ] 清空练习记录

---

## P6：统计接口

- [ ] 学习总览 `/stats/overview`
- [ ] 分类掌握度 `/stats/categories`

---

## P7：题库导入 / 抓取

- [ ] 确定抓取来源
- [ ] 评估来源网站的 robots / 使用条款 /版权风险
- [ ] 编写抓取脚本或导入脚本
- [ ] 清洗 HTML / Markdown 内容
- [ ] 标签规范化
- [ ] 分类规范化
- [ ] 去重策略（标题 + 来源 + 内容 hash）
- [ ] 入库脚本

---

## P8：测试与联调

- [ ] 接口单元测试
- [ ] 数据库集成测试
- [ ] 前后端联调
- [ ] mock service 替换为真实 API service

---

## 推荐实施顺序

1. 初始化 Go 项目
2. 配置数据库和 migration
3. 登录接口
4. 题库列表/详情
5. 收藏/已学习/未掌握
6. 浏览/练习记录
7. 统计接口
8. 题库抓取导入

---

## 当前最值得先做的 5 件事

1. 初始化 Go 后端项目
2. 建表
3. 做 `/questions`
4. 做 `/questions/:id`
5. 做状态接口（收藏/已学习/未掌握）
