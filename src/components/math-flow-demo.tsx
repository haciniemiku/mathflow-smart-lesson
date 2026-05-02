"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor, type NodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import katex from "katex";
import { Braces, GripVertical, Play, Sparkles, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  type AgentResult,
  type BarChartBlockObject,
  type FormulaBlockObject,
  type LessonAgentResponse,
  type LessonContentBlock,
  type MathSlider,
  type QuadraticMathObject,
  lessonAgentResponseSchema,
} from "@/lib/ai/parseMathIntent";

type Params = QuadraticMathObject["params"];
type SlashMenu = { top: number; left: number };
type AssistantState = { top: number; left: number };
type FloatingSize = { width: number; height: number };
type EditorJsonContent = Record<string, unknown>;

const T = {
  initialPrompt: "\u753b\u4e00\u4e2a\u5f00\u53e3\u5411\u4e0a\u7684\u629b\u7269\u7ebf",
  graphLabel: "\u4e8c\u6b21\u51fd\u6570\u56fe\u50cf",
  previewTitle: "\u53ef\u590d\u5236\u6559\u6848\u9884\u89c8",
  pageTitle: "\u4e8c\u6b21\u51fd\u6570\u56fe\u50cf\u4e0e\u53c2\u6570\u53d8\u5316",
  scope: "MVP\uff1a\u4e8c\u6b21\u51fd\u6570",
  lessonGoal: "\u8bfe\u5802\u76ee\u6807",
  lessonText: "\u901a\u8fc7\u4ea4\u4e92\u5f0f\u51fd\u6570\u56fe\uff0c\u8ba9\u5b66\u751f\u89c2\u5bdf a\u3001b\u3001c \u5bf9\u629b\u7269\u7ebf\u5f00\u53e3\u65b9\u5411\u3001\u5bf9\u79f0\u8f74\u548c\u622a\u8ddd\u7684\u5f71\u54cd\u3002",
  lessonPointOne: "\u8bc6\u522b\u6807\u51c6\u5f62\u5f0f y = ax^2 + bx + c",
  lessonPointTwo: "\u62d6\u52a8\u53c2\u6570\u6ed1\u5757\u5e76\u89e3\u91ca\u56fe\u50cf\u53d8\u5316",
  commandMenuTitle: "\u9009\u62e9\u8981\u63d2\u5165\u7684\u5185\u5bb9",
  aiCommandTitle: "AI \u6570\u5b66\u52a9\u624b",
  aiCommandDescription: "\u7528\u81ea\u7136\u8bed\u8a00\u751f\u6210\u516c\u5f0f\u548c\u51fd\u6570\u56fe",
  aiBlockTitle: "AI \u6559\u6848 Agent",
  aiBlockHint:
    "\u63cf\u8ff0\u4f60\u60f3\u63d2\u5165\u7684\u5185\u5bb9\uff1a\u51fd\u6570\u56fe\u3001\u7edf\u8ba1\u56fe\u6216\u516c\u5f0f\u3002Agent \u4f1a\u81ea\u4e3b\u9009\u62e9\u5de5\u5177\u3002",
  slashHint: "\u8f93\u5165 /ai \u5524\u51fa AI \u52a9\u624b",
  close: "\u5173\u95ed",
  deleteBlock: "\u5220\u9664\u8fd9\u4e2a\u6570\u5b66\u5757",
  dragBlock: "\u62d6\u62fd\u79fb\u52a8\u8fd9\u4e2a\u6570\u5b66\u5757",
  promptLabel: "\u81ea\u7136\u8bed\u8a00\u751f\u6210\u6570\u5b66\u5bf9\u8c61",
  generating: "\u751f\u6210\u4e2d",
  generate: "\u751f\u6210",
  parseFallback: "\u89e3\u6790\u5931\u8d25\uff0c\u8bf7\u6362\u4e00\u79cd\u8bf4\u6cd5\u3002",
  paramsTitle: "\u53c2\u6570\u8c03\u6574",
  functionResultTitle: "\u51fd\u6570\u56fe",
  formulaResultTitle: "\u516c\u5f0f",
  chartResultTitle: "\u7edf\u8ba1\u56fe",
  continueTitle: "\u540e\u7eed\u8bb2\u89e3",
  continueText: "\u5728\u8fd9\u91cc\u7ee7\u7eed\u7f16\u5199\u6559\u6848\uff1a\u53ef\u4ee5\u8bb0\u5f55\u63d0\u95ee\u3001\u5b66\u751f\u89c2\u5bdf\u7ed3\u8bba\u6216\u8bfe\u5802\u5c0f\u7ed3\u3002",
  continuePointOne: "\u5f53 a > 0 \u65f6\uff0c\u629b\u7269\u7ebf\u5f00\u53e3\u5411\u4e0a\u3002",
  continuePointTwo: "\u5f15\u5bfc\u5b66\u751f\u5bf9\u6bd4 b \u548c c \u6539\u53d8\u65f6\u7684\u56fe\u50cf\u5dee\u5f02\u3002",
  emptyHint: "\u5728\u4efb\u610f\u65b0\u884c\u8f93\u5165 /ai\uff0c\u6309 Enter \u9009\u62e9 AI \u6570\u5b66\u52a9\u624b\u3002",
  safetyNote:
    "AI \u8f93\u51fa\u53ea\u80fd\u662f\u7ecf\u8fc7 zod \u6821\u9a8c\u7684\u7ed3\u6784\u5316 JSON\u3002\u516c\u5f0f\u6e32\u67d3\u548c\u56fe\u50cf\u7ed8\u5236\u90fd\u7531\u7c7b\u578b\u5b89\u5168\u7684\u4ea7\u54c1\u4ee3\u7801\u5b8c\u6210\uff0c\u4e0d\u6267\u884c\u52a8\u6001\u4ee3\u7801\u3002",
};

