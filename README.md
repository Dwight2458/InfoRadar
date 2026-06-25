# InfoRadar

InfoRadar 是一个面向 AI Agent 的优质信息输入系统。它按“事实源、新闻源、观点/情绪源”三层结构采集公开信息，完成标准化、去重、规则打分、可选 AI 增强，并通过高密度工作台展示。

它不是普通 RSS 阅读器，也不提供投资建议。MVP 默认只使用官方 API、RSS 和公开数据接口。

## 已实现

- Next.js 16 App Router + TypeScript + Tailwind CSS + shadcn/ui（Base UI）
- PostgreSQL + Prisma；Redis + BullMQ repeatable job
- 15 个种子信息源，包含 12 个可采集源和 3 个合规占位源
- RSS、arXiv、GitHub、Hugging Face、CoinGecko、DefiLlama、Hacker News Provider
- URL、规范化标题 Hash、同源同标题去重
- 可靠性、重要性、新鲜度、热度、简单情绪规则评分
- 可选 OpenAI LLM Provider 和无密钥 Mock Provider
- Dashboard、信息流筛选、详情、信息源管理、采集任务页面
- 手动采集 API、全量采集、CLI、BullMQ Worker、周期调度

## 快速启动

要求 Node.js 20.9+、npm、Docker 和 Docker Compose。

```bash
npm install
cp .env.example .env.local
docker compose up -d
npm run db:push
npm run db:seed
npm run fetch:once
```

本项目使用独立的 Compose 项目 `inforadar-mvp`，PostgreSQL 映射到宿主机 `55432`，Redis 映射到 `56379`，不会复用其他 `info-radar` 项目的容器或数据卷。

分别启动 WebApp 和 Worker：

```bash
npm run dev
npm run worker
```

访问 `http://localhost:3000`。Worker 启动后会注册每分钟检查一次的 BullMQ Job Scheduler，各 Source 仍按照自己的 `fetch_interval_minutes` 判断是否到期。

如果只想验证页面，可先跳过 `fetch:once`；空数据库会显示零统计和空状态。

如果 `docker compose up -d` 报 Docker socket/daemon 无响应，请先启动 Docker Desktop 或系统 Docker 服务，再重试；Compose 配置本身可用 `docker compose config --quiet` 独立校验。

## 环境变量

`.env.example` 包含所有变量。除 PostgreSQL 和 Redis 连接外，所有外部密钥均可选。

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接字符串 |
| `REDIS_URL` | BullMQ Redis 连接字符串 |
| `GITHUB_TOKEN` | 提升 GitHub Search API 配额 |
| `HUGGINGFACE_TOKEN` | 可选 Hugging Face Hub Token |
| `COINGECKO_API_KEY` | 可选 CoinGecko Demo/Pro Key |
| `X_BEARER_TOKEN` | 预留官方 X API Token，MVP 不采集 X |
| `LLM_PROVIDER` | `mock` 或 `openai` |
| `LLM_ENRICHMENT_ENABLED` | 是否在入库前进行 AI 增强，默认 `false` |
| `LLM_MAX_ITEMS_PER_FETCH` | 每个源单次最多增强的条目数 |
| `OPENAI_API_KEY` | 可选 OpenAI API Key |
| `OPENAI_MODEL` | 启用 OpenAI 时使用的模型名 |

没有任何 API Key 时系统仍可运行。GitHub 使用匿名低配额；其余已实现 Provider 使用公开接口；LLM 回退到原始摘要/规则数据。

启用 OpenAI 增强示例：

```dotenv
LLM_PROVIDER=openai
LLM_ENRICHMENT_ENABLED=true
OPENAI_API_KEY=your-key
OPENAI_MODEL=your-model
```

AI 增强默认关闭，以避免意外费用。密钥只应保存在已被 Git 忽略的 `.env.local`，不要提交到仓库。

## 常用命令

```bash
npm run dev                 # WebApp 开发服务器
npm run build               # 生产构建
npm run lint                # ESLint
npm run typecheck           # TypeScript 严格检查
npm run db:generate         # 生成 Prisma Client
npm run db:push             # 本地快速同步 schema
npm run db:migrate          # 创建/执行开发 migration
npm run db:seed             # 初始化 15 个信息源
npm run worker              # BullMQ Worker + 周期调度器
npm run fetch:once          # 直接采集全部已启用源，单源失败不影响其他源
npm run fetch:source -- arxiv-ai
npm run test                # 单元测试
npm run test:integration    # 网络集成测试；默认跳过
```

要实际执行网络集成测试：

```bash
RUN_INTEGRATION_TESTS=true npm run test:integration
```

## 项目结构

```text
src/
  app/                 页面与 Route Handlers
  components/          工作台组件与 shadcn/ui primitives
  jobs/                BullMQ queue、worker、scheduler
  lib/                 env、db、HTTP、日志、去重、评分、LLM
  providers/           各信息源 Provider
  services/            抓取、标准化、查询、Dashboard、Digest 业务逻辑
prisma/
  schema.prisma        PostgreSQL 数据模型
  seed.ts              MVP 信息源
scripts/               单次/单源采集 CLI
```

## Provider 设计

所有 Provider 实现统一接口：

```ts
interface SourceProvider {
  name: string
  fetch(source: Source): Promise<RawItem[]>
}
```

增加 Provider：

1. 在 `src/providers/` 新建实现，使用 `src/lib/http.ts` 获得统一 timeout 和 retry。
2. 将远端数据转换为 `RawItem`，不要在 Provider 中直接写数据库。
3. 在 `src/providers/index.ts` 注册实例。
4. 在 `prisma/seed.ts` 增加 Source，或直接写入 `sources` 表。
5. 为解析、边界输入和去重行为添加测试。

`fetch-service` 负责隔离单源错误、生成任务记录；`item-service` 负责标准化、去重、评分和幂等入库。Provider 不应该绕过这两层。

## API

- `GET /api/items`：筛选、排序、分页查询
- `GET /api/items/:id`：详情
- `GET /api/sources`：信息源列表
- `PATCH /api/sources/:id`：启用/禁用
- `POST /api/sources/:id/fetch`：加入单源采集队列
- `POST /api/fetch`：将全部启用源加入队列
- `GET /api/jobs`：采集任务列表

MVP 面向本地单用户开发环境，API 尚未加入认证。部署到公网前必须添加身份认证、CSRF 防护和按用户/地址限流。

## 合规边界

- 默认只接入官方 API、RSS 和明确公开的数据接口。
- 不默认抓取知乎、雪球或 X 网页；三个 Provider 在 seed 中均为禁用占位项。
- X 后续只通过官方 API 和明确的白名单账号配置接入。
- 知乎、雪球接入前必须确认官方开放能力、RSSHub 可用性、`robots.txt`、服务条款和频率限制。
- 不绕过登录、验证码、付费墙、访问控制或反爬限制。
- 不采集私人数据，不把观点/情绪源当作事实依据。
- 本项目只做信息聚合和研究辅助，不构成投资建议。

## 当前 MVP 限制

- GitHub 使用官方 Search API 近似 Trending，不解析 GitHub Trending HTML。
- CoinGecko/DefiLlama 以当前市场状态生成条目，MVP 未实现时序快照表。
- 标题 Hash 去重属于确定性规则；embedding 相似去重和事件聚类仅预留。
- SEC EDGAR、FRED、X、知乎、雪球尚未真实接入。
- AI Daily Digest 有 Provider 抽象和服务接口，但尚未提供独立定时 Digest 页面。
