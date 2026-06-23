import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  VIDEO_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

// ============================
// HTML ページ (スマホファースト)
// ============================
app.get('/', (c) => {
  return c.html(/* html */`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>📹 VideoVault</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    :root {
      --primary: #7c3aed;
      --primary-light: #ede9fe;
      --accent: #f59e0b;
      --danger: #ef4444;
      --bg: #0f0f1a;
      --surface: #1a1a2e;
      --surface2: #16213e;
      --border: #2d2d4e;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding-bottom: 80px;
    }
    /* ヘッダー */
    .app-header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-bottom: 1px solid var(--border);
      padding: 16px;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
    }
    .header-title {
      font-size: 1.4rem;
      font-weight: 800;
      background: linear-gradient(135deg, #a78bfa, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    /* ストレージメーター */
    .storage-card {
      background: linear-gradient(135deg, #1e1b4b 0%, #1a1a2e 100%);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      margin: 16px;
    }
    .storage-bar {
      height: 10px;
      background: var(--border);
      border-radius: 99px;
      overflow: hidden;
      margin: 8px 0;
    }
    .storage-fill {
      height: 100%;
      border-radius: 99px;
      background: linear-gradient(90deg, #7c3aed, #f59e0b);
      transition: width 0.6s ease;
    }
    /* アップロードボタン */
    .upload-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: calc(100% - 32px);
      margin: 0 16px 16px;
      padding: 16px;
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.2s;
      box-shadow: 0 4px 20px rgba(124,58,237,0.4);
    }
    .upload-btn:active { transform: scale(0.97); opacity: 0.9; }
    /* フィルター */
    .filter-bar {
      display: flex;
      gap: 8px;
      padding: 0 16px 12px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .filter-bar::-webkit-scrollbar { display: none; }
    .filter-chip {
      flex-shrink: 0;
      padding: 6px 14px;
      border-radius: 99px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-muted);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .filter-chip.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }
    /* 検索 */
    .search-wrap {
      padding: 0 16px 12px;
      position: relative;
    }
    .search-input {
      width: 100%;
      padding: 12px 16px 12px 42px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text);
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus { border-color: var(--primary); }
    .search-icon {
      position: absolute;
      left: 30px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    /* 動画グリッド */
    .video-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 0 16px;
    }
    .video-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.2s;
      position: relative;
    }
    .video-card:active { transform: scale(0.97); }
    .video-thumb {
      width: 100%;
      aspect-ratio: 16/9;
      background: var(--surface2);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .video-thumb video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .video-thumb-icon {
      font-size: 2.5rem;
      color: var(--primary);
      opacity: 0.7;
    }
    .play-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.3);
    }
    .play-overlay i {
      font-size: 2rem;
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    }
    .video-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 0.65rem;
      font-weight: 600;
    }
    .video-info {
      padding: 10px;
    }
    .video-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .video-meta {
      font-size: 0.68rem;
      color: var(--text-muted);
      margin-top: 3px;
    }
    .video-tag-chip {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 0.62rem;
      font-weight: 600;
      margin-top: 4px;
      background: var(--primary-light);
      color: var(--primary);
    }
    /* 空の状態 */
    .empty-state {
      text-align: center;
      padding: 60px 32px;
      color: var(--text-muted);
    }
    .empty-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.4; }
    /* ボトムナビ */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--surface);
      border-top: 1px solid var(--border);
      display: flex;
      z-index: 100;
    }
    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 4px;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 0.65rem;
      font-weight: 600;
      gap: 3px;
      transition: color 0.2s;
    }
    .nav-item.active { color: var(--primary); }
    .nav-item i { font-size: 1.2rem; }
    /* モーダル */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      z-index: 200;
      align-items: flex-end;
    }
    .modal-overlay.open { display: flex; }
    .modal-sheet {
      width: 100%;
      background: var(--surface);
      border-radius: 20px 20px 0 0;
      padding: 20px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .modal-handle {
      width: 40px;
      height: 4px;
      background: var(--border);
      border-radius: 99px;
      margin: 0 auto 20px;
    }
    /* 動画プレーヤーモーダル */
    .player-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 300;
      flex-direction: column;
    }
    .player-modal.open { display: flex; }
    .player-video {
      width: 100%;
      flex: 1;
      object-fit: contain;
    }
    .player-header {
      padding: 16px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10;
    }
    .player-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 20px 16px;
      background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
    }
    /* アップロードモーダル */
    .upload-area {
      border: 2px dashed var(--border);
      border-radius: 14px;
      padding: 32px 16px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      position: relative;
    }
    .upload-area.drag-over {
      border-color: var(--primary);
      background: rgba(124,58,237,0.05);
    }
    .upload-area input[type=file] {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
    .form-group { margin-bottom: 16px; }
    .form-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 12px 14px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      font-size: 0.9rem;
      outline: none;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: var(--primary);
    }
    .form-textarea { resize: vertical; min-height: 80px; }
    /* プログレスバー */
    .progress-wrap {
      display: none;
      margin-top: 12px;
    }
    .progress-bar {
      height: 8px;
      background: var(--border);
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #7c3aed, #f59e0b);
      border-radius: 99px;
      transition: width 0.3s;
      width: 0%;
    }
    /* トースト */
    .toast {
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e293b;
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      z-index: 999;
      display: none;
      white-space: nowrap;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      border: 1px solid var(--border);
    }
    .toast.success { border-left: 4px solid #10b981; }
    .toast.error { border-left: 4px solid #ef4444; }
    .toast.show { display: block; animation: fadeIn 0.2s; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    /* アクションボタン */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 12px 20px;
      border-radius: 10px;
      border: none;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }
    .btn:active { transform: scale(0.97); }
    .btn-primary { background: var(--primary); color: white; }
    .btn-danger { background: var(--danger); color: white; }
    .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }
    .btn-full { width: 100%; justify-content: center; }
    /* 詳細パネル */
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 16px 0;
    }
    .detail-item {
      background: var(--surface2);
      border-radius: 10px;
      padding: 12px;
    }
    .detail-label { font-size: 0.7rem; color: var(--text-muted); }
    .detail-value { font-size: 0.9rem; font-weight: 700; color: var(--text); margin-top: 2px; }
    /* ローディング */
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    /* セクションタイトル */
    .section-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0 16px 8px;
    }
  </style>
</head>
<body>

<!-- ヘッダー -->
<header class="app-header">
  <div style="display:flex; align-items:center; justify-content:space-between;">
    <div>
      <div class="header-title">📹 VideoVault</div>
      <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">動画ストレージマネージャー</div>
    </div>
    <button onclick="openUpload()" style="background:var(--primary); border:none; color:white; width:40px; height:40px; border-radius:50%; cursor:pointer; font-size:1.2rem; display:flex; align-items:center; justify-content:center;">
      <i class="fas fa-plus"></i>
    </button>
  </div>
</header>

<!-- ストレージカード -->
<div class="storage-card" id="storageCard">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
    <span style="font-weight:700; font-size:0.9rem;">ストレージ使用量</span>
    <span id="videoCount" style="font-size:0.75rem; color:var(--text-muted);">読み込み中...</span>
  </div>
  <div class="storage-bar">
    <div class="storage-fill" id="storageFill" style="width:0%"></div>
  </div>
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <span id="storageUsed" style="font-size:0.85rem; font-weight:700; color:#a78bfa;">0 MB</span>
    <span id="storagePercent" style="font-size:0.75rem; color:var(--text-muted);">0%</span>
  </div>
</div>

<!-- フィルター -->
<div class="filter-bar" id="filterBar">
  <button class="filter-chip active" data-tag="all" onclick="setFilter('all', this)">
    <i class="fas fa-th-large" style="font-size:0.7rem;"></i> すべて
  </button>
</div>

<!-- 検索 -->
<div class="search-wrap">
  <i class="fas fa-search search-icon"></i>
  <input type="text" class="search-input" id="searchInput" placeholder="ファイル名・メモで検索..." oninput="filterVideos()">
</div>

<!-- 動画グリッド -->
<p class="section-title" id="gridLabel">動画一覧</p>
<div class="video-grid" id="videoGrid">
  <!-- JS で描画 -->
</div>
<div class="empty-state" id="emptyState" style="display:none;">
  <div class="empty-icon">📹</div>
  <p style="font-weight:700; font-size:1rem;">動画がありません</p>
  <p style="font-size:0.85rem; margin-top:8px;">右上の＋ボタンからアップロードしてください</p>
</div>

<!-- ボトムナビ -->
<nav class="bottom-nav">
  <div class="nav-item active" onclick="showTab('home', this)">
    <i class="fas fa-home"></i>
    <span>ホーム</span>
  </div>
  <div class="nav-item" onclick="showTab('stats', this)">
    <i class="fas fa-chart-pie"></i>
    <span>統計</span>
  </div>
  <div class="nav-item" onclick="openUpload()">
    <i class="fas fa-cloud-upload-alt"></i>
    <span>追加</span>
  </div>
  <div class="nav-item" onclick="showTab('tags', this)">
    <i class="fas fa-tags"></i>
    <span>タグ</span>
  </div>
  <div class="nav-item" onclick="showTab('settings', this)">
    <i class="fas fa-cog"></i>
    <span>設定</span>
  </div>
</nav>

<!-- アップロードモーダル -->
<div class="modal-overlay" id="uploadModal">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <h2 style="font-size:1.1rem; font-weight:800; margin-bottom:20px;">
      <i class="fas fa-cloud-upload-alt" style="color:var(--primary);"></i> 動画をアップロード
    </h2>
    <div class="upload-area" id="uploadArea">
      <input type="file" id="fileInput" accept="video/*" multiple onchange="handleFiles(this.files)">
      <i class="fas fa-video" style="font-size:2.5rem; color:var(--primary); opacity:0.7; margin-bottom:12px; display:block;"></i>
      <p style="font-weight:700; margin-bottom:4px;">タップして動画を選択</p>
      <p style="font-size:0.8rem; color:var(--text-muted);">MP4・MOV・AVI・MKV対応<br>複数ファイル同時アップロード可</p>
    </div>
    <div id="selectedFiles" style="margin-top:16px;"></div>
    <div class="form-group" style="margin-top:16px;">
      <label class="form-label">タグ</label>
      <select class="form-select" id="uploadTag">
        <option value="">タグなし</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">メモ</label>
      <textarea class="form-textarea" id="uploadMemo" placeholder="メモを入力（任意）"></textarea>
    </div>
    <div class="progress-wrap" id="progressWrap">
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:6px;">
        <span id="progressLabel">アップロード中...</span>
        <span id="progressPct">0%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    </div>
    <div style="display:flex; gap:10px; margin-top:20px;">
      <button class="btn btn-ghost" onclick="closeModal('uploadModal')" style="flex:1;">キャンセル</button>
      <button class="btn btn-primary" id="uploadSubmitBtn" onclick="submitUpload()" style="flex:2;">
        <i class="fas fa-upload"></i> アップロード
      </button>
    </div>
  </div>
</div>

<!-- 動画プレーヤーモーダル -->
<div class="player-modal" id="playerModal">
  <div class="player-header" style="display:flex; align-items:center; gap:12px;">
    <button onclick="closePlayer()" style="background:rgba(255,255,255,0.15); border:none; color:white; width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:1rem;">
      <i class="fas fa-chevron-left"></i>
    </button>
    <span id="playerTitle" style="font-weight:700; font-size:0.9rem; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"></span>
  </div>
  <video class="player-video" id="playerVideo" controls playsinline></video>
  <div class="player-info">
    <p id="playerName" style="font-weight:700; color:white; margin-bottom:4px;"></p>
    <p id="playerMeta" style="font-size:0.75rem; color:rgba(255,255,255,0.7);"></p>
    <div style="margin-top:12px; display:flex; gap:8px;">
      <button class="btn btn-ghost" id="playerEditBtn" onclick="openDetail()" style="flex:1; font-size:0.8rem; padding:8px;">
        <i class="fas fa-edit"></i> 編集
      </button>
      <button class="btn btn-danger" id="playerDeleteBtn" style="flex:1; font-size:0.8rem; padding:8px;" onclick="confirmDelete()">
        <i class="fas fa-trash"></i> 削除
      </button>
      <button class="btn btn-ghost" id="playerDownloadBtn" style="flex:1; font-size:0.8rem; padding:8px;" onclick="downloadCurrent()">
        <i class="fas fa-download"></i> DL
      </button>
    </div>
  </div>
</div>

<!-- 詳細・編集モーダル -->
<div class="modal-overlay" id="detailModal">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <h2 style="font-size:1.1rem; font-weight:800; margin-bottom:16px;">
      <i class="fas fa-info-circle" style="color:var(--primary);"></i> 動画の詳細
    </h2>
    <div class="detail-grid" id="detailGrid"></div>
    <div class="form-group">
      <label class="form-label">タグ変更</label>
      <select class="form-select" id="editTag"></select>
    </div>
    <div class="form-group">
      <label class="form-label">メモ編集</label>
      <textarea class="form-textarea" id="editMemo"></textarea>
    </div>
    <div style="display:flex; gap:10px; margin-top:16px;">
      <button class="btn btn-ghost" onclick="closeModal('detailModal')" style="flex:1;">閉じる</button>
      <button class="btn btn-primary" onclick="saveDetail()" style="flex:2;">
        <i class="fas fa-save"></i> 保存
      </button>
    </div>
  </div>
</div>

<!-- 統計タブ -->
<div id="statsPanel" style="display:none; padding:16px;">
  <h2 style="font-size:1rem; font-weight:800; margin-bottom:16px; padding:0 16px;">📊 ストレージ統計</h2>
  <div id="statsContent"></div>
</div>

<!-- タグ管理タブ -->
<div id="tagsPanel" style="display:none; padding:16px;">
  <h2 style="font-size:1rem; font-weight:800; margin-bottom:16px;">🏷️ タグ管理</h2>
  <div style="display:flex; gap:10px; margin-bottom:16px;">
    <input type="text" class="form-input" id="newTagName" placeholder="タグ名を入力" style="flex:1;">
    <input type="color" id="newTagColor" value="#7c3aed" style="width:46px; height:46px; border:none; border-radius:10px; cursor:pointer; background:transparent;">
    <button class="btn btn-primary" onclick="addTag()" style="padding:12px 16px;">
      <i class="fas fa-plus"></i>
    </button>
  </div>
  <div id="tagList"></div>
</div>

<!-- 設定タブ -->
<div id="settingsPanel" style="display:none; padding:16px;">
  <h2 style="font-size:1rem; font-weight:800; margin-bottom:16px;">⚙️ 設定</h2>
  <div style="background:var(--surface); border:1px solid var(--border); border-radius:14px; overflow:hidden;">
    <div style="padding:16px; border-bottom:1px solid var(--border);">
      <p style="font-weight:700; font-size:0.9rem;">VideoVault について</p>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">動画ファイルをクラウドに安全に保管・管理できるサービスです。</p>
    </div>
    <div style="padding:16px; border-bottom:1px solid var(--border);">
      <p style="font-weight:700; font-size:0.9rem;">キャッシュクリア</p>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px; margin-bottom:10px;">動画リストのキャッシュをクリアして再取得します。</p>
      <button class="btn btn-ghost" onclick="refreshAll()" style="font-size:0.85rem; padding:10px 16px;">
        <i class="fas fa-sync"></i> 再読み込み
      </button>
    </div>
    <div style="padding:16px;">
      <p style="font-weight:700; font-size:0.9rem; color:var(--danger);">全データ削除</p>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px; margin-bottom:10px;">全ての動画を削除します。この操作は取り消せません。</p>
      <button class="btn btn-danger" onclick="confirmDeleteAll()" style="font-size:0.85rem; padding:10px 16px;">
        <i class="fas fa-trash-alt"></i> 全削除
      </button>
    </div>
  </div>
</div>

<!-- トースト -->
<div class="toast" id="toast"></div>

<script>
// =====================
// 状態管理
// =====================
let allVideos = [];
let allTags = [];
let currentTag = 'all';
let currentVideo = null;
let pendingFiles = [];

// =====================
// 初期化
// =====================
document.addEventListener('DOMContentLoaded', () => {
  loadVideos();
  loadTags();
});

// =====================
// 動画一覧読み込み
// =====================
async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    const data = await res.json();
    allVideos = data.videos || [];
    renderVideos(allVideos);
    updateStorageInfo();
  } catch (e) {
    showToast('動画の読み込みに失敗しました', 'error');
  }
}

// =====================
// タグ読み込み
// =====================
async function loadTags() {
  try {
    const res = await fetch('/api/tags');
    const data = await res.json();
    allTags = data.tags || [];
    renderFilterChips();
    renderTagOptions();
    renderTagList();
  } catch (e) {}
}

// =====================
// ストレージ情報更新
// =====================
function updateStorageInfo() {
  const total = allVideos.reduce((sum, v) => sum + (v.file_size || 0), 0);
  // 上限 100GB
  const limit = 100 * 1024 * 1024 * 1024;
  const pct = Math.min((total / limit) * 100, 100).toFixed(1);
  document.getElementById('storageFill').style.width = pct + '%';
  document.getElementById('storageUsed').textContent = formatSize(total);
  document.getElementById('storagePercent').textContent = pct + '% / 100GB';
  document.getElementById('videoCount').textContent = allVideos.length + ' 本の動画';
}

// =====================
// 動画描画
// =====================
function renderVideos(videos) {
  const grid = document.getElementById('videoGrid');
  const empty = document.getElementById('emptyState');
  const label = document.getElementById('gridLabel');
  
  if (videos.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    label.textContent = '動画一覧（0件）';
    return;
  }
  
  grid.style.display = 'grid';
  empty.style.display = 'none';
  label.textContent = \`動画一覧（\${videos.length}件）\`;
  
  grid.innerHTML = videos.map(v => {
    const tag = allTags.find(t => t.name === v.tag);
    const tagColor = tag ? tag.color : '#6366f1';
    const thumbHtml = v.thumbnail_key
      ? \`<img src="/api/videos/\${v.id}/thumbnail" alt="thumbnail"
             style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0;"
             onerror="this.style.display='none'">\`
      : '';
    return \`
      <div class="video-card" onclick="openPlayer(\${v.id})">
        <div class="video-thumb">
          \${thumbHtml}
          <i class="fas fa-video video-thumb-icon" style="position:absolute; \${v.thumbnail_key ? 'display:none;' : ''}"></i>
          <div class="play-overlay">
            <i class="fas fa-play-circle"></i>
          </div>
          <div class="video-badge">\${formatSize(v.file_size)}</div>
        </div>
        <div class="video-info">
          <div class="video-name" title="\${esc(v.original_name)}">\${esc(v.original_name)}</div>
          <div class="video-meta">\${formatDate(v.created_at)}</div>
          \${v.tag ? \`<span class="video-tag-chip" style="background:\${tagColor}22; color:\${tagColor};">\${esc(v.tag)}</span>\` : ''}
        </div>
      </div>
    \`;
  }).join('');
}

// =====================
// フィルターチップ描画
// =====================
function renderFilterChips() {
  const bar = document.getElementById('filterBar');
  const allChip = bar.querySelector('[data-tag="all"]');
  // 既存タグチップを削除
  bar.querySelectorAll('[data-tag]:not([data-tag="all"])').forEach(el => el.remove());
  
  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.dataset.tag = tag.name;
    btn.onclick = function() { setFilter(tag.name, this); };
    btn.innerHTML = \`<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:\${tag.color}; margin-right:4px;"></span>\${esc(tag.name)}\`;
    bar.appendChild(btn);
  });
}

// =====================
// フィルター
// =====================
function setFilter(tag, el) {
  currentTag = tag;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterVideos();
}

function filterVideos() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  let filtered = allVideos;
  if (currentTag !== 'all') {
    filtered = filtered.filter(v => v.tag === currentTag);
  }
  if (q) {
    filtered = filtered.filter(v =>
      v.original_name.toLowerCase().includes(q) ||
      (v.memo || '').toLowerCase().includes(q)
    );
  }
  renderVideos(filtered);
}

// =====================
// タグセレクト更新
// =====================
function renderTagOptions() {
  ['uploadTag', 'editTag'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">タグなし</option>';
    allTags.forEach(tag => {
      sel.innerHTML += \`<option value="\${esc(tag.name)}">\${esc(tag.name)}</option>\`;
    });
  });
}

// =====================
// アップロード
// =====================
function openUpload() {
  pendingFiles = [];
  document.getElementById('selectedFiles').innerHTML = '';
  document.getElementById('uploadMemo').value = '';
  document.getElementById('uploadTag').value = '';
  document.getElementById('progressWrap').style.display = 'none';
  document.getElementById('uploadModal').classList.add('open');
}

function handleFiles(files) {
  pendingFiles = Array.from(files);
  const container = document.getElementById('selectedFiles');
  if (pendingFiles.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = \`
    <div style="background:var(--surface2); border-radius:10px; padding:10px;">
      <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">選択ファイル（\${pendingFiles.length}件）</p>
      \${pendingFiles.map(f => \`
        <div style="display:flex; align-items:center; gap:8px; padding:4px 0; border-bottom:1px solid var(--border);">
          <i class="fas fa-video" style="color:var(--primary); font-size:0.9rem;"></i>
          <span style="font-size:0.82rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${esc(f.name)}</span>
          <span style="font-size:0.75rem; color:var(--text-muted); margin-left:auto;">\${formatSize(f.size)}</span>
        </div>
      \`).join('')}
    </div>
  \`;
}

async function submitUpload() {
  if (pendingFiles.length === 0) {
    showToast('ファイルを選択してください', 'error');
    return;
  }
  const tag = document.getElementById('uploadTag').value;
  const memo = document.getElementById('uploadMemo').value;
  const btn = document.getElementById('uploadSubmitBtn');
  const progressWrap = document.getElementById('progressWrap');
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> アップロード中...';
  progressWrap.style.display = 'block';
  
  let success = 0;
  for (let i = 0; i < pendingFiles.length; i++) {
    const file = pendingFiles[i];
    const pct = Math.round((i / pendingFiles.length) * 100);
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressPct').textContent = pct + '%';
    document.getElementById('progressLabel').textContent = \`(\${i+1}/\${pendingFiles.length}) \${file.name}\`;
    
    try {
      // サムネイル生成（ブラウザ側Canvas）
      document.getElementById('progressLabel').textContent = \`(\${i+1}/\${pendingFiles.length}) サムネイル生成中...\`;
      const thumbnail = await generateThumbnail(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tag', tag);
      formData.append('memo', memo);
      if (thumbnail) formData.append('thumbnail', thumbnail);
      
      document.getElementById('progressLabel').textContent = \`(\${i+1}/\${pendingFiles.length}) \${file.name}\`;
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) success++;
      else {
        const err = await res.json();
        showToast(\`\${file.name}: \${err.error || 'エラー'}\`, 'error');
      }
    } catch (e) {
      showToast(\`\${file.name}: アップロード失敗\`, 'error');
    }
  }
  
  document.getElementById('progressFill').style.width = '100%';
  document.getElementById('progressPct').textContent = '100%';
  
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-upload"></i> アップロード';
    progressWrap.style.display = 'none';
    closeModal('uploadModal');
    loadVideos();
    if (success > 0) showToast(\`\${success}件アップロード完了！\`, 'success');
  }, 500);
}

// =====================
// サムネイル生成（Canvas）
// =====================
function generateThumbnail(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const cleanup = () => { URL.revokeObjectURL(url); };

    video.onloadeddata = () => {
      // 動画の長さが取れればその5%地点、無ければ1秒
      const seekTime = video.duration > 0 ? Math.min(video.duration * 0.05, 3) : 1;
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const W = 640;
        const H = Math.round(W * (video.videoHeight / video.videoWidth)) || 360;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, W, H);
        const jpeg = canvas.toDataURL('image/jpeg', 0.75);
        cleanup();
        resolve(jpeg);
      } catch (e) {
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => { cleanup(); resolve(null); };
    // タイムアウト保険（5秒）
    setTimeout(() => { cleanup(); resolve(null); }, 5000);
    video.src = url;
  });
}

// =====================
// プレーヤー
// =====================
async function openPlayer(id) {
  const video = allVideos.find(v => v.id === id);
  if (!video) return;
  currentVideo = video;
  
  try {
    const res = await fetch(\`/api/videos/\${id}/url\`);
    const data = await res.json();
    
    document.getElementById('playerTitle').textContent = video.original_name;
    document.getElementById('playerName').textContent = video.original_name;
    document.getElementById('playerMeta').textContent = \`\${formatSize(video.file_size)} | \${formatDate(video.created_at)}\${video.tag ? ' | 🏷️ ' + video.tag : ''}\`;
    
    const playerVideo = document.getElementById('playerVideo');
    playerVideo.src = data.url;
    playerVideo.load();
    
    document.getElementById('playerModal').classList.add('open');
  } catch (e) {
    showToast('動画の読み込みに失敗しました', 'error');
  }
}

function closePlayer() {
  const v = document.getElementById('playerVideo');
  v.pause();
  v.src = '';
  document.getElementById('playerModal').classList.remove('open');
}

// =====================
// 詳細・編集
// =====================
function openDetail() {
  if (!currentVideo) return;
  const v = currentVideo;
  
  document.getElementById('detailGrid').innerHTML = \`
    <div class="detail-item">
      <div class="detail-label">ファイルサイズ</div>
      <div class="detail-value">\${formatSize(v.file_size)}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">形式</div>
      <div class="detail-value">\${v.mime_type.split('/')[1]?.toUpperCase() || 'VIDEO'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">アップロード日</div>
      <div class="detail-value" style="font-size:0.75rem;">\${formatDate(v.created_at)}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">ID</div>
      <div class="detail-value">#\${v.id}</div>
    </div>
  \`;
  
  document.getElementById('editTag').value = v.tag || '';
  document.getElementById('editMemo').value = v.memo || '';
  document.getElementById('detailModal').classList.add('open');
}

async function saveDetail() {
  if (!currentVideo) return;
  const tag = document.getElementById('editTag').value;
  const memo = document.getElementById('editMemo').value;
  
  try {
    const res = await fetch(\`/api/videos/\${currentVideo.id}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, memo })
    });
    if (res.ok) {
      const updated = await res.json();
      const idx = allVideos.findIndex(v => v.id === currentVideo.id);
      if (idx !== -1) allVideos[idx] = { ...allVideos[idx], tag, memo };
      currentVideo = { ...currentVideo, tag, memo };
      closeModal('detailModal');
      filterVideos();
      showToast('保存しました！', 'success');
    }
  } catch (e) {
    showToast('保存に失敗しました', 'error');
  }
}

// =====================
// 削除
// =====================
function confirmDelete() {
  if (!currentVideo) return;
  if (confirm(\`「\${currentVideo.original_name}」を削除しますか？\`)) {
    deleteVideo(currentVideo.id);
  }
}

async function deleteVideo(id) {
  try {
    const res = await fetch(\`/api/videos/\${id}\`, { method: 'DELETE' });
    if (res.ok) {
      closePlayer();
      allVideos = allVideos.filter(v => v.id !== id);
      filterVideos();
      updateStorageInfo();
      showToast('削除しました', 'success');
    }
  } catch (e) {
    showToast('削除に失敗しました', 'error');
  }
}

function confirmDeleteAll() {
  if (confirm('全ての動画を削除しますか？この操作は取り消せません。')) {
    deleteAllVideos();
  }
}

async function deleteAllVideos() {
  try {
    const res = await fetch('/api/videos', { method: 'DELETE' });
    if (res.ok) {
      allVideos = [];
      renderVideos([]);
      updateStorageInfo();
      showToast('全動画を削除しました', 'success');
    }
  } catch (e) {
    showToast('削除に失敗しました', 'error');
  }
}

// =====================
// ダウンロード
// =====================
function downloadCurrent() {
  if (!currentVideo) return;
  // ダウンロード専用エンドポイントに直接遷移（Content-Disposition: attachment）
  const a = document.createElement('a');
  a.href = \`/api/videos/\${currentVideo.id}/download\`;
  a.download = currentVideo.original_name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('ダウンロードを開始しました！', 'success');
}

// =====================
// タグ管理
// =====================
async function addTag() {
  const name = document.getElementById('newTagName').value.trim();
  const color = document.getElementById('newTagColor').value;
  if (!name) { showToast('タグ名を入力してください', 'error'); return; }
  
  try {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    if (res.ok) {
      document.getElementById('newTagName').value = '';
      await loadTags();
      showToast('タグを追加しました！', 'success');
    } else {
      const err = await res.json();
      showToast(err.error || 'エラー', 'error');
    }
  } catch (e) {
    showToast('タグの追加に失敗しました', 'error');
  }
}

function renderTagList() {
  const container = document.getElementById('tagList');
  if (!container) return;
  if (allTags.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:20px;">タグがありません</p>';
    return;
  }
  container.innerHTML = allTags.map(tag => {
    const count = allVideos.filter(v => v.tag === tag.name).length;
    return \`
      <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--surface); border:1px solid var(--border); border-radius:12px; margin-bottom:8px;">
        <div style="width:20px; height:20px; border-radius:50%; background:\${tag.color}; flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:0.9rem;">\${esc(tag.name)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">\${count}本の動画</div>
        </div>
        <button onclick="deleteTag(\${tag.id})" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; padding:6px;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    \`;
  }).join('');
}

async function deleteTag(id) {
  if (!confirm('このタグを削除しますか？')) return;
  try {
    const res = await fetch(\`/api/tags/\${id}\`, { method: 'DELETE' });
    if (res.ok) {
      await loadTags();
      showToast('タグを削除しました', 'success');
    }
  } catch (e) {
    showToast('削除に失敗しました', 'error');
  }
}

// =====================
// 統計
// =====================
function renderStats() {
  const container = document.getElementById('statsContent');
  const total = allVideos.reduce((s, v) => s + v.file_size, 0);
  
  // タグ別集計
  const byTag = {};
  allVideos.forEach(v => {
    const key = v.tag || 'タグなし';
    if (!byTag[key]) byTag[key] = { count: 0, size: 0 };
    byTag[key].count++;
    byTag[key].size += v.file_size;
  });
  
  const tagRows = Object.entries(byTag).sort((a,b) => b[1].size - a[1].size).map(([name, info]) => {
    const pct = total > 0 ? (info.size / total * 100).toFixed(1) : 0;
    const tag = allTags.find(t => t.name === name);
    const color = tag ? tag.color : '#94a3b8';
    return \`
      <div style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:0.85rem; font-weight:600;">
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:\${color}; margin-right:6px;"></span>
            \${esc(name)}
          </span>
          <span style="font-size:0.8rem; color:var(--text-muted);">\${info.count}本 / \${formatSize(info.size)}</span>
        </div>
        <div style="height:8px; background:var(--border); border-radius:99px; overflow:hidden;">
          <div style="height:100%; background:\${color}; border-radius:99px; width:\${pct}%; transition:width 0.6s;"></div>
        </div>
      </div>
    \`;
  }).join('');
  
  container.innerHTML = \`
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0 0 20px;">
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px; text-align:center;">
        <div style="font-size:2rem; font-weight:800; color:#a78bfa;">\${allVideos.length}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">総動画数</div>
      </div>
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px; text-align:center;">
        <div style="font-size:1.3rem; font-weight:800; color:#f59e0b;">\${formatSize(total)}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">合計サイズ</div>
      </div>
    </div>
    <p style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px;">タグ別内訳</p>
    \${tagRows || '<p style="color:var(--text-muted); font-size:0.85rem;">データがありません</p>'}
  \`;
}

// =====================
// タブ切り替え
// =====================
function showTab(tab, el) {
  const panels = ['statsPanel', 'tagsPanel', 'settingsPanel'];
  const homeEls = [
    document.querySelector('.storage-card'),
    document.querySelector('.filter-bar'),
    document.querySelector('.search-wrap'),
    document.querySelector('.section-title'),
    document.querySelector('.video-grid'),
    document.getElementById('emptyState'),
    document.querySelector('.upload-btn')
  ];
  
  panels.forEach(p => { const el = document.getElementById(p); if (el) el.style.display = 'none'; });
  
  if (tab === 'home') {
    homeEls.forEach(el => { if (el) el.style.display = ''; });
    document.getElementById('videoGrid').style.display = 'grid';
    filterVideos();
  } else {
    homeEls.forEach(el => { if (el) el.style.display = 'none'; });
    const panelId = tab + 'Panel';
    const panel = document.getElementById(panelId);
    if (panel) panel.style.display = 'block';
    
    if (tab === 'stats') renderStats();
    if (tab === 'tags') renderTagList();
  }
  
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
}

// =====================
// ユーティリティ
// =====================
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  t.className = \`toast \${type} show\`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit' });
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function refreshAll() {
  loadVideos();
  loadTags();
  showToast('データを再取得しました', 'success');
}

// ドラッグ＆ドロップ
const uploadArea = document.getElementById('uploadArea');
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});
</script>
</body>
</html>`)
})

