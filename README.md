# x-to-short

X（旧Twitter）のポストから、**ショート動画（縦動画）を自動生成するツール**です。

* ブラウザから画像をアップロード
* GPT でナレーション用スクリプトを自動生成
* VOICEVOX で読み上げ音声を生成
* 画像＋字幕＋音声＋BGM をまとめて動画にします

---

## 必要なもの

* **Node.js**

  * バージョン 18 以上を推奨
* **npm**（Node.js に同梱されています）
* **FFmpeg**

  * `ffmpeg` コマンドが使える状態になっていること（PATH が通っていること）
* **VOICEVOX エンジン**

  * デスクトップアプリを起動しておけば OK（内部でサーバーとして動きます）
* **OpenAI API キー**

  * GPT にスクリプト生成をさせるために使用します

環境構築の細かい部分（FFmpeg のインストール方法など）は OS によって異なるので、
わからないところは「この README を GPT に読ませて質問」するのがおすすめです。

---

## セットアップ手順

ターミナル（コマンドプロンプト / PowerShell / Terminal など）で、次の順番で実行してください。

```bash
# 1. 任意の作業用ディレクトリへ移動
cd /path/to/your/workdir

# 2. リポジトリをクローン
git clone https://github.com/LilMzki/x-to-short-public

# 3. ディレクトリに入る
cd x-to-short-public

# 4. 依存パッケージをインストール
npm i
```

---

## config.json の設定（重要）

このツールは、ルートディレクトリの `config.json` を読んで動きます。
**フォントや BGM、VOICEVOX、GPT モデルなどをここで設定します。**

`config.json` の例：

```json
{
  "bgmPath": "./assets/bgm.mp3",
  "fontPath": "./assets/NotoSansJP-ExtraBold.ttf",
  "voiceVoxBaseUrl": "http://127.0.0.1:50021",
  "serverPort": 3000,
  "openaiModel": "gpt-5-mini"
}
```

### 各項目の説明

* `bgmPath`

  * BGM の音声ファイル（mp3 など）のパス
  * 例: `./assets/bgm.mp3`
  * **ここにファイルが存在しないと動画生成が失敗します**

* `fontPath`

  * 字幕やテキスト描画に使うフォント（.ttf）のパス
  * 日本語を含むフォントを指定してください（Noto Sans JP など）
  * **ここで指定したフォントがないと文字が表示されなかったり、エラーになることがあります**

* `voiceVoxBaseUrl`

  * VOICEVOX エンジンの URL
  * デスクトップ版をそのまま起動した場合、通常は `http://127.0.0.1:50021` で問題ありません

* `serverPort`

  * このツールの Web サーバーが使うポート番号
  * 通常は `3000` のままで OK です
  * すでに 3000 番を使う別のアプリがある場合は変更してください

* `openaiModel`

  * 使用する GPT モデル名（openai のクライアントに渡されます）
  * 利用可能なモデル名を指定してください（例: `"gpt-4.1-mini"` など）

> `bgmPath` と `fontPath` は、**必ず実在するファイルパスにしておく**のがおすすめです。
> 迷ったら、`assets` フォルダを作ってその中に BGM とフォントを入れておくと分かりやすいです。

---

## OpenAI API キーの設定

OS の **環境変数 `OPENAI_API_KEY`** に、自分の API キーを設定してください。

### macOS / Linux (bash, zsh など)

```bash
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxx"
```

### Windows (PowerShell)

```powershell
setx OPENAI_API_KEY "sk-xxxxxxxxxxxxxxxx"
```

設定方法がよく分からない場合は、
「OPENAI_API_KEY 環境変数 設定 方法」などで検索するか、GPT に聞いてみてください。

---

## VOICEVOX の起動

1. VOICEVOX のデスクトップアプリを起動します。
2. そのまま開いておけば OK です。
   （内部でサーバーが立ち上がり、`voiceVoxBaseUrl` からアクセスされます）

---

## 開発サーバーの起動

準備ができたら、プロジェクトのディレクトリ（`x-to-short-public`）で：

```bash
npm run dev
```

成功すると、コンソールに例えば次のようなメッセージが出ます：

```text
Server running: http://localhost:3000
```

---

## ブラウザから使う

1. コンソールに表示された URL（例: `http://localhost:3000`）をブラウザで開きます
2. フォームに必要な情報を入力します
3. 画像をアップロードします（X のスクリーンショットなど）
4. 「アップロード」ボタンを押すと処理が開始されます
5. サーバー側で

   * GPT によるスクリプト生成
   * VOICEVOX による音声生成
   * 画像レンダリング
   * FFmpeg による動画合成
   * BGM 付与
     が順番に実行されます
6. 処理が完了すると、画面上から **動画ファイルをダウンロード可能** になります

---

## 出力されるファイル（どこに保存されるか）

ブラウザからダウンロードできるだけでなく、
ローカルのフォルダにも動画が保存されます。

* 出力先ディレクトリ: **`./outputs`**

  * リポジトリ直下に `outputs` フォルダが自動作成されます
  * 1 ジョブごとにランダムな ID 名の mp4 が生成され、その BGM 付き版が最終出力になります

`outputs` の中身を直接確認すれば、ブラウザからダウンロードしたファイルと同じ動画を見つけられます。

---

## よくあるつまずきポイント

* FFmpeg が見つからないと言われる
  → `ffmpeg` コマンドを実行できる状態になっているか確認してください（PATH 設定）

* VOICEVOX が動いていないと言われる / 音声が生成されない
  → VOICEVOX アプリが起動しているか、`voiceVoxBaseUrl` が正しいか確認してください

* 日本語の字幕が変・出ない
  → `fontPath` で指定したフォントファイルが日本語対応か確認してください

* OpenAI のエラーになる
  → `OPENAI_API_KEY` が正しく設定されているか、API キーが有効か確認してください

---

## 困ったときは…

この README をそのまま GPT に渡して、

> 「この README を読んで、Windows で動かすための手順を教えて」
> 「config.json の設定を一緒に確認したい」

と聞くと、あなたの環境に合わせてもう一段階かみ砕いて説明してもらえます。

---
