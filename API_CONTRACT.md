# 前端面试 App API Contract

## 1. 目标

本文档定义前端 V1 对后端的最小接口契约，目标是让当前 mock service 能平滑替换为真实 API。

---

## 2. 通用约定

### Base URL

```txt
/api/v1
```

### 响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

### 错误格式

```json
{
  "code": 4001,
  "message": "invalid params",
  "data": null
}
```

### 鉴权方式

V1 建议：

- `Authorization: Bearer <token>`

---

## 3. 数据模型

### User

```ts
type UserDto = {
  id: string;
  name: string;
  avatar: string;
  streakDays: number;
  learnedCount: number;
  favoriteCount: number;
};
```

### Question

```ts
type QuestionDto = {
  id: string;
  title: string;
  content: string;
  answer: string;
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  isFavorite: boolean;
  isLearned: boolean;
  needsReview: boolean;
};
```

### MockInterviewRecord

```ts
type MockInterviewRecordDto = {
  id: string;
  questionId: string;
  startedAt: string;
  duration: number;
};
```

### RecentViewedRecord

```ts
type RecentViewedRecordDto = {
  id: string;
  questionId: string;
  viewedAt: string;
};
```

---

## 4. Auth 接口

### 4.1 假登录 / 登录

```http
POST /auth/login
```

Request:

```json
{
  "identifier": "user@example.com",
  "password": "123456"
}
```

Response:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "u1",
      "name": "前端候选人",
      "avatar": "👨‍💻",
      "streakDays": 7,
      "learnedCount": 10,
      "favoriteCount": 5
    }
  }
}
```

---

## 5. 用户接口

### 5.1 获取当前用户

```http
GET /users/me
```

Response:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "u1",
    "name": "前端候选人",
    "avatar": "👨‍💻",
    "streakDays": 7,
    "learnedCount": 10,
    "favoriteCount": 5
  }
}
```

---

## 6. 题库接口

### 6.1 获取题目列表

```http
GET /questions
```

Query params:

- `search?: string`
- `category?: string`
- `difficulty?: easy|medium|hard`
- `tag?: string`
- `favoriteOnly?: boolean`
- `unlearnedOnly?: boolean`
- `needsReviewOnly?: boolean`
- `sort?: default|difficulty|favorites-first`

Response:

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "q1",
      "title": "React Native 中 bridge 的作用是什么？",
      "content": "...",
      "answer": "...",
      "category": "react-native",
      "tags": ["RN", "架构"],
      "difficulty": "medium",
      "isFavorite": true,
      "isLearned": false,
      "needsReview": true
    }
  ]
}
```

### 6.2 获取题目详情

```http
GET /questions/:id
```

### 6.3 获取分类列表

```http
GET /questions/categories
```

### 6.4 获取标签列表

```http
GET /questions/tags
```

### 6.5 获取相关推荐

```http
GET /questions/:id/related
```

---

## 7. 学习状态接口

### 7.1 收藏题目

```http
POST /questions/:id/favorite
```

### 7.2 取消收藏

```http
DELETE /questions/:id/favorite
```

### 7.3 标记已学习

```http
POST /questions/:id/learned
```

### 7.4 标记未掌握

```http
POST /questions/:id/review
```

### 7.5 取消未掌握

```http
DELETE /questions/:id/review
```

---

## 8. 浏览记录接口

### 8.1 获取最近浏览

```http
GET /history/viewed
```

### 8.2 新增浏览记录

```http
POST /history/viewed
```

Request:

```json
{
  "questionId": "q1"
}
```

### 8.3 删除单条浏览记录

```http
DELETE /history/viewed/:id
```

### 8.4 清空浏览记录

```http
DELETE /history/viewed
```

---

## 9. 模拟面试记录接口

### 9.1 获取练习记录

```http
GET /history/interview
```

### 9.2 新增练习记录

```http
POST /history/interview
```

Request:

```json
{
  "questionId": "q1",
  "duration": 95
}
```

### 9.3 删除单条练习记录

```http
DELETE /history/interview/:id
```

### 9.4 清空练习记录

```http
DELETE /history/interview
```

---

## 10. 统计接口

### 10.1 获取学习统计

```http
GET /stats/overview
```

Response:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "totalQuestionCount": 100,
    "learnedCount": 35,
    "favoriteCount": 12,
    "needsReviewCount": 8,
    "averageInterviewDuration": 88
  }
}
```

### 10.2 获取分类掌握度

```http
GET /stats/categories
```

Response:

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "category": "react-native",
      "total": 20,
      "learned": 8,
      "review": 3,
      "progress": 40
    }
  ]
}
```

---

## 11. 前端替换建议

当前前端 mock service 替换成真实 API 时，建议按以下顺序：

1. 保持类型结构不变
2. 先替换 `questionService`
3. 再替换 `userService`
4. 再替换 `recentViewedService`
5. 再替换 `mockInterviewService`
6. 最后把本地状态与服务端同步策略补齐

---

## 12. 当前推荐后端优先级

建议最先做：

1. `/auth/login`
2. `/users/me`
3. `/questions`
4. `/questions/:id`
5. 收藏 / 已学习 / 未掌握状态接口
6. 浏览与练习记录接口
7. 统计接口
