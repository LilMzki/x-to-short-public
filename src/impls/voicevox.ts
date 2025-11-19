import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";
import { loadConfig } from "../utils/config";

export interface IVoiceVox {
  request(context: string, outPath: string): Promise<void>;
}

export class VoiceVoxImpl implements IVoiceVox {
  private baseUrl: string;

  constructor() {
    const config = loadConfig();
    this.baseUrl = config.voiceVoxBaseUrl;
  }

  async request(context: string, outPath: string): Promise<void> {
    const speaker = 2;

        //=== VoiceVoxサーバーの起動チェック（リトライ付き）========
        const delayMS = 5000;
        let isAlive = await this.isVoiceVoxServerAlive();

        if (!isAlive) {
            console.log("VoiceVoxサーバーが起動していません。リトライします...");

            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, delayMS));
                console.log(`Retry ${i + 1}/10...`);

                isAlive = await this.isVoiceVoxServerAlive();
                if (isAlive) break;
            }

            if (!isAlive) {
                throw new Error("VoiceVoxサーバーが応答しませんでした（10回リトライ後）。");
            }
        }
        //=======================================================

        // ディレクトリ自動作成
        const dir = path.dirname(outPath);
        try {
        await fs.mkdir(dir, { recursive: true });
        } catch (e) {
        console.error(`ディレクトリ作成に失敗しました: ${dir}`, e);
        throw e;
        }

        // ---------------------------------------------------
        // 1. audio_query（クエリ生成）
        // ---------------------------------------------------
        const queryRes = await axios.post<any>(
            `${this.baseUrl}/audio_query`,
            null,
            { params: { text: context, speaker } }
        );
        let query = queryRes.data;

        // 必要に応じてクエリ編集
        // query.speedScale = 1.2;
        // query.pitchScale = 0;

        // ---------------------------------------------------
        // 2. synthesis（音声合成）
        // ---------------------------------------------------
        const audioRes = await axios.post<ArrayBuffer>(
            `${this.baseUrl}/synthesis`,
            query,
            {
                params: { speaker },
                responseType: "arraybuffer",
            }
        );

        // ---------------------------------------------------
        // 3. WAV 書き出し
        // ---------------------------------------------------
        const buffer = Buffer.from(audioRes.data);
        await fs.writeFile(outPath, buffer);

        console.log(`VOICEVOX: 音声を生成しました → ${outPath}`);
    }

    /**
     * VoiceVoxサーバーの生存確認
     * /version にGETアクセスしてレスポンスを確認する
     */
    async isVoiceVoxServerAlive(): Promise<boolean> {
        try {
            const res = await axios.get(`${this.baseUrl}/version`, {
                timeout: 2000,
            });
            return typeof res.data === "string"; // バージョン番号が返る
        } catch (err) {
            return false;
        }
    }
}
