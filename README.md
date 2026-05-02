# MathFlow / 智数教案

中文 | [English](#english)

MathFlow 是一个面向高中数学老师的 Notion 风格智能教案编辑器。老师可以在连续文档中输入 `/ai` 唤起 AI 数学助手，用自然语言生成经过 schema 校验的数学对象，并把 LaTeX 公式、函数图和参数控制插入到教案中。

核心理念：**文档即课件，代码即插图**。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Tiptap / ProseMirror 编辑器
- KaTeX 公式渲染
- SVG 函数图绘制
- zod 校验 AI 输出
- lucide-react 图标

## 运行方式

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
4. 输入自然语言，例如：`画一个开口向上的抛物线`。
5. 点击“生成”。
6. 文档中会插入二次函数数学块，包括：
   - LaTeX 公式 `y = ax^2 + bx + c`
   - SVG 函数图
   - `a / b / c` 参数滑块
7. 调整滑块，函数图会实时更新。
8. 可以选中文档内容并复制到其他文档工具。

## 为什么 AI 只输出 JSON

MathFlow 把 AI 输出视为数据，而不是可执行代码。

AI 只负责把自然语言解析成结构化数学对象，前端负责用可信的产品代码渲染公式、函数图和交互控件。

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

当前实现使用 `mockAIParser`。后续接入真实模型时，应通过服务端接口返回同样通过 schema 校验的 JSON。

## 当前范围

- 仅支持二次函数 `quadratic`
- AI Parser 目前是 mock
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

MathFlow is a Notion-style intelligent lesson editor for high-school math teachers. Teachers can type `/ai` inside a continuous document to summon an AI math assistant, generate schema-validated math objects from natural language, and insert LaTeX formulas, function graphs, and parameter controls into the lesson.

Core idea: **documents are slides, and typed configuration is the illustration source**.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Tiptap / ProseMirror editor
- KaTeX for LaTeX rendering
- SVG for function graph rendering
- zod for validating AI output
- lucide-react icons

## Run Locally

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
4. Enter a natural-language prompt, for example: `Draw an upward-opening parabola`.
5. Click `Generate`.
6. The document inserts a quadratic math block with:
   - LaTeX formula `y = ax^2 + bx + c`
   - SVG function graph
   - `a / b / c` parameter sliders
7. Drag the sliders to update the graph in real time.
8. Select and copy the document content into another document tool.

## Why AI Only Outputs JSON

MathFlow treats AI output as data, not executable code.

The AI parser turns natural language into a structured math object. The frontend then renders formulas, graphs, and controls using trusted product code.

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

The current implementation uses `mockAIParser`. A real model integration should return the same schema-validated JSON through a server-side route.

## Current Scope

- Supports `quadratic` only
- Uses a mock AI parser
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
