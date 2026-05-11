# PUSH かんたんオープンデータ

誰でもデータセットを登録し、固有のURLを生成して、いつでも更新できるシンプルなオープンデータプラットフォームです。

- **デモ:** [https://push.sabae.cc/](https://push.sabae.cc/)

## 特徴

- **シンプルなWeb UI:** データベース不要で、使いやすいWebフォームを通じてデータの登録と更新が可能です。
- **共有可能なURL:** 各データセットには固有で永続的なURLが割り当てられます。
- **柔軟なデータタイプ:** `facility`（施設）、`store`（店舗）などの事前定義されたタイプを使用するか、`generic`スキーマを使って独自のカスタムタイプを作成できます。
- **データ集約:** `container`タイプを使って複数のデータセットを単一のエンドポイントに結合できます。
- **複数形式対応:** 人間が読めるHTMLページ、または機械可読なJSONおよびCSV形式でデータにアクセスできます。

## 使い方

### 1. データの登録
- [デモサイト](https://push.sabae.cc/)にアクセスします。
- 既存のデータタイプ（例: [施設/facility](https://push.sabae.cc/#type=facility)、[店舗/store](https://push.sabae.cc/#type=store)）を選択するか、[種別/generic](https://push.sabae.cc/#type=generic)から新しいタイプを作成します。
- フォームに必要事項を入力し、「オープンデータ登録」をクリックします。
- 固有のIDと、今後の更新に使用する`パスコード`が生成されます。

### 2. 複数データセットの集約
- [集約/container](https://push.sabae.cc/#type=container)データタイプを選択します。
- `IDs`フィールドに、まとめるデータセットの数値IDをカンマ区切りで入力します。
- 登録すると、含まれるすべてのデータに対する単一のエンドポイントを提供する新しいコンテナIDが生成されます。

## APIの利用

シンプルなGETリクエストでデータにアクセスできます。

- **HTMLビューの取得:**
  - `https://push.sabae.cc/ID`
  - 1つ以上のデータセット用に人間が読めるHTMLページをレンダリングします。
  - 例: `https://push.sabae.cc/1`

- **JSONデータの取得:**
  - `https://push.sabae.cc/ID1,ID2.json`
  - 集約されたデータをJSON形式で返します。`container`のIDが含まれている場合、その内容も自動的に取得されて含まれます。
  - 例: `https://push.sabae.cc/1.json`

- **生のJSONデータの取得:**
  - `https://push.sabae.cc/ID.raw.json`
  - 単一データセットの未加工の生のJSONファイルを返します。

- **CSVデータの取得:**
  - `https://push.sabae.cc/ID1,ID2.csv`
  - 集約されたデータをCSV形式で返します。

- **全データセットのリスト取得:**
  - `https://push.sabae.cc/`
  - 公開中のすべてのデータセットのメタデータを含むJSON配列を返します。

- **データの登録・更新:**
  - `POST /`
  - Web UIはこのエンドポイントにJSONペイロードを送信してデータセットを作成または更新します。更新するには正しい`パスコード`を含める必要があります。

## セルフホスティング

### 要件
- [Deno](https://deno.land/)

### サーバーの起動
1. リポジトリをクローンします。
2. アプリケーションサーバーを起動します。`run_push.sh`スクリプトには、サーバーがクラッシュした場合に自動で再起動する`while`ループが含まれています。
   ```sh
   sh run_push.sh
   ```
3. 本番環境では`nohup`を使ってバックグラウンドでサーバーを実行できます。
   ```sh
   nohup sh run_push.sh &
   ```
デフォルトではポート8006でサーバーが起動します。データは`data/`ディレクトリ内のフラットファイルとして保存されます。

## 記事
- [PUSH型オープンデータでリアルタイムな情報発信！ 福井県コロナ情報サイトで活用開始 (日本語)](https://fukuno.jig.jp/2849)

## ライセンス
このプロジェクトは[CC BY](https://creativecommons.org/licenses/by/4.0/)ライセンスの下で利用可能です。

---
作成者: [@taisukef](https://twitter.com/taisukef) / [Code for FUKUI](https://github.com/code4fukui)