const graphDomain = { min: -8, max: 8 };
const floatingMargin = 16;
const slashMenuSize: FloatingSize = { width: 384, height: 104 };
const assistantSize: FloatingSize = { width: 576, height: 344 };

function getFloatingPosition(coords: DOMRect, size: FloatingSize): AssistantState {
  const below = coords.bottom + 6;
  const above = coords.top - size.height - 6;
  const fitsBelow = below + size.height <= window.innerHeight - floatingMargin;
  const top = fitsBelow ? below : Math.max(floatingMargin, above);
  const left = Math.min(
    Math.max(floatingMargin, coords.left),
    Math.max(floatingMargin, window.innerWidth - size.width - floatingMargin),
  );

  return { top, left };
}

function clampSliderValue(value: number, slider: MathSlider): number {
  return Math.min(slider.max, Math.max(slider.min, value));
}

function evaluateQuadratic(x: number, params: Params): number {
  return params.a * x * x + params.b * x + params.c;
}

function buildGraphPath(mathObject: QuadraticMathObject): string {
  const width = 640;
  const height = 360;
  const yMin = -12;
  const yMax = 12;
  const xRange = graphDomain.max - graphDomain.min;

  return Array.from({ length: 121 }, (_, index) => {
    const ratio = index / 120;
    const x = graphDomain.min + ratio * xRange;
    const y = evaluateQuadratic(x, mathObject.params);
    const screenX = ratio * width;
    const screenY = height - ((Math.max(yMin, Math.min(yMax, y)) - yMin) / (yMax - yMin)) * height;

    return `${index === 0 ? "M" : "L"} ${screenX.toFixed(2)} ${screenY.toFixed(2)}`;
  }).join(" ");
}

function LatexFormula({ latex }: { latex: string }) {
  const markup = useMemo(() => ({ __html: katex.renderToString(latex, { throwOnError: false }) }), [latex]);

  return <div className="text-xl text-stone-950" dangerouslySetInnerHTML={markup} />;
}

function FunctionGraph({ mathObject }: { mathObject: QuadraticMathObject }) {
  const path = useMemo(() => buildGraphPath(mathObject), [mathObject]);

  return (
    <svg viewBox="0 0 640 360" role="img" aria-label={T.graphLabel} className="my-4 aspect-video w-full border border-stone-200">
      <rect width="640" height="360" fill="#fbfaf8" />
      <path d="M 0 180 L 640 180" stroke="#d6d3d1" strokeWidth="1.5" />
      <path d="M 320 0 L 320 360" stroke="#d6d3d1" strokeWidth="1.5" />
      {Array.from({ length: 9 }, (_, index) => (
        <path key={`x-${index}`} d={`M ${index * 80} 0 L ${index * 80} 360`} stroke="#eeeae6" strokeWidth="1" />
      ))}
      {Array.from({ length: 7 }, (_, index) => (
        <path key={`y-${index}`} d={`M 0 ${index * 60} L 640 ${index * 60}`} stroke="#eeeae6" strokeWidth="1" />
      ))}
      <path d={path} fill="none" stroke="#0f766e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    </svg>
  );
}

