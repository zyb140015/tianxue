# Go 后端创建命令清单

## 1. 创建后端目录

在当前项目根目录执行：

```bash
mkdir backend
```

---

## 2. 初始化 go module

进入后端目录后执行：

```bash
go mod init github.com/yourname/frontend-interview-app/backend
```

> 这里请换成你自己的模块路径。

---

## 3. 创建基础目录

```bash
mkdir -p cmd/api
mkdir -p internal/bootstrap
mkdir -p internal/config
mkdir -p internal/database
mkdir -p internal/handler
mkdir -p internal/middleware
mkdir -p internal/model
mkdir -p internal/repository
mkdir -p internal/response
mkdir -p internal/service
mkdir -p pkg/logger
mkdir -p migrations
mkdir -p docs
mkdir -p scripts
```

---

## 4. 安装第一版依赖

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

## 5. 创建环境变量文件

建议创建：

```txt
backend/.env.example
```

示例内容：

```env
APP_PORT=8080
APP_ENV=local

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=frontend_interview_app

JWT_SECRET=replace-with-your-secret
```

---

## 6. 建议创建 Docker Compose

先只起 MySQL：

```yaml
version: '3.9'
services:
  mysql:
    image: mysql:8.4
    container_name: frontend-interview-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: frontend_interview_app
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

---

## 7. 本地启动数据库

```bash
docker compose up -d
```

---

## 8. 启动后端服务

等你写好 `main.go` 后：

```bash
go run ./cmd/api
```

---

## 9. 第一版建议先实现的接口

```txt
GET /health
POST /auth/login
GET /users/me
GET /questions
GET /questions/:id
```

---

## 10. 推荐下一步

在执行完这些命令后，你下一步应该：

1. 写 `main.go`
2. 写配置加载
3. 写数据库连接
4. 写健康检查接口
5. 再开始写业务接口
