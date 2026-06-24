# FE/BE JSON契約 — MemoEditor

Phase 2（保存・復元）における、フロントエンドとバックエンドのデータ受け渡し形式を定める。

## 基本方針

- 単一ワークスペース = キャンバスは常に1つ。`id` は固定値 `"singleton"` を使う。
- バックエンドは `data` の中身を解釈せず、JSON としてそのまま保存する。
- 保存対象はフロントの2系統（elements と strokes）を両方含める。

## データ構造

```json
{
  "id": "singleton",
  "data": {
    "elements": [ /* 図形・テキストの配列（editorSlice の elements[]） */ ],
    "strokes":  [ /* ペンの手書き線の配列（editorSlice の currentStrokes[]） */ ]
  },
  "updatedAt": "ISO8601形式の日時"
}
```

- `elements`: 長方形・直線・テキスト。型は CanvasElement（types/index.ts）
- `strokes`: ペンの手書き線。型は StrokeData（types/index.ts）

## API

| メソッド | パス | 処理 |
|---------|------|------|
| GET | /api/canvas | 固定の1レコードを返す。無ければ空（elements:[], strokes:[]）を返す |
| PUT | /api/canvas | 固定の1レコードを上書き保存（upsert）。updatedAt を現在時刻に更新 |

## DBスキーマ（Prisma + SQLite）

model Canvas {

id  String  @id          // "singleton" 固定

data   String                // JSON文字列として保存

updatedAt DateTime @updatedAt

}

※ SQLite は Json 型を直接持てないため、data は String（JSON文字列）として保存し、
   読み書き時に JSON.parse / JSON.stringify する。

## 復元時の注意

- 復元では elements と strokes の **両方** を戻すこと。
- 現状の loadElements は elements しか戻さないため、strokes も戻す処理が必要。