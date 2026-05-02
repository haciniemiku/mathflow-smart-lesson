# MathFlow / Smart Math Lesson Plan

MathFlow is a Notion-style intelligent lesson editor for high-school math teachers. The MVP turns a natural-language teaching intent into a safe, structured math object, then renders LaTeX, an interactive function graph, parameter sliders, and a source inspector.

The core idea is: documents are slides, and typed configuration is the illustration source.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
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

Check code quality:

```bash
npm run lint
```

Build:

```bash
npm run build
```

## Demo Path

1. Open `http://localhost:3000`.
2. Use the default prompt, or enter: `Draw an upward-opening parabola`.
3. Click `Generate`.
4. The page renders the LaTeX formula `y = ax^2 + bx + c`.
5. The page renders an SVG graph for the quadratic function.
6. Drag the `a`, `b`, and `c` sliders to update the graph in real time.
7. Check the right-side Source Inspector for:
   - LaTeX source
   - Math object JSON
   - Python pseudo code preview

The mock parser also recognizes Chinese intent strings such as "draw an upward-opening parabola" when provided in Chinese characters, while the source code stores those Chinese match strings as Unicode escapes to avoid Windows codepage corruption.

## Why AI Only Outputs JSON

MathFlow treats AI output as data, not executable code.

The AI parser may turn natural language into a JSON object, but the app never lets AI directly generate or execute JavaScript or Python. This keeps the product safer and easier to debug:

- No `eval`.
- No `new Function`.
- No AI-generated runtime code execution.
- All AI output must pass a zod schema.
- Rendering is done by typed product code.
- Python is shown only as pseudo code/configuration, never executed.

The MVP parser lives in:

```text
src/lib/ai/parseMathIntent.ts
```

The current implementation uses `mockAIParser`. A real AI integration should be added through a server-side route and must still return schema-validated JSON.

## Current Scope

- Only supports `quadratic`.
- Uses a lightweight `contentEditable` editor instead of a full Tiptap block editor.
- Uses a mock AI parser.
- Uses a fixed graph domain and range.
- Does not mark vertex, intercepts, axis of symmetry, or monotonic intervals yet.
- Does not include auth, database, permissions, or Python execution.

## Future Extensions

- Add a real AI parser behind the same zod schema boundary.
- Support linear, trigonometric, exponential, and piecewise functions.
- Add teaching annotations: vertex, intercepts, axis of symmetry, and monotonic intervals.
- Replace the lightweight editor with Tiptap blocks.
- Export to PDF, PPTX, or lesson handouts.
- Add student-facing interaction modes and exercise generation.
