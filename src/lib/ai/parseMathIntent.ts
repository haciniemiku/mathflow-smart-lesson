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

export type MathSlider = z.infer<typeof mathSliderSchema>;
export type QuadraticMathObject = z.infer<typeof quadraticMathObjectSchema>;

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

export async function mockAIParser(prompt: string): Promise<QuadraticMathObject> {
  const normalized = prompt.trim();

  if (!normalized) {
    throw new Error("Please enter a math drawing request.");
  }

  const quadraticHints = [
    "quadratic",
    "parabola",
    "x^2",
    "x\u00b2",
    "\u4e8c\u6b21\u51fd\u6570",
    "\u629b\u7269\u7ebf",
    "\u5f00\u53e3\u5411\u4e0a",
    "\u5f00\u53e3\u5411\u4e0b",
  ];
  const looksQuadratic = quadraticHints.some((hint) => normalized.toLowerCase().includes(hint));

  if (!looksQuadratic) {
    throw new Error("The MVP currently supports quadratic functions only. Try: Draw an upward-opening parabola.");
  }

  const aiOutput = {
    ...quadraticDefaults,
    params: {
      ...quadraticDefaults.params,
      a: inferOpeningDirection(normalized),
    },
  };

  return parseQuadraticAIOutput(aiOutput);
}

export async function parseMathIntent(prompt: string): Promise<QuadraticMathObject> {
  // Real AI integration belongs on a server route and must keep this zod boundary.
  return mockAIParser(prompt);
}
