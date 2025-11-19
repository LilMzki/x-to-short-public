// ./src/web/server.ts
import express from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";

import { buildVideoFromImages } from "../main";
import { loadConfig } from "../utils/config";

const app = express();
const config = loadConfig();
const PORT = config.serverPort;

// ---- アップロードフォルダ ----
const uploadDir = path.resolve("./uploads");
const outputDir = path.resolve("./outputs");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// ---- メモリ上の簡易ジョブ管理 ----
const jobs: Record<
  string,
  {
    status: "processing" | "complete" | "error";
    videoPath?: string;
    progress?: string;
  }
> = {};

// ---- multer 設定 ----
function detectExtension(mimetype: string) {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
  };
  return map[mimetype] ?? "";
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = detectExtension(file.mimetype);
    const hash = crypto.randomBytes(16).toString("hex");
    cb(null, `${hash}${ext}`);
  },
});

// ★ 必要なら limits でサイズ制限も追加
const upload = multer({
  storage,
  // limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

// ---- アップロードファイル削除用 ----
function safeUnlink(filePath: string) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.warn(`ファイル削除に失敗しました: ${filePath}`, err);
    }
  });
}

// ---- HTML ----
app.get("/", (req, res) => {
  res.sendFile(path.resolve("src/web/index.html"));
});

// ---- アップロード（ジョブ登録） ----
app.post("/upload", upload.array("images"), async (req, res) => {
  const files = req.files as Express.Multer.File[];

  if (!files || !files.length) {
    return res.status(400).send("画像がアップロードされていません");
  }

  const imagePaths = files.map((f) => path.resolve(f.path));

  const quote = req.body.quote ?? "";
  console.log("引用文:", quote);

  const jobId = crypto.randomUUID();
  jobs[jobId] = { status: "processing" };

  setImmediate(async () => {
    try {
      const outputPath = path.resolve(outputDir, `${jobId}.mp4`);
      const finalOutput = outputPath.replace(".mp4", "_withBGM.mp4");

      await buildVideoFromImages(
        imagePaths,
        quote,
        outputPath,
        finalOutput,
        (progress: string) => {
          jobs[jobId].progress = progress;
        }
      );

      jobs[jobId].status = "complete";
      jobs[jobId].videoPath = finalOutput;
    } catch (e) {
      console.error(e);
      jobs[jobId].status = "error";
    } finally {
      // ★ ステップ5: uploads のクリーンアップ
      imagePaths.forEach((p) => safeUnlink(p));
    }
  });

  res.json({ jobId });
});

// ---- ジョブステータス ----
app.get("/job-status/:id", (req, res) => {
  const job = jobs[req.params.id];
  if (!job) return res.status(404).json({ error: "not found" });

  res.json({
    status: job.status,
    progress: job.progress,
    videoUrl: job.videoPath ? `/video/${path.basename(job.videoPath)}` : undefined,
  });
});

// ---- 完成動画のダウンロード ----
app.get("/video/:filename", (req, res) => {
  const file = path.resolve(outputDir, req.params.filename);
  res.download(file);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
