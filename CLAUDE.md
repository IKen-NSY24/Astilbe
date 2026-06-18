# CLAUDE.md

Claude Code はこのプロジェクトで作業する前に、必ずこのファイルと `docs/schedule.md` を読むこと。

## プロジェクト概要

**MemoEditor** — ブラウザ上で手書きメモ・図形・定型文を配置/保存できる軽量エディタ。

- **対象**: 個人利用（認証なし・**単一ワークスペース**）
- **特徴**: react-konva のキャンバスに描画 → JSON で NestJS に保存 → 復元

## 技術スタック

- **フロント**: React, Redux Toolkit, TypeScript, react-konva, Vite
- **バック**: NestJS, TypeScript, Prisma + SQLite
- **通信**: REST API（JSON）

## スコープ（厳守）

### 作る（Must）
- 描画: ペン(freehand) / 長方形 / 直線
- テキスト: 自由テキスト配置（インライン編集）/ 定型文の配置
- 要素操作: 選択 / ドラッグ移動 / 削除
- 永続化: 全要素を JSON で保存・復元（API経由）

### 作らない（スコープ外・追加しないこと）
- Undo/Redo（状態が複雑化するため。削除で代替）
- スマホ/タッチ対応（PCマウス操作に特化）
- リアルタイム同時編集（WebSocket等）
- ユーザー認証
- 画像アップロード/配置
- 付箋(Sticky)・レイヤーパネル・ズーム/パン・自動保存・複数ノート一覧
  （※旧コードに混在。要件外なので削除対象）

> スコープ外の機能を「気を利かせて」追加しないこと。迷ったら必ず質問する。

## アーキテクチャ方針

- **単一ワークスペース = 1キャンバス1レコード**。ノートを複数持たない。
  - API は `GET /api/canvas` と `PUT /api/canvas` の2本のみ（ID採番・一覧不要）
  - DBスキーマ: `Canvas { id, data: Json, updatedAt }` の単一テーブル
- 描画は **react-konva に一本化**（HTML Canvas API 版の旧実装は破棄済み/破棄予定）
- FE/BE 間の JSON 形式（Konva要素の直列化）は `docs/` に契約として残す

## Redux（editorSlice）最小構成

- **state**: `activeTool`, `elements[]`, `selectedId`
- **actions**: `setActiveTool`, `addElement`, `updateElement`, `deleteElement`, `selectElement`, `clearSelection`, `loadElements`
- **ToolType**: `'select' | 'pen' | 'rectangle' | 'line' | 'text'`

## コーディング規約

- TypeScript strict。`any` は原則禁止（やむを得ない箇所はコメントで理由を明記）
- コンポーネントは関数コンポーネント + Hooks
- Redux は Redux Toolkit の `createSlice` / `createAsyncThunk` を使用
- コミットメッセージは Conventional Commits（`feat:`, `fix:`, `chore:`, `refactor:` 等）
- 大きな変更は専用ブランチを切り、PR の説明に変更点の要約を書く

## 作業の進め方（Claude Code への指示）

- **破壊的変更（大量削除・リファクタ）は2段階**: (1)影響範囲を報告 → (2)確認後に実行
- スコープ外の判断・仕様が曖昧な点は、実装前に必ず質問する
- 変更後は型エラー・参照切れが残らないこと、ビルドが通ることを確認する
- 詰まった点・ハマった点は `NOTES.md` に追記する（技術記事の素材になる）

## ディレクトリ

```
├── frontend/   # React + Vite + Redux Toolkit + react-konva
├── backend/    # NestJS + Prisma + SQLite
└── docs/
    ├── schedule.md   # 開発スケジュール（6/18-6/30）
    └── (json-contract.md  ← FE/BE JSON契約。Phase 2で作成)
```

## スケジュール

詳細は `docs/schedule.md`。Phase 1=フロント(〜6/20) / Phase 2=バック連携(〜6/25) / Phase 3=デプロイ+記事(〜6/30)。