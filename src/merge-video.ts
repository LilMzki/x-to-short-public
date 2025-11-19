import { exec } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";

export async function mergeVideos(targetPaths: string[], outPath: string) {
    // concat リスト用一時ファイル
    const listFile = path.join(process.cwd(), `ffmpeg_concat_${Date.now()}.txt`);

    try {
        // ffmpeg 用の concat リストを作成
        const listContent = targetPaths
            .map(p => `file '${path.resolve(p)}'`)
            .join("\n");

        await fs.writeFile(listFile, listContent, "utf8");

        console.log("FFmpeg concat list:");
        console.log(listContent);

        // ffmpeg コマンド
        const cmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outPath}"`;

        console.log("Running:", cmd);

        await new Promise<void>((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                console.log(stdout);
                console.log(stderr);
                if (error) return reject(error);
                resolve();
            });
        });

        console.log(`done: ${outPath} に出力`);
    } finally {
        // 一時ファイル削除
        await fs.unlink(listFile).catch(() => {});
    }
}
