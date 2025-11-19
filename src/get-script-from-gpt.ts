// ./src/get-script-from-gpt.ts
import * as fs from "fs/promises";
import * as path from "path";
import OpenAI from "openai";
import { makePathAbsolute } from "./utils/make-path-absolute";
import { loadConfig } from "./utils/config";

const config = loadConfig();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -----------------------------
// メイン処理・画像とプロンプトから GPT に問い合わせ
// -----------------------------
export async function getScriptFromGPT(attachedImagePaths: string[]): Promise<string> {
  const prompt = await getStringFromFile("assets/prompt.txt");
  const systemPrompt = await getStringFromFile("assets/system-prompt.txt");

  const imageContents = await Promise.all(
    attachedImagePaths.map(async (p) => {
      const absPath = makePathAbsolute(p);
      const data = await fs.readFile(absPath);
      const ext = path.extname(absPath).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : "application/octet-stream";

      return {
        type: "image_url" as const,
        image_url: {
          url: `data:${mime};base64,${data.toString("base64")}`,
        },
      };
    })
  );

  const response = await client.chat.completions.create({
    model: config.openaiModel,
    messages: [
      {
        role: "system",
        content: [{ type: "text", text: systemPrompt }],
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...imageContents,
        ],
      },
    ],
  });

  console.log("チャッピからレスポンスを受け取りました");
  console.log(response.choices[0].message.content);
  return response.choices[0].message.content ?? "";
}

async function getStringFromFile(_path: string): Promise<string> {
  return await fs.readFile(makePathAbsolute(_path), "utf-8");
}
