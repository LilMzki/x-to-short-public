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
            const speakCtx = scenes[i].speakContext.replaceAll("^", "");
            const outPath = path.resolve(`out/${i}.wav`);
            await this.voicevox.request(speakCtx, outPath)
            scenes[i].audioPath = outPath;
        }
        return scenes;
    }
}