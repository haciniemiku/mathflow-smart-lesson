import { NextResponse } from "next/server";
import { coerceModelPlan, executeLessonPlan, extractJsonObject, mockPlanner } from "@/lib/ai/lessonAgent";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

async function requestPlannerFromDeepSeek(prompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are the MathFlow planner.",
            "Return only one JSON object. Do not return final lesson content outside JSON.",
            "You plan safe tool calls for a high-school math lesson editor.",
            "The executor is local code and can only run these tools:",
            "writeHeading, writeParagraph, writeBulletList, insertFormula, drawFunction, drawBarChart.",
            "Use mode='lesson' when the teacher asks for a complete lesson plan or teaching design.",
            "Use mode='single' for a single formula, graph, or chart request.",
            "For a complete lesson, include 6-10 steps and combine text, formulas, and at least one function graph.",
            "For drawFunction, the MVP supports quadratic graphs only.",
            "Never plan executable JavaScript or Python.",
            "Return this exact shape:",
            '{"mode":"lesson","title":"lesson title","steps":[{"id":"title","tool":"writeHeading","instruction":"heading text"},{"id":"intro","tool":"writeParagraph","instruction":"paragraph text"},{"id":"formula","tool":"insertFormula","instruction":"formula to insert"},{"id":"graph","tool":"drawFunction","instruction":"quadratic graph to draw"}]}',
          ].join("\n"),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return null;
  }

  return coerceModelPlan(extractJsonObject(content));
}

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: unknown };

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  let source: "deepseek-planner" | "mock-planner" = "deepseek-planner";
  let plan = await requestPlannerFromDeepSeek(prompt).catch(() => null);

  if (!plan) {
    source = "mock-planner";
    plan = mockPlanner(prompt);
  }

  const result = executeLessonPlan(plan);

  return NextResponse.json({
    result,
    plan,
    source,
  });
}
