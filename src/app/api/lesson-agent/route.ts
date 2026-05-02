import { NextResponse } from "next/server";
import { mockLessonAgent, parseAgentResult } from "@/lib/ai/parseMathIntent";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

function extractJsonObject(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fenced?.[1] ?? content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("DeepSeek did not return a JSON object.");
  }

  return JSON.parse(raw.slice(start, end + 1));
}

function inferExpectedTool(prompt: string) {
  const lower = prompt.trim().toLowerCase();

  if (/bar|chart|histogram|distribution|statistics|\u7edf\u8ba1|\u67f1\u72b6\u56fe|\u6761\u5f62\u56fe|\u5206\u5e03|\u6210\u7ee9/.test(lower)) {
    return "barChart";
  }

  if (/formula|latex|equation|\u516c\u5f0f|\u6c42\u6839|\u5224\u522b\u5f0f/.test(lower)) {
    return "formula";
  }

  if (/function|graph|parabola|quadratic|\u51fd\u6570|\u56fe\u50cf|\u629b\u7269\u7ebf|\u4e8c\u6b21/.test(lower)) {
    return "quadratic";
  }

  return null;
}

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: unknown };

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    const fallback = await mockLessonAgent(prompt);
    return NextResponse.json({ result: fallback, source: "mock" });
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
            "You are the MathFlow lesson agent.",
            "Return only one JSON object for a high-school math lesson editor.",
            "You have three safe tools. Choose exactly one tool based on the teacher intent.",
            "Tool 1 drawFunction: use for function graphs, currently only quadratic.",
            "Tool 2 insertFormula: use for formulas, identities, or equations.",
            "Tool 3 drawBarChart: use for statistics, distributions, scores, or counts.",
            "Never return executable JavaScript or Python.",
            "Return one of these JSON shapes:",
            'drawFunction -> {"type":"quadratic","latex":"y = ax^2 + bx + c","expression":"a*x*x + b*x + c","params":{"a":1,"b":0,"c":0},"sliders":[{"name":"a","min":-5,"max":5,"step":0.1},{"name":"b","min":-10,"max":10,"step":0.1},{"name":"c","min":-10,"max":10,"step":0.1}]}',
            'insertFormula -> {"type":"formula","title":"\\u516c\\u5f0f\\u6807\\u9898","latex":"x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}","caption":"\\u7b80\\u77ed\\u8bf4\\u660e"}',
            'drawBarChart -> {"type":"barChart","title":"\\u7edf\\u8ba1\\u56fe\\u6807\\u9898","xLabel":"\\u7c7b\\u522b","yLabel":"\\u6570\\u503c","data":[{"label":"A","value":10},{"label":"B","value":8}]}',
            "For drawFunction, keep a non-zero and choose params from the teacher intent.",
            "For chart data, infer reasonable demo data if the user did not provide exact numbers.",
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
    const fallback = await mockLessonAgent(prompt);
    return NextResponse.json({ result: fallback, source: "mock", warning: "DeepSeek request failed." });
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    const fallback = await mockLessonAgent(prompt);
    return NextResponse.json({ result: fallback, source: "mock", warning: "DeepSeek returned empty content." });
  }

  try {
    const parsed = parseAgentResult(extractJsonObject(content));

    const expectedTool = inferExpectedTool(prompt);
    if (expectedTool && parsed.type !== expectedTool) {
      const fallback = await mockLessonAgent(prompt);
      return NextResponse.json({
        result: fallback,
        source: "mock",
        warning: "DeepSeek selected a mismatched tool.",
      });
    }

    return NextResponse.json({ result: parsed, source: "deepseek" });
  } catch {
    const fallback = await mockLessonAgent(prompt);
    return NextResponse.json({ result: fallback, source: "mock", warning: "DeepSeek JSON failed schema validation." });
  }
}
