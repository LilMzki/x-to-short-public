## ./get-script-from-gpt.ts

```ts
export async function getScriptFromGPT(attachedImagePaths: string[]): Promise<string>{
    console.log(`${attachedImagePaths}と${await getPromptFromFile()}からGPTにリクエストしました`);
    await new Promise((r) => setTimeout(r, 1000));
    const dummyResult = "台本です台本です。台本です。台本です。台本です。";
    return dummyResult;
}

async function getPromptFromFile(): Promise<string>{
    return "テストプロンプト";
}
```

## ./main.ts

```ts
import { AudioConfiguredTimeline, IVoiceVox } from "./timelines/audio-configured-timeline";
import { CaptionContextTimeline, CaptionContextTimelineSettings } from "./timelines/caption-context-timeline";
import { DurationConfiguredTimeLine, IAudioDurationGetter } from "./timelines/duration-configured-timeline";
import { AttachedImageTimeline } from "./timelines/attached-image-timeline";
import { SpeakContextTimeline } from "./timelines/speak-context-timeline";
import { SceneBuilder } from "./timelines/builder";
import { ImageRenderedTimeline, ISceneImageRenderer } from "./timelines/image-rendered-timeline";
import { VideoRenderedTimeline, ISceneVideoRenderer } from "./timelines/video-rendered-timeline";
import { mergeVideos } from "./merge-video";
import { getScriptFromGPT } from "./get-script-from-gpt";

class MockVoiceVox implements IVoiceVox{
    async request(context: string, outPath: string): Promise<void> {
        await new Promise((r) => setTimeout(r, 500));
        console.log(`${context}の音声を${outPath}に書きだした`);
    }
}

class MockDurationGetter implements IAudioDurationGetter{
    async get(path: string): Promise<number> {
        await new Promise((r) => setTimeout(r, 500));
        const rNumber = 10 * Math.random();
        return rNumber;
    }
}

class MockImageRenderer implements ISceneImageRenderer{
    async render(outPath: string): Promise<void> {
        await new Promise((r) => setTimeout(r, 500));
        console.log(`${outPath}にシーンの写真レンダー結果を出力`);
    }
}

class MockVideoRenderer implements ISceneVideoRenderer{
    async render(outPath: string): Promise<void> {
        await new Promise((r) => setTimeout(r, 500));
        console.log(`${outPath}にシーンの動画レンダー結果を出力`);
    }
}


const testImagePaths = ["image001.png", "img002.png"];
const testScript = await getScriptFromGPT(testImagePaths);

const builder = new SceneBuilder()
        .add( new SpeakContextTimeline(testScript) )
        .add( new CaptionContextTimeline(new CaptionContextTimelineSettings()))
        .add( new AudioConfiguredTimeline(new MockVoiceVox()))
        .add( new DurationConfiguredTimeLine(new MockDurationGetter()) )
        .add( new AttachedImageTimeline(testImagePaths) )
        .add( new ImageRenderedTimeline(new MockImageRenderer()) )
        .add( new VideoRenderedTimeline(new MockVideoRenderer()) );

const scenes = await builder.execute();

const videoPaths = scenes.map(s => s.renderedVideoPath);
await mergeVideos(videoPaths, `out.mp4`);

console.log(scenes);
```

## ./merge-video.ts

```ts
export async function mergeVideos(targetPaths: string[], outPath: string){
    //未実装
    for(let i = 0; i < targetPaths.length; i++){
        console.log(`${targetPaths[i]}を統合中`);
        await new Promise((r) => setTimeout(r, 500));
    }
    console.log(`done: ${outPath}に出力`);
}
```

## ./scene.ts

```ts
export class Scene{
    speakContext: string = ""
    captionContext: string = ""
    duration: number = 0
    attachedImagePath: string = ""
    audioPath: string = ""
    changeAttachedImageNext: boolean = false;
    renderedImagePath: string = "";
    renderedVideoPath: string = "";
}
```

## ./timelines\attached-image-timeline.ts

```ts
import { Scene } from "../scene";
import { ITimeline } from "./interface";

export class AttachedImageTimeline implements ITimeline{
    imgPaths: string[];
    constructor(imgPaths: string[]){
        this.imgPaths = imgPaths;
    }

    async transform(scenes: Scene[]): Promise<Scene[]> {
        let imageChangedCount = 0;
        for(let i = 0; i < scenes.length; i++){
            const imageSelector = imageChangedCount % this.imgPaths.length;
            scenes[i].attachedImagePath = this.imgPaths[imageSelector];
            if(scenes[i].changeAttachedImageNext){
                imageChangedCount++;
            }
        }
        return scenes;
    }
}
```

## ./timelines\audio-configured-timeline.ts

```ts
import { Scene } from "../scene";
import * as path from "path";
import { ITimeline } from "./interface";

export interface IVoiceVox{
    request(context: string, outPath: string): Promise<void>
}

export class AudioConfiguredTimeline implements ITimeline{
    private voicevox: IVoiceVox;
    constructor(voicevox: IVoiceVox){
        this.voicevox = voicevox;
    }

    async transform(scenes: Scene[]): Promise<Scene[]> {
        for(let i = 0; i < scenes.length; i++){
            const speakCtx = scenes[i].speakContext;
            const outPath = path.resolve(`out/${i}.wav`);
            await this.voicevox.request(speakCtx, outPath)
            scenes[i].audioPath = outPath;
        }
        return scenes;
    }
}
```

