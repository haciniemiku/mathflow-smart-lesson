import { z } from "zod";
import {
  agentResultSchema,
  barChartBlockSchema,
  formulaBlockSchema,
  lessonAgentResponseSchema,
  lessonDocumentSchema,
  parseAgentResult,
  parseLessonAgentResponse,
  quadraticMathObjectSchema,
  type AgentResult,
  type LessonAgentResponse,
  type LessonContentBlock,
} from "@/lib/ai/parseMathIntent";

const toolNameSchema = z.enum(["writeHeading", "writeParagraph", "writeBulletList", "insertFormula", "drawFunction", "drawBarChart"]);

const plannedStepSchema = z.object({
  id: z.string().min(1),
  tool: toolNameSchema,
  instruction: z.string().min(1),
});

export const lessonPlanSchema = z.object({
  mode: z.enum(["single", "lesson"]),
  title: z.string().min(1),
  steps: z.array(plannedStepSchema).min(1).max(18),
});

export type LessonPlan = z.infer<typeof lessonPlanSchema>;
type ToolName = z.infer<typeof toolNameSchema>;

const quadraticDefaults = {
  type: "quadratic",
  latex: "y = ax^2 + bx + c",
  expression: "a*x*x + b*x + c",
  params: {
    a: 1,
    b: 0,
    c: 0,
  },
  sliders: [
    { name: "a", min: -5, max: 5, step: 0.1 },
    { name: "b", min: -10, max: 10, step: 0.1 },
    { name: "c", min: -10, max: 10, step: 0.1 },
  ],
} as const;

export function extractJsonObject(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fenced?.[1] ?? content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object.");
  }

  return JSON.parse(raw.slice(start, end + 1));
}

function hasAny(prompt: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(prompt));
}

function inferTool(prompt: string): ToolName {
  const lower = prompt.trim().toLowerCase();

  if (hasAny(lower, [/bar|chart|histogram|distribution|statistics/, /\u7edf\u8ba1|\u67f1\u72b6\u56fe|\u6761\u5f62\u56fe|\u5206\u5e03|\u6210\u7ee9/])) {
    return "drawBarChart";
  }

  if (hasAny(lower, [/formula|latex|equation/, /\u516c\u5f0f|\u6c42\u6839|\u5224\u522b\u5f0f|\u6052\u7b49\u5f0f/])) {
    return "insertFormula";
  }

  return "drawFunction";
}

export function isFullLessonRequest(prompt: string) {
  return /lesson|teaching plan|complete plan|full lesson|\u5b8c\u6574.*\u6559\u6848|\u6559\u6848|\u4e00\u8282\u8bfe|\u8bfe\u65f6|\u6559\u5b66\u8bbe\u8ba1/.test(
    prompt.trim().toLowerCase(),
  );
}

function inferOpeningDirection(prompt: string) {
  const normalized = prompt.toLowerCase();
  return /down|opens downward|concave down|\u5411\u4e0b|\u5f00\u53e3\u5411\u4e0b/.test(normalized) ? -1 : 1;
}

function drawFunction(instruction: string): AgentResult {
  return parseAgentResult({
    ...quadraticDefaults,
    params: {
      ...quadraticDefaults.params,
      a: inferOpeningDirection(instruction),
    },
  });
}

function insertFormula(instruction: string): AgentResult {
  const lower = instruction.toLowerCase();

  if (/vertex|\u9876\u70b9/.test(lower)) {
    return parseAgentResult({
      type: "formula",
      title: "\u4e8c\u6b21\u51fd\u6570\u9876\u70b9\u516c\u5f0f",
      latex: "\\left(-\\frac{b}{2a}, \\frac{4ac-b^2}{4a}\\right)",
      caption: "\u7528\u4e8e\u5f15\u5bfc\u5b66\u751f\u4ece\u53c2\u6570\u53d8\u5316\u89c2\u5bdf\u9876\u70b9\u4f4d\u7f6e\u3002",
    });
  }

  return parseAgentResult({
    type: "formula",
    title: "\u4e8c\u6b21\u65b9\u7a0b\u6c42\u6839\u516c\u5f0f",
    latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    caption: "\u5f53 ax^2 + bx + c = 0 \u4e14 a \\ne 0 \u65f6\u4f7f\u7528\u3002",
  });
}

function drawBarChart(): AgentResult {
  return parseAgentResult({
    type: "barChart",
    title: "\u8bfe\u5802\u5c0f\u6d4b\u6210\u7ee9\u5206\u5e03",
    xLabel: "\u5206\u6570\u6bb5",
    yLabel: "\u4eba\u6570",
    data: [
      { label: "60\u4ee5\u4e0b", value: 3 },
      { label: "60-70", value: 8 },
      { label: "70-80", value: 15 },
      { label: "80-90", value: 12 },
      { label: "90\u4ee5\u4e0a", value: 5 },
    ],
  });
}

