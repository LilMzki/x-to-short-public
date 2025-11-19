// ./src/main.ts
import { AudioConfiguredTimeline } from "./timelines/audio-configured-timeline";
import { CaptionContextTimeline, CaptionContextTimelineSettings } from "./timelines/caption-context-timeline";
import { DurationConfiguredTimeLine } from "./timelines/duration-configured-timeline";
import { AttachedImageTimeline } from "./timelines/attached-image-timeline";
import { SpeakContextTimeline } from "./timelines/speak-context-timeline";
import { SceneBuilder } from "./timelines/builder";
import { ImageRenderedTimeline } from "./timelines/image-rendered-timeline";
import { VideoRenderedTimeline } from "./timelines/video-rendered-timeline";
import { mergeVideos } from "./merge-video";
import { getScriptFromGPT } from "./get-script-from-gpt";
import { SceneImageRenderer } from "./impls/image-renderer/scene-image-renderer";
import { VoiceVoxImpl } from "./impls/voicevox";
import { DurationGetterImpl } from "./impls/duration-getter";
import { SceneVideoRenderer } from "./impls/scene-video-renderer";
import { addBGMToVideo } from "./add-bgm";
import path from "path";
import { QuoteContextTimeline } from "./timelines/quote-context-timeline";
import { loadConfig } from "./utils/config";

export async function buildVideoFromImages(
  imagePaths: string[],
  quoteContext: string,
  output: string,
  finalOutput: string,
  onProgress: (t: string) => void
) {
  const config = loadConfig();

  onProgress("スクリプト生成中...");
  const script = await getScriptFromGPT(imagePaths);

  onProgress("タイムライン生成中...");
  const builder = new SceneBuilder()
    .add(new SpeakContextTimeline(script))
    .add(new CaptionContextTimeline(new CaptionContextTimelineSettings()))
    .add(new QuoteContextTimeline(quoteContext))
    .add(new AudioConfiguredTimeline(new VoiceVoxImpl()))
    .add(new DurationConfiguredTimeLine(new DurationGetterImpl()))
    .add(new AttachedImageTimeline(imagePaths))
    .add(new ImageRenderedTimeline(new SceneImageRenderer()))
    .add(new VideoRenderedTimeline(new SceneVideoRenderer()));

  const scenes = await builder.execute();

  onProgress("動画結合中...");
  const videoPaths = scenes.map((s) => s.renderedVideoPath);
  await mergeVideos(videoPaths, output);

  onProgress("BGM追加中...");
  await addBGMToVideo(
    output,
    path.resolve(config.bgmPath),
    { videoVolume: 1.0, bgmVolume: 0.2, outputPath: finalOutput }
  );

  onProgress("完了");
}