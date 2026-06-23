# 📹 VideoVault - 動画ストレージ管理

## プロジェクト概要
- **名前**: VideoVault
- **目的**: スマホで撮影した動画をクラウドにアップロード・管理するWebアプリ
- **特徴**: スマホファーストUI、タグ管理、検索、ストリーミング再生

## 機能
- ✅ 動画アップロード（複数同時・ドラッグ&ドロップ）
- ✅ 動画一覧表示（グリッドレイアウト）
- ✅ インブラウザ動画再生（Range対応ストリーミング）
- ✅ タグ管理（カラー付き）
- ✅ タグ・ファイル名・メモで検索
- ✅ ストレージ使用量グラフ表示
- ✅ 統計タブ（タグ別内訳）
- ✅ 動画削除（個別・全削除）
- ✅ タグ・メモ編集
- ✅ ダウンロード

## エントリーポイント

| パス | 説明 |
|------|------|
| `GET /` | メインUI（スマホファースト） |
| `GET /api/videos` | 動画一覧取得 |
| `POST /api/videos/upload` | 動画アップロード（multipart） |
| `GET /api/videos/:id/url` | 動画URL取得 |
| `GET /api/videos/:id/stream` | 動画ストリーミング（Range対応） |
| `PATCH /api/videos/:id` | タグ・メモ更新 |
| `DELETE /api/videos/:id` | 動画削除 |
| `DELETE /api/videos` | 全動画削除 |
| `GET /api/tags` | タグ一覧 |
| `POST /api/tags` | タグ作成 |
| `DELETE /api/tags/:id` | タグ削除 |

## データ設計
- **DB**: Cloudflare D1 (SQLite)  
  - `videos`: id, filename, original_name, file_size, mime_type, r2_key, tag, memo, created_at
  - `tags`: id, name, color, created_at
- **Storage**: Cloudflare R2 (`VIDEO_BUCKET`)

## デプロイ
- **プラットフォーム**: Cloudflare Pages + Workers
- **ステータス**: ローカル開発中
- **技術スタック**: Hono + TypeScript + TailwindCSS CDN
- **最終更新**: 2026-06-23