// ============================
// API: 動画一覧取得
// ============================
app.get('/api/videos', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM videos ORDER BY created_at DESC'
    ).all()
    return c.json({ videos: results })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================
// API: 動画アップロード
// ============================
app.post('/api/videos/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    const tag = (formData.get('tag') as string) || ''
    const memo = (formData.get('memo') as string) || ''

    if (!file) return c.json({ error: 'ファイルがありません' }, 400)

    // ファイルサイズ制限（500MB）
    if (file.size > 500 * 1024 * 1024) {
      return c.json({ error: 'ファイルサイズが500MBを超えています' }, 400)
    }

    const ext = file.name.split('.').pop() || 'mp4'
    const r2Key = `videos/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    // R2に保存
    await c.env.VIDEO_BUCKET.put(r2Key, file.stream(), {
      httpMetadata: { contentType: file.type || 'video/mp4' }
    })

    // サムネイル（Base64 JPEG）があればR2に保存
    const thumbnailBase64 = (formData.get('thumbnail') as string) || ''
    let thumbnailKey: string | null = null
    if (thumbnailBase64) {
      try {
        const base64Data = thumbnailBase64.replace(/^data:image\/jpeg;base64,/, '')
        const binaryStr = atob(base64Data)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
        thumbnailKey = `thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`
        await c.env.VIDEO_BUCKET.put(thumbnailKey, bytes, {
          httpMetadata: { contentType: 'image/jpeg' }
        })
      } catch (_) { thumbnailKey = null }
    }

    // D1にメタデータ保存
    const stmt = await c.env.DB.prepare(
      `INSERT INTO videos (filename, original_name, file_size, mime_type, r2_key, thumbnail_key, tag, memo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(r2Key.split('/').pop(), file.name, file.size, file.type || 'video/mp4', r2Key, thumbnailKey, tag || null, memo || null)
      .run()

    return c.json({ id: stmt.meta.last_row_id, original_name: file.name, file_size: file.size })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================
// API: サムネイル配信
// ============================
app.get('/api/videos/:id/thumbnail', async (c) => {
  const id = c.req.param('id')
  try {
    const video = await c.env.DB.prepare('SELECT thumbnail_key FROM videos WHERE id = ?').bind(id).first() as any
    if (!video || !video.thumbnail_key) {
      return c.json({ error: 'サムネイルがありません' }, 404)
    }
    const obj = await c.env.VIDEO_BUCKET.get(video.thumbnail_key)
    if (!obj) return c.json({ error: 'サムネイルファイルが見つかりません' }, 404)

    return new Response(obj.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      }
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================
// API: 動画URL取得（署名付き or 直接）
// ============================
app.get('/api/videos/:id/url', async (c) => {
  const id = c.req.param('id')
  try {
    const video = await c.env.DB.prepare('SELECT * FROM videos WHERE id = ?').bind(id).first() as any
    if (!video) return c.json({ error: '動画が見つかりません' }, 404)

    const obj = await c.env.VIDEO_BUCKET.get(video.r2_key)
    if (!obj) return c.json({ error: 'ファイルが見つかりません' }, 404)

    // ArrayBufferをBase64に変換してdata URLで返す（小さいファイル向け）
    // 大きいファイルはストリーミングエンドポイントを使用
    return c.json({ url: `/api/videos/${id}/stream`, key: video.r2_key })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================
// API: 動画ストリーミング
// ============================
app.get('/api/videos/:id/stream', async (c) => {
  const id = c.req.param('id')
  try {
    const video = await c.env.DB.prepare('SELECT * FROM videos WHERE id = ?').bind(id).first() as any
    if (!video) return c.json({ error: '動画が見つかりません' }, 404)

    const range = c.req.header('Range')
    const obj = await c.env.VIDEO_BUCKET.get(video.r2_key, range ? { range: parseRange(range, video.file_size) } : undefined)
    if (!obj) return c.json({ error: 'ファイルが見つかりません' }, 404)

    const headers: Record<string, string> = {
      'Content-Type': video.mime_type || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Content-Disposition': `inline; filename="${encodeURIComponent(video.original_name)}"`,
    }

    if (range && obj.range) {
      const r = obj.range as any
      const start = r.offset || 0
      const end = start + (r.length || video.file_size) - 1
      headers['Content-Range'] = `bytes ${start}-${end}/${video.file_size}`
      headers['Content-Length'] = String(r.length || video.file_size)
      return new Response(obj.body, { status: 206, headers })
    }

    headers['Content-Length'] = String(video.file_size)
    return new Response(obj.body, { status: 200, headers })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================
// API: 動画ダウンロード（強制DL）
// ============================
app.get('/api/videos/:id/download', async (c) => {
  const id = c.req.param('id')
  try {
    const video = await c.env.DB.prepare('SELECT * FROM videos WHERE id = ?').bind(id).first() as any
    if (!video) return c.json({ error: '動画が見つかりません' }, 404)

    const obj = await c.env.VIDEO_BUCKET.get(video.r2_key)
    if (!obj) return c.json({ error: 'ファイルが見つかりません' }, 404)

    // Content-Disposition: attachment でブラウザに強制ダウンロードさせる
    const filename = encodeURIComponent(video.original_name)
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}; filename="${filename}"`,
      'Content-Length': String(video.file_size),
    }
    return new Response(obj.body, { status: 200, headers })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

function parseRange(rangeHeader: string, totalSize: number) {
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/)
  if (!match) return undefined
  const start = match[1] ? parseInt(match[1]) : undefined
  const end = match[2] ? parseInt(match[2]) : undefined
  if (start === undefined) return undefined
  return { offset: start, length: (end !== undefined ? end - start + 1 : totalSize - start) }
}

// ============================
// API: 動画更新（タグ・メモ）
// ============================
app.patch('/api/videos/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const { tag, memo } = await c.req.json() as { tag?: string; memo?: string }
    await c.env.DB.prepare(
      'UPDATE videos SET tag = ?, memo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(tag || null, memo || null, id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================
// API: 動画削除
// ============================
app.delete('/api/videos/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const video = await c.env.DB.prepare('SELECT * FROM videos WHERE id = ?').bind(id).first() as any
    if (!video) return c.json({ error: '動画が見つかりません' }, 404)

    await c.env.VIDEO_BUCKET.delete(video.r2_key)
    await c.env.DB.prepare('DELETE FROM videos WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================
// API: 全動画削除
// ============================
app.delete('/api/videos', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT r2_key FROM videos').all() as any
    for (const v of results) {
      await c.env.VIDEO_BUCKET.delete(v.r2_key)
    }
    await c.env.DB.prepare('DELETE FROM videos').run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================
// API: タグ一覧
// ============================
app.get('/api/tags', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM tags ORDER BY name').all()
    return c.json({ tags: results })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================
// API: タグ作成
// ============================
app.post('/api/tags', async (c) => {
  try {
    const { name, color } = await c.req.json() as { name: string; color?: string }
    if (!name) return c.json({ error: 'タグ名は必須です' }, 400)
    await c.env.DB.prepare(
      'INSERT INTO tags (name, color) VALUES (?, ?)'
    ).bind(name, color || '#6366f1').run()
    return c.json({ success: true })
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) return c.json({ error: '同じ名前のタグが既に存在します' }, 409)
    return c.json({ error: e.message }, 500)
  }
})

// ============================
// API: タグ削除
// ============================
app.delete('/api/tags/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const tag = await c.env.DB.prepare('SELECT name FROM tags WHERE id = ?').bind(id).first() as any
    if (tag) {
      await c.env.DB.prepare('UPDATE videos SET tag = NULL WHERE tag = ?').bind(tag.name).run()
    }
    await c.env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default app
