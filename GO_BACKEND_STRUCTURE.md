# Go 后端目录脚手架说明

## 1. 推荐目录结构

```txt
backend/
  cmd/
    api/
      main.go

  internal/
    bootstrap/
      app.go
    config/
      config.go
    database/
      mysql.go
    handler/
      health_handler.go
      auth_handler.go
      question_handler.go
      user_handler.go
      stats_handler.go
    middleware/
      auth_middleware.go
      logger_middleware.go
    model/
      user.go
      question.go
      category.go
      tag.go
      user_question_state.go
      user_view_history.go
      mock_interview_record.go
    repository/
      user_repository.go
      question_repository.go
      stats_repository.go
    response/
      response.go
      error_response.go
    service/
      auth_service.go
      question_service.go
      user_service.go
      stats_service.go

  pkg/
    logger/
      logger.go

  migrations/
  scripts/
  docs/

  .env.example
  go.mod
  Dockerfile
  docker-compose.yml
  Makefile
```

---

## 2. 各目录职责

### `cmd/api`

程序入口。

只负责：

- 创建应用
- 启动 HTTP 服务

不要在这里写业务。

---

### `internal/bootstrap`

应用装配层。

负责：

- 初始化配置
- 初始化数据库
- 初始化 router
- 注册 handler / service / repository

---

### `internal/config`

配置定义和加载。

例如：

- AppPort
- DatabaseDSN
- JWTSecret

---

### `internal/database`

数据库初始化。

例如：

- MySQL 连接
- GORM 配置

---

### `internal/model`

数据库模型。

建议：

- 一张表一个文件
- 每个字段写注释

---

### `internal/repository`

数据访问层。

职责：

- 查数据库
- 写数据库
- 不写 HTTP 逻辑

---

### `internal/service`

业务逻辑层。

职责：

- 组合 repository
- 实现业务规则
- 不直接返回 HTTP 响应

---

### `internal/handler`

接口层。

职责：

- 参数绑定
- 参数校验
- 调 service
- 返回统一响应

---

### `internal/middleware`

中间件层。

例如：

- JWT 校验
- 请求日志
- panic recover

---

### `internal/response`

统一返回格式。

例如：

- Success
- Fail
- ValidationError

---

### `pkg/logger`

通用日志封装。

第一版可基于 `slog`。

---

## 3. 初学者最重要的分层理解

你可以先记住这一句：

- handler 处理“请求”
- service 处理“业务”
- repository 处理“数据库”

只要不把这三层混在一起，后端就不会太乱。

---

## 4. 当前最小建议

刚开始时你甚至可以只写这些文件：

- `cmd/api/main.go`
- `internal/bootstrap/app.go`
- `internal/config/config.go`
- `internal/database/mysql.go`
- `internal/handler/health_handler.go`
- `internal/response/response.go`

先跑通，再扩展。
