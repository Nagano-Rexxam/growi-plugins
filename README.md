# growi-plugin-confirm-delete-text

GROWI のページ編集画面と削除ダイアログを補助するプラグインです。

## 機能

- 削除確認ダイアログで、`Delete` を入力するまで削除ボタンを無効化する
- ページ下部の編集ログに表示される編集者情報を非表示にする
- `Edit` ボタンの有効化をチェックボックスで切り替える

## 構成

- `client-entry.tsx`: `window.pluginActivators` への登録
- `src/confirmDelete.ts`: 削除確認の追加、編集者情報の非表示、編集ボタン制御
- `src/styles.css`: 追加 UI のスタイル
- `vite.config.ts`: ビルド設定

## 開発

```bash
npm install
npm run build
```

開発中にローカルビルドを監視する場合:

```bash
npm run dev
```

## GROWI へのインストール

1. GROWI の `/admin/plugins` を開く
2. リポジトリ URL に次を入力する

```text
https://github.com/Nagano-Rexxam/growi-plugins
```

3. ブランチ名に `main` を指定する
4. `[インストール]` をクリックする
5. 必要に応じて GROWI を再起動する

## 動作メモ

- ページの編集画面が表示されると、`Edit` ボタンの右側に「編集を有効にする」チェックボックスが表示される
- チェックを入れるまで `Edit` ボタンは無効になる
- ページ下部の編集ログにある編集者表示は自動で取り除かれる
- 削除モーダルでは、`Delete` を入力するまで削除ボタンは有効にならない

