# MathFlow / 智数教案

中文 | [English](#english)

MathFlow 是一个面向高中数学老师的 Notion 风格智能教案编辑器。老师可以在连续文档中输入 `/ai` 唤起 AI 教案 Agent，用自然语言生成经过 schema 校验的数学对象，并把公式、函数图、统计图和参数控制插入到教案中。

核心理念：**文档即课件，代码即插图**。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Tiptap / ProseMirror 编辑器
- KaTeX 公式渲染
- SVG 函数图与统计图绘制
- zod 校验 AI 输出
- lucide-react 图标

## 运行方式

创建本地环境变量文件：

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
```

`.env.local` 已被 `.gitignore` 排除，不要提交真实密钥。

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

代码检查：

```bash
npm run lint
```

构建：

```bash
npm run build
```

## Demo 演示路径

1. 打开 `http://localhost:3000`。
2. 在文档任意新行输入 `/ai`。
3. 出现命令菜单后，按 `Enter` 或点击“AI 数学助手”。
4. 输入自然语言，例如：`画一个开口向上的抛物线`、`插入二次方程求根公式`、`生成班级成绩分布统计图` 或 `给我生成一个完整的二次函数教案，包含公式和函数图像`。
5. 点击“生成”。
6. Agent 会自主选择安全工具，并在文档中插入对应内容：
   - 函数图：LaTeX 公式 `y = ax^2 + bx + c`、SVG 函数图、`a / b / c` 参数滑块
   - 公式：KaTeX 渲染的数学公式
   - 统计图：SVG 柱状图
   - 完整教案：标题、段落、列表、公式、函数图和统计图组成的连续文档
7. 调整函数图滑块，图像会实时更新。
8. 可以选中文档内容并复制到其他文档工具。

## 为什么 AI 只输出 JSON

MathFlow 把 AI 输出视为数据，而不是可执行代码。

Agent 被拆成两层：

- Planner：把老师的自然语言拆成工具调用计划，例如 `writeParagraph`、`insertFormula`、`drawFunction`、`drawBarChart`
- Executor：只执行产品代码中定义好的白名单工具，并输出经过 zod 校验的 JSON

AI 只负责规划结构和工具意图。前端负责用可信的产品代码渲染公式、函数图、统计图和交互控件。

这样做可以保证：

- 不使用 `eval`
- 不使用 `new Function`
- 不执行 AI 生成的 JavaScript 或 Python
- 所有 AI 输出都必须通过 zod schema 校验
- 渲染逻辑可测试、可调试、可扩展
- Python 只作为伪代码或配置展示，不会执行

当前 parser 位于：

```text
src/lib/ai/parseMathIntent.ts
```

Planner / Executor 位于：

```text
src/lib/ai/lessonAgent.ts
```

真实 DeepSeek 接口位于：

```text
src/app/api/lesson-agent/route.ts
```

当 `DEEPSEEK_API_KEY` 存在时，服务端会调用 DeepSeek 作为 planner；如果请求失败或返回计划不符合 schema，会回退到 `mockPlanner`。Executor 始终在本地执行白名单工具，保证 Demo 稳定且不执行模型生成代码。

## 当前范围

- 函数图当前仅支持二次函数 `quadratic`
- Agent 工具当前支持标题、段落、列表、函数图、公式、柱状统计图
- 支持一次生成包含公式和函数图的完整教案
- DeepSeek 可用时走真实接口；不可用时走 mock agent
- 函数图使用固定坐标范围
- 暂不标注顶点、交点、对称轴和单调区间
- 不包含登录、数据库、权限系统
- 不执行 Python

## 后续扩展

- 接入真实 AI 模型
- 支持一次函数、三角函数、指数函数、分段函数
- 增加顶点、交点、对称轴、单调区间等教学标注
- 支持导出 PDF、PPTX 或讲义
- 支持更多 Tiptap 数学块类型
- 支持学生互动模式和课堂练习生成

---

## English

MathFlow is a Notion-style intelligent lesson editor for high-school math teachers. Teachers can type `/ai` inside a continuous document to summon an AI lesson agent, generate schema-validated math objects from natural language, and insert formulas, function graphs, statistical charts, and parameter controls into the lesson.

Core idea: **documents are slides, and typed configuration is the illustration source**.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Tiptap / ProseMirror editor
- KaTeX for LaTeX rendering
- SVG for function graph and chart rendering
- zod for validating AI output
- lucide-react icons

## Run Locally

Create a local environment file:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
```

`.env.local` is ignored by git. Do not commit real secrets.

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

## Demo Flow

1. Open `http://localhost:3000`.
2. Type `/ai` on any new line in the document.
3. When the command menu appears, press `Enter` or click `AI Math Assistant`.
4. Enter a natural-language prompt, for example: `Draw an upward-opening parabola`, `Insert the quadratic formula`, `Create a score distribution chart`, or `Generate a complete quadratic function lesson with formulas and a graph`.
5. Click `Generate`.
6. The agent chooses a safe tool and inserts the matching result:
   - Function graph: LaTeX formula `y = ax^2 + bx + c`, SVG graph, and `a / b / c` parameter sliders
   - Formula: KaTeX-rendered math formula
   - Statistical chart: SVG bar chart
   - Complete lesson: a continuous document with headings, paragraphs, lists, formulas, function graphs, and charts
7. Drag graph sliders to update the graph in real time.
8. Select and copy the document content into another document tool.

## Why AI Only Outputs JSON

MathFlow treats AI output as data, not executable code.

The agent has two layers:

- Planner: turns the teacher's natural language into a tool plan, such as `writeParagraph`, `insertFormula`, `drawFunction`, or `drawBarChart`
- Executor: runs only product-defined allowlisted tools and returns zod-validated JSON

AI plans the structure and tool intent. The frontend renders formulas, graphs, charts, and controls using trusted product code.

This keeps the app safer and easier to maintain:

- No `eval`
- No `new Function`
- No AI-generated JavaScript or Python execution
- All AI output must pass a zod schema
- Rendering logic is testable, debuggable, and extensible
- Python is shown only as pseudo code or configuration, never executed

The parser lives in:

```text
src/lib/ai/parseMathIntent.ts
```

The planner / executor lives in:

```text
src/lib/ai/lessonAgent.ts
```

The DeepSeek server route lives in:

```text
src/app/api/lesson-agent/route.ts
```

When `DEEPSEEK_API_KEY` is configured, the server calls DeepSeek as the planner. If the request fails or the plan does not pass the schema, the route falls back to `mockPlanner`. The executor always runs local allowlisted tools, so the demo remains stable and never executes model-generated code.

## Current Scope

- Function graphs currently support `quadratic` only
- Agent tools currently support headings, paragraphs, lists, function graphs, formulas, and bar charts
- Supports generating a complete lesson containing formulas and a function graph
- Uses DeepSeek when configured, with a mock agent fallback
- Uses a fixed graph domain/range
- Does not yet mark vertex, intercepts, axis of symmetry, or monotonic intervals
- No auth, database, or permission system
- No Python execution

## Future Extensions

- Connect a real AI model
- Support linear, trigonometric, exponential, and piecewise functions
- Add teaching annotations such as vertex, intercepts, axis of symmetry, and monotonic intervals
- Export to PDF, PPTX, or lesson handouts
- Add more Tiptap math block types
- Add student-facing interaction modes and exercise generation
