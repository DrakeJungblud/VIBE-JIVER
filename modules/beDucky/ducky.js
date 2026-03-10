/* ============================================================
   BE DUCKY  v51  —  Vibe Jiver Module
   Mount target : #bd-module-root
   Bridge       : window.VJ.updateHUD / updateRes / snapImage
   NEW in v51:
     · Crosshair zoom via scroll wheel (size 20–200px)
     · Precision crosshair: thin gap-dot style, no full-span lines
     · Pin markers are sharp pinpoint dots (3px) with number badge
     · Label preset import (JSON list → applied to pins in order)
     · Label visibility toggle per-pin and global (Labels On/Off)
     · All export/undo/redo/clear/new-image functions fully wired
   ============================================================ */
(function (root) {
  'use strict';

  /* ════════════════════════════════════════════════════════════════
     1. HTML TEMPLATE  (defined first — used in step 4)
     ════════════════════════════════════════════════════════════════ */
  var _MODULE_HTML = [
    '<div id="bd-wrap">',

    /* ── TOP TOOLBAR ── */
    '  <div class="bd-toolbar">',
    '    <div class="bd-toolbar-left">',
    '      <span class="bd-module-badge">&#127919; BULLS-EYE DUCKY</span>',
    '      <button class="bd-btn" id="bd-reset-img"  title="Load a new image">&#8617; New Image</button>',
    '      <button class="bd-btn" id="bd-undo-btn"   disabled title="Undo (Ctrl+Z)">&#8630; Undo</button>',
    '      <button class="bd-btn" id="bd-redo-btn"   disabled title="Redo (Ctrl+Y)">&#8631; Redo</button>',
    '      <button class="bd-btn" id="bd-clear-btn"  disabled title="Clear all points">&#10005; Clear Pts</button>',
    '    </div>',
    '    <div class="bd-toolbar-center">',
    '      <span class="bd-coord-pill" id="bd-coord-display">&#8212;, &#8212;</span>',
    '      <span class="bd-count-pill" id="bd-count-display">0 pts</span>',
    '    </div>',
    '    <div class="bd-toolbar-right">',
    '      <button class="bd-btn bd-btn-active" id="bd-cross-btn"   title="Toggle crosshair">&#10011; Cross</button>',
    '      <button class="bd-btn"               id="bd-labels-btn"  title="Toggle label visibility">&#9673; Labels</button>',
    '      <button class="bd-btn"               id="bd-grid-btn"    title="Cycle grid overlay">Grid: Off</button>',
    '      <button class="bd-btn"               id="bd-snap-btn"    title="Snap to grid">&#8862; Snap</button>',
    '    </div>',
    '  </div>',

    /* ── URL / FILE BAR ── */
    '  <div class="bd-url-bar">',
    '    <input type="text" id="bd-url-input" class="bd-url-input"',
    '      placeholder="Paste image URL and press Enter or click Load"',
    '      spellcheck="false" autocomplete="off">',
    '    <button class="bd-btn bd-btn-gold"  id="bd-load-url-btn">Load</button>',
    '    <button class="bd-btn bd-btn-label" id="bd-import-labels-btn" title="Import label presets from JSON">&#8659; Labels JSON</button>',
    '    <input type="file" id="bd-file-input"        accept="image/*"       style="display:none">',
    '    <input type="file" id="bd-labels-file-input" accept=".json,.txt"    style="display:none">',
    '  </div>',

    /* ── CANVAS AREA ── */
    '  <div class="bd-canvas-area">',
    '    <div class="bd-drop-zone" id="bd-drop-zone">',
    '      <div class="bd-drop-icon">&#127919;</div>',
    '      <div class="bd-drop-title">Drop Image Here</div>',
    '      <div class="bd-drop-sub">or click to browse &middot; PNG JPG GIF WebP SVG</div>',
    '      <div class="bd-drop-hint">Scroll wheel resizes crosshair once image is loaded</div>',
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

    /* ── EXPORT BAR ── */
    '  <div class="bd-export-bar">',
    '    <span class="bd-export-label">EXPORT:</span>',
    '    <button class="bd-btn bd-btn-export" id="bd-export-css"  disabled>CSS</button>',
    '    <button class="bd-btn bd-btn-export" id="bd-export-json" disabled>JSON</button>',
    '    <button class="bd-btn bd-btn-export" id="bd-export-ai"   disabled>AI Prompt</button>',
    '    <button class="bd-btn bd-btn-gold"   id="bd-copy-all"    disabled>&#9000; Copy Output</button>',
    '    <span class="bd-status-pill" id="bd-status">Ready</span>',
    '  </div>',

    /* ── OUTPUT BOX ── */
    '  <div class="bd-output-wrap" style="display:none">',
    '    <textarea id="bd-output" class="bd-output" spellcheck="false" readonly></textarea>',
    '  </div>',

    /* ── CONTEXT MENU ── */
    '  <div id="bd-ctx-menu" class="bd-ctx-menu" style="display:none">',
    '    <button class="bd-ctx-item" id="bd-ctx-delete">&#10005; Delete Point</button>',
    '    <button class="bd-ctx-item" id="bd-ctx-label" >&#9998; Edit Label</button>',
    '    <button class="bd-ctx-item" id="bd-ctx-toggle-label">&#9673; Toggle Label</button>',
    '    <button class="bd-ctx-item" id="bd-ctx-moveup">&#8593; Move Up</button>',
    '    <button class="bd-ctx-item" id="bd-ctx-movedn">&#8595; Move Down</button>',
    '  </div>',

    /* ── LABEL EDIT MODAL ── */
    '  <div id="bd-label-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal">',
    '      <div class="bd-modal-title">Edit Point Label</div>',
    '      <input type="text" id="bd-label-input" class="bd-modal-input"',
    '        placeholder="e.g. left eye, CTA button, hero anchor" maxlength="60" spellcheck="false">',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-label-save">Save</button>',
    '        <button class="bd-btn"             id="bd-label-cancel">Cancel</button>',
    '      </div>',
    '    </div>',
    '  </div>',

    /* ── LABEL IMPORT MODAL ── */
    '  <div id="bd-import-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal bd-modal-wide">',
    '      <div class="bd-modal-title">&#8659; Import Label Presets</div>',
    '      <div class="bd-modal-desc">Paste a JSON array of label strings. They will be applied to pins in order (pin 1 gets label[0], etc.). Extra labels are stored and applied to future pins automatically.</div>',
    '      <textarea id="bd-import-textarea" class="bd-modal-textarea"',
    '        placeholder=\'["left eye", "right eye", "nose tip", "chin", "CTA button"]\'',
    '        spellcheck="false"></textarea>',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-import-apply">Apply Labels</button>',
    '        <button class="bd-btn"             id="bd-import-clear">Clear Presets</button>',
    '        <button class="bd-btn"             id="bd-import-cancel">Cancel</button>',
    '      </div>',
    '      <div class="bd-modal-hint" id="bd-import-status"></div>',
    '    </div>',
    '  </div>',

    '</div>'  /* end #bd-wrap */
  ].join('\n');


  /* ════════════════════════════════════════════════════════════════
     2. DUCK IMAGE PATH
     ════════════════════════════════════════════════════════════════ */
  if (typeof DUCK_IMG === 'undefined') {
    var _s = (document.currentScript || {}).src || '';
    var _d = _s.substring(0, _s.lastIndexOf('/') + 1);
    root.DUCK_IMG = _d ? (_d + '../../ducky.png') : './ducky.png';
  }


  /* ════════════════════════════════════════════════════════════════
     3. INJECT INLINE CSS  (critical — no flash)
     ════════════════════════════════════════════════════════════════ */
  (function () {
    if (document.getElementById('bd-ducky-inline')) return;
    var st = document.createElement('style');
    st.id = 'bd-ducky-inline';
    st.textContent = [

      /* ── Root / wrap ── */
      '#bd-module-root{display:block;height:100%}',
      '#bd-wrap{display:flex;flex-direction:column;height:100%;background:#000;color:#d8d8d8;font-family:"Rajdhani","Share Tech Mono",sans-serif;overflow:hidden;position:relative}',

      /* ── Toolbar ── */
      '.bd-toolbar{display:flex;align-items:center;gap:8px;padding:6px 12px;background:#080808;border-bottom:1px solid #1e1e1e;flex-shrink:0;flex-wrap:wrap}',
      '.bd-toolbar-left,.bd-toolbar-right{display:flex;gap:5px;align-items:center}',
      '.bd-toolbar-center{flex:1;display:flex;justify-content:center;align-items:center;gap:10px}',
      '.bd-module-badge{font-family:"Oswald",sans-serif;font-size:.72rem;font-weight:700;color:#c5a059;letter-spacing:3px;text-transform:uppercase;padding-right:10px;border-right:1px solid #222;margin-right:4px;white-space:nowrap}',

      /* ── Buttons ── */
      '.bd-btn{background:#0d0d0d;border:1px solid #222;color:#888;font-family:"Share Tech Mono",monospace;font-size:.65rem;letter-spacing:1px;padding:4px 10px;border-radius:2px;cursor:pointer;transition:all .15s;white-space:nowrap;text-transform:uppercase;line-height:1.4}',
      '.bd-btn:hover:not(:disabled){background:#141414;border-color:#333;color:#c5a059}',
      '.bd-btn:disabled{opacity:.28;cursor:not-allowed}',
      '.bd-btn-active{border-color:#c5a059 !important;color:#c5a059 !important;background:rgba(197,160,89,.06) !important}',
      '.bd-btn-gold{background:rgba(197,160,89,.08);border-color:rgba(197,160,89,.3);color:#c5a059}',
      '.bd-btn-gold:hover:not(:disabled){background:rgba(197,160,89,.16)}',
      '.bd-btn-label{background:rgba(77,184,255,.05);border-color:rgba(77,184,255,.2);color:#4db8ff}',
      '.bd-btn-label:hover:not(:disabled){background:rgba(77,184,255,.12)}',
      '.bd-btn-export{min-width:50px}',

      /* ── Coord / count pills ── */
      '.bd-coord-pill,.bd-count-pill{font-family:"Share Tech Mono",monospace;font-size:.7rem;letter-spacing:1.5px;padding:3px 10px;border-radius:2px;border:1px solid #1e1e1e;background:#080808;color:#c5a059;white-space:nowrap}',
      '.bd-count-pill{color:#4db8ff;border-color:rgba(77,184,255,.15)}',
      '.bd-status-pill{font-family:"Share Tech Mono",monospace;font-size:.65rem;letter-spacing:.8px;color:#444;white-space:nowrap;margin-left:auto;padding-right:4px}',

      /* ── URL bar ── */
      '.bd-url-bar{display:flex;gap:6px;padding:6px 12px;background:#080808;border-bottom:1px solid #181818;flex-shrink:0;align-items:center}',
      '.bd-url-input{flex:1;background:#0a0a0a;border:1px solid #222;color:#c5a059;font-family:"Share Tech Mono",monospace;font-size:.68rem;padding:5px 10px;border-radius:2px;outline:none;letter-spacing:.5px;min-width:0}',
      '.bd-url-input:focus{border-color:rgba(197,160,89,.5);box-shadow:0 0 0 1px rgba(197,160,89,.12)}',
      '.bd-url-input::placeholder{color:#2e2e2e}',

      /* ── Canvas area ── */
      '.bd-canvas-area{flex:1;position:relative;overflow:auto;background:#050505;display:flex;align-items:center;justify-content:center;min-height:0}',

      /* ── Drop zone ── */
      '.bd-drop-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;width:100%;height:100%;border:2px dashed #1e1e1e;border-radius:4px;cursor:pointer;transition:border-color .2s,background .2s;position:absolute;inset:0}',
      '.bd-drop-zone:hover,.bd-drag-over{border-color:rgba(197,160,89,.4);background:rgba(197,160,89,.03)}',
      '.bd-drop-icon{font-size:2.8rem;opacity:.35;pointer-events:none}',
      '.bd-drop-title{font-family:"Oswald",sans-serif;font-size:1rem;color:#4a4a4a;letter-spacing:3px;text-transform:uppercase;pointer-events:none}',
      '.bd-drop-sub{font-family:"Share Tech Mono",monospace;font-size:.56rem;color:#2e2e2e;letter-spacing:1px;pointer-events:none}',
      '.bd-drop-hint{font-family:"Share Tech Mono",monospace;font-size:.5rem;color:#222;letter-spacing:.5px;pointer-events:none}',

      /* ── Image area ── */
      '.bd-image-area{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:absolute;inset:0;overflow:auto;padding:12px}',
      '.bd-image-wrap{position:relative;display:inline-block;cursor:none;max-width:100%;max-height:100%;flex-shrink:0}',
      '.bd-main-img{display:block;max-width:100%;max-height:calc(100vh - 220px);width:auto;height:auto;pointer-events:none;user-select:none}',

      /* ── Canvas overlays ── */
      '.bd-canvas-overlay{position:absolute;top:0;left:0;pointer-events:none}',
      '.bd-cursor-canvas{z-index:10}',
      '.bd-grid-canvas{z-index:5}',

      /* ── Points layer ── */
      '.bd-points-layer{position:absolute;inset:0;pointer-events:none;z-index:20}',

      /* ── Pin: outer hit target ── */
      '.bd-pin{position:absolute;width:20px;height:20px;transform:translate(-50%,-50%);pointer-events:all;cursor:grab}',
      '.bd-pin:active{cursor:grabbing}',

      /* ── Pin: center dot — precision pinpoint ── */
      '.bd-pin-dot{',
      '  position:absolute;top:50%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  width:4px;height:4px;',
      '  border-radius:50%;',
      '  background:#e2b96f;',
      '  box-shadow:0 0 0 1px #000, 0 0 0 2px rgba(197,160,89,.7);',
      '  transition:width .1s,height .1s,box-shadow .1s;',
      '}',
      '.bd-pin:hover .bd-pin-dot{',
      '  width:6px;height:6px;',
      '  background:#fff;',
      '  box-shadow:0 0 0 1.5px #000, 0 0 0 3px #c5a059, 0 0 8px rgba(197,160,89,.6);',
      '}',

      /* ── Pin: number badge (above dot) ── */
      '.bd-pin-num{',
      '  position:absolute;',
      '  bottom:calc(50% + 5px);',
      '  left:50%;',
      '  transform:translateX(-50%);',
      '  font-family:"Share Tech Mono",monospace;',
      '  font-size:8px;',
      '  color:#c5a059;',
      '  background:rgba(0,0,0,.82);',
      '  padding:1px 3px;',
      '  border-radius:2px;',
      '  white-space:nowrap;',
      '  pointer-events:none;',
      '  line-height:1.3;',
      '  letter-spacing:.5px;',
      '}',

      /* ── Pin: label tag (below dot) — togglable ── */
      '.bd-pin-label{',
      '  position:absolute;',
      '  top:calc(50% + 5px);',
      '  left:50%;',
      '  transform:translateX(-50%);',
      '  font-family:"Share Tech Mono",monospace;',
      '  font-size:8px;',
      '  color:#4db8ff;',
      '  background:rgba(0,0,0,.85);',
      '  padding:1px 5px;',
      '  border-radius:2px;',
      '  white-space:nowrap;',
      '  pointer-events:none;',
      '  border:1px solid rgba(77,184,255,.25);',
      '  letter-spacing:.4px;',
      '  transition:opacity .18s;',
      '}',
      '.bd-pin-label.bd-label-hidden{opacity:0;pointer-events:none}',

      /* ── Export bar ── */
      '.bd-export-bar{display:flex;align-items:center;gap:6px;padding:5px 12px;background:#080808;border-top:1px solid #181818;flex-shrink:0;flex-wrap:wrap}',
      '.bd-export-label{font-family:"Share Tech Mono",monospace;font-size:.52rem;color:#333;letter-spacing:2px;text-transform:uppercase;margin-right:2px}',

      /* ── Output box ── */
      '.bd-output-wrap{flex-shrink:0;border-top:1px solid #1e1e1e}',
      '.bd-output{width:100%;height:148px;background:#030303;border:none;color:#00e87a;font-family:"Share Tech Mono",monospace;font-size:.68rem;padding:10px 14px;resize:none;outline:none;line-height:1.65;letter-spacing:.3px;display:block}',

      /* ── Context menu ── */
      '.bd-ctx-menu{position:fixed;background:#0c0c0c;border:1px solid #2a2a2a;border-radius:3px;padding:3px 0;z-index:9000;min-width:168px;box-shadow:0 8px 36px rgba(0,0,0,.9)}',
      '.bd-ctx-item{display:block;width:100%;text-align:left;padding:7px 14px;font-family:"Share Tech Mono",monospace;font-size:.63rem;letter-spacing:1px;color:#777;background:none;border:none;cursor:pointer;text-transform:uppercase;transition:all .11s}',
      '.bd-ctx-item:hover:not(:disabled){background:rgba(197,160,89,.07);color:#c5a059}',
      '.bd-ctx-item:disabled{opacity:.22;cursor:not-allowed}',

      /* ── Modals ── */
      '.bd-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;z-index:9100;backdrop-filter:blur(5px)}',
      '.bd-modal{background:#0c0c0c;border:1px solid rgba(197,160,89,.28);border-radius:4px;padding:22px 24px;min-width:300px;box-shadow:0 18px 64px rgba(0,0,0,.95)}',
      '.bd-modal-wide{min-width:420px;max-width:520px}',
      '.bd-modal-title{font-family:"Oswald",sans-serif;font-size:.78rem;font-weight:700;color:#c5a059;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px}',
      '.bd-modal-desc{font-family:"Share Tech Mono",monospace;font-size:.58rem;color:#444;line-height:1.7;margin-bottom:12px;letter-spacing:.3px}',
      '.bd-modal-input{width:100%;background:#080808;border:1px solid #2a2a2a;color:#d8d8d8;font-family:"Share Tech Mono",monospace;font-size:.76rem;padding:7px 10px;border-radius:2px;outline:none;margin-bottom:14px;letter-spacing:.3px}',
      '.bd-modal-input:focus{border-color:rgba(197,160,89,.5)}',
      '.bd-modal-textarea{width:100%;height:100px;background:#080808;border:1px solid #2a2a2a;color:#4db8ff;font-family:"Share Tech Mono",monospace;font-size:.66rem;padding:8px 10px;border-radius:2px;outline:none;resize:vertical;margin-bottom:12px;line-height:1.6;letter-spacing:.3px}',
      '.bd-modal-textarea:focus{border-color:rgba(77,184,255,.4)}',
      '.bd-modal-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}',
      '.bd-modal-hint{font-family:"Share Tech Mono",monospace;font-size:.58rem;color:#555;margin-top:8px;letter-spacing:.3px;min-height:1em}',

      /* ── Pin entrance animation ── */
      '@keyframes bd-pin-in{from{transform:translate(-50%,-50%) scale(0.2);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}',
      '.bd-pin{animation:bd-pin-in .2s cubic-bezier(.34,1.56,.64,1) forwards}'

    ].join('');
    document.head.appendChild(st);
  })();


  /* ════════════════════════════════════════════════════════════════
     4. MOUNT DOM
     ════════════════════════════════════════════════════════════════ */
  var _mountEl = document.getElementById('bd-module-root');
  if (!_mountEl) { console.error('[BeDucky] #bd-module-root not found.'); return; }
  _mountEl.innerHTML = _MODULE_HTML;


  /* ════════════════════════════════════════════════════════════════
     5. STATE
     ════════════════════════════════════════════════════════════════ */
  var points          = [];       /* [{x,y,label,labelVisible}] */
  var undoStack       = [];
  var redoStack       = [];
  var labelPresets    = [];       /* imported label list */
  var imgNatW         = 0;
  var imgNatH         = 0;
  var imgDispW        = 0;
  var imgDispH        = 0;
  var imgLoaded       = false;
  var ctxMenuOpen     = false;
  var ctxTargetIdx    = -1;
  var gridMode        = 'none';   /* none | rule3 | center | full */
  var showCrosshair   = true;
  var labelsVisible   = true;     /* global label toggle */
  var snapToGrid      = false;
  var isDragging      = false;
  var dragIdx         = -1;
  var dragOffX        = 0;
  var dragOffY        = 0;
  var crosshairSize   = 60;       /* px radius — scroll wheel controls this */
  var CROSS_MIN       = 20;
  var CROSS_MAX       = 200;


  /* ════════════════════════════════════════════════════════════════
     6. DOM REFS
     ════════════════════════════════════════════════════════════════ */
  function _q(sel) { return _mountEl.querySelector(sel); }

  var $dropZone          = _q('#bd-drop-zone');
  var $imageArea         = _q('#bd-image-area');
  var $img               = _q('#bd-main-img');
  var $gridCanvas        = _q('#bd-grid-canvas');
  var $cursorCanvas      = _q('#bd-cursor-canvas');
  var $pointsLayer       = _q('#bd-points-layer');
  var $fileInput         = _q('#bd-file-input');
  var $labelsFileInput   = _q('#bd-labels-file-input');
  var $urlInput          = _q('#bd-url-input');
  var $loadUrlBtn        = _q('#bd-load-url-btn');
  var $clearBtn          = _q('#bd-clear-btn');
  var $undoBtn           = _q('#bd-undo-btn');
  var $redoBtn           = _q('#bd-redo-btn');
  var $exportCss         = _q('#bd-export-css');
  var $exportJson        = _q('#bd-export-json');
  var $exportAi          = _q('#bd-export-ai');
  var $copyAll           = _q('#bd-copy-all');
  var $outputBox         = _q('#bd-output');
  var $ctxMenu           = _q('#bd-ctx-menu');
  var $ctxDelete         = _q('#bd-ctx-delete');
  var $ctxLabel          = _q('#bd-ctx-label');
  var $ctxToggleLabel    = _q('#bd-ctx-toggle-label');
  var $ctxMoveUp         = _q('#bd-ctx-moveup');
  var $ctxMoveDn         = _q('#bd-ctx-movedn');
  var $labelModal        = _q('#bd-label-modal');
  var $labelInput        = _q('#bd-label-input');
  var $labelSave         = _q('#bd-label-save');
  var $labelCancel       = _q('#bd-label-cancel');
  var $importModal       = _q('#bd-import-modal');
  var $importTextarea    = _q('#bd-import-textarea');
  var $importApply       = _q('#bd-import-apply');
  var $importClear       = _q('#bd-import-clear');
  var $importCancel      = _q('#bd-import-cancel');
  var $importStatus      = _q('#bd-import-status');
  var $importLabelsBtn   = _q('#bd-import-labels-btn');
  var $gridBtn           = _q('#bd-grid-btn');
  var $snapBtn           = _q('#bd-snap-btn');
  var $crossBtn          = _q('#bd-cross-btn');
  var $labelsBtn         = _q('#bd-labels-btn');
  var $resetImg          = _q('#bd-reset-img');
  var $coordDisplay      = _q('#bd-coord-display');
  var $countDisplay      = _q('#bd-count-display');
  var $statusMsg         = _q('#bd-status');


  /* ════════════════════════════════════════════════════════════════
     7. CANVAS CONTEXTS
     ════════════════════════════════════════════════════════════════ */
  var gCtx = $gridCanvas   ? $gridCanvas.getContext('2d')   : null;
  var cCtx = $cursorCanvas ? $cursorCanvas.getContext('2d') : null;


  /* ════════════════════════════════════════════════════════════════
     8. IMAGE LOAD
     ════════════════════════════════════════════════════════════════ */
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
        _setStatus('Loaded \u00b7 ' + imgNatW + '\u00d7' + imgNatH + ' \u00b7 Click to pin \u00b7 Scroll = crosshair size');
        if (root.VJ && root.VJ.updateRes)  root.VJ.updateRes(imgNatW, imgNatH);
        if (root.VJ && root.VJ.snapImage)  root.VJ.snapImage($img);
      });
    };

    $img.onerror = function () {
      _setStatus('\u26a0 Could not load image.');
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


  /* ════════════════════════════════════════════════════════════════
     9. COORDINATE CONVERSION
     ════════════════════════════════════════════════════════════════ */
  function _toNatural(ex, ey) {
    var r  = $img.getBoundingClientRect();
    var nx = Math.round(((ex - r.left) / r.width)  * imgNatW);
    var ny = Math.round(((ey - r.top)  / r.height) * imgNatH);
    return { x: Math.max(0, Math.min(imgNatW, nx)), y: Math.max(0, Math.min(imgNatH, ny)) };
  }

  function _toDisplay(nx, ny) {
    _measureImage();
    return { x: (nx / imgNatW) * imgDispW, y: (ny / imgNatH) * imgDispH };
  }


  /* ════════════════════════════════════════════════════════════════
     10. UNDO / REDO
     ════════════════════════════════════════════════════════════════ */
  function _pushUndo() {
    undoStack.push(JSON.stringify(points));
    if (undoStack.length > 80) undoStack.shift();
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
    _setStatus('Undo \u00b7 ' + points.length + ' pin' + (points.length !== 1 ? 's' : ''));
  }

  function doRedo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(points));
    points = JSON.parse(redoStack.pop());
    renderPoints(); updateCtxMenuState(); _updateUndoBtns();
    _setStatus('Redo \u00b7 ' + points.length + ' pin' + (points.length !== 1 ? 's' : ''));
  }


  /* ════════════════════════════════════════════════════════════════
     11. POINT OPERATIONS
     ════════════════════════════════════════════════════════════════ */
  function _nextLabel() {
    /* Auto-apply next preset label if available */
    if (labelPresets.length > points.length) {
      return labelPresets[points.length] || '';
    }
    return '';
  }

  function _addPoint(nx, ny) {
    _pushUndo();
    points.push({ x: nx, y: ny, label: _nextLabel(), labelVisible: true });
    renderPoints(); updateCtxMenuState();
    _setStatus('Pin ' + points.length + ' \u2192 ' + nx + ', ' + ny + (points[points.length-1].label ? ' \u00b7 ' + points[points.length-1].label : ''));
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

  function _togglePointLabel(idx) {
    if (idx < 0 || idx >= points.length) return;
    _pushUndo();
    points[idx].labelVisible = !points[idx].labelVisible;
    renderPoints();
  }


  /* ════════════════════════════════════════════════════════════════
     12. RENDER POINTS
     ════════════════════════════════════════════════════════════════ */
  function renderPoints() {
    if (!$pointsLayer) return;
    $pointsLayer.innerHTML = '';
    if (!imgLoaded) return;
    _measureImage();

    points.forEach(function (pt, i) {
      var dp = _toDisplay(pt.x, pt.y);

      /* ── hit target ── */
      var pin = document.createElement('div');
      pin.className  = 'bd-pin';
      pin.style.left = dp.x + 'px';
      pin.style.top  = dp.y + 'px';

      /* ── center dot ── */
      var dot = document.createElement('div');
      dot.className = 'bd-pin-dot';

      /* ── number badge ── */
      var num = document.createElement('div');
      num.className   = 'bd-pin-num';
      num.textContent = i + 1;

      pin.appendChild(dot);
      pin.appendChild(num);

      /* ── label tag (conditionally visible) ── */
      if (pt.label) {
        var lbl = document.createElement('div');
        lbl.className = 'bd-pin-label' +
          ((!labelsVisible || pt.labelVisible === false) ? ' bd-label-hidden' : '');
        lbl.textContent = pt.label;
        pin.appendChild(lbl);
      }

      /* ── events (IIFE captures index) ── */
      (function (idx) {
        pin.addEventListener('contextmenu', function (e) {
          e.preventDefault(); e.stopPropagation();
          _openCtxMenu(e.clientX, e.clientY, idx);
        });
        pin.addEventListener('mousedown', function (e) {
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

      $pointsLayer.appendChild(pin);
    });

    if ($countDisplay) $countDisplay.textContent = points.length + ' pin' + (points.length !== 1 ? 's' : '');
  }


  /* ════════════════════════════════════════════════════════════════
     13. GRID CANVAS
     ════════════════════════════════════════════════════════════════ */
  function resizeGridCanvas() {
    if (!$gridCanvas || !$img || !imgLoaded) return;
    var r = $img.getBoundingClientRect();
    $gridCanvas.width        = Math.round(r.width);
    $gridCanvas.height       = Math.round(r.height);
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
      gCtx.strokeStyle = 'rgba(197,160,89,0.32)';
      [1/3, 2/3].forEach(function (t) {
        gCtx.beginPath(); gCtx.moveTo(t*w,0); gCtx.lineTo(t*w,h); gCtx.stroke();
        gCtx.beginPath(); gCtx.moveTo(0,t*h); gCtx.lineTo(w,t*h); gCtx.stroke();
      });
    }
    if (gridMode === 'center' || gridMode === 'full') {
      gCtx.strokeStyle = 'rgba(77,184,255,0.38)';
      gCtx.beginPath(); gCtx.moveTo(w/2,0); gCtx.lineTo(w/2,h); gCtx.stroke();
      gCtx.beginPath(); gCtx.moveTo(0,h/2); gCtx.lineTo(w,h/2); gCtx.stroke();
    }
    if (gridMode === 'full') {
      gCtx.strokeStyle = 'rgba(197,160,89,0.08)';
      var step = Math.max(20, Math.round(Math.min(w,h) / 10));
      for (var x = 0; x <= w; x += step) { gCtx.beginPath(); gCtx.moveTo(x,0); gCtx.lineTo(x,h); gCtx.stroke(); }
      for (var y = 0; y <= h; y += step) { gCtx.beginPath(); gCtx.moveTo(0,y); gCtx.lineTo(w,y); gCtx.stroke(); }
    }
  }


  /* ════════════════════════════════════════════════════════════════
     14. CURSOR / CROSSHAIR CANVAS
         Design: gap-style precision sight — no full-span lines,
         just 4 short dashes pointing inward with a dot at centre.
         Size controlled by crosshairSize (scroll wheel).
     ════════════════════════════════════════════════════════════════ */
  function resizeCursorCanvas() {
    if (!$cursorCanvas || !$img || !imgLoaded) return;
    var r = $img.getBoundingClientRect();
    $cursorCanvas.width        = Math.round(r.width);
    $cursorCanvas.height       = Math.round(r.height);
    $cursorCanvas.style.width  = r.width  + 'px';
    $cursorCanvas.style.height = r.height + 'px';
  }

  function _renderCursor(lx, ly) {
    if (!cCtx || !imgLoaded) return;
    var w = $cursorCanvas.width, h = $cursorCanvas.height;
    cCtx.clearRect(0, 0, w, h);
    if (!showCrosshair) return;

    var R   = crosshairSize;   /* outer reach of each arm */
    var gap = 8;               /* gap around centre dot */

    cCtx.save();
    cCtx.strokeStyle = 'rgba(197,160,89,0.85)';
    cCtx.lineWidth   = 1;
    cCtx.setLineDash([]);

    /* 4 arms: top, bottom, left, right — each starts at gap, ends at R */
    /* Top arm */
    cCtx.beginPath(); cCtx.moveTo(lx, ly - gap); cCtx.lineTo(lx, Math.max(0, ly - R)); cCtx.stroke();
    /* Bottom arm */
    cCtx.beginPath(); cCtx.moveTo(lx, ly + gap); cCtx.lineTo(lx, Math.min(h, ly + R)); cCtx.stroke();
    /* Left arm */
    cCtx.beginPath(); cCtx.moveTo(lx - gap, ly); cCtx.lineTo(Math.max(0, lx - R), ly); cCtx.stroke();
    /* Right arm */
    cCtx.beginPath(); cCtx.moveTo(lx + gap, ly); cCtx.lineTo(Math.min(w, lx + R), ly); cCtx.stroke();

    /* Outer corner tick marks at R — small diagonals for precision feel */
    var tick = 5;
    cCtx.strokeStyle = 'rgba(197,160,89,0.45)';
    cCtx.lineWidth   = 1;
    /* Top-left */
    cCtx.beginPath(); cCtx.moveTo(lx - R, ly - tick); cCtx.lineTo(lx - R, ly); cCtx.lineTo(lx - R + tick, ly); cCtx.stroke();
    /* Top-right */
    cCtx.beginPath(); cCtx.moveTo(lx + R, ly - tick); cCtx.lineTo(lx + R, ly); cCtx.lineTo(lx + R - tick, ly); cCtx.stroke();
    /* Bottom-left */
    cCtx.beginPath(); cCtx.moveTo(lx - R, ly + tick); cCtx.lineTo(lx - R, ly); cCtx.lineTo(lx - R + tick, ly); cCtx.stroke();
    /* Bottom-right */
    cCtx.beginPath(); cCtx.moveTo(lx + R, ly + tick); cCtx.lineTo(lx + R, ly); cCtx.lineTo(lx + R - tick, ly); cCtx.stroke();

    /* Centre precision dot */
    cCtx.beginPath();
    cCtx.arc(lx, ly, 1.5, 0, Math.PI * 2);
    cCtx.fillStyle = 'rgba(255,255,255,0.95)';
    cCtx.fill();

    /* Size indicator — tiny label bottom-right of crosshair */
    cCtx.font        = '9px "Share Tech Mono", monospace';
    cCtx.fillStyle   = 'rgba(197,160,89,0.5)';
    cCtx.textAlign   = 'left';
    cCtx.textBaseline= 'top';
    cCtx.fillText('\u00d7' + (R*2), lx + R + 3, ly + 2);

    cCtx.restore();
  }


  /* ════════════════════════════════════════════════════════════════
     15. CONTEXT MENU
     ════════════════════════════════════════════════════════════════ */
  function _openCtxMenu(cx, cy, idx) {
    ctxTargetIdx = idx;
    ctxMenuOpen  = true;
    var mw = 175, mh = 165;
    $ctxMenu.style.left    = ((cx + mw > window.innerWidth)  ? cx - mw : cx) + 'px';
    $ctxMenu.style.top     = ((cy + mh > window.innerHeight) ? cy - mh : cy) + 'px';
    $ctxMenu.style.display = 'block';
    if ($ctxMoveUp) $ctxMoveUp.disabled = (idx === 0);
    if ($ctxMoveDn) $ctxMoveDn.disabled = (idx === points.length - 1);
    /* Show label visibility state */
    if ($ctxToggleLabel) {
      var pt = points[idx];
      $ctxToggleLabel.textContent = (pt && pt.labelVisible !== false) ? '\u25cc Hide Label' : '\u25cf Show Label';
    }
  }

  function _closeCtxMenu() {
    ctxMenuOpen  = false;
    ctxTargetIdx = -1;
    if ($ctxMenu) $ctxMenu.style.display = 'none';
  }

  function updateCtxMenuState() {
    _updateUndoBtns();
    var has = points.length > 0;
    if ($clearBtn)   $clearBtn.disabled   = !has;
    if ($exportCss)  $exportCss.disabled  = !has;
    if ($exportJson) $exportJson.disabled = !has;
    if ($exportAi)   $exportAi.disabled   = !has;
    if ($copyAll)    $copyAll.disabled    = !has;
  }


  /* ════════════════════════════════════════════════════════════════
     16. LABEL EDIT MODAL
     ════════════════════════════════════════════════════════════════ */
  function _openLabelModal(idx) {
    ctxTargetIdx = idx;
    if (!$labelModal) return;
    $labelInput.value = (idx >= 0 && points[idx]) ? (points[idx].label || '') : '';
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
    }
    _closeLabelModal();
  }


  /* ════════════════════════════════════════════════════════════════
     17. LABEL IMPORT MODAL
     ════════════════════════════════════════════════════════════════ */
  function _openImportModal() {
    if (!$importModal) return;
    $importTextarea.value = labelPresets.length ? JSON.stringify(labelPresets, null, 2) : '';
    $importStatus.textContent = labelPresets.length
      ? labelPresets.length + ' preset' + (labelPresets.length !== 1 ? 's' : '') + ' currently loaded'
      : '';
    $importModal.style.display = 'flex';
    setTimeout(function () { $importTextarea.focus(); }, 50);
  }

  function _closeImportModal() {
    if ($importModal) $importModal.style.display = 'none';
  }

  function _applyImportedLabels() {
    var raw = $importTextarea ? $importTextarea.value.trim() : '';
    if (!raw) { $importStatus.textContent = '\u26a0 Nothing to parse.'; return; }

    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Expected a JSON array');
      /* Normalise to strings */
      labelPresets = parsed.map(function (item) { return String(item).trim(); });

      /* Apply to existing points in order */
      if (points.length) {
        _pushUndo();
        points.forEach(function (pt, i) {
          if (i < labelPresets.length) pt.label = labelPresets[i];
        });
        renderPoints();
      }

      $importStatus.textContent = '\u2713 ' + labelPresets.length + ' label' + (labelPresets.length !== 1 ? 's' : '') + ' loaded. Future pins auto-labelled.';
      _setStatus('Labels imported: ' + labelPresets.length);
    } catch (err) {
      $importStatus.textContent = '\u26a0 Invalid JSON: ' + err.message;
    }
  }


  /* ════════════════════════════════════════════════════════════════
     18. EXPORT
     ════════════════════════════════════════════════════════════════ */
  function _buildCss() {
    if (!points.length) return '/* No points plotted */';
    var lines = ['/* Bulls-Eye Ducky Export · ' + imgNatW + '\u00d7' + imgNatH + ' */'];
    points.forEach(function (pt, i) {
      var comment = pt.label ? ' /* ' + pt.label + ' */' : '';
      lines.push('.point-' + (i+1) + ' { left: ' + pt.x + 'px; top: ' + pt.y + 'px; }' + comment);
    });
    return lines.join('\n');
  }

  function _buildJson() {
    return JSON.stringify({
      source: 'Bulls-Eye Ducky v51',
      naturalSize: { width: imgNatW, height: imgNatH },
      points: points.map(function (pt, i) {
        return { index: i+1, x: pt.x, y: pt.y, label: pt.label || '' };
      })
    }, null, 2);
  }

  function _buildAi() {
    return [
      'Image dimensions: ' + imgNatW + ' \u00d7 ' + imgNatH + ' px (natural)',
      'Coordinate origin: top-left (0, 0)',
      'Total pins: ' + points.length,
      ''
    ].concat(points.map(function (pt, i) {
      return '  ' + (i+1) + '. x=' + pt.x + ', y=' + pt.y + (pt.label ? '  [' + pt.label + ']' : '');
    })).concat([
      '',
      'Use these coordinates for CSS absolute positioning,',
      'SVG viewBox placement, canvas drawImage, or spatial AI prompting.'
    ]).join('\n');
  }

  function _showOutput(text) {
    if (!$outputBox) return;
    $outputBox.value = text;
    $outputBox.parentElement.style.display = 'block';
    $outputBox.focus();
    $outputBox.select();
  }

  function _copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () { _setStatus('\u2713 Copied to clipboard'); })
        .catch(function () { _fallbackCopy(text); });
    } else { _fallbackCopy(text); }
  }

  function _fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value    = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;width:1px;height:1px';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); _setStatus('\u2713 Copied'); } catch(e){}
    document.body.removeChild(ta);
  }

  function _setStatus(msg) {
    if ($statusMsg) $statusMsg.textContent = msg;
  }


  /* ════════════════════════════════════════════════════════════════
     19. DROP ZONE — file drag & click-to-browse
     ════════════════════════════════════════════════════════════════ */
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
    $fileInput.value = '';
  });


  /* ════════════════════════════════════════════════════════════════
     20. URL LOAD
     ════════════════════════════════════════════════════════════════ */
  $loadUrlBtn.addEventListener('click', function () {
    var url = $urlInput.value.trim();
    if (url) loadImageSrc(url);
  });
  $urlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $loadUrlBtn.click();
  });


  /* ════════════════════════════════════════════════════════════════
     21. LABELS FILE IMPORT
     ════════════════════════════════════════════════════════════════ */
  $importLabelsBtn.addEventListener('click', function () { _openImportModal(); });

  $labelsFileInput.addEventListener('change', function () {
    var f = $labelsFileInput.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function (ev) {
      if ($importTextarea) $importTextarea.value = ev.target.result;
      _openImportModal();
    };
    r.readAsText(f);
    $labelsFileInput.value = '';
  });

  if ($importApply)  $importApply.addEventListener('click',  _applyImportedLabels);
  if ($importClear)  $importClear.addEventListener('click',  function () {
    labelPresets = [];
    $importStatus.textContent = 'Presets cleared.';
    _setStatus('Label presets cleared');
  });
  if ($importCancel) $importCancel.addEventListener('click', _closeImportModal);


  /* ════════════════════════════════════════════════════════════════
     22. IMAGE MOUSE EVENTS
     ════════════════════════════════════════════════════════════════ */
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
    if (e.target.closest && e.target.closest('.bd-pin')) return;
    if (ctxMenuOpen) { _closeCtxMenu(); return; }

    var c  = _toNatural(e.clientX, e.clientY);
    var nx = c.x, ny = c.y;

    if (snapToGrid && imgNatW > 0) {
      var step = Math.max(1, Math.round(Math.min(imgNatW, imgNatH) / 10));
      nx = Math.round(nx / step) * step;
      ny = Math.round(ny / step) * step;
    }
    _addPoint(nx, ny);
  });

  $imageArea.addEventListener('contextmenu', function (e) { e.preventDefault(); _closeCtxMenu(); });

  /* ── Scroll wheel → resize crosshair ── */
  $imageArea.addEventListener('wheel', function (e) {
    if (!imgLoaded) return;
    e.preventDefault();
    var delta = e.deltaY > 0 ? -8 : 8;
    crosshairSize = Math.max(CROSS_MIN, Math.min(CROSS_MAX, crosshairSize + delta));
    /* Re-render cursor at last known position */
    var r  = $img.getBoundingClientRect();
    var lx = e.clientX - r.left;
    var ly = e.clientY - r.top;
    if (lx >= 0 && ly >= 0 && lx <= r.width && ly <= r.height) _renderCursor(lx, ly);
    _setStatus('Crosshair size: ' + (crosshairSize * 2) + 'px');
  }, { passive: false });


  /* ════════════════════════════════════════════════════════════════
     23. DRAG MOVE / UP  (document-level so drag can leave image)
     ════════════════════════════════════════════════════════════════ */
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


  /* ════════════════════════════════════════════════════════════════
     24. CONTEXT MENU ACTIONS
     ════════════════════════════════════════════════════════════════ */
  if ($ctxDelete)      $ctxDelete.addEventListener('click',      function () { _deletePoint(ctxTargetIdx);      _closeCtxMenu(); });
  if ($ctxLabel)       $ctxLabel.addEventListener('click',       function () { var i = ctxTargetIdx; _closeCtxMenu(); _openLabelModal(i); });
  if ($ctxToggleLabel) $ctxToggleLabel.addEventListener('click', function () { _togglePointLabel(ctxTargetIdx); _closeCtxMenu(); });
  if ($ctxMoveUp)      $ctxMoveUp.addEventListener('click',      function () { _movePointUp(ctxTargetIdx);      _closeCtxMenu(); });
  if ($ctxMoveDn)      $ctxMoveDn.addEventListener('click',      function () { _movePointDown(ctxTargetIdx);    _closeCtxMenu(); });


  /* ════════════════════════════════════════════════════════════════
     25. TOOLBAR ACTIONS
     ════════════════════════════════════════════════════════════════ */
  /* Clear all pins */
  if ($clearBtn) $clearBtn.addEventListener('click', function () {
    if (!points.length) return;
    _pushUndo(); points = [];
    renderPoints(); updateCtxMenuState();
    _setStatus('All pins cleared');
  });

  /* Undo / Redo */
  if ($undoBtn) $undoBtn.addEventListener('click', doUndo);
  if ($redoBtn) $redoBtn.addEventListener('click', doRedo);

  /* New Image */
  if ($resetImg) $resetImg.addEventListener('click', function () {
    imgLoaded = false; points = []; undoStack = []; redoStack = [];
    $img.src = '';
    $imageArea.style.display = 'none';
    $dropZone.style.display  = 'flex';
    if ($outputBox) $outputBox.parentElement.style.display = 'none';
    renderPoints(); updateCtxMenuState();
    _setStatus('Ready \u00b7 Drop or browse an image');
    if (root.VJ && root.VJ.updateHUD) root.VJ.updateHUD(0, 0);
    if (root.VJ && root.VJ.updateRes) root.VJ.updateRes(0, 0);
  });

  /* Grid cycle */
  if ($gridBtn) $gridBtn.addEventListener('click', function () {
    var modes  = ['none', 'rule3', 'center', 'full'];
    var labels = { none:'Grid: Off', rule3:'Grid: \u2153', center:'Grid: \u271a', full:'Grid: All' };
    gridMode = modes[(modes.indexOf(gridMode) + 1) % modes.length];
    $gridBtn.textContent = labels[gridMode];
    renderGrid();
  });

  /* Snap toggle */
  if ($snapBtn) $snapBtn.addEventListener('click', function () {
    snapToGrid = !snapToGrid;
    $snapBtn.classList.toggle('bd-btn-active', snapToGrid);
    _setStatus('Grid snap: ' + (snapToGrid ? 'ON' : 'OFF'));
  });

  /* Crosshair toggle */
  if ($crossBtn) $crossBtn.addEventListener('click', function () {
    showCrosshair = !showCrosshair;
    $crossBtn.classList.toggle('bd-btn-active', showCrosshair);
    if (!showCrosshair && cCtx) cCtx.clearRect(0, 0, $cursorCanvas.width, $cursorCanvas.height);
    _setStatus('Crosshair: ' + (showCrosshair ? 'ON' : 'OFF'));
  });

  /* Global labels toggle */
  if ($labelsBtn) $labelsBtn.addEventListener('click', function () {
    labelsVisible = !labelsVisible;
    $labelsBtn.classList.toggle('bd-btn-active', labelsVisible);
    renderPoints();
    _setStatus('Labels: ' + (labelsVisible ? 'Visible' : 'Hidden'));
  });
  /* Start with labels button active */
  if ($labelsBtn) $labelsBtn.classList.add('bd-btn-active');


  /* ════════════════════════════════════════════════════════════════
     26. EXPORT BUTTONS
     ════════════════════════════════════════════════════════════════ */
  if ($exportCss)  $exportCss.addEventListener('click',  function () { _showOutput(_buildCss());  _setStatus('CSS \u00b7 ' + points.length + ' rule' + (points.length !== 1 ? 's' : '') + ' ready'); });
  if ($exportJson) $exportJson.addEventListener('click', function () { _showOutput(_buildJson()); _setStatus('JSON \u00b7 ' + points.length + ' pin' + (points.length !== 1 ? 's' : '') + ' exported'); });
  if ($exportAi)   $exportAi.addEventListener('click',   function () { _showOutput(_buildAi());  _setStatus('AI prompt ready'); });
  if ($copyAll)    $copyAll.addEventListener('click',    function () {
    var text = ($outputBox && $outputBox.value) ? $outputBox.value : _buildJson();
    _copyToClipboard(text);
  });


  /* ════════════════════════════════════════════════════════════════
     27. LABEL EDIT MODAL BUTTONS
     ════════════════════════════════════════════════════════════════ */
  if ($labelSave)   $labelSave.addEventListener('click',   _saveLabelModal);
  if ($labelCancel) $labelCancel.addEventListener('click', _closeLabelModal);
  if ($labelInput)  $labelInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter')  _saveLabelModal();
    if (e.key === 'Escape') _closeLabelModal();
  });


  /* ════════════════════════════════════════════════════════════════
     28. KEYBOARD SHORTCUTS
     ════════════════════════════════════════════════════════════════ */
  document.addEventListener('keydown', function (e) {
    if (!_mountEl.classList.contains('vj-mod--active')) return;
    /* Undo */
    if ((e.ctrlKey||e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); return; }
    /* Redo */
    if ((e.ctrlKey||e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); doRedo(); return; }
    /* Delete last pin */
    if ((e.key === 'Backspace' || e.key === 'Delete') && !e.target.matches('input,textarea,select')) {
      if (points.length) _deletePoint(points.length - 1);
    }
    /* L = toggle labels */
    if (e.key.toLowerCase() === 'l' && !e.target.matches('input,textarea,select')) {
      if ($labelsBtn) $labelsBtn.click();
    }
    /* Escape */
    if (e.key === 'Escape') { _closeCtxMenu(); _closeLabelModal(); _closeImportModal(); }
  });


  /* ════════════════════════════════════════════════════════════════
     29. WINDOW RESIZE
     ════════════════════════════════════════════════════════════════ */
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


  /* ════════════════════════════════════════════════════════════════
     30. EXPOSE GLOBALS  (VJ shell calls these post-load)
     ════════════════════════════════════════════════════════════════ */
  root.resizeGridCanvas   = resizeGridCanvas;
  root.resizeCursorCanvas = resizeCursorCanvas;
  root.renderPoints       = renderPoints;
  root.updateCtxMenuState = updateCtxMenuState;

  root.BeDucky = {
    getPoints    : function () { return points.slice(); },
    loadImage    : loadImageSrc,
    clearPoints  : function () { _pushUndo(); points = []; renderPoints(); updateCtxMenuState(); },
    setPresets   : function (arr) { labelPresets = Array.isArray(arr) ? arr.map(String) : []; }
  };


  /* ════════════════════════════════════════════════════════════════
     31. INIT
     ════════════════════════════════════════════════════════════════ */
  updateCtxMenuState();
  _setStatus('Ready \u00b7 Drop an image to begin \u00b7 Scroll wheel = crosshair size');
  console.log('[BeDucky] v51 mounted OK.');

}(window));