function SliderControl({
  slider,
  value,
  onChange,
}: {
  slider: MathSlider;
  value: number;
  onChange: (name: MathSlider["name"], value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="flex items-center justify-between gap-3 font-medium text-stone-800">
        <span>{slider.name}</span>
        <span className="font-mono text-stone-600">{value.toFixed(1)}</span>
      </span>
      <input
        type="range"
        min={slider.min}
        max={slider.max}
        step={slider.step}
        value={value}
        onChange={(event) => onChange(slider.name, clampSliderValue(Number(event.currentTarget.value), slider))}
        className="accent-teal-700"
      />
    </label>
  );
}

function BlockControls({ deleteNode }: { deleteNode: () => void }) {
  return (
    <div className="absolute -left-10 top-2 hidden items-center gap-1 text-stone-300 group-hover:flex">
      <button
        type="button"
        title={T.deleteBlock}
        onMouseDown={(event) => event.preventDefault()}
        onClick={deleteNode}
        className="grid size-5 place-items-center rounded-sm hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="size-3.5" />
      </button>
      <button
        type="button"
        title={T.dragBlock}
        data-drag-handle
        className="grid size-5 cursor-grab place-items-center rounded-sm hover:bg-stone-100 hover:text-stone-600 active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" />
      </button>
    </div>
  );
}

function MathBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const mathObject = node.attrs.mathObject as QuadraticMathObject;

  function updateParam(name: MathSlider["name"], value: number) {
    updateAttributes({
      mathObject: {
        ...mathObject,
        params: {
          ...mathObject.params,
          [name]: value,
        },
      },
    });
  }

  return (
    <NodeViewWrapper className="group relative my-4">
      <BlockControls deleteNode={deleteNode} />
      <section className="border-l-4 border-teal-500 bg-teal-50/40 py-4 pl-5 pr-3">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700">
          <Braces className="size-4" />
          {T.functionResultTitle}
        </p>
        <LatexFormula latex={mathObject.latex} />
        <FunctionGraph mathObject={mathObject} />
        <p className="text-sm text-stone-600">
          a = {mathObject.params.a.toFixed(1)}, b = {mathObject.params.b.toFixed(1)}, c = {mathObject.params.c.toFixed(1)}
        </p>
        <div className="mt-4 grid gap-4 border-t border-teal-200 pt-4 sm:grid-cols-3">
          {mathObject.sliders.map((slider) => (
            <SliderControl
              key={slider.name}
              slider={slider}
              value={mathObject.params[slider.name]}
              onChange={updateParam}
            />
          ))}
        </div>
      </section>
    </NodeViewWrapper>
  );
}

function FormulaBlockView({ node, deleteNode }: NodeViewProps) {
  const formula = node.attrs.formulaObject as FormulaBlockObject;

  return (
    <NodeViewWrapper className="group relative my-4">
      <BlockControls deleteNode={deleteNode} />
      <section className="border-l-4 border-indigo-500 bg-indigo-50/40 py-4 pl-5 pr-3">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700">
          <Braces className="size-4" />
          {formula.title}
        </p>
        <LatexFormula latex={formula.latex} />
        {formula.caption ? <p className="mt-3 text-sm text-stone-600">{formula.caption}</p> : null}
      </section>
    </NodeViewWrapper>
  );
}

function BarChartBlockView({ node, deleteNode }: NodeViewProps) {
  const chart = node.attrs.chartObject as BarChartBlockObject;
  const maxValue = Math.max(...chart.data.map((item) => item.value), 1);

  return (
    <NodeViewWrapper className="group relative my-4">
      <BlockControls deleteNode={deleteNode} />
      <section className="border-l-4 border-amber-500 bg-amber-50/40 py-4 pl-5 pr-3">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700">
          <Braces className="size-4" />
          {chart.title}
        </p>
        <svg viewBox="0 0 640 360" role="img" aria-label={chart.title} className="my-4 aspect-video w-full border border-stone-200 bg-white">
          <line x1="64" y1="300" x2="604" y2="300" stroke="#a8a29e" strokeWidth="1.5" />
          <line x1="64" y1="40" x2="64" y2="300" stroke="#a8a29e" strokeWidth="1.5" />
          {chart.data.map((item, index) => {
            const barWidth = Math.min(52, 460 / chart.data.length);
            const gap = (520 - barWidth * chart.data.length) / Math.max(chart.data.length - 1, 1);
            const x = 84 + index * (barWidth + gap);
            const height = (item.value / maxValue) * 220;
            const y = 300 - height;

            return (
              <g key={item.label}>
                <rect x={x} y={y} width={barWidth} height={height} fill="#0f766e" rx="3" />
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="13" fill="#57534e">
                  {item.value}
                </text>
                <text x={x + barWidth / 2} y="326" textAnchor="middle" fontSize="12" fill="#57534e">
                  {item.label}
                </text>
              </g>
            );
          })}
          {chart.xLabel ? (
            <text x="334" y="350" textAnchor="middle" fontSize="13" fill="#78716c">
              {chart.xLabel}
            </text>
          ) : null}
          {chart.yLabel ? (
            <text x="18" y="174" textAnchor="middle" fontSize="13" fill="#78716c" transform="rotate(-90 18 174)">
              {chart.yLabel}
            </text>
          ) : null}
        </svg>
      </section>
    </NodeViewWrapper>
  );
}

