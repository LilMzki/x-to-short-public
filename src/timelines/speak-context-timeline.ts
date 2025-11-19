import { Scene } from "../scene"
import { createLineBreaker } from "../utils/create-line-breaker";
import { ITimeline } from "./interface";

export class SpeakContextTimeline implements ITimeline{
    private script: string;

    constructor(script: string){
        this.script = script;
    }

    async transform(scenes: Scene[]): Promise<Scene[]> {
        const lineBreaker = await createLineBreaker({ marker: "^", max: 12, min: 7 });
        const speakContexts = 
        splitJapaneseSentencesWithQuotes(this.script)
            .map(s => s.replace(/\n+/g, ""))
            .filter(s => s.trim() !== "")
            .map(s => lineBreaker(s));

        for (const sc of speakContexts) {
            const newScene = new Scene();
            newScene.speakContext = sc;
            scenes.push(newScene);
        }
        return scenes;
    }
}

function splitJapaneseSentencesWithQuotes(text: string): string[] {
    const result: string[] = [];
    let buffer = "";
    let quoteDepth = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const prevChar = i > 0 ? text[i - 1] : "";

        if (char === "「") {
            quoteDepth++;
            buffer += char;
            continue;
        }

        if (char === "」") {
            buffer += char;

            if (prevChar && "。、？！".includes(prevChar)) {
                result.push(buffer);
                buffer = "";
            }

            quoteDepth = Math.max(0, quoteDepth - 1);
            continue;
        }

        buffer += char;

        if (quoteDepth === 0 && "。、？！".includes(char)) {
            result.push(buffer);
            buffer = "";
        }
    }

    if (buffer.trim() !== "") {
        result.push(buffer.trim());
    }

    return result;
}
