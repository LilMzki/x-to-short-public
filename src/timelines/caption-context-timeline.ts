import { Scene } from "../scene";
import { ITimeline } from "./interface";
import { SpeakContextTimeline } from "./speak-context-timeline";

export class CaptionContextTimelineSettings{
    maxLineCharacterCount: number = 12;
    maxLineCount: number = 3;
}

export class CaptionContextTimeline implements ITimeline{
    settings: CaptionContextTimelineSettings;
    constructor(settings: CaptionContextTimelineSettings) {
        this.settings = settings;
    }

    async transform(scenes: Scene[]): Promise<Scene[]> {
        let tmpStack = "";
        scenes.forEach((s, i) => {
            const sc = s.speakContext;
            let lines: string[] = [];

            // 長い場合は wrap
            lines = wrapByLengthAndSpecialPunctuation(sc, this.settings.maxLineCharacterCount);

            // tmpStack に追加
            lines.forEach(l => {
                const trimmed = l.trim();
                if (trimmed.length > 0) {
                    tmpStack += trimmed + "\n";
                }
            });

            s.captionContext = tmpStack;

            // 行数オーバーしたらリセット
            const lineCount = tmpStack.trim().split("\n").length;
            if (lineCount >= this.settings.maxLineCount) {
                tmpStack = "";
                scenes[i].changeAttachedImageNext = true;
            }
        });

        return scenes;
    }
}

function wrapByLengthAndSpecialPunctuation(text: string, maxChars: number): string[] {
    const result: string[] = [];
    let line = "";

    for (let i = 0; i < text.length; i++) {
        if(text[i] == '^'){
            result.push(line);
            line = "";
        }else{
            line += text[i];
            if (line.length >= maxChars) {
                result.push(line);
                line = "";
            }
        }
    }
    if (line.length > 0) {
        result.push(line);
    }
    return result;
}