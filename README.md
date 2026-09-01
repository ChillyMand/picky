# PICKY! 挑食测试

PICKY! 是一个面向手机和桌面的中文趣味挑食测试。用户从 45+ 种食材中选择自己的接受程度，得到挑食指数、饭桌人格和分享卡片；也可以使用 4 位配对码与好友完成饭桌匹配度测试。

线上地址：<https://picky.wzrice.cn/>

## 功能概览

- 45+ 种食材，覆盖畜肉、家禽、鱼虾蟹、蔬菜、水果、主食等 17 个类别。
- 四种选择：超爱吃、可以吃、坚决不吃、没吃过。
- 根据前面的回答动态安排后续题目，并控制提示出现频率。
- 生成挑食指数、饭桌人格、六项饮食边界和趣味文案。
- 每次测试生成 4 位大写字母数字配对码。
- 好友通过配对码加入测试，双方完成后计算饭桌匹配度。
- 结果页可复制分享链接，也可生成带二维码的 JPG 分享卡。
- 支持手机浏览器、微信内置浏览器和桌面端横屏布局。
- 页面文字默认不可选，品牌图片不可拖拽；输入框和分享图片仍保留必要的复制、保存能力。

## 目录与文件说明

### `public/`：浏览器直接加载的前端资源

- `index.html`：页面入口、SEO 标题/描述、社交分享标签、结构化数据和页面骨架。
- `app.js`：前端状态机，负责首页、暗号说明、答题、结果、配对查询、复制链接和分享卡生成。
- `styles.css`：基础颜色、字体、按钮、卡片、题目和结果页样式。
- `desktop.css`：900px 以上桌面端双栏布局、题目四列选项和结果页宽度。
- `pair.css`：配对码输入、好友加入和匹配相关样式。
- `direct-match.css`：直接输入双方配对码查看结果的样式。
- `intro-compact.css`：对暗号页面四种选项说明和移动端排版。
- `touch-fixes.css`：触屏点击反馈、选中状态和移动端交互细节。
- `brand.css`：PICKY! 品牌锁定、Logo 和题目页品牌元素。
- `share-preview.css`：分享图片预览弹层、关闭按钮和移动端长按提示。
- `protection.css`：文字选择、图片拖拽等浏览器默认行为的限制。
- `robots.txt`：搜索引擎抓取规则和站点地图地址。
- `sitemap.xml`：线上首页的规范网址。
- `assets/`：PICKY! Logo 等前端图片资源。

### `src/`：可测试的业务模块

- `foods.js`：完整食材目录和 17 个分类。
- `adaptive.js`：根据回答动态补充题目的规则，避免重复并保证题量。
- `choice-copy.js`：四种选项的用户说明文字。
- `answer-feedback.js`：移动端选择后的高亮、弱化其他选项和短暂反馈。
- `progress-prompts.js`：答题过程中的阶段性提示文案。
- `scoring.js`：挑食指数、饭桌人格和六项边界计算。
- `matching.js`：两份测试答案的共同偏好、共同避开、分歧和匹配度计算。
- `codes.js`：4 位公开配对码的生成、校验和规范化。
- `archive.js`：本地开发时保存测试会话和答案；线上 Worker 使用 D1 完成同类存储。
- `share.js`：分享卡数据、二维码链接和分享图片所需信息。
- `share-copy.js`：随机生成多种简短邀请话术。
- `share-themes.js`：分享卡的五种视觉主题和随机主题选择。
- `screen-mode.js`：页面屏幕切换和答题期间滚动锁定。
- `browser-compat.js`：剪贴板、触屏和浏览器能力兼容处理。

### `test/`：自动化测试

测试覆盖食材完整性、动态出题、评分、配对、分享卡、SEO、移动端点击反馈、滚动锁定、浏览器兼容和服务端接口：

```bash
pnpm picky:test
```

### `migrations/`：Cloudflare D1 数据库迁移

保存线上测试会话、答案和匹配所需的最小数据结构。新配对码统一为 4 位，旧记录不再兼容。

### `scripts/`：构建脚本

- `build-assets.mjs`：将 `public/` 资源复制并整理到 `dist/`，供 Wrangler 部署。

### `data/`：本地开发数据

本地服务默认使用 `data/tests.json` 保存测试记录。该目录只用于本地运行，不是前端资源。

### 根目录文件

- `server.mjs`：Node.js 本地开发服务器，同时提供测试所需的会话、答案、完成测试和匹配接口。
- `worker.js`：Cloudflare Worker 入口，负责静态资源、API 和 D1 绑定。
- `wrangler.jsonc`：Worker 名称、静态资源目录、D1 数据库和自定义域配置。
- `dist/`：部署前由构建脚本生成的静态资源目录。

## 本地运行

在工作区根目录执行：

```bash
pnpm install
pnpm picky:serve
```

打开 <http://127.0.0.1:4173/>。如需更换端口：

```bash
PICKY_PORT=5173 pnpm picky:serve
```

也可以直接进入本目录运行：

```bash
node server.mjs
```

## 构建与部署

生成部署资源：

```bash
pnpm picky:assets
```

预检查 Wrangler 配置：

```bash
wrangler deploy --config picky-test/wrangler.jsonc --dry-run
```

部署到线上：

```bash
pnpm picky:deploy
```

线上 Worker 名称为 `picky`，自定义域名为 `picky.wzrice.cn`，数据库绑定为 Cloudflare D1 `picky`。部署前请确保 Wrangler 已登录正确的 Cloudflare 账号。

## 当前版本注意事项

- 配对码固定为 4 位大写字母数字组合。
- 测试结果和匹配需要通过线上接口写入 D1；本地运行时写入 `data/tests.json`。
- 分享卡为 JPG，二维码内容是包含配对码的邀请链接。
- 站点地图是给搜索引擎读取的纯 XML，浏览器显示“没有样式信息”属于正常现象。
