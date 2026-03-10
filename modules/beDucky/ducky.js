/* ============================================================
   BE DUCKY  v53  —  Vibe Jiver Module
   NEW in v53:
     · Label panel EXPANDED mode — ⤢ button blows panel up to
       340px with large 13px inputs for easy typing; ⤡ collapses back
     · Label panel COLLAPSIBLE — ◀ collapses panel to icon rail;
       ▶ expands back
     · Right-click context menu is now a full shortcut reference:
       every item shows its keyboard shortcut key
     · Panel font sizes bumped — normal 11px, expanded 13px
     · All v52 features preserved
   ============================================================ */
(function (root) {
  'use strict';

  var MAX_LABELS = 20;

  /* ════════════════════════════════════════════════════════════════
     AI MEET DUCKY system prompt
     ════════════════════════════════════════════════════════════════ */
  var DUCKY_SYSTEM_PROMPT = [
    '# BULLS-EYE DUCKY — Coordinate Plotter · System Context',
    '',
    'I use a tool called **Bulls-Eye Ducky** (part of Vibe Jiver Studio) to plot',
    'precise pixel coordinates on images. Here is how it works so you can collaborate',
    'with me directly:',
    '',
    '## How It Works',
    '- I load an image (PNG/JPG/WebP/SVG/GIF) into the plotter.',
    '- I click on the image to drop numbered **pins** at exact pixel positions.',
    '- Every pin records: { index, x, y, label } where x/y are natural pixel coords',
    '  from the top-left origin (0,0).',
    '- The image natural size (width × height in px) is always included in exports.',
    '',
    '## Label System',
    '- Each pin slot (1–20) can have a pre-assigned label.',
    '- **Live Label Mode ON**: as I place pins they auto-receive the label from the',
    '  matching numbered slot.',
    '- **Live Label Mode OFF**: pins are unlabelled until I manually assign them.',
    '- I can import a label list from you as a JSON array OR plain numbered text.',
    '',
    '## How You Can Help Me',
    '',
    '### Send me labels (I paste them in, they auto-apply as I pin):',
    'Return a JSON array like:',
    '["left eye", "right eye", "nose tip", "mouth center", "chin"]',
    '',
    'Or plain numbered text:',
    '1. Left eye',
    '2. Right eye',
    '3. Nose tip',
    '',
    '### I send you coordinates (you use them for layout/code/AI):',
    'I will export a block like this:',
    '',
    'Image: 1200 × 800 px',
    'Pins:',
    '  1. x=340, y=210  [left eye]',
    '  2. x=580, y=210  [right eye]',
    '  3. x=460, y=310  [nose tip]',
    '',
    '## Export Formats',
    '- **CSS**: `.point-N { left: Xpx; top: Ypx; } /* label */`',
    '- **JSON**: structured object with naturalSize + points array',
    '- **AI Prompt**: human-readable block ready to paste into any chat',
    '',
    '## Key Rules',
    '- Coordinates are NATURAL pixel values (not scaled/display px).',
    '- Pin numbers are 1-indexed and match the label slot numbers.',
    '- Labels are optional but make exports dramatically more useful.',
    '- When you provide label lists, number them 1–N to match my pin order.',
    '',
    '---',
    'You now understand Bulls-Eye Ducky. When I share coordinates or ask you to',
    'provide labels, use the formats above. Ready to collaborate.'
  ].join('\n');


  /* ════════════════════════════════════════════════════════════════
     1. HTML — label rows
     ════════════════════════════════════════════════════════════════ */
  var _labelRows = [];
  for (var _ri = 1; _ri <= MAX_LABELS; _ri++) {
    _labelRows.push(
      '<div class="bd-lp-row" id="bd-lp-row-' + _ri + '" data-slot="' + _ri + '">' +
      '  <span class="bd-lp-num">' + _ri + '</span>' +
      '  <input type="text" class="bd-lp-input" id="bd-lp-input-' + _ri + '"' +
      '    placeholder="label ' + _ri + '" maxlength="48" spellcheck="false">' +
      '  <span class="bd-lp-dot" id="bd-lp-dot-' + _ri + '"></span>' +
      '</div>'
    );
  }

  var _MODULE_HTML = [
    '<div id="bd-wrap">',

    /* ── TOP TOOLBAR ── */
    '  <div class="bd-toolbar">',
    '    <div class="bd-toolbar-left">',
    '      <span class="bd-module-badge">&#127919; BULLS-EYE DUCKY</span>',
    '      <button class="bd-btn" id="bd-reset-img"  title="New image">&#8617; New Image</button>',
    '      <button class="bd-btn" id="bd-undo-btn"   disabled title="Undo (Ctrl+Z)">&#8630; Undo</button>',
    '      <button class="bd-btn" id="bd-redo-btn"   disabled title="Redo (Ctrl+Y)">&#8631; Redo</button>',
    '      <button class="bd-btn" id="bd-clear-btn"  disabled title="Clear all pins (X)">&#10005; Clear</button>',
    '    </div>',
    '    <div class="bd-toolbar-center">',
    '      <span class="bd-coord-pill" id="bd-coord-display">&#8212;, &#8212;</span>',
    '      <span class="bd-count-pill" id="bd-count-display">0 pins</span>',
    '    </div>',
    '    <div class="bd-toolbar-right">',
    '      <button class="bd-btn bd-btn-active" id="bd-cross-btn"  title="Toggle crosshair (C)">&#10011; Cross</button>',
    '      <button class="bd-btn bd-btn-active" id="bd-live-btn"   title="Live Label Mode (V)">&#9673; Live</button>',
    '      <button class="bd-btn bd-btn-active" id="bd-labels-btn" title="Show/hide labels (L)">&#9673; Labels</button>',
    '      <button class="bd-btn"               id="bd-grid-btn"   title="Cycle grid (G)">Grid: Off</button>',
    '      <button class="bd-btn"               id="bd-snap-btn"   title="Snap to grid (S)">&#8862; Snap</button>',
    '    </div>',
    '  </div>',

    /* ── URL BAR ── */
    '  <div class="bd-url-bar">',
    '    <input type="text" id="bd-url-input" class="bd-url-input"',
    '      placeholder="Paste image URL then Enter or Load"',
    '      spellcheck="false" autocomplete="off">',
    '    <button class="bd-btn bd-btn-gold" id="bd-load-url-btn">Load</button>',
    '    <input type="file" id="bd-file-input" accept="image/*" style="display:none">',
    '    <div class="bd-url-spacer"></div>',
    '    <button class="bd-btn bd-btn-ai" id="bd-ai-meet-btn" title="Copy AI onboarding prompt">&#129302; AI Meet Ducky</button>',
    '  </div>',

    /* ── BODY ── */
    '  <div class="bd-body">',

    /* canvas */
    '    <div class="bd-canvas-area">',
    '      <div class="bd-drop-zone" id="bd-drop-zone">',
    '        <div class="bd-drop-icon">&#127919;</div>',
    '        <div class="bd-drop-title">Drop Image Here</div>',
    '        <div class="bd-drop-sub">or click to browse &middot; PNG JPG GIF WebP SVG</div>',
    '        <div class="bd-drop-hint">Scroll = crosshair size &middot; Right-click pin = full menu</div>',
    '      </div>',
    '      <div class="bd-image-area" id="bd-image-area" style="display:none">',
    '        <div class="bd-image-wrap vj-artwork">',
    '          <img id="bd-main-img" class="bd-main-img vj-artwork__img" alt="target" draggable="false">',
    '          <canvas id="bd-grid-canvas"   class="bd-canvas-overlay bd-grid-canvas"></canvas>',
    '          <canvas id="bd-cursor-canvas" class="bd-canvas-overlay bd-cursor-canvas"></canvas>',
    '          <div    id="bd-points-layer"  class="bd-points-layer"></div>',
    '        </div>',
    '      </div>',
    '    </div>',

    /* ── LABEL PANEL ── */
    '    <div class="bd-label-panel" id="bd-label-panel">',

    /* panel header row */
    '      <div class="bd-lp-header">',
    '        <span class="bd-lp-title" id="bd-lp-title-txt">&#9998; LABELS</span>',
    '        <button class="bd-btn bd-btn-lp-sm" id="bd-lp-expand-btn"   title="Expand panel for easier typing (E)">&#10070;</button>',
    '        <button class="bd-btn bd-btn-lp-sm" id="bd-lp-collapse-btn" title="Collapse panel (&#9664;)">&#9664;</button>',
    '      </div>',

    /* live mode row */
    '      <div class="bd-lp-mode-row" id="bd-lp-mode-row">',
    '        <span class="bd-lp-mode-label">LIVE</span>',
    '        <button class="bd-btn bd-btn-active bd-btn-lp-toggle" id="bd-lp-live-toggle" title="Toggle live labelling (V)">ON</button>',
    '        <button class="bd-btn bd-btn-lp-sm bd-btn-lp-import"  id="bd-lp-import-btn"  title="Import labels (JSON or text)">&#8659;</button>',
    '        <button class="bd-btn bd-btn-lp-sm bd-btn-lp-clr"     id="bd-lp-clear-btn"   title="Clear all slots">&#10005;</button>',
    '      </div>',

    /* list */
    '      <div class="bd-lp-list" id="bd-lp-list">',
           _labelRows.join(''),
    '      </div>',

    /* collapsed rail (hidden by default) */
    '      <div class="bd-lp-rail" id="bd-lp-rail" style="display:none">',
    '        <button class="bd-btn bd-btn-rail" id="bd-lp-expand-rail" title="Expand labels (E)">&#9654;<br><span>L<br>A<br>B<br>E<br>L<br>S</span></button>',
    '      </div>',

    '    </div>', /* end .bd-label-panel */
    '  </div>',  /* end .bd-body */

    /* ── EXPORT BAR ── */
    '  <div class="bd-export-bar">',
    '    <span class="bd-export-label">EXPORT:</span>',
    '    <button class="bd-btn bd-btn-export" id="bd-export-css"  disabled>CSS</button>',
    '    <button class="bd-btn bd-btn-export" id="bd-export-json" disabled>JSON</button>',
    '    <button class="bd-btn bd-btn-export" id="bd-export-ai"   disabled>AI Prompt</button>',
    '    <button class="bd-btn bd-btn-gold"   id="bd-copy-all"    disabled>&#9000; Copy</button>',
    '    <span class="bd-status-pill" id="bd-status">Ready</span>',
    '  </div>',

    /* ── OUTPUT BOX ── */
    '  <div class="bd-output-wrap" style="display:none">',
    '    <textarea id="bd-output" class="bd-output" spellcheck="false" readonly></textarea>',
    '  </div>',

    /* ══════════════════════════════════════════════════════════════
       RIGHT-CLICK CONTEXT MENU  — full shortcut reference
       ══════════════════════════════════════════════════════════════ */
    '  <div id="bd-ctx-menu" class="bd-ctx-menu" style="display:none">',

    /* pin-specific */
    '    <div class="bd-ctx-section-lbl">PIN</div>',
    '    <button class="bd-ctx-item" id="bd-ctx-delete">',
    '      <span class="bd-ctx-icon">&#10005;</span> Delete Pin',
    '      <span class="bd-ctx-key">Del</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-label">',
    '      <span class="bd-ctx-icon">&#9998;</span> Edit Label',
    '      <span class="bd-ctx-key">dbl&#8209;clk</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-toggle-label">',
    '      <span class="bd-ctx-icon">&#9673;</span> Toggle Label',
    '      <span class="bd-ctx-key">&nbsp;</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-moveup">',
    '      <span class="bd-ctx-icon">&#8593;</span> Move Up',
    '      <span class="bd-ctx-key">&nbsp;</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-movedn">',
    '      <span class="bd-ctx-icon">&#8595;</span> Move Down',
    '      <span class="bd-ctx-key">&nbsp;</span>',
    '    </button>',

    '    <div class="bd-ctx-sep"></div>',

    /* mode toggles */
    '    <div class="bd-ctx-section-lbl">MODES</div>',
    '    <button class="bd-ctx-item bd-ctx-live-item" id="bd-ctx-live-toggle">',
    '      <span class="bd-ctx-icon">&#9673;</span> Live Label: ON',
    '      <span class="bd-ctx-key">V</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-labels-vis">',
    '      <span class="bd-ctx-icon">&#9673;</span> Labels: Visible',
    '      <span class="bd-ctx-key">L</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-crosshair">',
    '      <span class="bd-ctx-icon">&#10011;</span> Crosshair: On',
    '      <span class="bd-ctx-key">C</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-grid">',
    '      <span class="bd-ctx-icon">&#9638;</span> Grid: Off',
    '      <span class="bd-ctx-key">G</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-snap">',
    '      <span class="bd-ctx-icon">&#8862;</span> Snap: Off',
    '      <span class="bd-ctx-key">S</span>',
    '    </button>',

    '    <div class="bd-ctx-sep"></div>',

    /* history */
    '    <div class="bd-ctx-section-lbl">HISTORY</div>',
    '    <button class="bd-ctx-item" id="bd-ctx-undo">',
    '      <span class="bd-ctx-icon">&#8630;</span> Undo',
    '      <span class="bd-ctx-key">Ctrl+Z</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-redo">',
    '      <span class="bd-ctx-icon">&#8631;</span> Redo',
    '      <span class="bd-ctx-key">Ctrl+Y</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-clear-pins">',
    '      <span class="bd-ctx-icon">&#9108;</span> Clear All Pins',
    '      <span class="bd-ctx-key">X</span>',
    '    </button>',

    '    <div class="bd-ctx-sep"></div>',

    /* export shortcuts */
    '    <div class="bd-ctx-section-lbl">EXPORT</div>',
    '    <button class="bd-ctx-item" id="bd-ctx-exp-ai">',
    '      <span class="bd-ctx-icon">&#129302;</span> AI Prompt',
    '      <span class="bd-ctx-key">A</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-exp-json">',
    '      <span class="bd-ctx-icon">{ }</span> JSON',
    '      <span class="bd-ctx-key">J</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-exp-css">',
    '      <span class="bd-ctx-icon">#</span> CSS',
    '      <span class="bd-ctx-key">K</span>',
    '    </button>',

    '  </div>',

    /* ── LABEL EDIT MODAL ── */
    '  <div id="bd-label-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal">',
    '      <div class="bd-modal-title">&#9998; Edit Pin Label</div>',
    '      <input type="text" id="bd-label-input" class="bd-modal-input"',
    '        placeholder="e.g. left eye, CTA button, hero anchor" maxlength="60" spellcheck="false">',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-label-save">Save</button>',
    '        <button class="bd-btn"             id="bd-label-cancel">Cancel</button>',
    '      </div>',
    '    </div>',
    '  </div>',

    /* ── IMPORT MODAL ── */
    '  <div id="bd-import-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal bd-modal-wide">',
    '      <div class="bd-modal-title">&#8659; Import Label List</div>',
    '      <div class="bd-modal-desc">Paste a JSON array <em>or</em> numbered plain text. Labels fill slots 1&ndash;20. AI can generate this list &mdash; just ask.</div>',
    '      <textarea id="bd-import-textarea" class="bd-modal-textarea"',
    '        placeholder=\'["left eye", "right eye", "nose tip"]\nor:\n1. Left eye\n2. Right eye\'',
    '        spellcheck="false"></textarea>',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-import-apply">Apply to Slots</button>',
    '        <button class="bd-btn"             id="bd-import-clear">Clear All Slots</button>',
    '        <button class="bd-btn"             id="bd-import-cancel">Cancel</button>',
    '      </div>',
    '      <div class="bd-modal-hint" id="bd-import-status"></div>',
    '    </div>',
    '  </div>',

    /* ── AI MEET DUCKY MODAL ── */
    '  <div id="bd-ai-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal bd-modal-wide">',
    '      <div class="bd-modal-title">&#129302; AI Meet Ducky</div>',
    '      <div class="bd-modal-desc">Paste this into any AI chat (ChatGPT, Claude, Gemini…) and the AI instantly knows how to collaborate with your coordinate plotter.</div>',
    '      <textarea id="bd-ai-prompt-box" class="bd-modal-textarea bd-modal-textarea-tall"',
    '        spellcheck="false" readonly></textarea>',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-ai-copy-btn">&#9000; Copy Prompt</button>',
    '        <button class="bd-btn"             id="bd-ai-cancel-btn">Close</button>',
    '      </div>',
    '      <div class="bd-modal-hint" id="bd-ai-status"></div>',
    '    </div>',
    '  </div>',

    '</div>'
  ].join('\n');


  /* ════════════════════════════════════════════════════════════════
     2. DUCK IMAGE
     ════════════════════════════════════════════════════════════════ */
  if (typeof DUCK_IMG === 'undefined') {
    var _s = (document.currentScript || {}).src || '';
    var _d = _s.substring(0, _s.lastIndexOf('/') + 1);
    root.DUCK_IMG = _d ? (_d + '../../ducky.png') : './ducky.png';
  }


  /* ════════════════════════════════════════════════════════════════
     3. INLINE CSS
     ════════════════════════════════════════════════════════════════ */
  (function () {
    if (document.getElementById('bd-ducky-inline')) return;
    var st = document.createElement('style');
    st.id  = 'bd-ducky-inline';
    st.textContent = [

      '#bd-module-root{display:block;height:100%}',
      '#bd-wrap{display:flex;flex-direction:column;height:100%;background:#000;color:#d8d8d8;font-family:"Rajdhani","Share Tech Mono",sans-serif;overflow:hidden;position:relative}',

      /* toolbar */
      '.bd-toolbar{display:flex;align-items:center;gap:7px;padding:5px 12px;background:#080808;border-bottom:1px solid #1e1e1e;flex-shrink:0;flex-wrap:wrap}',
      '.bd-toolbar-left,.bd-toolbar-right{display:flex;gap:5px;align-items:center}',
      '.bd-toolbar-center{flex:1;display:flex;justify-content:center;align-items:center;gap:10px}',
      '.bd-module-badge{font-family:"Oswald",sans-serif;font-size:.72rem;font-weight:700;color:#c5a059;letter-spacing:3px;text-transform:uppercase;padding-right:10px;border-right:1px solid #222;margin-right:4px;white-space:nowrap}',

      /* buttons */
      '.bd-btn{background:#0d0d0d;border:1px solid #222;color:#888;font-family:"Share Tech Mono",monospace;font-size:.65rem;letter-spacing:1px;padding:4px 10px;border-radius:2px;cursor:pointer;transition:all .15s;white-space:nowrap;text-transform:uppercase;line-height:1.4}',
      '.bd-btn:hover:not(:disabled){background:#141414;border-color:#333;color:#c5a059}',
      '.bd-btn:disabled{opacity:.28;cursor:not-allowed}',
      '.bd-btn-active{border-color:#c5a059 !important;color:#c5a059 !important;background:rgba(197,160,89,.06) !important}',
      '.bd-btn-gold{background:rgba(197,160,89,.08);border-color:rgba(197,160,89,.3);color:#c5a059}',
      '.bd-btn-gold:hover:not(:disabled){background:rgba(197,160,89,.18)}',
      '.bd-btn-ai{background:rgba(100,180,255,.06);border-color:rgba(100,180,255,.25);color:#6ab4ff;font-weight:700}',
      '.bd-btn-ai:hover:not(:disabled){background:rgba(100,180,255,.14);color:#90caff}',
      '.bd-btn-export{min-width:46px}',

      /* small panel buttons */
      '.bd-btn-lp-sm{padding:2px 6px;font-size:.58rem;line-height:1.3;border-radius:2px}',
      '.bd-btn-lp-toggle{font-size:.65rem;padding:2px 10px;min-width:38px;text-align:center}',
      '.bd-btn-lp-import{background:rgba(77,184,255,.06);border-color:rgba(77,184,255,.2);color:#4db8ff}',
      '.bd-btn-lp-import:hover{background:rgba(77,184,255,.14) !important;color:#80d4ff !important}',
      '.bd-btn-lp-clr{background:rgba(255,60,60,.04);border-color:rgba(255,60,60,.15);color:#664444}',
      '.bd-btn-lp-clr:hover{color:#ff5555 !important;border-color:rgba(255,60,60,.35) !important}',
      '.bd-btn-rail{width:100%;background:none;border:none;color:#333;font-family:"Share Tech Mono",monospace;font-size:.52rem;letter-spacing:1.5px;cursor:pointer;padding:14px 0 8px;text-align:center;line-height:1.8;transition:color .15s}',
      '.bd-btn-rail:hover{color:#c5a059}',

      /* pills */
      '.bd-coord-pill,.bd-count-pill{font-family:"Share Tech Mono",monospace;font-size:.7rem;letter-spacing:1.5px;padding:3px 10px;border-radius:2px;border:1px solid #1e1e1e;background:#080808;color:#c5a059;white-space:nowrap}',
      '.bd-count-pill{color:#4db8ff;border-color:rgba(77,184,255,.15)}',
      '.bd-status-pill{font-family:"Share Tech Mono",monospace;font-size:.63rem;letter-spacing:.7px;color:#3a3a3a;white-space:nowrap;margin-left:auto;overflow:hidden;text-overflow:ellipsis;max-width:340px}',

      /* url bar */
      '.bd-url-bar{display:flex;gap:6px;padding:5px 12px;background:#080808;border-bottom:1px solid #181818;flex-shrink:0;align-items:center}',
      '.bd-url-input{flex:1;background:#0a0a0a;border:1px solid #222;color:#c5a059;font-family:"Share Tech Mono",monospace;font-size:.68rem;padding:5px 10px;border-radius:2px;outline:none;letter-spacing:.5px;min-width:0}',
      '.bd-url-input:focus{border-color:rgba(197,160,89,.5);box-shadow:0 0 0 1px rgba(197,160,89,.1)}',
      '.bd-url-input::placeholder{color:#2a2a2a}',
      '.bd-url-spacer{flex:0 0 6px}',

      /* body */
      '.bd-body{flex:1;display:flex;min-height:0;overflow:hidden}',

      /* canvas area */
      '.bd-canvas-area{flex:1;position:relative;overflow:auto;background:#050505;display:flex;align-items:center;justify-content:center;min-height:0;min-width:0}',
      '.bd-drop-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;width:100%;height:100%;border:2px dashed #1a1a1a;border-radius:4px;cursor:pointer;transition:border-color .2s,background .2s;position:absolute;inset:0}',
      '.bd-drop-zone:hover,.bd-drag-over{border-color:rgba(197,160,89,.4);background:rgba(197,160,89,.03)}',
      '.bd-drop-icon{font-size:2.6rem;opacity:.3;pointer-events:none}',
      '.bd-drop-title{font-family:"Oswald",sans-serif;font-size:.95rem;color:#3e3e3e;letter-spacing:3px;text-transform:uppercase;pointer-events:none}',
      '.bd-drop-sub{font-family:"Share Tech Mono",monospace;font-size:.55rem;color:#282828;letter-spacing:1px;pointer-events:none}',
      '.bd-drop-hint{font-family:"Share Tech Mono",monospace;font-size:.48rem;color:#1e1e1e;letter-spacing:.5px;pointer-events:none}',
      '.bd-image-area{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:absolute;inset:0;overflow:auto;padding:12px}',
      '.bd-image-wrap{position:relative;display:inline-block;cursor:none;max-width:100%;max-height:100%;flex-shrink:0}',
      '.bd-main-img{display:block;max-width:100%;max-height:calc(100vh - 220px);width:auto;height:auto;pointer-events:none;user-select:none}',
      '.bd-canvas-overlay{position:absolute;top:0;left:0;pointer-events:none}',
      '.bd-cursor-canvas{z-index:10}',
      '.bd-grid-canvas{z-index:5}',
      '.bd-points-layer{position:absolute;inset:0;pointer-events:none;z-index:20}',

      /* ═══════════════════════════════════════════
         LABEL PANEL — three states:
           normal   : width 220px, font 11px
           expanded : width 340px, font 13px  (.bd-lp-expanded)
           collapsed: width 28px  (.bd-lp-collapsed)
         ═══════════════════════════════════════════ */
      '.bd-label-panel{width:220px;flex-shrink:0;background:#060606;border-left:1px solid #1a1a1a;display:flex;flex-direction:column;overflow:hidden;transition:width .22s cubic-bezier(.4,0,.2,1)}',
      '.bd-label-panel.bd-lp-expanded{width:340px}',
      '.bd-label-panel.bd-lp-collapsed{width:28px}',

      /* header */
      '.bd-lp-header{display:flex;align-items:center;gap:4px;padding:7px 7px 6px;border-bottom:1px solid #1a1a1a;flex-shrink:0;min-height:32px}',
      '.bd-lp-title{font-family:"Oswald",sans-serif;font-size:.7rem;font-weight:700;color:#c5a059;letter-spacing:2.5px;text-transform:uppercase;flex:1;white-space:nowrap;overflow:hidden}',

      /* mode row */
      '.bd-lp-mode-row{display:flex;align-items:center;gap:5px;padding:4px 7px;border-bottom:1px solid #141414;flex-shrink:0;background:#080808;flex-wrap:wrap}',
      '.bd-lp-mode-label{font-family:"Share Tech Mono",monospace;font-size:.58rem;color:#444;letter-spacing:1.5px;text-transform:uppercase}',

      /* scrollable list */
      '.bd-lp-list{flex:1;overflow-y:auto;overflow-x:hidden;padding:3px 0}',
      '.bd-lp-list::-webkit-scrollbar{width:3px}',
      '.bd-lp-list::-webkit-scrollbar-track{background:#050505}',
      '.bd-lp-list::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px}',

      /* label row — NORMAL size */
      '.bd-lp-row{display:flex;align-items:center;gap:5px;padding:3px 7px;transition:background .12s}',
      '.bd-lp-row:hover{background:rgba(197,160,89,.04)}',
      '.bd-lp-row.bd-lp-pinned{background:rgba(197,160,89,.06)}',
      '.bd-lp-num{font-family:"Share Tech Mono",monospace;font-size:11px;color:#333;width:18px;text-align:right;flex-shrink:0;letter-spacing:.5px}',
      '.bd-lp-row.bd-lp-pinned .bd-lp-num{color:#c5a059}',
      '.bd-lp-input{flex:1;background:transparent;border:none;border-bottom:1px solid #1c1c1c;color:#bbb;font-family:"Share Tech Mono",monospace;font-size:11px;padding:4px 4px;outline:none;letter-spacing:.3px;width:100%;min-width:0;transition:border-color .12s}',
      '.bd-lp-input:focus{border-bottom-color:rgba(197,160,89,.45);color:#e2b96f}',
      '.bd-lp-input::placeholder{color:#252525;font-size:10px}',
      '.bd-lp-row.bd-lp-pinned .bd-lp-input{color:#c5a059}',

      /* EXPANDED state — bigger text */
      '.bd-lp-expanded .bd-lp-num{font-size:13px;width:22px}',
      '.bd-lp-expanded .bd-lp-input{font-size:13px;padding:5px 5px}',
      '.bd-lp-expanded .bd-lp-input::placeholder{font-size:12px}',
      '.bd-lp-expanded .bd-lp-row{padding:4px 10px}',
      '.bd-lp-expanded .bd-lp-mode-label{font-size:.65rem}',
      '.bd-lp-expanded .bd-lp-title{font-size:.8rem}',

      /* indicator dots */
      '.bd-lp-dot{width:6px;height:6px;border-radius:50%;background:transparent;flex-shrink:0;transition:background .15s,box-shadow .15s}',
      '.bd-lp-dot.bd-lp-dot-next{background:#c5a059;box-shadow:0 0 6px rgba(197,160,89,.7)}',
      '.bd-lp-dot.bd-lp-dot-placed{background:#00e87a;box-shadow:0 0 4px rgba(0,232,122,.5)}',

      /* collapsed rail */
      '.bd-lp-rail{width:28px;display:flex;flex-direction:column;align-items:center;background:#050505;height:100%;border-left:1px solid #111}',

      /* pins */
      '.bd-pin{position:absolute;width:20px;height:20px;transform:translate(-50%,-50%);pointer-events:all;cursor:grab}',
      '.bd-pin:active{cursor:grabbing}',
      '.bd-pin-dot{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:4px;height:4px;border-radius:50%;background:#e2b96f;box-shadow:0 0 0 1px #000,0 0 0 2px rgba(197,160,89,.7);transition:width .1s,height .1s,box-shadow .1s}',
      '.bd-pin:hover .bd-pin-dot{width:6px;height:6px;background:#fff;box-shadow:0 0 0 1.5px #000,0 0 0 3px #c5a059,0 0 8px rgba(197,160,89,.6)}',
      '.bd-pin-num{position:absolute;bottom:calc(50% + 5px);left:50%;transform:translateX(-50%);font-family:"Share Tech Mono",monospace;font-size:8px;color:#c5a059;background:rgba(0,0,0,.82);padding:1px 3px;border-radius:2px;white-space:nowrap;pointer-events:none;line-height:1.3;letter-spacing:.5px}',
      '.bd-pin-label{position:absolute;top:calc(50% + 5px);left:50%;transform:translateX(-50%);font-family:"Share Tech Mono",monospace;font-size:8px;color:#4db8ff;background:rgba(0,0,0,.85);padding:1px 5px;border-radius:2px;white-space:nowrap;pointer-events:none;border:1px solid rgba(77,184,255,.25);letter-spacing:.4px;transition:opacity .18s}',
      '.bd-pin-label.bd-label-hidden{opacity:0;pointer-events:none}',

      /* export bar */
      '.bd-export-bar{display:flex;align-items:center;gap:6px;padding:5px 12px;background:#080808;border-top:1px solid #181818;flex-shrink:0;flex-wrap:wrap}',
      '.bd-export-label{font-family:"Share Tech Mono",monospace;font-size:.52rem;color:#2e2e2e;letter-spacing:2px;text-transform:uppercase;margin-right:2px}',

      /* output */
      '.bd-output-wrap{flex-shrink:0;border-top:1px solid #1e1e1e}',
      '.bd-output{width:100%;height:140px;background:#030303;border:none;color:#00e87a;font-family:"Share Tech Mono",monospace;font-size:.67rem;padding:9px 14px;resize:none;outline:none;line-height:1.65;letter-spacing:.3px;display:block}',

      /* ═══════════════════════════════════════════
         CONTEXT MENU — full shortcut panel
         ═══════════════════════════════════════════ */
      '.bd-ctx-menu{position:fixed;background:#0a0a0a;border:1px solid #282828;border-radius:3px;padding:4px 0;z-index:9000;min-width:210px;box-shadow:0 10px 44px rgba(0,0,0,.95)}',
      '.bd-ctx-section-lbl{font-family:"Share Tech Mono",monospace;font-size:.5rem;color:#2e2e2e;letter-spacing:2.5px;text-transform:uppercase;padding:6px 12px 2px;pointer-events:none}',
      '.bd-ctx-item{display:flex;align-items:center;width:100%;text-align:left;padding:6px 12px;font-family:"Share Tech Mono",monospace;font-size:.68rem;letter-spacing:.8px;color:#777;background:none;border:none;cursor:pointer;text-transform:uppercase;transition:all .1s;gap:6px}',
      '.bd-ctx-item:hover:not(:disabled){background:rgba(197,160,89,.08);color:#c5a059}',
      '.bd-ctx-item:disabled{opacity:.2;cursor:not-allowed}',
      '.bd-ctx-icon{width:14px;text-align:center;flex-shrink:0;opacity:.7}',
      '.bd-ctx-key{margin-left:auto;font-size:.55rem;color:#2e2e2e;letter-spacing:.5px;background:#0d0d0d;border:1px solid #1e1e1e;border-radius:2px;padding:1px 5px;white-space:nowrap;flex-shrink:0}',
      '.bd-ctx-item:hover .bd-ctx-key{color:#555;border-color:#333}',
      '.bd-ctx-live-item{color:#4db8ff !important}',
      '.bd-ctx-live-item:hover{color:#80d4ff !important;background:rgba(77,184,255,.07) !important}',
      '.bd-ctx-live-item .bd-ctx-key{color:#1e4466;border-color:#1a3a55}',
      '.bd-ctx-sep{height:1px;background:#181818;margin:3px 0}',

      /* modals */
      '.bd-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;z-index:9100;backdrop-filter:blur(5px)}',
      '.bd-modal{background:#0c0c0c;border:1px solid rgba(197,160,89,.28);border-radius:4px;padding:22px 24px;min-width:300px;box-shadow:0 18px 64px rgba(0,0,0,.95)}',
      '.bd-modal-wide{min-width:440px;max-width:560px}',
      '.bd-modal-title{font-family:"Oswald",sans-serif;font-size:.78rem;font-weight:700;color:#c5a059;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px}',
      '.bd-modal-desc{font-family:"Share Tech Mono",monospace;font-size:.58rem;color:#444;line-height:1.7;margin-bottom:12px;letter-spacing:.3px}',
      '.bd-modal-desc em{color:#555;font-style:normal;text-decoration:underline}',
      '.bd-modal-input{width:100%;background:#080808;border:1px solid #2a2a2a;color:#d8d8d8;font-family:"Share Tech Mono",monospace;font-size:.8rem;padding:8px 10px;border-radius:2px;outline:none;margin-bottom:14px;letter-spacing:.3px}',
      '.bd-modal-input:focus{border-color:rgba(197,160,89,.5)}',
      '.bd-modal-textarea{width:100%;height:110px;background:#080808;border:1px solid #2a2a2a;color:#4db8ff;font-family:"Share Tech Mono",monospace;font-size:.67rem;padding:8px 10px;border-radius:2px;outline:none;resize:vertical;margin-bottom:12px;line-height:1.6;letter-spacing:.3px}',
      '.bd-modal-textarea-tall{height:200px;color:#aaa}',
      '.bd-modal-textarea:focus{border-color:rgba(77,184,255,.4)}',
      '.bd-modal-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}',
      '.bd-modal-hint{font-family:"Share Tech Mono",monospace;font-size:.58rem;color:#4a4a4a;margin-top:8px;letter-spacing:.3px;min-height:1em}',

      /* pin animation */
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
  var points        = [];
  var undoStack     = [];
  var redoStack     = [];
  var labelSlots    = [];
  var imgNatW = 0, imgNatH = 0, imgDispW = 0, imgDispH = 0;
  var imgLoaded     = false;
  var ctxMenuOpen   = false;
  var ctxTargetIdx  = -1;
  var gridMode      = 'none';
  var showCrosshair = true;
  var labelsVisible = true;
  var liveLabelMode = true;
  var snapToGrid    = false;
  var isDragging    = false;
  var dragIdx       = -1, dragOffX = 0, dragOffY = 0;
  var crosshairSize = 60;
  var CROSS_MIN = 20, CROSS_MAX = 200;
  var panelState    = 'normal'; /* 'normal' | 'expanded' | 'collapsed' */

  for (var _i = 0; _i < MAX_LABELS; _i++) labelSlots.push('');


  /* ════════════════════════════════════════════════════════════════
     6. DOM REFS
     ════════════════════════════════════════════════════════════════ */
  function _q(sel) { return _mountEl.querySelector(sel); }

  var $dropZone       = _q('#bd-drop-zone');
  var $imageArea      = _q('#bd-image-area');
  var $img            = _q('#bd-main-img');
  var $gridCanvas     = _q('#bd-grid-canvas');
  var $cursorCanvas   = _q('#bd-cursor-canvas');
  var $pointsLayer    = _q('#bd-points-layer');
  var $fileInput      = _q('#bd-file-input');
  var $urlInput       = _q('#bd-url-input');
  var $loadUrlBtn     = _q('#bd-load-url-btn');
  var $clearBtn       = _q('#bd-clear-btn');
  var $undoBtn        = _q('#bd-undo-btn');
  var $redoBtn        = _q('#bd-redo-btn');
  var $exportCss      = _q('#bd-export-css');
  var $exportJson     = _q('#bd-export-json');
  var $exportAi       = _q('#bd-export-ai');
  var $copyAll        = _q('#bd-copy-all');
  var $outputBox      = _q('#bd-output');
  var $ctxMenu        = _q('#bd-ctx-menu');
  var $ctxDelete      = _q('#bd-ctx-delete');
  var $ctxLabel       = _q('#bd-ctx-label');
  var $ctxToggleLabel = _q('#bd-ctx-toggle-label');
  var $ctxLiveToggle  = _q('#bd-ctx-live-toggle');
  var $ctxLabelsVis   = _q('#bd-ctx-labels-vis');
  var $ctxCrosshair   = _q('#bd-ctx-crosshair');
  var $ctxGrid        = _q('#bd-ctx-grid');
  var $ctxSnap        = _q('#bd-ctx-snap');
  var $ctxUndo        = _q('#bd-ctx-undo');
  var $ctxRedo        = _q('#bd-ctx-redo');
  var $ctxClearPins   = _q('#bd-ctx-clear-pins');
  var $ctxExpAi       = _q('#bd-ctx-exp-ai');
  var $ctxExpJson     = _q('#bd-ctx-exp-json');
  var $ctxExpCss      = _q('#bd-ctx-exp-css');
  var $ctxMoveUp      = _q('#bd-ctx-moveup');
  var $ctxMoveDn      = _q('#bd-ctx-movedn');
  var $labelModal     = _q('#bd-label-modal');
  var $labelInput     = _q('#bd-label-input');
  var $labelSave      = _q('#bd-label-save');
  var $labelCancel    = _q('#bd-label-cancel');
  var $importModal    = _q('#bd-import-modal');
  var $importTextarea = _q('#bd-import-textarea');
  var $importApply    = _q('#bd-import-apply');
  var $importClear    = _q('#bd-import-clear');
  var $importCancel   = _q('#bd-import-cancel');
  var $importStatus   = _q('#bd-import-status');
  var $aiModal        = _q('#bd-ai-modal');
  var $aiPromptBox    = _q('#bd-ai-prompt-box');
  var $aiCopyBtn      = _q('#bd-ai-copy-btn');
  var $aiCancelBtn    = _q('#bd-ai-cancel-btn');
  var $aiStatus       = _q('#bd-ai-status');
  var $aiMeetBtn      = _q('#bd-ai-meet-btn');
  var $gridBtn        = _q('#bd-grid-btn');
  var $snapBtn        = _q('#bd-snap-btn');
  var $crossBtn       = _q('#bd-cross-btn');
  var $labelsBtn      = _q('#bd-labels-btn');
  var $liveBtn        = _q('#bd-live-btn');
  var $lpLiveToggle   = _q('#bd-lp-live-toggle');
  var $lpImportBtn    = _q('#bd-lp-import-btn');
  var $lpClearBtn     = _q('#bd-lp-clear-btn');
  var $lpExpandBtn    = _q('#bd-lp-expand-btn');
  var $lpCollapseBtn  = _q('#bd-lp-collapse-btn');
  var $lpExpandRail   = _q('#bd-lp-expand-rail');
  var $lpPanel        = _q('#bd-label-panel');
  var $lpList         = _q('#bd-lp-list');
  var $lpRail         = _q('#bd-lp-rail');
  var $lpModeRow      = _q('#bd-lp-mode-row');
  var $lpTitleTxt     = _q('#bd-lp-title-txt');
  var $resetImg       = _q('#bd-reset-img');
  var $coordDisplay   = _q('#bd-coord-display');
  var $countDisplay   = _q('#bd-count-display');
  var $statusMsg      = _q('#bd-status');


  /* ════════════════════════════════════════════════════════════════
     7. CANVAS CONTEXTS
     ════════════════════════════════════════════════════════════════ */
  var gCtx = $gridCanvas   ? $gridCanvas.getContext('2d')   : null;
  var cCtx = $cursorCanvas ? $cursorCanvas.getContext('2d') : null;


  /* ════════════════════════════════════════════════════════════════
     8. PANEL STATE MACHINE
        normal → expanded (⤢) → normal (⤡)
        any    → collapsed (◀) → normal (▶)
     ════════════════════════════════════════════════════════════════ */
  function _setPanelState(state) {
    panelState = state;
    $lpPanel.classList.remove('bd-lp-expanded', 'bd-lp-collapsed');

    if (state === 'expanded') {
      $lpPanel.classList.add('bd-lp-expanded');
      $lpList.style.display    = '';
      $lpModeRow.style.display = '';
      $lpRail.style.display    = 'none';
      if ($lpExpandBtn)  $lpExpandBtn.textContent  = '⤡';
      if ($lpExpandBtn)  $lpExpandBtn.title         = 'Return to normal size (E)';
      if ($lpCollapseBtn) $lpCollapseBtn.style.display = '';
      if ($lpTitleTxt)   $lpTitleTxt.style.display  = '';
    } else if (state === 'collapsed') {
      $lpPanel.classList.add('bd-lp-collapsed');
      $lpList.style.display    = 'none';
      $lpModeRow.style.display = 'none';
      $lpRail.style.display    = 'flex';
      if ($lpCollapseBtn) $lpCollapseBtn.style.display = 'none';
      if ($lpExpandBtn)   $lpExpandBtn.style.display   = 'none';
      if ($lpTitleTxt)    $lpTitleTxt.style.display    = 'none';
    } else {
      /* normal */
      $lpList.style.display    = '';
      $lpModeRow.style.display = '';
      $lpRail.style.display    = 'none';
      if ($lpExpandBtn)   { $lpExpandBtn.textContent = '⤢'; $lpExpandBtn.title = 'Expand for easier typing (E)'; $lpExpandBtn.style.display = ''; }
      if ($lpCollapseBtn) { $lpCollapseBtn.style.display = ''; }
      if ($lpTitleTxt)    $lpTitleTxt.style.display = '';
    }

    /* re-measure after transition */
    setTimeout(function () {
      if (imgLoaded) { _measureImage(); resizeGridCanvas(); resizeCursorCanvas(); renderPoints(); }
    }, 260);
  }

  if ($lpExpandBtn) $lpExpandBtn.addEventListener('click', function () {
    _setPanelState(panelState === 'expanded' ? 'normal' : 'expanded');
  });
  if ($lpCollapseBtn) $lpCollapseBtn.addEventListener('click', function () {
    _setPanelState('collapsed');
  });
  if ($lpExpandRail) $lpExpandRail.addEventListener('click', function () {
    _setPanelState('normal');
  });


  /* ════════════════════════════════════════════════════════════════
     9. LABEL PANEL I/O
     ════════════════════════════════════════════════════════════════ */
  function _readSlots() {
    for (var i = 0; i < MAX_LABELS; i++) {
      var inp = _q('#bd-lp-input-' + (i+1));
      labelSlots[i] = inp ? inp.value.trim() : '';
    }
  }

  function _writeSlots(arr) {
    for (var i = 0; i < MAX_LABELS; i++) {
      var inp = _q('#bd-lp-input-' + (i+1));
      if (inp) inp.value = (arr && arr[i]) ? arr[i] : '';
      labelSlots[i] = (arr && arr[i]) ? arr[i] : '';
    }
    _updatePanelDots();
  }

  function _updatePanelDots() {
    var nextIdx = points.length;
    for (var i = 0; i < MAX_LABELS; i++) {
      var dot = _q('#bd-lp-dot-' + (i+1));
      var row = _q('#bd-lp-row-'  + (i+1));
      if (!dot || !row) continue;
      dot.className = 'bd-lp-dot';
      row.classList.remove('bd-lp-pinned');
      if (i < points.length) {
        dot.classList.add('bd-lp-dot-placed');
        row.classList.add('bd-lp-pinned');
      } else if (i === nextIdx && liveLabelMode) {
        dot.classList.add('bd-lp-dot-next');
      }
    }
    var activeRow = _q('#bd-lp-row-' + (nextIdx + 1));
    if (activeRow) activeRow.scrollIntoView({ block:'nearest', behavior:'smooth' });
  }

  /* live-sync panel inputs → labelSlots; update existing pin labels */
  for (var _si = 1; _si <= MAX_LABELS; _si++) {
    (function (slot) {
      var inp = _q('#bd-lp-input-' + slot);
      if (!inp) return;
      inp.addEventListener('input', function () {
        labelSlots[slot-1] = inp.value.trim();
        if (slot <= points.length) {
          points[slot-1].label = labelSlots[slot-1];
          renderPoints();
        }
        _updatePanelDots();
      });
    }(_si));
  }

  /* double-click panel input with matching pin → open label modal */
  for (var _di = 1; _di <= MAX_LABELS; _di++) {
    (function (slot) {
      var inp = _q('#bd-lp-input-' + slot);
      if (!inp) return;
      inp.addEventListener('dblclick', function () {
        if (slot <= points.length) _openLabelModal(slot - 1);
      });
    }(_di));
  }


  /* ════════════════════════════════════════════════════════════════
     10. IMAGE LOAD
     ════════════════════════════════════════════════════════════════ */
  function loadImageSrc(src) {
    imgLoaded = false; $img.src = '';
    $img.classList.remove('vj-artwork__img--loaded');
    $img.classList.add('vj-artwork__img');
    $dropZone.style.display  = 'none';
    $imageArea.style.display = 'flex';

    $img.onload = function () {
      imgNatW = $img.naturalWidth; imgNatH = $img.naturalHeight;
      imgLoaded = true; points = []; undoStack = []; redoStack = [];
      requestAnimationFrame(function () {
        _measureImage(); resizeGridCanvas(); resizeCursorCanvas();
        renderGrid(); renderPoints(); updateCtxMenuState(); _updatePanelDots();
        _setStatus('Loaded \u00b7 ' + imgNatW + '\u00d7' + imgNatH + ' \u00b7 Click to pin');
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
    imgDispW = r.width; imgDispH = r.height;
  }


  /* ════════════════════════════════════════════════════════════════
     11. COORD CONVERSION
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
     12. UNDO / REDO
     ════════════════════════════════════════════════════════════════ */
  function _pushUndo() {
    undoStack.push(JSON.stringify(points));
    if (undoStack.length > 80) undoStack.shift();
    redoStack = []; _updateUndoBtns();
  }
  function _updateUndoBtns() {
    if ($undoBtn) $undoBtn.disabled = !undoStack.length;
    if ($redoBtn) $redoBtn.disabled = !redoStack.length;
  }
  function doUndo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(points));
    points = JSON.parse(undoStack.pop());
    renderPoints(); updateCtxMenuState(); _updateUndoBtns(); _updatePanelDots();
    _setStatus('Undo \u00b7 ' + points.length + ' pin' + (points.length !== 1 ? 's' : ''));
  }
  function doRedo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(points));
    points = JSON.parse(redoStack.pop());
    renderPoints(); updateCtxMenuState(); _updateUndoBtns(); _updatePanelDots();
    _setStatus('Redo \u00b7 ' + points.length + ' pin' + (points.length !== 1 ? 's' : ''));
  }


  /* ════════════════════════════════════════════════════════════════
     13. POINT OPS
     ════════════════════════════════════════════════════════════════ */
  function _getSlotLabel(idx) {
    _readSlots();
    return (liveLabelMode && idx < MAX_LABELS) ? (labelSlots[idx] || '') : '';
  }
  function _addPoint(nx, ny) {
    var lbl = _getSlotLabel(points.length);
    _pushUndo();
    points.push({ x: nx, y: ny, label: lbl, labelVisible: true });
    renderPoints(); updateCtxMenuState(); _updatePanelDots();
    _setStatus('Pin ' + points.length + (lbl ? ' \u00b7 ' + lbl : '') + ' \u2192 ' + nx + ', ' + ny);
  }
  function _deletePoint(idx) {
    if (idx < 0 || idx >= points.length) return;
    _pushUndo(); points.splice(idx, 1);
    renderPoints(); updateCtxMenuState(); _updatePanelDots();
  }
  function _movePointUp(idx) {
    if (idx <= 0) return;
    _pushUndo(); var t = points[idx]; points[idx] = points[idx-1]; points[idx-1] = t;
    renderPoints(); _updatePanelDots();
  }
  function _movePointDown(idx) {
    if (idx >= points.length-1) return;
    _pushUndo(); var t = points[idx]; points[idx] = points[idx+1]; points[idx+1] = t;
    renderPoints(); _updatePanelDots();
  }
  function _togglePointLabel(idx) {
    if (idx < 0 || idx >= points.length) return;
    _pushUndo(); points[idx].labelVisible = !points[idx].labelVisible; renderPoints();
  }


  /* ════════════════════════════════════════════════════════════════
     14. RENDER POINTS
     ════════════════════════════════════════════════════════════════ */
  function renderPoints() {
    if (!$pointsLayer) return;
    $pointsLayer.innerHTML = '';
    if (!imgLoaded) return;
    _measureImage();

    points.forEach(function (pt, i) {
      var dp  = _toDisplay(pt.x, pt.y);
      var pin = document.createElement('div');
      pin.className  = 'bd-pin';
      pin.style.left = dp.x + 'px';
      pin.style.top  = dp.y + 'px';

      var dot = document.createElement('div'); dot.className = 'bd-pin-dot';
      var num = document.createElement('div'); num.className = 'bd-pin-num'; num.textContent = i+1;
      pin.appendChild(dot); pin.appendChild(num);

      if (pt.label) {
        var lbl = document.createElement('div');
        lbl.className   = 'bd-pin-label' + ((!labelsVisible || pt.labelVisible === false) ? ' bd-label-hidden' : '');
        lbl.textContent = pt.label;
        pin.appendChild(lbl);
      }

      (function (idx) {
        pin.addEventListener('contextmenu', function (e) {
          e.preventDefault(); e.stopPropagation(); _openCtxMenu(e.clientX, e.clientY, idx);
        });
        pin.addEventListener('dblclick', function (e) {
          e.stopPropagation(); _openLabelModal(idx);
        });
        pin.addEventListener('mousedown', function (e) {
          if (e.button !== 0) return;
          e.stopPropagation();
          isDragging = true; dragIdx = idx;
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
     15. GRID CANVAS
     ════════════════════════════════════════════════════════════════ */
  function resizeGridCanvas() {
    if (!$gridCanvas || !$img || !imgLoaded) return;
    var r = $img.getBoundingClientRect();
    $gridCanvas.width  = Math.round(r.width);  $gridCanvas.height  = Math.round(r.height);
    $gridCanvas.style.width  = r.width+'px';   $gridCanvas.style.height = r.height+'px';
    renderGrid();
  }
  function renderGrid() {
    if (!gCtx || !imgLoaded) return;
    var w = $gridCanvas.width, h = $gridCanvas.height;
    gCtx.clearRect(0,0,w,h); if (gridMode==='none') return;
    gCtx.lineWidth=1;
    if (gridMode==='rule3'||gridMode==='full') {
      gCtx.strokeStyle='rgba(197,160,89,0.3)';
      [1/3,2/3].forEach(function(t){gCtx.beginPath();gCtx.moveTo(t*w,0);gCtx.lineTo(t*w,h);gCtx.stroke();gCtx.beginPath();gCtx.moveTo(0,t*h);gCtx.lineTo(w,t*h);gCtx.stroke();});
    }
    if (gridMode==='center'||gridMode==='full') {
      gCtx.strokeStyle='rgba(77,184,255,0.35)';
      gCtx.beginPath();gCtx.moveTo(w/2,0);gCtx.lineTo(w/2,h);gCtx.stroke();
      gCtx.beginPath();gCtx.moveTo(0,h/2);gCtx.lineTo(w,h/2);gCtx.stroke();
    }
    if (gridMode==='full') {
      gCtx.strokeStyle='rgba(197,160,89,0.07)';
      var step=Math.max(20,Math.round(Math.min(w,h)/10));
      for(var x=0;x<=w;x+=step){gCtx.beginPath();gCtx.moveTo(x,0);gCtx.lineTo(x,h);gCtx.stroke();}
      for(var y=0;y<=h;y+=step){gCtx.beginPath();gCtx.moveTo(0,y);gCtx.lineTo(w,y);gCtx.stroke();}
    }
  }


  /* ════════════════════════════════════════════════════════════════
     16. CROSSHAIR CANVAS
     ════════════════════════════════════════════════════════════════ */
  function resizeCursorCanvas() {
    if (!$cursorCanvas||!$img||!imgLoaded) return;
    var r = $img.getBoundingClientRect();
    $cursorCanvas.width  = Math.round(r.width);  $cursorCanvas.height  = Math.round(r.height);
    $cursorCanvas.style.width  = r.width+'px';   $cursorCanvas.style.height = r.height+'px';
  }
  function _renderCursor(lx, ly) {
    if (!cCtx||!imgLoaded) return;
    var w=$cursorCanvas.width, h=$cursorCanvas.height;
    cCtx.clearRect(0,0,w,h);
    if (!showCrosshair) return;
    var R=crosshairSize, gap=8, tick=5;
    cCtx.save();
    cCtx.strokeStyle='rgba(197,160,89,0.82)'; cCtx.lineWidth=1; cCtx.setLineDash([]);
    cCtx.beginPath();cCtx.moveTo(lx,ly-gap);cCtx.lineTo(lx,Math.max(0,ly-R));cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx,ly+gap);cCtx.lineTo(lx,Math.min(h,ly+R));cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx-gap,ly);cCtx.lineTo(Math.max(0,lx-R),ly);cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx+gap,ly);cCtx.lineTo(Math.min(w,lx+R),ly);cCtx.stroke();
    cCtx.strokeStyle='rgba(197,160,89,0.38)';
    cCtx.beginPath();cCtx.moveTo(lx-R,ly-tick);cCtx.lineTo(lx-R,ly);cCtx.lineTo(lx-R+tick,ly);cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx+R,ly-tick);cCtx.lineTo(lx+R,ly);cCtx.lineTo(lx+R-tick,ly);cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx-R,ly+tick);cCtx.lineTo(lx-R,ly);cCtx.lineTo(lx-R+tick,ly);cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx+R,ly+tick);cCtx.lineTo(lx+R,ly);cCtx.lineTo(lx+R-tick,ly);cCtx.stroke();
    cCtx.beginPath();cCtx.arc(lx,ly,1.5,0,Math.PI*2);
    cCtx.fillStyle='rgba(255,255,255,0.95)';cCtx.fill();
    var nextLbl='';
    if (liveLabelMode && points.length < MAX_LABELS) { _readSlots(); nextLbl=labelSlots[points.length]||''; }
    cCtx.font='9px "Share Tech Mono",monospace'; cCtx.textAlign='left'; cCtx.textBaseline='top';
    cCtx.fillStyle='rgba(197,160,89,0.55)';
    cCtx.fillText('\u00d7'+(R*2)+(nextLbl?'  \u25b8 '+nextLbl:''), lx+R+4, ly+2);
    cCtx.restore();
  }


  /* ════════════════════════════════════════════════════════════════
     17. CONTEXT MENU
     ════════════════════════════════════════════════════════════════ */
  function _openCtxMenu(cx, cy, idx) {
    ctxTargetIdx = idx;
    ctxMenuOpen  = true;

    /* Update dynamic labels */
    if ($ctxMoveUp)      $ctxMoveUp.disabled = (idx === 0);
    if ($ctxMoveDn)      $ctxMoveDn.disabled = (idx === points.length - 1);
    if ($ctxToggleLabel) {
      var vis = points[idx] && points[idx].labelVisible !== false;
      $ctxToggleLabel.querySelector('.bd-ctx-icon').textContent = vis ? '◌' : '●';
      $ctxToggleLabel.childNodes[1] && ($ctxToggleLabel.childNodes[1].textContent = ' ' + (vis ? 'Hide Label' : 'Show Label'));
    }
    if ($ctxLiveToggle) {
      var liveSpan = $ctxLiveToggle.querySelector('.bd-ctx-icon');
      if (liveSpan) liveSpan.textContent = liveLabelMode ? '⬡' : '○';
      /* update text node */
      $ctxLiveToggle.childNodes[1] && ($ctxLiveToggle.childNodes[1].textContent = ' Live Label: ' + (liveLabelMode ? 'ON' : 'OFF'));
    }
    if ($ctxLabelsVis) {
      $ctxLabelsVis.childNodes[1] && ($ctxLabelsVis.childNodes[1].textContent = ' Labels: ' + (labelsVisible ? 'Visible' : 'Hidden'));
    }
    if ($ctxCrosshair) {
      $ctxCrosshair.childNodes[1] && ($ctxCrosshair.childNodes[1].textContent = ' Crosshair: ' + (showCrosshair ? 'On' : 'Off'));
    }
    if ($ctxGrid) {
      var gridLabels={none:'Off',rule3:'1/3',center:'+',full:'All'};
      $ctxGrid.childNodes[1] && ($ctxGrid.childNodes[1].textContent = ' Grid: ' + (gridLabels[gridMode]||'Off'));
    }
    if ($ctxSnap) {
      $ctxSnap.childNodes[1] && ($ctxSnap.childNodes[1].textContent = ' Snap: ' + (snapToGrid ? 'On' : 'Off'));
    }
    if ($ctxUndo)      $ctxUndo.disabled = !undoStack.length;
    if ($ctxRedo)      $ctxRedo.disabled = !redoStack.length;
    if ($ctxClearPins) $ctxClearPins.disabled = !points.length;
    if ($ctxExpAi)     $ctxExpAi.disabled = !points.length;
    if ($ctxExpJson)   $ctxExpJson.disabled = !points.length;
    if ($ctxExpCss)    $ctxExpCss.disabled = !points.length;

    /* Position — keep in viewport */
    var mw = 215, mh = 520;
    var left = (cx + mw > window.innerWidth)  ? cx - mw : cx;
    var top  = (cy + mh > window.innerHeight) ? cy - mh : cy;
    $ctxMenu.style.left    = left + 'px';
    $ctxMenu.style.top     = top  + 'px';
    $ctxMenu.style.display = 'block';
  }

  function _openCtxMenuCanvas(cx, cy) {
    /* Right-click on canvas (not on a pin) — open with idx=-1, hide pin-specific items */
    ctxTargetIdx = -1;
    ctxMenuOpen  = true;
    if ($ctxDelete)      $ctxDelete.style.display      = 'none';
    if ($ctxLabel)       $ctxLabel.style.display       = 'none';
    if ($ctxToggleLabel) $ctxToggleLabel.style.display = 'none';
    if ($ctxMoveUp)      $ctxMoveUp.style.display      = 'none';
    if ($ctxMoveDn)      $ctxMoveDn.style.display      = 'none';
    _openCtxMenu(cx, cy, -1);
  }

  function _closeCtxMenu() {
    ctxMenuOpen  = false;
    ctxTargetIdx = -1;
    if ($ctxMenu) $ctxMenu.style.display = 'none';
    /* Restore hidden items */
    [$ctxDelete,$ctxLabel,$ctxToggleLabel,$ctxMoveUp,$ctxMoveDn].forEach(function(el){
      if (el) el.style.display = '';
    });
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
     18. LABEL EDIT MODAL
     ════════════════════════════════════════════════════════════════ */
  function _openLabelModal(idx) {
    ctxTargetIdx = idx;
    if (!$labelModal) return;
    $labelInput.value = (idx >= 0 && points[idx]) ? (points[idx].label || '') : '';
    $labelModal.style.display = 'flex';
    setTimeout(function(){ if($labelInput){$labelInput.focus();$labelInput.select();}}, 50);
  }
  function _closeLabelModal() { if ($labelModal) $labelModal.style.display='none'; }
  function _saveLabelModal() {
    var val = $labelInput ? $labelInput.value.trim() : '';
    if (ctxTargetIdx >= 0 && points[ctxTargetIdx] !== undefined) {
      _pushUndo();
      points[ctxTargetIdx].label = val;
      if (ctxTargetIdx < MAX_LABELS) {
        var si = _q('#bd-lp-input-' + (ctxTargetIdx+1));
        if (si) si.value = val;
        labelSlots[ctxTargetIdx] = val;
      }
      renderPoints();
    }
    _closeLabelModal();
  }


  /* ════════════════════════════════════════════════════════════════
     19. LABEL IMPORT
     ════════════════════════════════════════════════════════════════ */
  function _parseImportText(raw) {
    raw = raw.trim(); if (!raw) return null;
    if (raw[0]==='[') {
      try { var a=JSON.parse(raw); if(Array.isArray(a)) return a.map(String); } catch(e){}
    }
    var lines = raw.split('\n').map(function(l){return l.trim();}).filter(Boolean)
      .map(function(l){return l.replace(/^\d+[\.\)]\s*/,'').replace(/^\d+\s+/,'').trim();}).filter(Boolean);
    return lines.length ? lines : null;
  }
  function _openImportModal() {
    if (!$importModal) return;
    var cur = labelSlots.filter(Boolean);
    $importTextarea.value = cur.length ? JSON.stringify(cur, null, 2) : '';
    $importStatus.textContent = cur.length ? cur.length + ' labels in slots' : '';
    $importModal.style.display = 'flex';
    setTimeout(function(){$importTextarea.focus();}, 50);
  }
  function _closeImportModal() { if ($importModal) $importModal.style.display='none'; }
  function _applyImport() {
    var raw = $importTextarea ? $importTextarea.value : '';
    var parsed = _parseImportText(raw);
    if (!parsed) { $importStatus.textContent='\u26a0 Nothing to parse. Check format.'; return; }
    var arr = parsed.slice(0, MAX_LABELS);
    _writeSlots(arr);
    if (points.length) {
      _pushUndo();
      points.forEach(function(pt,i){ if(i<arr.length) pt.label=arr[i]; });
      renderPoints();
    }
    $importStatus.textContent = '\u2713 ' + arr.length + ' label' + (arr.length!==1?'s':'') + ' loaded.';
    _setStatus('Labels imported: ' + arr.length);
  }


  /* ════════════════════════════════════════════════════════════════
     20. LIVE LABEL TOGGLE
     ════════════════════════════════════════════════════════════════ */
  function _setLiveMode(on) {
    liveLabelMode = on;
    if ($liveBtn)      { $liveBtn.classList.toggle('bd-btn-active', on);      $liveBtn.textContent = (on?'\u9673':'\u25cb') + ' Live'; }
    if ($lpLiveToggle) { $lpLiveToggle.classList.toggle('bd-btn-active', on); $lpLiveToggle.textContent = on ? 'ON' : 'OFF'; }
    _updatePanelDots();
    _setStatus('Live Label: ' + (on ? 'ON' : 'OFF'));
  }


  /* ════════════════════════════════════════════════════════════════
     21. EXPORT
     ════════════════════════════════════════════════════════════════ */
  function _buildCss() {
    if (!points.length) return '/* No pins */';
    var lines=['/* Bulls-Eye Ducky \u00b7 '+imgNatW+'\u00d7'+imgNatH+' */'];
    points.forEach(function(pt,i){lines.push('.point-'+(i+1)+'{left:'+pt.x+'px;top:'+pt.y+'px}'+(pt.label?' /* '+pt.label+' */':''));});
    return lines.join('\n');
  }
  function _buildJson() {
    _readSlots();
    return JSON.stringify({source:'Bulls-Eye Ducky v53',naturalSize:{width:imgNatW,height:imgNatH},
      labelSlots:labelSlots.slice(0,MAX_LABELS),
      points:points.map(function(pt,i){return{index:i+1,x:pt.x,y:pt.y,label:pt.label||''};})
    },null,2);
  }
  function _buildAi() {
    _readSlots();
    var lines=['Bulls-Eye Ducky \u00b7 Coordinate Export',
      'Image: '+imgNatW+' \u00d7 '+imgNatH+' px (natural, top-left origin)',
      'Total pins: '+points.length,''];
    if (labelSlots.some(Boolean)) {
      lines.push('Label Manifest:');
      labelSlots.forEach(function(s,i){if(s)lines.push('  '+(i+1)+'. '+s);});
      lines.push('');
    }
    lines.push('Pins:');
    points.forEach(function(pt,i){lines.push('  '+(i+1)+'. x='+pt.x+', y='+pt.y+(pt.label?'  ['+pt.label+']':''));});
    lines.push('','Coordinates are natural pixel values. Use for CSS, SVG, canvas, or spatial AI prompting.');
    return lines.join('\n');
  }
  function _showOutput(text) {
    if (!$outputBox) return;
    $outputBox.value=text; $outputBox.parentElement.style.display='block';
    $outputBox.focus(); $outputBox.select();
  }
  function _copyToClipboard(text, msg) {
    msg = msg || '\u2713 Copied';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){_setStatus(msg);}).catch(function(){_fallbackCopy(text,msg);});
    } else { _fallbackCopy(text,msg); }
  }
  function _fallbackCopy(text, msg) {
    var ta=document.createElement('textarea'); ta.value=text;
    ta.style.cssText='position:fixed;opacity:0;top:0;left:0;width:1px;height:1px';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try{document.execCommand('copy');_setStatus(msg||'\u2713 Copied');}catch(e){}
    document.body.removeChild(ta);
  }
  function _setStatus(msg) { if ($statusMsg) $statusMsg.textContent=msg; }


  /* ════════════════════════════════════════════════════════════════
     22. DROP ZONE / FILE INPUT
     ════════════════════════════════════════════════════════════════ */
  $dropZone.addEventListener('dragover',  function(e){e.preventDefault();$dropZone.classList.add('bd-drag-over');});
  $dropZone.addEventListener('dragleave', function(){$dropZone.classList.remove('bd-drag-over');});
  $dropZone.addEventListener('drop', function(e){
    e.preventDefault(); $dropZone.classList.remove('bd-drag-over');
    var f=e.dataTransfer.files[0];
    if(f&&f.type.startsWith('image/')){var r=new FileReader();r.onload=function(ev){loadImageSrc(ev.target.result);};r.readAsDataURL(f);}
  });
  $dropZone.addEventListener('click', function(){$fileInput.click();});
  $fileInput.addEventListener('change', function(){
    var f=$fileInput.files[0]; if(!f) return;
    var r=new FileReader(); r.onload=function(ev){loadImageSrc(ev.target.result);}; r.readAsDataURL(f); $fileInput.value='';
  });

  $loadUrlBtn.addEventListener('click', function(){var u=$urlInput.value.trim();if(u)loadImageSrc(u);});
  $urlInput.addEventListener('keydown', function(e){if(e.key==='Enter')$loadUrlBtn.click();});


  /* ════════════════════════════════════════════════════════════════
     23. IMAGE MOUSE EVENTS
     ════════════════════════════════════════════════════════════════ */
  $imageArea.addEventListener('mousemove', function(e){
    if (!imgLoaded) return;
    var r=$img.getBoundingClientRect(), lx=e.clientX-r.left, ly=e.clientY-r.top;
    if(lx<0||ly<0||lx>r.width||ly>r.height) return;
    _renderCursor(lx,ly);
    var c=_toNatural(e.clientX,e.clientY);
    if($coordDisplay)$coordDisplay.textContent=c.x+', '+c.y;
    if(root.VJ&&root.VJ.updateHUD) root.VJ.updateHUD(c.x,c.y);
  });
  $imageArea.addEventListener('mouseleave', function(){
    if(cCtx)cCtx.clearRect(0,0,$cursorCanvas.width,$cursorCanvas.height);
    if($coordDisplay)$coordDisplay.textContent='\u2014, \u2014';
  });
  $imageArea.addEventListener('click', function(e){
    if(!imgLoaded||isDragging) return;
    if(e.target.closest&&e.target.closest('.bd-pin')) return;
    if(ctxMenuOpen){_closeCtxMenu();return;}
    var c=_toNatural(e.clientX,e.clientY), nx=c.x, ny=c.y;
    if(snapToGrid&&imgNatW>0){var step=Math.max(1,Math.round(Math.min(imgNatW,imgNatH)/10));nx=Math.round(nx/step)*step;ny=Math.round(ny/step)*step;}
    _addPoint(nx,ny);
  });
  /* Right-click on image canvas (not on a pin) → show context menu without pin items */
  $imageArea.addEventListener('contextmenu', function(e){
    e.preventDefault();
    if(e.target.closest&&e.target.closest('.bd-pin')) return; /* pin has its own handler */
    _openCtxMenuCanvas(e.clientX, e.clientY);
  });

  /* scroll = crosshair size */
  $imageArea.addEventListener('wheel', function(e){
    if(!imgLoaded) return; e.preventDefault();
    crosshairSize=Math.max(CROSS_MIN,Math.min(CROSS_MAX,crosshairSize+(e.deltaY>0?-8:8)));
    var r=$img.getBoundingClientRect(),lx=e.clientX-r.left,ly=e.clientY-r.top;
    if(lx>=0&&ly>=0&&lx<=r.width&&ly<=r.height)_renderCursor(lx,ly);
  },{passive:false});

  document.addEventListener('mousemove', function(e){
    if(!isDragging||dragIdx<0) return;
    var r=$img.getBoundingClientRect();
    var lx=(e.clientX-dragOffX)-r.left, ly=(e.clientY-dragOffY)-r.top;
    var nx=Math.max(0,Math.min(imgNatW,Math.round((lx/r.width)*imgNatW)));
    var ny=Math.max(0,Math.min(imgNatH,Math.round((ly/r.height)*imgNatH)));
    points[dragIdx].x=nx; points[dragIdx].y=ny; renderPoints();
    if($coordDisplay)$coordDisplay.textContent=nx+', '+ny;
  });
  document.addEventListener('mouseup', function(){
    if(isDragging){isDragging=false;dragIdx=-1;renderPoints();}
  });
  document.addEventListener('click', function(e){
    if(ctxMenuOpen&&$ctxMenu&&!$ctxMenu.contains(e.target))_closeCtxMenu();
  });


  /* ════════════════════════════════════════════════════════════════
     24. CONTEXT MENU ACTIONS
     ════════════════════════════════════════════════════════════════ */
  /* pin actions */
  if ($ctxDelete)      $ctxDelete.addEventListener('click',      function(){_deletePoint(ctxTargetIdx);_closeCtxMenu();});
  if ($ctxLabel)       $ctxLabel.addEventListener('click',       function(){var i=ctxTargetIdx;_closeCtxMenu();_openLabelModal(i);});
  if ($ctxToggleLabel) $ctxToggleLabel.addEventListener('click', function(){_togglePointLabel(ctxTargetIdx);_closeCtxMenu();});
  if ($ctxMoveUp)      $ctxMoveUp.addEventListener('click',      function(){_movePointUp(ctxTargetIdx);_closeCtxMenu();});
  if ($ctxMoveDn)      $ctxMoveDn.addEventListener('click',      function(){_movePointDown(ctxTargetIdx);_closeCtxMenu();});
  /* mode toggles */
  if ($ctxLiveToggle)  $ctxLiveToggle.addEventListener('click',  function(){_setLiveMode(!liveLabelMode);_closeCtxMenu();});
  if ($ctxLabelsVis)   $ctxLabelsVis.addEventListener('click',   function(){if($labelsBtn)$labelsBtn.click();_closeCtxMenu();});
  if ($ctxCrosshair)   $ctxCrosshair.addEventListener('click',   function(){if($crossBtn)$crossBtn.click();_closeCtxMenu();});
  if ($ctxGrid)        $ctxGrid.addEventListener('click',        function(){if($gridBtn)$gridBtn.click();_closeCtxMenu();});
  if ($ctxSnap)        $ctxSnap.addEventListener('click',        function(){if($snapBtn)$snapBtn.click();_closeCtxMenu();});
  /* history */
  if ($ctxUndo)      $ctxUndo.addEventListener('click',      function(){doUndo();_closeCtxMenu();});
  if ($ctxRedo)      $ctxRedo.addEventListener('click',      function(){doRedo();_closeCtxMenu();});
  if ($ctxClearPins) $ctxClearPins.addEventListener('click', function(){
    if(!points.length)return; _pushUndo(); points=[];
    renderPoints(); updateCtxMenuState(); _updatePanelDots(); _setStatus('All pins cleared');
    _closeCtxMenu();
  });
  /* export */
  if ($ctxExpAi)   $ctxExpAi.addEventListener('click',   function(){_showOutput(_buildAi());_setStatus('AI Prompt ready');_closeCtxMenu();});
  if ($ctxExpJson) $ctxExpJson.addEventListener('click', function(){_showOutput(_buildJson());_setStatus('JSON ready');_closeCtxMenu();});
  if ($ctxExpCss)  $ctxExpCss.addEventListener('click',  function(){_showOutput(_buildCss());_setStatus('CSS ready');_closeCtxMenu();});


  /* ════════════════════════════════════════════════════════════════
     25. TOOLBAR ACTIONS
     ════════════════════════════════════════════════════════════════ */
  if ($clearBtn) $clearBtn.addEventListener('click', function(){
    if(!points.length) return; _pushUndo(); points=[];
    renderPoints(); updateCtxMenuState(); _updatePanelDots(); _setStatus('All pins cleared');
  });
  if ($undoBtn) $undoBtn.addEventListener('click', doUndo);
  if ($redoBtn) $redoBtn.addEventListener('click', doRedo);

  if ($resetImg) $resetImg.addEventListener('click', function(){
    imgLoaded=false; points=[]; undoStack=[]; redoStack=[];
    $img.src=''; $imageArea.style.display='none'; $dropZone.style.display='flex';
    if($outputBox)$outputBox.parentElement.style.display='none';
    renderPoints(); updateCtxMenuState(); _updatePanelDots();
    _setStatus('Ready \u00b7 Drop or browse an image');
    if(root.VJ&&root.VJ.updateHUD)root.VJ.updateHUD(0,0);
    if(root.VJ&&root.VJ.updateRes)root.VJ.updateRes(0,0);
  });

  if ($gridBtn) $gridBtn.addEventListener('click', function(){
    var modes=['none','rule3','center','full'];
    var labels={none:'Grid: Off',rule3:'Grid: \u2153',center:'Grid: \u271a',full:'Grid: All'};
    gridMode=modes[(modes.indexOf(gridMode)+1)%modes.length];
    $gridBtn.textContent=labels[gridMode]; renderGrid();
  });

  if ($snapBtn) $snapBtn.addEventListener('click', function(){
    snapToGrid=!snapToGrid; $snapBtn.classList.toggle('bd-btn-active',snapToGrid);
    _setStatus('Snap: '+(snapToGrid?'ON':'OFF'));
  });

  if ($crossBtn) $crossBtn.addEventListener('click', function(){
    showCrosshair=!showCrosshair; $crossBtn.classList.toggle('bd-btn-active',showCrosshair);
    if(!showCrosshair&&cCtx)cCtx.clearRect(0,0,$cursorCanvas.width,$cursorCanvas.height);
  });

  if ($labelsBtn) $labelsBtn.addEventListener('click', function(){
    labelsVisible=!labelsVisible; $labelsBtn.classList.toggle('bd-btn-active',labelsVisible);
    renderPoints(); _setStatus('Labels: '+(labelsVisible?'Visible':'Hidden'));
  });

  if ($liveBtn)      $liveBtn.addEventListener('click',      function(){_setLiveMode(!liveLabelMode);});
  if ($lpLiveToggle) $lpLiveToggle.addEventListener('click', function(){_setLiveMode(!liveLabelMode);});


  /* ════════════════════════════════════════════════════════════════
     26. LABEL PANEL BUTTONS
     ════════════════════════════════════════════════════════════════ */
  if ($lpImportBtn) $lpImportBtn.addEventListener('click', _openImportModal);
  if ($lpClearBtn)  $lpClearBtn.addEventListener('click', function(){
    _writeSlots([]);
    if(points.length){_pushUndo();points.forEach(function(pt){pt.label='';});renderPoints();}
    _setStatus('Label slots cleared');
  });
  if ($importApply)  $importApply.addEventListener('click',  _applyImport);
  if ($importClear)  $importClear.addEventListener('click',  function(){_writeSlots([]);$importStatus.textContent='Cleared.';});
  if ($importCancel) $importCancel.addEventListener('click', _closeImportModal);


  /* ════════════════════════════════════════════════════════════════
     27. LABEL EDIT MODAL
     ════════════════════════════════════════════════════════════════ */
  if ($labelSave)   $labelSave.addEventListener('click',   _saveLabelModal);
  if ($labelCancel) $labelCancel.addEventListener('click', _closeLabelModal);
  if ($labelInput)  $labelInput.addEventListener('keydown', function(e){
    if(e.key==='Enter')_saveLabelModal(); if(e.key==='Escape')_closeLabelModal();
  });


  /* ════════════════════════════════════════════════════════════════
     28. EXPORT BUTTONS
     ════════════════════════════════════════════════════════════════ */
  if ($exportCss)  $exportCss.addEventListener('click',  function(){_showOutput(_buildCss());_setStatus('CSS ready');});
  if ($exportJson) $exportJson.addEventListener('click', function(){_showOutput(_buildJson());_setStatus('JSON ready');});
  if ($exportAi)   $exportAi.addEventListener('click',   function(){_showOutput(_buildAi());_setStatus('AI Prompt ready');});
  if ($copyAll)    $copyAll.addEventListener('click',    function(){
    _copyToClipboard(($outputBox&&$outputBox.value)?$outputBox.value:_buildJson());
  });


  /* ════════════════════════════════════════════════════════════════
     29. AI MEET DUCKY
     ════════════════════════════════════════════════════════════════ */
  if ($aiMeetBtn) $aiMeetBtn.addEventListener('click', function(){
    if($aiPromptBox)$aiPromptBox.value=DUCKY_SYSTEM_PROMPT;
    if($aiStatus)$aiStatus.textContent='';
    if($aiModal)$aiModal.style.display='flex';
    setTimeout(function(){if($aiPromptBox){$aiPromptBox.focus();$aiPromptBox.select();}},60);
  });
  if ($aiCopyBtn)    $aiCopyBtn.addEventListener('click',    function(){
    _copyToClipboard(DUCKY_SYSTEM_PROMPT,'\u2713 Prompt copied!');
    if($aiStatus)$aiStatus.textContent='\u2713 Copied! Paste into ChatGPT, Claude, Gemini, etc.';
  });
  if ($aiCancelBtn)  $aiCancelBtn.addEventListener('click',  function(){if($aiModal)$aiModal.style.display='none';});


  /* ════════════════════════════════════════════════════════════════
     30. KEYBOARD SHORTCUTS
     ════════════════════════════════════════════════════════════════ */
  document.addEventListener('keydown', function(e){
    if (!_mountEl.classList.contains('vj-mod--active')) return;
    if (e.target.matches('input,textarea,select')) return;
    /* Ctrl combos */
    if ((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();doUndo();return;}
    if ((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toUpperCase()==='Z'))){e.preventDefault();doRedo();return;}
    /* single keys */
    var k=e.key.toLowerCase();
    if (k==='backspace'||k==='delete'){if(points.length)_deletePoint(points.length-1);return;}
    if (k==='l'){if($labelsBtn)$labelsBtn.click();return;}
    if (k==='v'){_setLiveMode(!liveLabelMode);return;}
    if (k==='c'){if($crossBtn)$crossBtn.click();return;}
    if (k==='g'){if($gridBtn)$gridBtn.click();return;}
    if (k==='s'){if($snapBtn)$snapBtn.click();return;}
    if (k==='x'){if($clearBtn&&!$clearBtn.disabled)$clearBtn.click();return;}
    if (k==='e'){_setPanelState(panelState==='expanded'?'normal':panelState==='collapsed'?'normal':'expanded');return;}
    if (k==='a'){if($exportAi&&!$exportAi.disabled){_showOutput(_buildAi());_setStatus('AI Prompt ready');}return;}
    if (k==='j'){if($exportJson&&!$exportJson.disabled){_showOutput(_buildJson());_setStatus('JSON ready');}return;}
    if (k==='k'){if($exportCss&&!$exportCss.disabled){_showOutput(_buildCss());_setStatus('CSS ready');}return;}
    if (e.key==='Escape'){_closeCtxMenu();_closeLabelModal();_closeImportModal();if($aiModal)$aiModal.style.display='none';}
  });


  /* ════════════════════════════════════════════════════════════════
     31. WINDOW RESIZE
     ════════════════════════════════════════════════════════════════ */
  var _rTimer;
  window.addEventListener('resize', function(){
    clearTimeout(_rTimer);
    _rTimer=setTimeout(function(){
      if(!imgLoaded)return;
      _measureImage();resizeGridCanvas();resizeCursorCanvas();renderPoints();
    },120);
  });


  /* ════════════════════════════════════════════════════════════════
     32. EXPOSE GLOBALS
     ════════════════════════════════════════════════════════════════ */
  root.resizeGridCanvas   = resizeGridCanvas;
  root.resizeCursorCanvas = resizeCursorCanvas;
  root.renderPoints       = renderPoints;
  root.updateCtxMenuState = updateCtxMenuState;
  root.BeDucky = {
    getPoints  : function(){return points.slice();},
    loadImage  : loadImageSrc,
    clearPoints: function(){_pushUndo();points=[];renderPoints();updateCtxMenuState();_updatePanelDots();},
    setLabels  : function(arr){_writeSlots(Array.isArray(arr)?arr.map(String):[]);}
  };


  /* ════════════════════════════════════════════════════════════════
     33. INIT
     ════════════════════════════════════════════════════════════════ */
  updateCtxMenuState();
  _updatePanelDots();
  _setLiveMode(true);
  _setPanelState('normal');
  _setStatus('Ready \u00b7 Fill labels \u00b7 Drop image \u00b7 Click to pin \u00b7 Right-click = full menu');
  console.log('[BeDucky] v53 mounted OK.');

}(window));