## ./timelines\builder.ts

```ts
import { Scene } from "../scene";
import { ITimeline } from "./interface";

export class SceneBuilder{
    private timelines: ITimeline[] = [];

    public add(timeline: ITimeline): SceneBuilder{
        this.timelines.push(timeline);
        return this;
    }

    async execute(): Promise<Scene[]>{
        let scenes: Scene[] = [];
        for(let i = 0; i < this.timelines.length; i++){
            scenes = await this.timelines[i].transform(scenes);
        }
        return scenes;
    }
}
```

## ./timelines\caption-context-timeline.ts

```ts
import { Scene } from "../scene";
import { ITimeline } from "./interface";
import { SpeakContextTimeline } from "./speak-context-timeline";

export class CaptionContextTimelineSettings{
    maxLineCharacterCount: number = 12;
    maxLineCount: number = 7;
}

export class CaptionContextTimeline implements ITimeline{
    settings: CaptionContextTimelineSettings;
    constructor(settings: CaptionContextTimelineSettings) {
        this.settings = settings;
    }

    async transform(scenes: Scene[]): Promise<Scene[]> {
        let tmpStack = "";
        scenes.forEach(s => {
            const sc = s.speakContext;
            let lines: string[] = [];

            if (sc.length > this.settings.maxLineCharacterCount) {
                // 長い場合は wrap
                lines = wrapByLength(sc, this.settings.maxLineCharacterCount);
            } else {
                lines = [sc];
            }

            // tmpStack に追加
            lines.forEach(l => {
                tmpStack += l + "\n";
            });

            s.captionContext = tmpStack;

            // 行数オーバーしたらリセット
            const lineCount = tmpStack.trim().split("\n").length;
            if (lineCount >= this.settings.maxLineCount) {
                tmpStack = "";
                s.changeAttachedImageNext = true;
            }
        });

        return scenes;
    }
}

function wrapByLength(text: string, maxChars: number): string[] {
    const result: string[] = [];
    let line = "";

    for (let i = 0; i < text.length; i++) {
        line += text[i];
        if (line.length >= maxChars) {
            result.push(line);
            line = "";
        }
    }
    if (line.length > 0) {
        result.push(line);
    }
    return result;
}
```

## ./timelines\duration-configured-timeline.ts

```ts
import { Scene } from "../scene";
import { ITimeline } from "./interface";

export interface IAudioDurationGetter{
    get(path: string): Promise<number>;
}

export class DurationConfiguredTimeLine implements ITimeline{
    private durationGetter: IAudioDurationGetter;

    constructor(durationGetter: IAudioDurationGetter){
        this.durationGetter = durationGetter;
    }

    async transform(scenes: Scene[]): Promise<Scene[]> {
        for(let i = 0; i < scenes.length; i++){
            const _path = scenes[i].audioPath;
            scenes[i].duration = await this.durationGetter.get(_path);
        }
        return scenes;
    }
}
```

## ./timelines\image-rendered-timeline.ts

```ts
import { Scene } from "../scene";
import { ITimeline } from "./interface";
import * as path from "path";

export interface ISceneImageRenderer{
    render(outPath: string, scene: Scene): Promise<void>;
}

export class ImageRenderedTimeline implements ITimeline{
    constructor(private renderer: ISceneImageRenderer){}

    async transform(scenes: Scene[]): Promise<Scene[]> {
        for(let i = 0; i < scenes.length; i++){
            const outPath = path.resolve(`rendered-scene-${i}.png`);
            await this.renderer.render(outPath, scenes[i]);
            scenes[i].renderedImagePath = outPath;
        }
        return scenes;
    }
}
```

## ./timelines\interface.ts

```ts
import { Scene } from "../scene";

export interface ITimeline {
    transform( scenes: Scene[] ): Promise<Scene[]>
}
```

## ./timelines\speak-context-timeline.ts

```ts
import { Scene } from "../scene"
import { ITimeline } from "./interface";

export class SpeakContextTimeline implements ITimeline{
    private script: string;

    constructor(script: string){
        this.script = script;
    }

    async transform(scenes: Scene[]): Promise<Scene[]> {
        const speakContexts = this.script
        .split(/(?<=、|。)|(?=\n)/) 
        .map(s => s.replace(/\n+/g, ""))
        .filter(s => s.trim() !== "");
        
        speakContexts.forEach((sc) => {
            const newScene = new Scene();
            newScene.speakContext = sc;
            scenes.push(newScene);
        })
        return scenes;
    }
}
```

## ./timelines\video-rendered-timeline.ts

```ts
import { Scene } from "../scene";
import { ITimeline } from "./interface";
import * as path from "path";

export interface ISceneVideoRenderer{
    render(outPath: string, scene: Scene): Promise<void>;
}

export class VideoRenderedTimeline implements ITimeline{
    constructor(private renderer: ISceneVideoRenderer){}

    async transform(scenes: Scene[]): Promise<Scene[]> {
        for(let i = 0; i < scenes.length; i++){
            const outPath = path.resolve(`rendered-scene-${i}.mp4`);
            await this.renderer.render(outPath, scenes[i]);
            scenes[i].renderedVideoPath = outPath;
        }
        return scenes;
    }
}
```