const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      mathObject: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-math-object");
          return raw ? JSON.parse(raw) : null;
        },
        renderHTML: (attributes) => ({
          "data-math-object": JSON.stringify(attributes.mathObject),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='math-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "math-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView);
  },
});

const FormulaBlock = Node.create({
  name: "formulaBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      formulaObject: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-formula-object");
          return raw ? JSON.parse(raw) : null;
        },
        renderHTML: (attributes) => ({
          "data-formula-object": JSON.stringify(attributes.formulaObject),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='formula-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "formula-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FormulaBlockView);
  },
});

const ChartBlock = Node.create({
  name: "chartBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      chartObject: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-chart-object");
          return raw ? JSON.parse(raw) : null;
        },
        renderHTML: (attributes) => ({
          "data-chart-object": JSON.stringify(attributes.chartObject),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='chart-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "chart-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BarChartBlockView);
  },
});

function buildToolResultContent(result: AgentResult): EditorJsonContent[] {
  if (result.type === "formula") {
    return [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: result.title || T.formulaResultTitle }],
      },
      {
        type: "formulaBlock",
        attrs: { formulaObject: result },
      },
      {
        type: "paragraph",
      },
    ];
  }

  if (result.type === "barChart") {
    return [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: result.title || T.chartResultTitle }],
      },
      {
        type: "chartBlock",
        attrs: { chartObject: result },
      },
      {
        type: "paragraph",
      },
    ];
  }

  return [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: T.functionResultTitle }],
    },
    {
      type: "mathBlock",
      attrs: { mathObject: result },
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `a = ${result.params.a.toFixed(1)}, b = ${result.params.b.toFixed(1)}, c = ${result.params.c.toFixed(1)}`,
        },
      ],
    },
    {
      type: "paragraph",
    },
  ];
}

function buildLessonBlockContent(block: LessonContentBlock): EditorJsonContent[] {
  if (block.type === "heading") {
    return [
      {
        type: "heading",
        attrs: { level: block.level },
        content: [{ type: "text", text: block.text }],
      },
    ];
  }

  if (block.type === "paragraph") {
    return [
      {
        type: "paragraph",
        content: [{ type: "text", text: block.text }],
      },
    ];
  }

  if (block.type === "bulletList") {
    return [
      {
        type: "bulletList",
        content: block.items.map((item) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: item }],
            },
          ],
        })),
      },
    ];
  }

  return buildToolResultContent(block);
}

function buildAgentInsertContent(result: LessonAgentResponse): EditorJsonContent[] {
  if (result.type === "lessonDocument") {
    return [
      ...result.blocks.flatMap(buildLessonBlockContent),
      {
        type: "paragraph",
      },
    ];
  }

  return buildToolResultContent(result);
}

function SlashCommandMenu({
  menu,
  onChooseAi,
}: {
  menu: SlashMenu;
  onChooseAi: () => void;
}) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      onChooseAi();
    }
  }

  return (
    <div className="fixed z-40 w-full max-w-sm border border-stone-200 bg-white p-2 shadow-lg" style={{ top: menu.top, left: menu.left }}>
      <p className="px-2 py-1 text-xs font-medium text-stone-500">{T.commandMenuTitle}</p>
      <button
        type="button"
        autoFocus
        onClick={onChooseAi}
        onKeyDown={handleKeyDown}
        className="mt-1 flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-teal-100 text-teal-800">
          <Sparkles className="size-4" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-stone-900">{T.aiCommandTitle}</span>
          <span className="block text-xs leading-5 text-stone-500">{T.aiCommandDescription}</span>
        </span>
      </button>
    </div>
  );
}

