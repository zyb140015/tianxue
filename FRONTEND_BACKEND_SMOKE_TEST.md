# 前后端联调 Smoke Test

## 1. 目标

本文档用于快速验证：

- 前端是否成功连到 Go 后端
- 登录是否成功
- 题库是否读取真实数据库数据
- 收藏 / 已学习 / 未掌握是否能回显
- history / stats 是否正常读写

---

## 2. 启动顺序

### 2.1 启动 MySQL

```bash
cd /Users/zhangyibo/Desktop/app-backend
docker compose up -d
```

### 2.2 启动后端

```bash
cd /Users/zhangyibo/Desktop/app-backend
cp env.sample .env
APP_PORT=18088 go run ./cmd/api
```

### 2.3 启动前端

```bash
cd /Users/zhangyibo/Desktop/app
npm run start
```

---

## 3. 当前默认联调地址

前端当前固定访问：

```txt
https://xnyb.online/tianxue/api/v1
```

如果你后端改了端口，则需要同步修改：

- `src/constants/api.ts`

中的地址改成：

```ts
export const backendApiBaseUrl = 'https://xnyb.online/tianxue/api/v1';
```

---

## 4. 联调检查清单

## 4.1 登录

在登录页输入：

- 账号：`demo@example.com`
- 密码：`123456`

预期：

- 登录成功
- 跳转首页
- session 中保存 token

---

## 4.2 首页用户信息

预期：

- 首页用户名来自 `/users/me`
- 我的页用户名来自 `/users/me`

---

## 4.3 题库列表

进入题库页，预期：

- 题目列表来自后端 `/questions`
- 分类来自 `/questions/categories`
- 标签来自 `/questions/tags`
- 列表不是空白（seed 已写入 1 道题）

---

## 4.4 题目详情

点击题目进入详情页，预期：

- 标题、题干、答案来自后端 `/questions/:id`
- 相关推荐能正常展示（前端本地基于当前列表计算）

---

## 4.5 收藏状态联调

在详情页点击“收藏题目”。

预期：

1. 后端调用：
   - `POST /questions/:id/favorite`
2. 再刷新题库或详情：
   - `isFavorite = true`
3. 收藏页能看到该题

取消收藏时：

1. 后端调用：
   - `DELETE /questions/:id/favorite`
2. 再刷新列表/详情：
   - `isFavorite = false`

---

## 4.6 已学习 / 未掌握状态联调

在详情页点击：

- 标记已学习
- 标记未掌握

预期：

- 后端状态接口成功
- 列表与详情页能回显最新状态

---

## 4.7 浏览记录联调

进入题目详情页后，预期：

- 会调用 `POST /history/viewed`
- 首页 / 我的页 / 统计页最近浏览能看到新记录

---

## 4.8 模拟面试记录联调

进入模拟面试页：

- 开始一轮
- 下一题或完成记录

预期：

- 会调用 `POST /history/interview`
- 首页 / 我的页 / 统计页最近练习能看到新记录

---

## 4.9 统计页联调

进入统计页，预期：

- `/stats/overview` 返回学习总览
- `/stats/categories` 返回分类掌握度
- 删除单条记录、清空记录后页面会刷新

---

## 5. 常见问题

### 问题 1：前端登录失败

检查：

1. 后端端口是否和 `src/constants/api.ts` 一致
2. 后端是否正在运行
3. 浏览器控制台是否有网络错误

### 问题 2：前端能登录，但题库为空

检查：

1. 后端是否连接到 Docker MySQL
2. 是否执行了 AutoMigrate + Seed
3. 数据库中 `questions` 表是否已有数据

### 问题 3：stats 页面报错

优先检查：

1. 是否带 token
2. 后端 `/stats/overview` 是否正常返回
3. 后端 `/stats/categories` 是否正常返回

---

## 6. 当前建议

在继续开发前，至少先确认：

- 登录成功
- 题库可读
- 收藏状态可更新并回显
- history 能记录
- stats 能展示

做到这一步，前后端主链路就算真正打通了。
