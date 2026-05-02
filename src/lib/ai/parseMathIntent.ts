import { z } from "zod";

export const mathSliderSchema = z.object({
  name: z.enum(["a", "b", "c"]),
  min: z.number().finite(),
  max: z.number().finite(),
  step: z.number().positive().finite(),
});

export const quadraticMathObjectSchema = z
  .object({
    type: z.literal("quadratic"),
    latex: z.literal("y = ax^2 + bx + c"),
    expression: z.literal("a*x*x + b*x + c"),
    params: z.object({
      a: z.number().finite().refine((value) => value !== 0, "a cannot be 0 for a quadratic function."),
      b: z.number().finite(),
      c: z.number().finite(),
    }),
    sliders: z.array(mathSliderSchema).length(3),
  })
  .superRefine((mathObject, context) => {
    const sliderNames = new Set(mathObject.sliders.map((slider) => slider.name));

    for (const name of ["a", "b", "c"] as const) {
      if (!sliderNames.has(name)) {
        context.addIssue({
          code: "custom",
          message: `Missing ${name} slider.`,
          path: ["sliders"],
        });
      }
    }

    for (const slider of mathObject.sliders) {
      const value = mathObject.params[slider.name];

      if (slider.min >= slider.max) {
        context.addIssue({
          code: "custom",
          message: "Slider min must be less than max.",
          path: ["sliders", slider.name],
        });
      }

      if (value < slider.min || value > slider.max) {
        context.addIssue({
          code: "custom",
          message: `Initial value for ${slider.name} must fit within its slider range.`,
          path: ["params", slider.name],
        });
      }
    }
  });

export const formulaBlockSchema = z.object({
  type: z.literal("formula"),
  title: z.string().min(1),
  latex: z.string().min(1),
  caption: z.string().min(1).optional(),
});

export const chartDatumSchema = z.object({
  label: z.string().min(1),
  value: z.number().finite().nonnegative(),
});

export const barChartBlockSchema = z.object({
  type: z.literal("barChart"),
  title: z.string().min(1),
  xLabel: z.string().min(1).optional(),
  yLabel: z.string().min(1).optional(),
  data: z.array(chartDatumSchema).min(1).max(12),
});

export const agentResultSchema = z.discriminatedUnion("type", [
  quadraticMathObjectSchema,
  formulaBlockSchema,
  barChartBlockSchema,
]);

export type MathSlider = z.infer<typeof mathSliderSchema>;
export type QuadraticMathObject = z.infer<typeof quadraticMathObjectSchema>;
export type FormulaBlockObject = z.infer<typeof formulaBlockSchema>;
export type BarChartBlockObject = z.infer<typeof barChartBlockSchema>;
export type AgentResult = z.infer<typeof agentResultSchema>;

export function parseAgentResult(output: unknown): AgentResult {
  return agentResultSchema.parse(output);
}

export function parseQuadraticAIOutput(output: unknown): QuadraticMathObject {
  return quadraticMathObjectSchema.parse(output);
}

const quadraticDefaults: QuadraticMathObject = parseQuadraticAIOutput({
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
});

function inferOpeningDirection(prompt: string): number {
  const normalized = prompt.toLowerCase();
  const downwardHints = ["down", "opens downward", "concave down", "\u5411\u4e0b", "\u5f00\u53e3\u5411\u4e0b"];

  return downwardHints.some((hint) => normalized.includes(hint)) ? -1 : 1;
}

function createQuadraticResult(prompt: string): QuadraticMathObject {
  return parseQuadraticAIOutput({
    ...quadraticDefaults,
    params: {
      ...quadraticDefaults.params,
      a: inferOpeningDirection(prompt),
    },
  });
}

export async function mockLessonAgent(prompt: string): Promise<AgentResult> {
  const normalized = prompt.trim();
  const lower = normalized.toLowerCase();

  if (!normalized) {
    throw new Error("Please enter a math drawing request.");
  }

  if (/bar|chart|histogram|distribution|statistics|\u7edf\u8ba1|\u67f1\u72b6\u56fe|\u6761\u5f62\u56fe|\u5206\u5e03|\u6210\u7ee9/.test(lower)) {
    return parseAgentResult({
      type: "barChart",
      title: "\u73ed\u7ea7\u6210\u7ee9\u5206\u5e03",
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

  if (/formula|latex|equation|\u516c\u5f0f|\u6c42\u6839|\u5224\u522b\u5f0f/.test(lower)) {
    return parseAgentResult({
      type: "formula",
      title: "\u4e8c\u6b21\u65b9\u7a0b\u6c42\u6839\u516c\u5f0f",
      latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      caption: "\u5f53 ax^2 + bx + c = 0 \u4e14 a \\ne 0 \u65f6\u4f7f\u7528\u3002",
    });
  }

  return createQuadraticResult(normalized);
}

export async function mockAIParser(prompt: string): Promise<QuadraticMathObject> {
  const result = await mockLessonAgent(prompt);

  if (result.type !== "quadratic") {
    return createQuadraticResult(prompt);
  }

  return result;
}

export async function parseMathIntent(prompt: string): Promise<QuadraticMathObject> {
  return mockAIParser(prompt);
}
