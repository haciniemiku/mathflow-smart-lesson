import { NextResponse } from "next/server";
import { mockAIParser, parseQuadraticAIOutput } from "@/lib/ai/parseMathIntent";

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

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: unknown };

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    const fallback = await mockAIParser(prompt);
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
            "For this MVP, support only quadratic function requests.",
            "Never return executable JavaScript or Python.",
            "The JSON must exactly match this shape:",
            '{"type":"quadratic","latex":"y = ax^2 + bx + c","expression":"a*x*x + b*x + c","params":{"a":1,"b":0,"c":0},"sliders":[{"name":"a","min":-5,"max":5,"step":0.1},{"name":"b","min":-10,"max":10,"step":0.1},{"name":"c","min":-10,"max":10,"step":0.1}]}',
            "Choose params from the teacher intent, but keep a non-zero.",
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
    const fallback = await mockAIParser(prompt);
    return NextResponse.json({ result: fallback, source: "mock", warning: "DeepSeek request failed." });
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    const fallback = await mockAIParser(prompt);
    return NextResponse.json({ result: fallback, source: "mock", warning: "DeepSeek returned empty content." });
  }

  try {
    const parsed = parseQuadraticAIOutput(extractJsonObject(content));
    return NextResponse.json({ result: parsed, source: "deepseek" });
  } catch {
    const fallback = await mockAIParser(prompt);
    return NextResponse.json({ result: fallback, source: "mock", warning: "DeepSeek JSON failed schema validation." });
  }
}
