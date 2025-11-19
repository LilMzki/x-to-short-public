// ./src/config.ts
import * as fs from "fs";
import * as path from "path";

export interface AppConfig {
  bgmPath: string;
  fontPath: string;
  voiceVoxBaseUrl: string;
  serverPort: number;
  openaiModel: string;
}

let cachedConfig: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = path.resolve("config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(`config.json が見つかりません: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = JSON.parse(raw) as Partial<AppConfig>;

  cachedConfig = {
    bgmPath: parsed.bgmPath ?? "./assets/bgm.mp3",
    fontPath: parsed.fontPath ?? "./assets/NotoSansJP-ExtraBold.ttf",
    voiceVoxBaseUrl: parsed.voiceVoxBaseUrl ?? "http://127.0.0.1:50021",
    serverPort: parsed.serverPort ?? 3000,
    openaiModel: parsed.openaiModel ?? "gpt-5-mini"
  };

  return cachedConfig;
}
