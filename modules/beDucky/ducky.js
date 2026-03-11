/* ============================================================
   BE DUCKY  v50  —  Vibe Jiver Module
   Mount target : #bd-module-root  (injected by VJ shell)
   Bridge       : window.VJ.updateHUD(x,y) / updateRes(w,h) / snapImage(img)
   Namespace    : window.BeDucky
   ============================================================ */
(function (root) {
  'use strict';

  /* ── 1. STRINGS FIRST (used by step 3 below) ───────────────────── */
  var _MODULE_HTML = [
    '<div id="bd-wrap">',

    '  <div class="bd-toolbar">',
    '    <div class="bd-toolbar-left">',
    '      <span class="bd-module-badge">&#127919; BULLS-EYE DUCKY</span>',
    '      <button class="bd-btn" id="bd-reset-img" title="New image">&#8617; New Image</button>',
    '      <button class="bd-btn" id="bd-undo-btn" disabled>&#8630; Undo</button>',
    '      <button class="bd-btn" id="bd-redo-btn" disabled>&#8631; Redo</button>',
    '      <button class="bd-btn" id="bd-clear-btn" disabled>&#10005; Clear</button>',
    '    </div>',
    '    <div class="bd-toolbar-center">',
    '      <span class="bd-coord-pill" id="bd-coord-display">&#8212;, &#8212;</span>',
    '      <span class="bd-count-pill" id="bd-count-display">0 pts</span>',
    '    </div>',
    '    <div class="bd-toolbar-right">',
    '      <button class="bd-btn bd-btn-active" id="bd-cross-btn">&#10011; Cross</button>',
    '      <button class="bd-btn" id="bd-grid-btn">Grid: Off</button>',
    '      <button class="bd-btn" id="bd-snap-btn">&#8862; Snap</button>',
    '    </div>',
    '  </div>',

    '  <div class="bd-url-bar">',
    '    <input type="text" id="bd-url-input" class="bd-url-input"',
    '      placeholder="Paste image URL and press Enter or click Load"',
    '      spellcheck="false" autocomplete="off">',
    '    <button class="bd-btn bd-btn-gold" id="bd-load-url-btn">Load</button>',
    '    <input type="file" id="bd-file-input" accept="image/*" style="display:none">',
    '  </div>',

    '  <div class="bd-canvas-area">',
    '    <div class="bd-drop-zone" id="bd-drop-zone">',
    '      <div class="bd-drop-icon">&#127919;</div>',
    '      <div class="bd-drop-title">Drop Image Here</div>',
    '      <div class="bd-drop-sub">or click to browse &middot; PNG, JPG, GIF, WebP, SVG</div>',
    '    </div>',
    '    <div class="bd-image-area" id="bd-image-area" style="display:none">',
    '      <div class="bd-image-wrap vj-artwork">',
    '        <img id="bd-main-img" class="bd-main-img vj-artwork__img" alt="target image" draggable="false">',
    '        <canvas id="bd-grid-canvas"   class="bd-canvas-overlay bd-grid-canvas"></canvas>',
    '        <canvas id="bd-cursor-canvas" class="bd-canvas-overlay bd-cursor-canvas"></canvas>',
    '        <div    id="bd-points-layer"  class="bd-points-layer"></div>',
    '      </div>',
    '    </div>',
    '  </div>',

    '  <div class="bd-export-bar">',
    '    <button class="bd-btn bd-btn-export" id="bd-export-css"  disabled>CSS</button>',
    '    <button class="bd-btn bd-btn-export" id="bd-export-json" disabled>JSON</button>',
    '    <button class="bd-btn bd-btn-export" id="bd-export-ai"   disabled>AI Prompt</button>',
    '    <button class="bd-btn bd-btn-gold"   id="bd-copy-all"    disabled>&#9000; Copy</button>',
    '    <span class="bd-status-pill" id="bd-status">Ready</span>',
    '  </div>',

    '  <div class="bd-output-wrap" style="display:none">',
    '    <textarea id="bd-output" class="bd-output" spellcheck="false" readonly></textarea>',
    '  </div>',

    '  <div id="bd-ctx-menu" class="bd-ctx-menu" style="display:none">',
    '    <button class="bd-ctx-item" id="bd-ctx-delete">&#10005; Delete Point</button>',
    '    <button class="bd-ctx-item" id="bd-ctx-label" >&#9998; Edit Label</button>',
    '    <button class="bd-ctx-item" id="bd-ctx-moveup">&#8593; Move Up</button>',
    '    <button class="bd-ctx-item" id="bd-ctx-movedn">&#8595; Move Down</button>',
    '  </div>',

    '  <div id="bd-label-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal">',
    '      <div class="bd-modal-title">Edit Point Label</div>',
    '      <input type="text" id="bd-label-input" class="bd-modal-input"',
    '        placeholder="e.g. eye, nose, CTA button" maxlength="48" spellcheck="false">',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-label-save">Save</button>',
    '        <button class="bd-btn"             id="bd-label-cancel">Cancel</button>',
    '      </div>',
    '    </div>',
    '  </div>',

    '</div>'
  ].join('\n');

  /* ── 2. DUCK IMAGE ──────────────────────────────────────────────── */
  if (typeof DUCK_IMG === 'undefined') {
    var _s = (document.currentScript || {}).src || '';
    var _d = _s.substring(0, _s.lastIndexOf('/') + 1);
    root.DUCK_IMG = _d ? (_d + '../../ducky.png') : './ducky.png';
  }

  /* ── 3. INJECT CSS ──────────────────────────────────────────────── */
  (function () {
    if (document.getElementById('bd-ducky-inline')) return;
    var st = document.createElement('style');
    st.id = 'bd-ducky-inline';
    st.textContent = [
      '#bd-module-root{display:block;height:100%}',
      '#bd-wrap{display:flex;flex-direction:column;height:100%;background:#000;color:#d8d8d8;font-family:"Rajdhani","Share Tech Mono",monospace;overflow:hidden;position:relative}',
      '.bd-toolbar{display:flex;align-items:center;gap:8px;padding:6px 12px;background:#080808;border-bottom:1px solid #1e1e1e;flex-shrink:0;flex-wrap:wrap}',
      '.bd-toolbar-left,.bd-toolbar-right{display:flex;gap:6px;align-items:center}',
      '.bd-toolbar-center{flex:1;display:flex;justify-content:center;align-items:center;gap:10px}',
      '.bd-module-badge{font-family:"Oswald",sans-serif;font-size:.72rem;font-weight:700;color:#c5a059;letter-spacing:3px;text-transform:uppercase;padding-right:10px;border-right:1px solid #222;margin-right:4px}',
      '.bd-btn{background:#0d0d0d;border:1px solid #222;color:#888;font-family:"Share Tech Mono",monospace;font-size:.65rem;letter-spacing:1px;padding:4px 10px;border-radius:2px;cursor:pointer;transition:all .15s;white-space:nowrap;text-transform:uppercase}',
      '.bd-btn:hover:not(:disabled){background:#141414;border-color:#333;color:#c5a059}',
      '.bd-btn:disabled{opacity:.3;cursor:not-allowed}',
      '.bd-btn-active{border-color:#c5a059 !important;color:#c5a059 !important}',
      '.bd-btn-gold{background:rgba(197,160,89,.08);border-color:rgba(197,160,89,.3);color:#c5a059}',
      '.bd-btn-gold:hover:not(:disabled){background:rgba(197,160,89,.16)}',
      '.bd-btn-export{min-width:54px}',
      '.bd-coord-pill,.bd-count-pill,.bd-status-pill{font-family:"Share Tech Mono",monospace;font-size:.7rem;letter-spacing:1.5px;padding:3px 10px;border-radius:2px;border:1px solid #1e1e1e;background:#080808;color:#c5a059;white-space:nowrap}',
      '.bd-count-pill{color:#4db8ff;border-color:rgba(77,184,255,.15)}',
      '.bd-status-pill{flex:1;color:#555;text-align:left;border:none;background:transparent}',
      '.bd-url-bar{display:flex;gap:6px;padding:6px 12px;background:#080808;border-bottom:1px solid #181818;flex-shrink:0}',
      '.bd-url-input{flex:1;background:#0a0a0a;border:1px solid #222;color:#c5a059;font-family:"Share Tech Mono",monospace;font-size:.68rem;padding:5px 10px;border-radius:2px;outline:none;letter-spacing:.5px}',
      '.bd-url-input:focus{border-color:rgba(197,160,89,.5)}',
      '.bd-url-input::placeholder{color:#333}',
      '.bd-canvas-area{flex:1;position:relative;overflow:auto;background:#050505;display:flex;align-items:center;justify-content:center;min-height:0}',
      '.bd-drop-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;height:100%;border:2px dashed #1e1e1e;border-radius:4px;cursor:pointer;transition:border-color .2s,background .2s;position:absolute;inset:0}',
      '.bd-drop-zone:hover,.bd-drag-over{border-color:rgba(197,160,89,.4);background:rgba(197,160,89,.03)}',
      '.bd-drop-icon{font-size:3rem;opacity:.4}',
      '.bd-drop-title{font-family:"Oswald",sans-serif;font-size:1.1rem;color:#555;letter-spacing:3px;text-transform:uppercase}',
      '.bd-drop-sub{font-family:"Share Tech Mono",monospace;font-size:.58rem;color:#333;letter-spacing:1px}',
      '.bd-image-area{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:absolute;inset:0;overflow:auto;padding:12px}',
      '.bd-image-wrap{position:relative;display:inline-block;cursor:crosshair;max-width:100%;max-height:100%;flex-shrink:0}',
      '.bd-main-img{display:block;max-width:100%;max-height:calc(100vh - 220px);width:auto;height:auto;pointer-events:none;user-select:none}',
      '.bd-canvas-overlay{position:absolute;top:0;left:0;pointer-events:none}',
      '.bd-cursor-canvas{z-index:10}',
      '.bd-grid-canvas{z-index:5}',
      '.bd-points-layer{position:absolute;inset:0;pointer-events:none;z-index:20}',
      '.bd-point-ring{position:absolute;width:22px;height:22px;transform:translate(-50%,-50%);pointer-events:all;cursor:grab}',
      '.bd-point-ring:active{cursor:grabbing}',
      '.bd-point-dot{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:7px;height:7px;border-radius:50%;background:#c5a059;box-shadow:0 0 0 2px #000,0 0 0 3.5px #c5a059}',
      '.bd-point-ring:hover .bd-point-dot{background:#e2b96f;box-shadow:0 0 0 2px #000,0 0 0 3.5px #e2b96f,0 0 10px rgba(197,160,89,.6)}',
      '.bd-point-num{position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-family:"Share Tech Mono",monospace;font-size:9px;color:#c5a059;background:rgba(0,0,0,.75);padding:1px 3px;border-radius:2px;white-space:nowrap;pointer-events:none;line-height:1.3}',
      '.bd-point-label{position:absolute;top:14px;left:50%;transform:translateX(-50%);font-family:"Share Tech Mono",monospace;font-size:8px;color:#4db8ff;background:rgba(0,0,0,.8);padding:1px 4px;border-radius:2px;white-space:nowrap;pointer-events:none;border:1px solid rgba(77,184,255,.2)}',
      '.bd-export-bar{display:flex;align-items:center;gap:6px;padding:6px 12px;background:#080808;border-top:1px solid #181818;flex-shrink:0;flex-wrap:wrap}',
      '.bd-output-wrap{flex-shrink:0;max-height:160px;border-top:1px solid #1e1e1e}',
      '.bd-output{width:100%;height:160px;background:#030303;border:none;border-top:1px solid #181818;color:#00e87a;font-family:"Share Tech Mono",monospace;font-size:.68rem;padding:10px 14px;resize:none;outline:none;line-height:1.6;letter-spacing:.3px}',
      '.bd-ctx-menu{position:fixed;background:#0d0d0d;border:1px solid #2e2e2e;border-radius:3px;padding:3px 0;z-index:9000;min-width:160px;box-shadow:0 8px 32px rgba(0,0,0,.8)}',
      '.bd-ctx-item{display:block;width:100%;text-align:left;padding:7px 14px;font-family:"Share Tech Mono",monospace;font-size:.65rem;letter-spacing:1px;color:#888;background:none;border:none;cursor:pointer;text-transform:uppercase;transition:all .12s}',
      '.bd-ctx-item:hover:not(:disabled){background:rgba(197,160,89,.06);color:#c5a059}',
      '.bd-ctx-item:disabled{opacity:.25;cursor:not-allowed}',
      '.bd-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:9100;backdrop-filter:blur(4px)}',
      '.bd-modal{background:#0d0d0d;border:1px solid rgba(197,160,89,.3);border-radius:4px;padding:22px 24px;min-width:300px;box-shadow:0 16px 60px rgba(0,0,0,.9)}',
      '.bd-modal-title{font-family:"Oswald",sans-serif;font-size:.8rem;font-weight:700;color:#c5a059;letter-spacing:3px;text-transform:uppercase;margin-bottom:14px}',
      '.bd-modal-input{width:100%;background:#080808;border:1px solid #2e2e2e;color:#d8d8d8;font-family:"Share Tech Mono",monospace;font-size:.78rem;padding:7px 10px;border-radius:2px;outline:none;margin-bottom:14px}',
      '.bd-modal-input:focus{border-color:rgba(197,160,89,.5)}',
      '.bd-modal-actions{display:flex;gap:8px;justify-content:flex-end}'
    ].join('\n');
    document.head.appendChild(st);
  })();

  /* ── 4. MOUNT DOM ───────────────────────────────────────────────── */
  var _mountEl = document.getElementById('bd-module-root');
  if (!_mountEl) {
    console.error('[BeDucky] #bd-module-root not found.');
    return;
  }
  _mountEl.innerHTML = _MODULE_HTML;

  /* ── 5. STATE ───────────────────────────────────────────────────── */
  var points       = [];
  var undoStack    = [];
  var redoStack    = [];
  var imgNatW      = 0;
  var imgNatH      = 0;
  var imgDispW     = 0;
  var imgDispH     = 0;
  var imgLoaded    = false;
  var ctxMenuOpen  = false;
  var ctxTargetIdx = -1;
  var activeLabel  = '';
  var gridMode     = 'none';
  var showCrosshair= true;
  var snapToGrid   = false;
  var isDragging   = false;
  var dragIdx      = -1;
  var dragOffX     = 0;
  var dragOffY     = 0;

  /* ── 6. DOM REFS ────────────────────────────────────────────────── */
  function _q(sel) { return _mountEl.querySelector(sel); }

  var $dropZone     = _q('#bd-drop-zone');
  var $imageArea    = _q('#bd-image-area');
  var $img          = _q('#bd-main-img');
  var $gridCanvas   = _q('#bd-grid-canvas');
  var $cursorCanvas = _q('#bd-cursor-canvas');
  var $pointsLayer  = _q('#bd-points-layer');
  var $fileInput    = _q('#bd-file-input');
  var $urlInput     = _q('#bd-url-input');
  var $loadUrlBtn   = _q('#bd-load-url-btn');
  var $clearBtn     = _q('#bd-clear-btn');
  var $undoBtn      = _q('#bd-undo-btn');
  var $redoBtn      = _q('#bd-redo-btn');
  var $exportCss    = _q('#bd-export-css');
  var $exportJson   = _q('#bd-export-json');
  var $exportAi     = _q('#bd-export-ai');
  var $copyAll      = _q('#bd-copy-all');
  var $outputBox    = _q('#bd-output');
  var $ctxMenu      = _q('#bd-ctx-menu');
  var $ctxDelete    = _q('#bd-ctx-delete');
  var $ctxLabel     = _q('#bd-ctx-label');
  var $ctxMoveUp    = _q('#bd-ctx-moveup');
  var $ctxMoveDn    = _q('#bd-ctx-movedn');
  var $labelModal   = _q('#bd-label-modal');
  var $labelInput   = _q('#bd-label-input');
  var $labelSave    = _q('#bd-label-save');
  var $labelCancel  = _q('#bd-label-cancel');
  var $gridBtn      = _q('#bd-grid-btn');
  var $snapBtn      = _q('#bd-snap-btn');
  var $crossBtn     = _q('#bd-cross-btn');
  var $resetImg     = _q('#bd-reset-img');
  var $coordDisplay = _q('#bd-coord-display');
  var $countDisplay = _q('#bd-count-display');
  var $statusMsg    = _q('#bd-status');

  /* ── 7. CANVAS CONTEXTS ─────────────────────────────────────────── */
  var gCtx = $gridCanvas   ? $gridCanvas.getContext('2d')   : null;
  var cCtx = $cursorCanvas ? $cursorCanvas.getContext('2d') : null;

  /* ── 8. IMAGE LOAD ──────────────────────────────────────────────── */
  function loadImageSrc(src) {
    imgLoaded = false;
    $img.src  = '';
    $img.classList.remove('vj-artwork__img--loaded');
    $img.classList.add('vj-artwork__img');
    $dropZone.style.display  = 'none';
    $imageArea.style.display = 'flex';

    $img.onload = function () {
      imgNatW   = $img.naturalWidth;
      imgNatH   = $img.naturalHeight;
      imgLoaded = true;
      points    = [];
      undoStack = [];
      redoStack = [];

      requestAnimationFrame(function () {
        _measureImage();
        resizeGridCanvas();
        resizeCursorCanvas();
        renderGrid();
        renderPoints();
        updateCtxMenuState();
        _setStatus('Image loaded \u00b7 ' + imgNatW + ' \u00d7 ' + imgNatH + ' px \u00b7 Click to plot');
        if (root.VJ && root.VJ.updateRes)  root.VJ.updateRes(imgNatW, imgNatH);
        if (root.VJ && root.VJ.snapImage)  root.VJ.snapImage($img);
      });
    };

    $img.onerror = function () {
      _setStatus('\u26a0 Could not load image. Try another URL or file.');
      $dropZone.style.display  = 'flex';
      $imageArea.style.display = 'none';
    };

    $img.src = src;
  }

  function _measureImage() {
    var r = $img.getBoundingClientRect();
    imgDispW = r.width;
    imgDispH = r.height;
  }

  /* ── 9. COORDINATE CONVERSION ───────────────────────────────────── */
  function _toNatural(ex, ey) {
    var r  = $img.getBoundingClientRect();
    var lx = ex - r.left;
    var ly = ey - r.top;
    var nx = Math.round((lx / r.width)  * imgNatW);
    var ny = Math.round((ly / r.height) * imgNatH);
    nx = Math.max(0, Math.min(imgNatW, nx));
    ny = Math.max(0, Math.min(imgNatH, ny));
    return { x: nx, y: ny };
  }

  function _toDisplay(nx, ny) {
    _measureImage();
    return {
      x: (nx / imgNatW) * imgDispW,
      y: (ny / imgNatH) * imgDispH
    };
  }

  /* ── 10. UNDO / REDO ────────────────────────────────────────────── */
  function _pushUndo() {
    undoStack.push(JSON.stringify(points));
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
    _updateUndoBtns();
  }

  function _updateUndoBtns() {
    if ($undoBtn) $undoBtn.disabled = undoStack.length === 0;
    if ($redoBtn) $redoBtn.disabled = redoStack.length === 0;
  }

  function doUndo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(points));
    points = JSON.parse(undoStack.pop());
    renderPoints(); updateCtxMenuState(); _updateUndoBtns();
    _setStatus('Undo \u00b7 ' + points.length + ' point' + (points.length !== 1 ? 's' : ''));
  }

  function doRedo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(points));
    points = JSON.parse(redoStack.pop());
    renderPoints(); updateCtxMenuState(); _updateUndoBtns();
    _setStatus('Redo \u00b7 ' + points.length + ' point' + (points.length !== 1 ? 's' : ''));
  }

  /* ── 11. POINT OPERATIONS ───────────────────────────────────────── */
  function _addPoint(nx, ny) {
    _pushUndo();
    points.push({ x: nx, y: ny, label: activeLabel });
    renderPoints(); updateCtxMenuState();
    _setStatus('Point ' + points.length + ' \u2192 ' + nx + ', ' + ny);
  }

  function _deletePoint(idx) {
    if (idx < 0 || idx >= points.length) return;
    _pushUndo(); points.splice(idx, 1);
    renderPoints(); updateCtxMenuState();
  }

  function _movePointUp(idx) {
    if (idx <= 0) return;
    _pushUndo();
    var t = points[idx]; points[idx] = points[idx-1]; points[idx-1] = t;
    renderPoints();
  }

  function _movePointDown(idx) {
    if (idx >= points.length - 1) return;
    _pushUndo();
    var t = points[idx]; points[idx] = points[idx+1]; points[idx+1] = t;
    renderPoints();
  }

  /* ── 12. RENDER POINTS ──────────────────────────────────────────── */
  function renderPoints() {
    if (!$pointsLayer) return;
    $pointsLayer.innerHTML = '';
    if (!imgLoaded) return;
    _measureImage();

    points.forEach(function (pt, i) {
      var dp = _toDisplay(pt.x, pt.y);

      var ring = document.createElement('div');
      ring.className  = 'bd-point-ring';
      ring.style.left = dp.x + 'px';
      ring.style.top  = dp.y + 'px';

      var dot = document.createElement('div');
      dot.className = 'bd-point-dot';

      var num = document.createElement('div');
      num.className   = 'bd-point-num';
      num.textContent = i + 1;

      ring.appendChild(dot);
      ring.appendChild(num);

      if (pt.label) {
        var lbl = document.createElement('div');
        lbl.className   = 'bd-point-label';
        lbl.textContent = pt.label;
        ring.appendChild(lbl);
      }

      /* Context menu on right-click */
      (function (idx) {
        ring.addEventListener('contextmenu', function (e) {
          e.preventDefault(); e.stopPropagation();
          _openCtxMenu(e.clientX, e.clientY, idx);
        });
        /* Drag start */
        ring.addEventListener('mousedown', function (e) {
          if (e.button !== 0) return;
          e.stopPropagation();
          isDragging = true;
          dragIdx    = idx;
          var r2  = $img.getBoundingClientRect();
          var dp2 = _toDisplay(pt.x, pt.y);
          dragOffX = e.clientX - (r2.left + dp2.x);
          dragOffY = e.clientY - (r2.top  + dp2.y);
        });
      }(i));

      $pointsLayer.appendChild(ring);
    });

    if ($countDisplay) $countDisplay.textContent = points.length + ' pt' + (points.length !== 1 ? 's' : '');
  }

  /* ── 13. GRID CANVAS ────────────────────────────────────────────── */
  function resizeGridCanvas() {
    if (!$gridCanvas || !$img || !imgLoaded) return;
    var r = $img.getBoundingClientRect();
    $gridCanvas.width  = Math.round(r.width);
    $gridCanvas.height = Math.round(r.height);
    $gridCanvas.style.width  = r.width  + 'px';
    $gridCanvas.style.height = r.height + 'px';
    renderGrid();
  }

  function renderGrid() {
    if (!gCtx || !imgLoaded) return;
    var w = $gridCanvas.width, h = $gridCanvas.height;
    gCtx.clearRect(0, 0, w, h);
    if (gridMode === 'none') return;

    gCtx.lineWidth = 1;

    if (gridMode === 'rule3' || gridMode === 'full') {
      gCtx.strokeStyle = 'rgba(197,160,89,0.35)';
      [1/3, 2/3].forEach(function (t) {
        gCtx.beginPath(); gCtx.moveTo(t*w, 0); gCtx.lineTo(t*w, h); gCtx.stroke();
        gCtx.beginPath(); gCtx.moveTo(0, t*h); gCtx.lineTo(w, t*h); gCtx.stroke();
      });
    }
    if (gridMode === 'center' || gridMode === 'full') {
      gCtx.strokeStyle = 'rgba(77,184,255,0.4)';
      gCtx.beginPath(); gCtx.moveTo(w/2, 0); gCtx.lineTo(w/2, h); gCtx.stroke();
      gCtx.beginPath(); gCtx.moveTo(0, h/2); gCtx.lineTo(w, h/2); gCtx.stroke();
    }
    if (gridMode === 'full') {
      gCtx.strokeStyle = 'rgba(197,160,89,0.1)';
      var step = Math.round(Math.min(w, h) / 10);
      if (step > 0) {
        for (var x = 0; x <= w; x += step) { gCtx.beginPath(); gCtx.moveTo(x,0); gCtx.lineTo(x,h); gCtx.stroke(); }
        for (var y = 0; y <= h; y += step) { gCtx.beginPath(); gCtx.moveTo(0,y); gCtx.lineTo(w,y); gCtx.stroke(); }
      }
    }
  }

  /* ── 14. CURSOR CANVAS ──────────────────────────────────────────── */
  function resizeCursorCanvas() {
    if (!$cursorCanvas || !$img || !imgLoaded) return;
    var r = $img.getBoundingClientRect();
    $cursorCanvas.width  = Math.round(r.width);
    $cursorCanvas.height = Math.round(r.height);
    $cursorCanvas.style.width  = r.width  + 'px';
    $cursorCanvas.style.height = r.height + 'px';
  }

  function _renderCursor(lx, ly) {
    if (!cCtx || !imgLoaded) return;
    var w = $cursorCanvas.width, h = $cursorCanvas.height;
    cCtx.clearRect(0, 0, w, h);
    if (!showCrosshair) return;

    cCtx.strokeStyle = 'rgba(197,160,89,0.65)';
    cCtx.lineWidth   = 1;
    cCtx.setLineDash([4, 4]);
    cCtx.beginPath(); cCtx.moveTo(0, ly); cCtx.lineTo(w, ly); cCtx.stroke();
    cCtx.beginPath(); cCtx.moveTo(lx, 0); cCtx.lineTo(lx, h); cCtx.stroke();

    cCtx.setLineDash([]);
    cCtx.strokeStyle = 'rgba(255,255,255,0.9)';
    cCtx.lineWidth   = 1.5;
    cCtx.beginPath(); cCtx.arc(lx, ly, 4, 0, Math.PI * 2); cCtx.stroke();
  }

  /* ── 15. CONTEXT MENU ───────────────────────────────────────────── */
  function _openCtxMenu(cx, cy, idx) {
    ctxTargetIdx = idx;
    ctxMenuOpen  = true;
    var mw = 170, mh = 140;
    var left = (cx + mw > window.innerWidth)  ? cx - mw : cx;
    var top  = (cy + mh > window.innerHeight) ? cy - mh : cy;
    $ctxMenu.style.left    = left + 'px';
    $ctxMenu.style.top     = top  + 'px';
    $ctxMenu.style.display = 'block';
    if ($ctxMoveUp) $ctxMoveUp.disabled = (idx === 0);
    if ($ctxMoveDn) $ctxMoveDn.disabled = (idx === points.length - 1);
  }

  function _closeCtxMenu() {
    ctxMenuOpen  = false;
    ctxTargetIdx = -1;
    if ($ctxMenu) $ctxMenu.style.display = 'none';
  }

  function updateCtxMenuState() {
    _updateUndoBtns();
    if ($clearBtn)   $clearBtn.disabled   = points.length === 0;
    if ($exportCss)  $exportCss.disabled  = points.length === 0;
    if ($exportJson) $exportJson.disabled = points.length === 0;
    if ($exportAi)   $exportAi.disabled   = points.length === 0;
    if ($copyAll)    $copyAll.disabled    = points.length === 0;
  }

  /* ── 16. LABEL MODAL ────────────────────────────────────────────── */
  function _openLabelModal(idx) {
    ctxTargetIdx = idx;
    if (!$labelModal) return;
    $labelInput.value = (idx >= 0 && points[idx]) ? (points[idx].label || '') : activeLabel;
    $labelModal.style.display = 'flex';
    setTimeout(function () { if ($labelInput) { $labelInput.focus(); $labelInput.select(); } }, 50);
  }

  function _closeLabelModal() {
    if ($labelModal) $labelModal.style.display = 'none';
  }

  function _saveLabelModal() {
    var val = ($labelInput ? $labelInput.value.trim() : '');
    if (ctxTargetIdx >= 0 && points[ctxTargetIdx]) {
      _pushUndo();
      points[ctxTargetIdx].label = val;
      renderPoints();
    } else {
      activeLabel = val;
    }
    _closeLabelModal();
  }

  /* ── 17. EXPORT ─────────────────────────────────────────────────── */
  function _buildCss() {
    if (!points.length) return '/* No points plotted */';
    return points.map(function (pt, i) {
      var c = pt.label ? ' /* ' + pt.label + ' */' : '';
      return '.point-' + (i+1) + ' { left: ' + pt.x + 'px; top: ' + pt.y + 'px; }' + c;
    }).join('\n');
  }

  function _buildJson() {
    return JSON.stringify({
      naturalSize: { width: imgNatW, height: imgNatH },
      points: points.map(function (pt, i) {
        return { index: i+1, x: pt.x, y: pt.y, label: pt.label || '' };
      })
    }, null, 2);
  }

  function _buildAi() {
    return [
      'Image natural dimensions: ' + imgNatW + ' \u00d7 ' + imgNatH + ' px',
      'Coordinate system: top-left origin (0,0)',
      'Points plotted (' + points.length + '):',
      ''
    ].concat(points.map(function (pt, i) {
      return '  ' + (i+1) + '. x=' + pt.x + ', y=' + pt.y + (pt.label ? ' \u2014 ' + pt.label : '');
    })).concat([
      '',
      'Use these coordinates for CSS positioning, SVG placement, canvas drawing, or spatial AI prompting.'
    ]).join('\n');
  }

  function _showOutput(text) {
    if ($outputBox) {
      $outputBox.value = text;
      $outputBox.parentElement.style.display = 'block';
      $outputBox.focus();
      $outputBox.select();
    }
  }

  function _copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { _setStatus('\u2713 Copied to clipboard'); })
        .catch(function () { _fallbackCopy(text); });
    } else { _fallbackCopy(text); }
  }

  function _fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); _setStatus('\u2713 Copied'); } catch(e) {}
    document.body.removeChild(ta);
  }

  function _setStatus(msg) {
    if ($statusMsg) $statusMsg.textContent = msg;
  }

  /* ── 18. DRAG-AND-DROP FILE ─────────────────────────────────────── */
  $dropZone.addEventListener('dragover',  function (e) { e.preventDefault(); $dropZone.classList.add('bd-drag-over'); });
  $dropZone.addEventListener('dragleave', function ()  { $dropZone.classList.remove('bd-drag-over'); });
  $dropZone.addEventListener('drop', function (e) {
    e.preventDefault(); $dropZone.classList.remove('bd-drag-over');
    var f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) {
      var r = new FileReader();
      r.onload = function (ev) { loadImageSrc(ev.target.result); };
      r.readAsDataURL(f);
    }
  });
  $dropZone.addEventListener('click', function () { $fileInput.click(); });
  $fileInput.addEventListener('change', function () {
    var f = $fileInput.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function (ev) { loadImageSrc(ev.target.result); };
    r.readAsDataURL(f);
  });

  /* ── 19. URL LOAD ───────────────────────────────────────────────── */
  $loadUrlBtn.addEventListener('click', function () {
    var url = $urlInput.value.trim();
    if (url) loadImageSrc(url);
  });
  $urlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $loadUrlBtn.click();
  });

  /* ── 20. IMAGE MOUSE EVENTS ─────────────────────────────────────── */
  $imageArea.addEventListener('mousemove', function (e) {
    if (!imgLoaded) return;
    var r  = $img.getBoundingClientRect();
    var lx = e.clientX - r.left;
    var ly = e.clientY - r.top;
    if (lx < 0 || ly < 0 || lx > r.width || ly > r.height) return;

    _renderCursor(lx, ly);
    var c = _toNatural(e.clientX, e.clientY);
    if ($coordDisplay) $coordDisplay.textContent = c.x + ', ' + c.y;
    if (root.VJ && root.VJ.updateHUD) root.VJ.updateHUD(c.x, c.y);
  });

  $imageArea.addEventListener('mouseleave', function () {
    if (cCtx) cCtx.clearRect(0, 0, $cursorCanvas.width, $cursorCanvas.height);
    if ($coordDisplay) $coordDisplay.textContent = '\u2014, \u2014';
  });

  $imageArea.addEventListener('click', function (e) {
    if (!imgLoaded || isDragging) return;
    if (e.target.closest && e.target.closest('.bd-point-ring')) return;
    if (ctxMenuOpen) { _closeCtxMenu(); return; }

    var c = _toNatural(e.clientX, e.clientY);
    var nx = c.x, ny = c.y;

    if (snapToGrid && imgNatW > 0) {
      var step = Math.round(Math.min(imgNatW, imgNatH) / 10);
      if (step > 0) { nx = Math.round(nx / step) * step; ny = Math.round(ny / step) * step; }
    }

    _addPoint(nx, ny);
  });

  $imageArea.addEventListener('contextmenu', function (e) { e.preventDefault(); _closeCtxMenu(); });

  /* Drag move & up — bound on document so it works outside the image */
  document.addEventListener('mousemove', function (e) {
    if (!isDragging || dragIdx < 0) return;
    var r  = $img.getBoundingClientRect();
    var lx = (e.clientX - dragOffX) - r.left;
    var ly = (e.clientY - dragOffY) - r.top;
    var nx = Math.max(0, Math.min(imgNatW, Math.round((lx / r.width)  * imgNatW)));
    var ny = Math.max(0, Math.min(imgNatH, Math.round((ly / r.height) * imgNatH)));
    points[dragIdx].x = nx;
    points[dragIdx].y = ny;
    renderPoints();
    if ($coordDisplay) $coordDisplay.textContent = nx + ', ' + ny;
  });

  document.addEventListener('mouseup', function () {
    if (isDragging) { isDragging = false; dragIdx = -1; renderPoints(); }
  });

  document.addEventListener('click', function (e) {
    if (ctxMenuOpen && $ctxMenu && !$ctxMenu.contains(e.target)) _closeCtxMenu();
  });

  /* ── 21. CONTEXT MENU ACTIONS ───────────────────────────────────── */
  if ($ctxDelete) $ctxDelete.addEventListener('click', function () { _deletePoint(ctxTargetIdx); _closeCtxMenu(); });
  if ($ctxLabel)  $ctxLabel.addEventListener('click',  function () { var i = ctxTargetIdx; _closeCtxMenu(); _openLabelModal(i); });
  if ($ctxMoveUp) $ctxMoveUp.addEventListener('click', function () { _movePointUp(ctxTargetIdx); _closeCtxMenu(); });
  if ($ctxMoveDn) $ctxMoveDn.addEventListener('click', function () { _movePointDown(ctxTargetIdx); _closeCtxMenu(); });

  /* ── 22. TOOLBAR ACTIONS ────────────────────────────────────────── */
  if ($clearBtn) $clearBtn.addEventListener('click', function () {
    if (!points.length) return;
    _pushUndo(); points = [];
    renderPoints(); updateCtxMenuState();
    _setStatus('All points cleared');
  });
  if ($undoBtn) $undoBtn.addEventListener('click', doUndo);
  if ($redoBtn) $redoBtn.addEventListener('click', doRedo);

  if ($resetImg) $resetImg.addEventListener('click', function () {
    imgLoaded = false; points = []; undoStack = []; redoStack = [];
    $img.src = '';
    $imageArea.style.display = 'none';
    $dropZone.style.display  = 'flex';
    if ($outputBox) $outputBox.parentElement.style.display = 'none';
    renderPoints(); updateCtxMenuState();
    _setStatus('Ready \u00b7 Drop an image or paste a URL');
    if (root.VJ && root.VJ.updateHUD) root.VJ.updateHUD(0, 0);
    if (root.VJ && root.VJ.updateRes) root.VJ.updateRes(0, 0);
  });

  if ($gridBtn) $gridBtn.addEventListener('click', function () {
    var modes = ['none','rule3','center','full'];
    gridMode  = modes[(modes.indexOf(gridMode) + 1) % modes.length];
    var labels = { none:'Grid: Off', rule3:'Grid: 1/3', center:'Grid: +', full:'Grid: All' };
    $gridBtn.textContent = labels[gridMode];
    renderGrid();
  });

  if ($snapBtn) $snapBtn.addEventListener('click', function () {
    snapToGrid = !snapToGrid;
    $snapBtn.classList.toggle('bd-btn-active', snapToGrid);
    _setStatus('Snap: ' + (snapToGrid ? 'ON' : 'OFF'));
  });

  if ($crossBtn) $crossBtn.addEventListener('click', function () {
    showCrosshair = !showCrosshair;
    $crossBtn.classList.toggle('bd-btn-active', showCrosshair);
    if (!showCrosshair && cCtx) cCtx.clearRect(0, 0, $cursorCanvas.width, $cursorCanvas.height);
  });

  /* ── 23. EXPORT BUTTONS ─────────────────────────────────────────── */
  if ($exportCss)  $exportCss.addEventListener('click',  function () { _showOutput(_buildCss());  _setStatus('CSS exported \u00b7 ' + points.length + ' rules'); });
  if ($exportJson) $exportJson.addEventListener('click', function () { _showOutput(_buildJson()); _setStatus('JSON exported \u00b7 ' + points.length + ' points'); });
  if ($exportAi)   $exportAi.addEventListener('click',   function () { _showOutput(_buildAi());  _setStatus('AI prompt exported'); });
  if ($copyAll) $copyAll.addEventListener('click', function () {
    _copyToClipboard($outputBox && $outputBox.value ? $outputBox.value : _buildJson());
  });

  /* ── 24. LABEL MODAL BUTTONS ────────────────────────────────────── */
  if ($labelSave)   $labelSave.addEventListener('click',   _saveLabelModal);
  if ($labelCancel) $labelCancel.addEventListener('click', _closeLabelModal);
  if ($labelInput)  $labelInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter')  _saveLabelModal();
    if (e.key === 'Escape') _closeLabelModal();
  });

  /* ── 25. KEYBOARD SHORTCUTS ─────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (!_mountEl.classList.contains('vj-mod--active')) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); doRedo(); return; }
    if ((e.key === 'Backspace' || e.key === 'Delete') && !e.target.matches('input,textarea,select')) {
      if (points.length) _deletePoint(points.length - 1);
    }
    if (e.key === 'Escape') { _closeCtxMenu(); _closeLabelModal(); }
  });

  /* ── 26. WINDOW RESIZE ──────────────────────────────────────────── */
  var _rTimer;
  window.addEventListener('resize', function () {
    clearTimeout(_rTimer);
    _rTimer = setTimeout(function () {
      if (!imgLoaded) return;
      _measureImage();
      resizeGridCanvas();
      resizeCursorCanvas();
      renderPoints();
    }, 120);
  });

  /* ── 27. EXPOSE GLOBALS (shell calls these after script load) ───── */
  root.resizeGridCanvas   = resizeGridCanvas;
  root.resizeCursorCanvas = resizeCursorCanvas;
  root.renderPoints       = renderPoints;
  root.updateCtxMenuState = updateCtxMenuState;

  /* ── 28. INIT ───────────────────────────────────────────────────── */
  updateCtxMenuState();
  _setStatus('Ready \u00b7 Drop an image or paste a URL to begin');

  root.BeDucky = {
    getPoints:   function () { return points.slice(); },
    loadImage:   loadImageSrc,
    clearPoints: function () { _pushUndo(); points = []; renderPoints(); updateCtxMenuState(); }
  };

  console.log('[BeDucky] v50 mounted OK.');

}(window));
