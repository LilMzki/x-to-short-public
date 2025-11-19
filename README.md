# x-to-short

X のポストからショート動画を自動生成するツール。  
ローカルで HTTP サーバを立ち上げ、ブラウザから画像をアップロードして動画を生成します。

## 必要なもの

- Node.js (推奨: 18 以上)
- FFmpeg（`ffmpeg` コマンドが通ること）
- VOICEVOX エンジン（ローカルで起動済み）
- OpenAI API キー
  - 環境変数 `OPENAI_API_KEY` に設定

## セットアップ

```bash
npm install