function InlineAiAssistant({
  assistant,
  prompt,
  error,
  isGenerating,
  onPromptChange,
  onGenerate,
  onClose,
}: {
  assistant: AssistantState;
  prompt: string;
  error: string | null;
  isGenerating: boolean;
  onPromptChange: (value: string) => void;
  onGenerate: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <section
      className="fixed z-40 w-full max-w-xl border-l-4 border-teal-500 bg-teal-50 px-5 py-4 shadow-lg"
      style={{ top: assistant.top, left: assistant.left }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-teal-900">
            <Sparkles className="size-4" />
            {T.aiBlockTitle}
          </p>
          <p className="mt-1 text-sm leading-6 text-teal-800">{T.aiBlockHint}</p>
        </div>
        <button
          type="button"
          title={T.close}
          onClick={onClose}
          className="grid size-8 place-items-center rounded-md text-stone-500 hover:bg-white/70 hover:text-stone-800"
        >
          <X className="size-4" />
        </button>
      </div>
      <form onSubmit={onGenerate} className="mt-4 grid gap-3">
        <label htmlFor="math-prompt" className="text-sm font-semibold text-stone-800">
          {T.promptLabel}
        </label>
        <textarea
          id="math-prompt"
          value={prompt}
          onChange={(event) => onPromptChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !isGenerating) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={3}
          autoFocus
          className="resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
        />
        <button
          type="submit"
          disabled={isGenerating}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          <Play className="size-4" />
          {isGenerating ? T.generating : T.generate}
        </button>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </section>
  );
}

export function MathFlowDemo() {
  const [slashMenu, setSlashMenu] = useState<SlashMenu | null>(null);
  const [assistant, setAssistant] = useState<AssistantState | null>(null);
  const [prompt, setPrompt] = useState(T.initialPrompt);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: T.emptyHint,
      }),
      MathBlock,
      FormulaBlock,
      ChartBlock,
    ],
    editorProps: {
      attributes: {
        class:
          "mathflow-editor min-h-[760px] px-6 py-8 outline-none sm:px-12 prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-li:my-1",
      },
    },
    content: `
      <p><strong>${T.previewTitle}</strong></p>
      <h1>${T.pageTitle}</h1>
      <p>${T.scope}</p>
      <h2>${T.lessonGoal}</h2>
      <p>${T.lessonText}</p>
      <ul>
        <li>${T.lessonPointOne}</li>
        <li>${T.lessonPointTwo}</li>
      </ul>
      <p>${T.emptyHint}</p>
      <h2>${T.continueTitle}</h2>
      <p>${T.continueText}</p>
      <ul>
        <li>${T.continuePointOne}</li>
        <li>${T.continuePointTwo}</li>
      </ul>
    `,
    onUpdate: ({ editor: updatedEditor }) => {
      const { from } = updatedEditor.state.selection;
      const before = updatedEditor.state.doc.textBetween(Math.max(0, from - 3), from, "\n", "\n");

      if (before === "/ai") {
        const coords = updatedEditor.view.coordsAtPos(from);
        setSlashMenu(getFloatingPosition(new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top), slashMenuSize));
        return;
      }

      setSlashMenu(null);
    },
  });

  function chooseAiCommand() {
    if (!editor || !slashMenu) {
      return;
    }

    const coords = editor.view.coordsAtPos(editor.state.selection.from);

    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        const { from } = state.selection;
        const before = state.doc.textBetween(Math.max(0, from - 3), from, "\n", "\n");
        const start = before.endsWith("/ai") ? from - 3 : from;
        tr.delete(start, from);
        return true;
      })
      .run();

    setSlashMenu(null);
    setAssistant(getFloatingPosition(new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top), assistantSize));
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editor) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/lesson-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(T.parseFallback);
      }

      const payload = (await response.json()) as { result: unknown };
      const parsed = lessonAgentResponseSchema.parse(payload.result);

      editor
        .chain()
        .focus()
        .insertContent(buildAgentInsertContent(parsed))
        .run();
      setAssistant(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : T.parseFallback);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-stone-950">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <article className="min-w-0 bg-white shadow-sm">
          <EditorContent editor={editor} />
        </article>
      </div>

      {slashMenu ? <SlashCommandMenu menu={slashMenu} onChooseAi={chooseAiCommand} /> : null}
      {assistant ? (
        <InlineAiAssistant
          assistant={assistant}
          prompt={prompt}
          error={error}
          isGenerating={isGenerating}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          onClose={() => setAssistant(null)}
        />
      ) : null}
    </main>
  );
}
