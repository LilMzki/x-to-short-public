import { spawn } from "child_process";
import * as path from "path";

export async function addBGMToVideo(
  targetVideoPath: string,
  bgmPath: string,
  options?: {
    videoVolume?: number;
    bgmVolume?: number;
    outputPath?: string;
  }
): Promise<string> {

  const videoVol = options?.videoVolume ?? 1.0;
  const bgmVol = options?.bgmVolume ?? 0.3;

  const outPath =
    options?.outputPath ??
    path.join(
      path.dirname(targetVideoPath),
      `${path.basename(targetVideoPath, path.extname(targetVideoPath))}_with_bgm.mp4`
    );

const args = [
  "-y",
  "-i", targetVideoPath,
  "-i", bgmPath,
  "-filter_complex",
  `
  [0:a]volume=${videoVol}[va];
  [1:a]volume=${bgmVol}[ba];
  [va][ba]amix=inputs=2:duration=first:dropout_transition=3[mixed];
  [mixed]loudnorm=I=-14:TP=-2:LRA=11:print_format=none[aout]
  `.replace(/\s+/g, " "),
  "-map", "0:v",
  "-map", "[aout]",
  "-c:v", "copy",
  "-c:a", "aac",
  outPath
];


  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", args);

    ff.stderr.on("data", (d) => {
      //console.log(String(d));
    });

    ff.on("close", (code) => {
      if (code === 0) resolve(outPath);
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}
