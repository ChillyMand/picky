# PICKY! 挑食测试

## 本地启动

```bash
pnpm picky:serve
```

- 用户测试：<http://127.0.0.1:4173/>
- Admin：<http://127.0.0.1:4173/admin/>

可通过 `PICKY_PORT` 修改端口。

## 测试

```bash
pnpm picky:test
```

## 数据

本地运行数据保存在 `picky-test/data/tests.json`，包含每次测试的逐题选择、结果、IP、User-Agent 和浏览器上报的设备环境。该运行数据已从 Git 排除。

Admin 本身不包含登录、角色、IP 遮挡或字段加解密流程。未来部署时，应在 Cloudflare 上用 Access 保护 `/admin/*` 和 `/api/admin/*`。