export function mockPlanner(prompt: string): LessonPlan {
  if (isFullLessonRequest(prompt)) {
    return lessonPlanSchema.parse({
      mode: "lesson",
      title: "\u4e8c\u6b21\u51fd\u6570\u56fe\u50cf\u4e0e\u53c2\u6570\u53d8\u5316\u6559\u6848",
      steps: [
        { id: "title", tool: "writeHeading", instruction: "\u4e8c\u6b21\u51fd\u6570\u56fe\u50cf\u4e0e\u53c2\u6570\u53d8\u5316" },
        { id: "intro", tool: "writeParagraph", instruction: "\u9762\u5411\u9ad8\u4e2d\u6570\u5b66\u8bfe\u5802\uff0c\u7528\u53ef\u89c6\u5316\u65b9\u5f0f\u5f15\u5bfc\u5b66\u751f\u7406\u89e3 y = ax^2 + bx + c \u7684\u56fe\u50cf\u53d8\u5316\u3002" },
        { id: "goals", tool: "writeBulletList", instruction: "\u8bfe\u5802\u76ee\u6807\uff1b\u8bc6\u522b\u6807\u51c6\u5f62\u5f0f\uff1b\u8bf4\u660e a\u3001b\u3001c \u5bf9\u56fe\u50cf\u7684\u5f71\u54cd\uff1b\u80fd\u901a\u8fc7\u56fe\u50cf\u89e3\u91ca\u53c2\u6570\u610f\u4e49" },
        { id: "formula-main", tool: "insertFormula", instruction: "\u63d2\u5165\u4e8c\u6b21\u51fd\u6570\u7684\u6807\u51c6\u5f62\u5f0f" },
        { id: "graph", tool: "drawFunction", instruction: "\u753b\u4e00\u4e2a\u5f00\u53e3\u5411\u4e0a\u7684\u629b\u7269\u7ebf\uff0c\u63d0\u4f9b a\u3001b\u3001c \u6ed1\u5757" },
        { id: "activity", tool: "writeParagraph", instruction: "\u6559\u5b66\u6d3b\u52a8\uff1a\u5148\u56fa\u5b9a b\u548c c\uff0c\u62d6\u52a8 a \u89c2\u5bdf\u5f00\u53e3\u65b9\u5411\u548c\u5bbd\u7a84\uff1b\u518d\u8c03\u6574 b\u548c c\uff0c\u8bb0\u5f55\u5bf9\u79f0\u8f74\u548c\u622a\u8ddd\u7684\u53d8\u5316\u3002" },
        { id: "vertex", tool: "insertFormula", instruction: "\u63d2\u5165\u4e8c\u6b21\u51fd\u6570\u9876\u70b9\u516c\u5f0f" },
        { id: "assessment", tool: "drawBarChart", instruction: "\u751f\u6210\u8bfe\u5802\u5c0f\u6d4b\u6210\u7ee9\u5206\u5e03\u56fe\uff0c\u7528\u4e8e\u8bfe\u540e\u5206\u6790" },
        { id: "summary", tool: "writeBulletList", instruction: "\u8bfe\u5802\u5c0f\u7ed3\uff1ba \u51b3\u5b9a\u5f00\u53e3\u65b9\u5411\u548c\u5bbd\u7a84\uff1bc \u5f71\u54cd y \u8f74\u622a\u8ddd\uff1b\u53c2\u6570\u53d8\u5316\u8981\u7ed3\u5408\u56fe\u50cf\u89c2\u5bdf" },
      ],
    });
  }

  return lessonPlanSchema.parse({
    mode: "single",
    title: "\u5355\u4e2a\u6570\u5b66\u5de5\u5177\u7ed3\u679c",
    steps: [{ id: "single", tool: inferTool(prompt), instruction: prompt }],
  });
}

function executeTextTool(step: LessonPlan["steps"][number]): LessonContentBlock {
  if (step.tool === "writeHeading") {
    return { type: "heading", level: step.id === "title" ? 1 : 2, text: step.instruction };
  }

  if (step.tool === "writeBulletList") {
    return {
      type: "bulletList",
      items: step.instruction
        .split(/[;\uff1b]/)
        .map((item) => item.trim())
        .filter(Boolean),
    };
  }

  return { type: "paragraph", text: step.instruction };
}

export function executeLessonPlan(plan: LessonPlan): LessonAgentResponse {
  const blocks = plan.steps.map((step): LessonContentBlock => {
    if (step.tool === "drawFunction") {
      return drawFunction(step.instruction);
    }

    if (step.tool === "insertFormula") {
      return insertFormula(step.instruction);
    }

    if (step.tool === "drawBarChart") {
      return drawBarChart();
    }

    return executeTextTool(step);
  });

  if (plan.mode === "single") {
    const firstToolResult = blocks.find((block) => agentResultSchema.safeParse(block).success);

    if (firstToolResult) {
      return parseLessonAgentResponse(firstToolResult);
    }
  }

  return parseLessonAgentResponse({
    type: "lessonDocument",
    title: plan.title,
    blocks,
  });
}

export function executeSingleTool(prompt: string): AgentResult {
  const tool = inferTool(prompt);

  if (tool === "drawBarChart") {
    return drawBarChart();
  }

  if (tool === "insertFormula") {
    return insertFormula(prompt);
  }

  return drawFunction(prompt);
}

export function coerceModelPlan(output: unknown): LessonPlan {
  return lessonPlanSchema.parse(output);
}

export function coerceModelExecution(output: unknown): LessonAgentResponse {
  return lessonAgentResponseSchema.parse(output);
}

export function validateToolResult(tool: ToolName, output: unknown): LessonContentBlock {
  if (tool === "drawFunction") {
    return quadraticMathObjectSchema.parse(output);
  }

  if (tool === "insertFormula") {
    return formulaBlockSchema.parse(output);
  }

  if (tool === "drawBarChart") {
    return barChartBlockSchema.parse(output);
  }

  return executeTextTool({ id: "text", tool, instruction: String(output) });
}

export { lessonAgentResponseSchema, lessonDocumentSchema };
