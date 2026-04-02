# Go 后端技术选型与初始化方案

## 1. 目标

你希望：

- 使用 **Go** 做后端
- 技术栈尽量新，但要稳定
- 项目不仅能跑，还要适合学习后端
- 代码要有**重度注释**，方便理解

因此后端方案应该满足：

1. 结构清晰
2. 分层明确
3. 不过度复杂
4. 适合从小项目逐步扩展

---

## 2. 推荐技术栈

## 2.1 语言与版本

- **Go 1.24+**（使用当前稳定版本即可）

原因：

- 标准库强
- 编译速度快
- 适合做 API 服务
- 学习后端时，比很多动态语言更容易建立“类型 + 边界 + 分层”的概念

---

## 2.2 Web 框架

- **Gin**

原因：

- 社区成熟
- 文档多
- 上手快
- 适合学习 REST API
- 对初学者比更“重”的框架友好

> 你后期也可以切到 Echo / Fiber / Chi，但第一版建议 Gin。

---

## 2.3 配置管理

- 标准库 `os`
- `.env`
- `godotenv`

原因：

- 简单直接
- 足够当前项目使用

---

## 2.4 数据库

- **MySQL 8**

原因：

- 你前面已经按 MySQL 思路设计了表
- 常见、稳定、资料多
- 适合学习后端数据库建模

---

## 2.5 ORM / 数据访问

- **GORM**（第一版推荐）

原因：

- 对学习型项目更友好
- migration、模型映射、关联关系更快起步
- 可以先用 ORM 建立后端认知，再逐步补 SQL 能力

> 如果你后面要做更高性能、SQL 更可控的版本，再考虑 `sqlc` 或 `ent`。

---

## 2.6 参数校验

- `go-playground/validator/v10`

原因：

- Gin 常用
- 适合做请求参数验证

---

## 2.7 鉴权

- **JWT**
- 推荐库：`golang-jwt/jwt/v5`

原因：

- 当前项目是移动端/前后端分离场景
- JWT 足够应对第一版登录态

---

## 2.8 日志

- **slog**（Go 标准库）

原因：

- 新标准
- 足够当前项目
- 不需要额外引入复杂日志库

---

## 2.9 API 文档

- **Swagger / OpenAPI**
- 推荐：`swaggo/swag`

原因：

- 你是学习型项目
- 接口文档自动生成会很有帮助

---

## 2.10 测试

- Go 标准测试 `testing`
- 表驱动测试
- `httptest`

---

## 2.11 容器化

- Docker
- Docker Compose

原因：

- 本地起 MySQL 很方便
- 后期部署更顺滑

---

## 3. 推荐项目结构

```txt
backend/
  cmd/
    api/
      main.go

  internal/
    config/
    database/
    model/
    repository/
    service/
    handler/
    middleware/
    response/
    auth/
    bootstrap/

  pkg/
    logger/
    utils/

  migrations/
  docs/
  scripts/

  .env.example
  go.mod
  go.sum
  Dockerfile
  docker-compose.yml
  Makefile
```

---

## 4. 每层职责

### cmd/api

- 程序入口
- 只负责启动，不写业务

### internal/config

- 读取环境变量
- 统一配置结构

### internal/database

- 初始化数据库连接
- 配置 GORM

### internal/model

- 数据库模型定义

### internal/repository

- 负责数据库读写
- 不写 HTTP 逻辑

### internal/service

- 负责业务逻辑
- 组合 repository

### internal/handler

- 负责 HTTP 请求和响应
- 参数绑定
- 调 service

### internal/middleware

- JWT 中间件
- 日志中间件
- 错误处理中间件

### internal/response

- 统一 API 响应格式

### internal/auth

- JWT 生成与解析

---

## 5. 推荐初始化依赖

建议第一版安装：

```bash
go get github.com/gin-gonic/gin
go get gorm.io/gorm
go get gorm.io/driver/mysql
go get github.com/joho/godotenv
go get github.com/golang-jwt/jwt/v5
go get github.com/go-playground/validator/v10
go get github.com/swaggo/gin-swagger
go get github.com/swaggo/files
```

---

## 6. 第一阶段推荐实现顺序

1. 初始化 Go 项目
2. 配置 Gin
3. 配置环境变量
4. 配置 MySQL 连接
5. 建 users / questions / states 等核心表
6. 做登录接口
7. 做题库列表和详情接口
8. 做收藏 / 已学习 / 未掌握接口
9. 做浏览与练习记录接口
10. 做统计接口

---

## 7. 为什么这套方案适合你

因为你说：

- 不是很懂后端
- 想通过项目学习后端
- 需要重注释

所以不应该上来就选过于复杂的架构。

这套方案的优点是：

1. **足够现代**
2. **足够稳定**
3. **容易学**
4. **未来能扩展**

---

## 8. 当前推荐结论

### 第一版后端建议固定为：

- Go 1.24+
- Gin
- GORM
- MySQL 8
- JWT
- slog
- Swagger
- Docker Compose

这是当前最适合你这个项目、也最适合“边做边学”的方案。
