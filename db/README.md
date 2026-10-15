# 数据库迁移说明

生产环境使用宝塔服务器本地的 MySQL 8.0。数据库账号和密码应只在服务器的 `.env` 中配置，**不要提交到仓库、上传包或发送到聊天中**。

## 首次初始化

```bash
cp .env.example .env
# 在 .env 中填写 DB_NAME、DB_USER、DB_PASSWORD；本地 MySQL 保持 DB_HOST=127.0.0.1
npm run db:migrate
npm run db:import-json
```

`db:migrate` 只执行未记录的 SQL 迁移；`db:import-json` 将当前 `data/store.json` 的课程、任务、资料、社区帖子和提交记录导入数据库。导入脚本可重复运行，用于核对迁移结果；它不会删除 JSON 原文件。

## 数据边界

- MySQL 仅允许本机访问，不开放 3306 公网端口。
- 当前 MVP 的课件保存在服务器的 `data/uploads/`；备份时应连同该目录一起备份。
- 用户密码只保存哈希值；迁移时不创建任何真实学生账号。
