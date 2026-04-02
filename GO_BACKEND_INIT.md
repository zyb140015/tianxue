# Go 后端项目初始化方案

## 1. 目标

为当前前端面试 App 创建一个适合学习的 Go 后端项目。

要求：

- 技术栈清晰稳定
- 分层明确
- 注释足够多
- 方便后续接 MySQL 和前端接口

---

## 2. 建议项目位置

建议在当前项目根目录下新增：

```txt
backend/
```

这样前后端可以放在同一个项目目录里，便于学习和联调。

---

## 3. 初始化顺序

### 第一步：创建后端目录

```txt
backend/
```

### 第二步：初始化 go module

模块名建议用你自己的仓库路径，例如：

```txt
github.com/yourname/frontend-interview-app/backend
```

### 第三步：建立最小目录结构

先创建：

- `cmd/api`
- `internal/config`
- `internal/database`
- `internal/handler`
- `internal/service`
- `internal/repository`
- `internal/model`
- `internal/middleware`
- `internal/response`
- `internal/bootstrap`
- `pkg/logger`
- `migrations`

### 第四步：安装依赖

第一版依赖只装必要的：

- Gin
- GORM
- MySQL Driver
- godotenv
- JWT
- validator

### 第五步：先让服务能启动

先实现：

- 健康检查接口 `/health`
- 配置加载
- 数据库初始化占位
- 路由注册占位

只要服务能跑起来，再继续加功能。

---

## 4. 第一版先不要做的事

初始化阶段先不要做：

- 复杂权限系统
- 消息队列
- 微服务拆分
- DDD 大型架构
- 太早写抓取系统
- 太早写管理后台

---

## 5. 第一版最小可运行目标

后端初始化完成后，至少满足：

1. `go run ./cmd/api` 能启动
2. 能读取 `.env`
3. 能连接 MySQL（先可占位）
4. 有 `/health` 接口
5. 有统一响应格式
6. 有基础日志输出

---

## 6. 完成初始化后立刻做什么

初始化完成后，建议马上进入：

1. 数据库迁移
2. users 表
3. questions 表
4. 登录接口
5. 题库列表接口

---

## 7. 学习建议

因为你是通过项目学习后端，所以建议：

1. 每层都写清楚注释
2. 每实现一个接口就本地调通一次
3. 不要一开始把所有模块一起写
4. 先把“能跑通”放在“架构高级”前面

---

## 8. 推荐下一步

初始化后建议按顺序继续：

1. 数据库 migration
2. 登录
3. 获取当前用户
4. 题库列表
5. 题库详情
6. 收藏/已学习/未掌握
