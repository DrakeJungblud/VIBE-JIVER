/* ============================================================
   BE DUCKY  v57  —  Vibe Jiver Module
   NEW in v57:
     · Output panel LOCKED OPEN after export — stays visible
       until user clicks new ✕ Clear Output button or loads
       a new image. No more auto-collapsing output.
     · CLEAR OUTPUT button added to bottom bar (red ✕)
     · Readability Pass 2: all toolbar toggle labels brighter
       (14px, #d0d0d0 idle / gold active), status pill #bbb,
       output bar label #bbb 14px, drop zone text visible,
       context menu hints #aaa, mode descs #bbb, pin labels 13px
     · Adaptive crosshair: white on dark bg / dark on light bg
   ============================================================ */
/* ============================================================
   PRESERVED NOTES v55/v56:
     · Full typography audit — all body text #e8e8e8 at 13px+
       Gold (#c5a059) strictly for headers, active states, pins
     · Right panel label inputs: 14px, full-width, clearly legible
     · Panel numbers & slot numbers: 13px, #aaa (was 10px #333)
     · Right-click context menu completely rebuilt as Windows-10-style
       native-look popup: frosted dark card, proper hover highlight,
       checkmark for active states, dividers between groups,
       greyed-out disabled items, smooth shadow — NO section label clutter
     · Context menu is CONTEXT-AWARE: PIN section only appears when
       right-clicking a pin; canvas right-click shows condensed menu
     · CSS+Labels export now clearly labeled and accessible
     · All v54 features preserved (tabs, expand/collapse, shortcuts,
       live label, import, AI Meet Ducky, modes tab, export tab)
   ============================================================ */
(function (root) {
  'use strict';

  var MAX_LABELS = 20;

  /* ════════════════════════════════════════════════════════════════
     AI MEET DUCKY
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
    '- **Live Label Mode ON**: pins auto-receive the label from the matching numbered slot.',
    '- **Live Label Mode OFF**: pins are unlabelled until manually assigned.',
    '- I can import a label list as a JSON array OR plain numbered text.',
    '',
    '## How You Can Help Me',
    '',
    '### Send me labels (paste them in, they auto-apply as I pin):',
    '["left eye", "right eye", "nose tip", "mouth center", "chin"]',
    '',
    'Or plain numbered text:',
    '1. Left eye',
    '2. Right eye',
    '3. Nose tip',
    '',
    '### I send you coordinates:',
    '',
    'Image: 1200 × 800 px',
    'Pins:',
    '  1. x=340, y=210  [left eye]',
    '  2. x=580, y=210  [right eye]',
    '  3. x=460, y=310  [nose tip]',
    '',
    '## Export Formats',
    '- **CSS**: .point-N { left: Xpx; top: Ypx; } /* label */',
    '- **JSON**: structured object with naturalSize + points array',
    '- **AI Prompt**: human-readable block ready to paste into any chat',
    '',
    '## Key Rules',
    '- Coordinates are NATURAL pixel values (not scaled/display px).',
    '- Pin numbers are 1-indexed and match the label slot numbers.',
    '- Labels are optional but make exports dramatically more useful.',
    '',
    '---',
    'You now understand Bulls-Eye Ducky. Ready to collaborate.'
  ].join('\n');


  /* ════════════════════════════════════════════════════════════════
     1. HTML — label rows (20 slots)
     ════════════════════════════════════════════════════════════════ */
  var _labelRows = [];
  for (var _ri = 1; _ri <= MAX_LABELS; _ri++) {
    _labelRows.push(
      '<div class="bd-lp-row" id="bd-lp-row-' + _ri + '" data-slot="' + _ri + '">' +
      '<span class="bd-lp-num">' + _ri + '</span>' +
      '<input type="text" class="bd-lp-input" id="bd-lp-input-' + _ri + '"' +
      ' placeholder="Label ' + _ri + '" maxlength="48" spellcheck="false">' +
      '<span class="bd-lp-dot" id="bd-lp-dot-' + _ri + '"></span>' +
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
    '      <button class="bd-btn bd-btn-active" id="bd-labels-btn" title="Show/hide pin labels (L)">&#9673; Labels</button>',
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
    '        <div class="bd-drop-hint">Scroll wheel = crosshair size &middot; Right-click anywhere = menu</div>',
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

    /* ══════════════════════════════════════════════════════════
       RIGHT PANEL — tabbed: LABELS / MODES / EXPORT
       ══════════════════════════════════════════════════════════ */
    '    <div class="bd-panel" id="bd-label-panel">',

    /* top bar */
    '      <div class="bd-panel-topbar">',
    '        <span class="bd-panel-brand" id="bd-lp-title-txt">&#9998; DUCKY PANEL</span>',
    '        <button class="bd-panel-iconbtn" id="bd-lp-expand-btn"   title="Expand panel (E)">&#10070;</button>',
    '        <button class="bd-panel-iconbtn" id="bd-lp-collapse-btn" title="Collapse panel">&#9664;</button>',
    '      </div>',

    /* tab bar */
    '      <div class="bd-tab-bar" id="bd-lp-mode-row">',
    '        <button class="bd-tab bd-tab-active" id="bd-tab-labels"  data-tab="labels">LABELS</button>',
    '        <button class="bd-tab"               id="bd-tab-modes"   data-tab="modes">MODES</button>',
    '        <button class="bd-tab"               id="bd-tab-export"  data-tab="export">EXPORT</button>',
    '      </div>',

    /* ── TAB: LABELS ── */
    '      <div class="bd-tab-pane" id="bd-pane-labels">',
    '        <div class="bd-pane-controls">',
    '          <span class="bd-pane-label">LIVE MODE</span>',
    '          <button class="bd-pill bd-pill-on" id="bd-lp-live-toggle" title="Auto-label pins from slots (V)">ON</button>',
    '          <button class="bd-panel-iconbtn bd-btn-lp-import" id="bd-lp-import-btn" title="Import label list">&#8659; Import</button>',
    '          <button class="bd-panel-iconbtn bd-btn-lp-clr"   id="bd-lp-clear-btn"  title="Clear all slots">&#10005;</button>',
    '        </div>',
    '        <div class="bd-lp-list" id="bd-lp-list">',
               _labelRows.join(''),
    '        </div>',
    '      </div>',

    /* ── TAB: MODES ── */
    '      <div class="bd-tab-pane bd-tab-pane-hidden" id="bd-pane-modes">',
    '        <div class="bd-mode-list">',

    '          <div class="bd-mode-row">',
    '            <div class="bd-mode-info">',
    '              <span class="bd-mode-name">Live Labels</span>',
    '              <span class="bd-mode-desc">Auto-apply slot labels to new pins</span>',
    '            </div>',
    '            <button class="bd-pill bd-pill-on" id="bd-mode-live">ON</button>',
    '          </div>',

    '          <div class="bd-mode-row">',
    '            <div class="bd-mode-info">',
    '              <span class="bd-mode-name">Label Overlay</span>',
    '              <span class="bd-mode-desc">Show label text on image pins</span>',
    '            </div>',
    '            <button class="bd-pill bd-pill-on" id="bd-mode-labels">ON</button>',
    '          </div>',

    '          <div class="bd-mode-row">',
    '            <div class="bd-mode-info">',
    '              <span class="bd-mode-name">Crosshair</span>',
    '              <span class="bd-mode-desc">Precision cursor overlay on canvas</span>',
    '            </div>',
    '            <button class="bd-pill bd-pill-on" id="bd-mode-cross">ON</button>',
    '          </div>',

    '          <div class="bd-mode-row">',
    '            <div class="bd-mode-info">',
    '              <span class="bd-mode-name">Grid Overlay</span>',
    '              <span class="bd-mode-desc">Rule of thirds / center / full</span>',
    '            </div>',
    '            <button class="bd-pill" id="bd-mode-grid">OFF</button>',
    '          </div>',

    '          <div class="bd-mode-row">',
    '            <div class="bd-mode-info">',
    '              <span class="bd-mode-name">Snap to Grid</span>',
    '              <span class="bd-mode-desc">Pins snap to grid intersections</span>',
    '            </div>',
    '            <button class="bd-pill" id="bd-mode-snap">OFF</button>',
    '          </div>',

    '        </div>',

    '        <div class="bd-mode-section-title">KEYBOARD SHORTCUTS</div>',
    '        <div class="bd-shortcut-list">',
    '          <div class="bd-sc-row"><span class="bd-sc-key">V</span><span class="bd-sc-desc">Toggle Live Labels</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">L</span><span class="bd-sc-desc">Toggle Label Overlay</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">C</span><span class="bd-sc-desc">Toggle Crosshair</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">G</span><span class="bd-sc-desc">Cycle Grid Mode</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">S</span><span class="bd-sc-desc">Toggle Snap to Grid</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">X</span><span class="bd-sc-desc">Clear All Pins</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">E</span><span class="bd-sc-desc">Expand / Collapse Panel</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">A</span><span class="bd-sc-desc">Export AI Prompt</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">J</span><span class="bd-sc-desc">Export JSON</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">K</span><span class="bd-sc-desc">Export CSS</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">Shift+K</span><span class="bd-sc-desc">Export CSS + Labels</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">Ctrl+Z</span><span class="bd-sc-desc">Undo</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">Ctrl+Y</span><span class="bd-sc-desc">Redo</span></div>',
    '          <div class="bd-sc-row"><span class="bd-sc-key">Del</span><span class="bd-sc-desc">Delete Last Pin</span></div>',
    '        </div>',
    '      </div>',

    /* ── TAB: EXPORT ── */
    '      <div class="bd-tab-pane bd-tab-pane-hidden" id="bd-pane-export">',
    '        <div class="bd-export-section">',
    '          <div class="bd-export-section-title">OUTPUT FORMAT</div>',

    '          <button class="bd-export-btn" id="bd-px-exp-ai" disabled>',
    '            <span class="bd-export-btn-icon">&#129302;</span>',
    '            <span class="bd-export-btn-body">',
    '              <span class="bd-export-btn-name">AI Prompt</span>',
    '              <span class="bd-export-btn-desc">Human-readable block for any AI chat</span>',
    '            </span>',
    '            <span class="bd-export-btn-key">A</span>',
    '          </button>',

    '          <button class="bd-export-btn" id="bd-px-exp-json" disabled>',
    '            <span class="bd-export-btn-icon">{ }</span>',
    '            <span class="bd-export-btn-body">',
    '              <span class="bd-export-btn-name">JSON</span>',
    '              <span class="bd-export-btn-desc">Structured data with labels &amp; coords</span>',
    '            </span>',
    '            <span class="bd-export-btn-key">J</span>',
    '          </button>',

    '          <button class="bd-export-btn" id="bd-px-exp-css" disabled>',
    '            <span class="bd-export-btn-icon">#</span>',
    '            <span class="bd-export-btn-body">',
    '              <span class="bd-export-btn-name">CSS</span>',
    '              <span class="bd-export-btn-desc">Positioning rules, coordinates only</span>',
    '            </span>',
    '            <span class="bd-export-btn-key">K</span>',
    '          </button>',

    '          <button class="bd-export-btn bd-export-btn-labeled" id="bd-px-exp-css-lbl" disabled>',
    '            <span class="bd-export-btn-icon">&#9998;</span>',
    '            <span class="bd-export-btn-body">',
    '              <span class="bd-export-btn-name">CSS + Labels</span>',
    '              <span class="bd-export-btn-desc">CSS rules with inline label comments</span>',
    '            </span>',
    '            <span class="bd-export-btn-key">Shift+K</span>',
    '          </button>',

    '        </div>',

    '        <div class="bd-export-section">',
    '          <div class="bd-export-section-title">CLIPBOARD</div>',
    '          <button class="bd-export-btn bd-export-btn-copy" id="bd-px-copy" disabled>',
    '            <span class="bd-export-btn-icon">&#9000;</span>',
    '            <span class="bd-export-btn-body">',
    '              <span class="bd-export-btn-name">Copy Output</span>',
    '              <span class="bd-export-btn-desc">Copy last generated output to clipboard</span>',
    '            </span>',
    '          </button>',
    '        </div>',

    '        <div class="bd-export-section">',
    '          <div class="bd-export-section-title">AI COLLABORATION</div>',
    '          <button class="bd-export-btn bd-export-btn-ai" id="bd-px-ai-meet">',
    '            <span class="bd-export-btn-icon">&#129302;</span>',
    '            <span class="bd-export-btn-body">',
    '              <span class="bd-export-btn-name">AI Meet Ducky</span>',
    '              <span class="bd-export-btn-desc">Onboard any AI to collaborate with this tool</span>',
    '            </span>',
    '          </button>',
    '        </div>',

    '      </div>',

    /* collapsed rail */
    '      <div class="bd-lp-rail" id="bd-lp-rail" style="display:none">',
    '        <button class="bd-btn-rail" id="bd-lp-expand-rail" title="Expand panel (E)">&#9654;<br><span>P<br>A<br>N<br>E<br>L</span></button>',
    '      </div>',

    '    </div>', /* end .bd-panel */
    '  </div>',  /* end .bd-body */

    /* ── BOTTOM BAR ── */
    '  <div class="bd-output-bar">',
    '    <span class="bd-output-bar-label">OUTPUT:</span>',
    '    <button class="bd-btn bd-btn-sm bd-btn-export" id="bd-export-css"  disabled>CSS</button>',
    '    <button class="bd-btn bd-btn-sm bd-btn-export" id="bd-export-json" disabled>JSON</button>',
    '    <button class="bd-btn bd-btn-sm bd-btn-export" id="bd-export-ai"   disabled>AI Prompt</button>',
    '    <button class="bd-btn bd-btn-sm bd-btn-gold"   id="bd-copy-all"    disabled>&#9000; Copy</button>',
    '    <button class="bd-btn bd-btn-sm bd-btn-clrout" id="bd-clear-output" style="display:none" title="Clear output panel">&#10005; Clear</button>',
    '    <span class="bd-status-pill" id="bd-status">Ready — drop an image to begin</span>',
    '  </div>',

    /* ── OUTPUT TEXTAREA ── */
    '  <div class="bd-output-wrap" style="display:none">',
    '    <textarea id="bd-output" class="bd-output" spellcheck="false" readonly></textarea>',
    '  </div>',

    /* ══════════════════════════════════════════════════════════════
       RIGHT-CLICK CONTEXT MENU  — Windows-10-style native popup
       Structure: header (pin info when on pin) → actions → divider → modes → divider → export
       All items use checkmark column for active state
       ══════════════════════════════════════════════════════════════ */
    '  <div id="bd-ctx-menu" class="bd-ctx-menu" style="display:none">',

    /* ── PIN HEADER (shown only when right-clicking a pin) ── */
    '    <div class="bd-ctx-header" id="bd-ctx-header">',
    '      <span class="bd-ctx-header-icon">&#127919;</span>',
    '      <span class="bd-ctx-header-text" id="bd-ctx-header-text">Pin 1</span>',
    '    </div>',

    /* ── PIN ACTIONS (shown only when right-clicking a pin) ── */
    '    <div id="bd-ctx-pin-group">',
    '      <button class="bd-ctx-item" id="bd-ctx-label">',
    '        <span class="bd-ctx-check"></span>',
    '        <span class="bd-ctx-item-icon">&#9998;</span>',
    '        <span class="bd-ctx-item-text">Edit Label</span>',
    '        <span class="bd-ctx-item-hint">double-click</span>',
    '      </button>',
    '      <button class="bd-ctx-item" id="bd-ctx-toggle-label">',
    '        <span class="bd-ctx-check" id="bd-ctx-chk-label"></span>',
    '        <span class="bd-ctx-item-icon">&#9673;</span>',
    '        <span class="bd-ctx-item-text" id="bd-ctx-tlbl-text">Show Label</span>',
    '        <span class="bd-ctx-item-hint"></span>',
    '      </button>',
    '      <button class="bd-ctx-item" id="bd-ctx-moveup">',
    '        <span class="bd-ctx-check"></span>',
    '        <span class="bd-ctx-item-icon">&#8593;</span>',
    '        <span class="bd-ctx-item-text">Move Up</span>',
    '        <span class="bd-ctx-item-hint"></span>',
    '      </button>',
    '      <button class="bd-ctx-item" id="bd-ctx-movedn">',
    '        <span class="bd-ctx-check"></span>',
    '        <span class="bd-ctx-item-icon">&#8595;</span>',
    '        <span class="bd-ctx-item-text">Move Down</span>',
    '        <span class="bd-ctx-item-hint"></span>',
    '      </button>',
    '      <button class="bd-ctx-item bd-ctx-item-danger" id="bd-ctx-delete">',
    '        <span class="bd-ctx-check"></span>',
    '        <span class="bd-ctx-item-icon">&#10005;</span>',
    '        <span class="bd-ctx-item-text">Delete Pin</span>',
    '        <span class="bd-ctx-item-hint">Del</span>',
    '      </button>',
    '    </div>',
    '    <div class="bd-ctx-divider" id="bd-ctx-div-pin"></div>',

    /* ── EDIT ACTIONS (always visible) ── */
    '    <button class="bd-ctx-item" id="bd-ctx-undo">',
    '        <span class="bd-ctx-check"></span>',
    '        <span class="bd-ctx-item-icon">&#8630;</span>',
    '        <span class="bd-ctx-item-text">Undo</span>',
    '        <span class="bd-ctx-item-hint">Ctrl+Z</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-redo">',
    '        <span class="bd-ctx-check"></span>',
    '        <span class="bd-ctx-item-icon">&#8631;</span>',
    '        <span class="bd-ctx-item-text">Redo</span>',
    '        <span class="bd-ctx-item-hint">Ctrl+Y</span>',
    '    </button>',
    '    <button class="bd-ctx-item bd-ctx-item-danger" id="bd-ctx-clear-pins">',
    '        <span class="bd-ctx-check"></span>',
    '        <span class="bd-ctx-item-icon">&#9108;</span>',
    '        <span class="bd-ctx-item-text">Clear All Pins</span>',
    '        <span class="bd-ctx-item-hint">X</span>',
    '    </button>',
    '    <div class="bd-ctx-divider"></div>',

    /* ── VIEW TOGGLES (checkmark = active) ── */
    '    <button class="bd-ctx-item" id="bd-ctx-live-toggle">',
    '      <span class="bd-ctx-check bd-ctx-checked" id="bd-ctx-chk-live">&#10003;</span>',
    '      <span class="bd-ctx-item-icon">&#9673;</span>',
    '      <span class="bd-ctx-item-text">Live Labels</span>',
    '      <span class="bd-ctx-item-hint">V</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-labels-vis">',
    '      <span class="bd-ctx-check bd-ctx-checked" id="bd-ctx-chk-labels">&#10003;</span>',
    '      <span class="bd-ctx-item-icon">&#9673;</span>',
    '      <span class="bd-ctx-item-text">Label Overlay</span>',
    '      <span class="bd-ctx-item-hint">L</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-crosshair">',
    '      <span class="bd-ctx-check bd-ctx-checked" id="bd-ctx-chk-cross">&#10003;</span>',
    '      <span class="bd-ctx-item-icon">&#10011;</span>',
    '      <span class="bd-ctx-item-text">Crosshair</span>',
    '      <span class="bd-ctx-item-hint">C</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-grid">',
    '      <span class="bd-ctx-check" id="bd-ctx-chk-grid"></span>',
    '      <span class="bd-ctx-item-icon">&#9638;</span>',
    '      <span class="bd-ctx-item-text" id="bd-ctx-grid-text">Grid: Off</span>',
    '      <span class="bd-ctx-item-hint">G</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-snap">',
    '      <span class="bd-ctx-check" id="bd-ctx-chk-snap"></span>',
    '      <span class="bd-ctx-item-icon">&#8862;</span>',
    '      <span class="bd-ctx-item-text">Snap to Grid</span>',
    '      <span class="bd-ctx-item-hint">S</span>',
    '    </button>',
    '    <div class="bd-ctx-divider"></div>',

    /* ── EXPORT ── */
    '    <button class="bd-ctx-item" id="bd-ctx-exp-ai">',
    '      <span class="bd-ctx-check"></span>',
    '      <span class="bd-ctx-item-icon">&#129302;</span>',
    '      <span class="bd-ctx-item-text">Export AI Prompt</span>',
    '      <span class="bd-ctx-item-hint">A</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-exp-json">',
    '      <span class="bd-ctx-check"></span>',
    '      <span class="bd-ctx-item-icon">{ }</span>',
    '      <span class="bd-ctx-item-text">Export JSON</span>',
    '      <span class="bd-ctx-item-hint">J</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-exp-css">',
    '      <span class="bd-ctx-check"></span>',
    '      <span class="bd-ctx-item-icon">#</span>',
    '      <span class="bd-ctx-item-text">Export CSS</span>',
    '      <span class="bd-ctx-item-hint">K</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-exp-css-lbl">',
    '      <span class="bd-ctx-check"></span>',
    '      <span class="bd-ctx-item-icon">&#9998;</span>',
    '      <span class="bd-ctx-item-text">Export CSS + Labels</span>',
    '      <span class="bd-ctx-item-hint">&#8679;K</span>',
    '    </button>',

    '  </div>',

    /* ── MODALS ── */
    '  <div id="bd-label-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal">',
    '      <div class="bd-modal-title">&#9998; Edit Pin Label</div>',
    '      <input type="text" id="bd-label-input" class="bd-modal-input" placeholder="e.g. left eye, CTA button, hero anchor" maxlength="60" spellcheck="false">',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-label-save">Save</button>',
    '        <button class="bd-btn"             id="bd-label-cancel">Cancel</button>',
    '      </div>',
    '    </div>',
    '  </div>',

    '  <div id="bd-import-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal bd-modal-wide">',
    '      <div class="bd-modal-title">&#8659; Import Label List</div>',
    '      <div class="bd-modal-desc">Paste a JSON array or numbered plain text. Labels fill slots 1&ndash;20 in order. AI can generate this list &mdash; just ask.</div>',
    '      <textarea id="bd-import-textarea" class="bd-modal-textarea" placeholder=\'["left eye", "right eye", "nose tip"]\nor:\n1. Left eye\n2. Right eye\' spellcheck="false"></textarea>',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-import-apply">Apply to Slots</button>',
    '        <button class="bd-btn"             id="bd-import-clear">Clear All Slots</button>',
    '        <button class="bd-btn"             id="bd-import-cancel">Cancel</button>',
    '      </div>',
    '      <div class="bd-modal-hint" id="bd-import-status"></div>',
    '    </div>',
    '  </div>',

    '  <div id="bd-ai-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal bd-modal-wide">',
    '      <div class="bd-modal-title">&#129302; AI Meet Ducky</div>',
    '      <div class="bd-modal-desc">Paste this into any AI chat (ChatGPT, Claude, Gemini&hellip;) and the AI instantly understands your coordinate plotter.</div>',
    '      <textarea id="bd-ai-prompt-box" class="bd-modal-textarea bd-modal-textarea-tall" spellcheck="false" readonly></textarea>',
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
     2. DUCK IMAGE PATH
     ════════════════════════════════════════════════════════════════ */
  if (typeof DUCK_IMG === 'undefined') {
    var _s = (document.currentScript || {}).src || '';
    var _d = _s.substring(0, _s.lastIndexOf('/') + 1);
    root.DUCK_IMG = _d ? (_d + '../../ducky.png') : './ducky.png';
  }


  /* ════════════════════════════════════════════════════════════════
     3. INLINE CSS
     Design tokens:
       gold   = #c5a059   headers, active states, pin numbers
       white  = #e8e8e8   all primary body text
       dim    = #9a9a9a   secondary / description text
       muted  = #555      disabled / placeholder
       bg0    = #0a0a0a   panel bg
       bg1    = #111      button bg
       border = #242424   standard borders
     ════════════════════════════════════════════════════════════════ */
  (function () {
    if (document.getElementById('bd-ducky-inline')) return;
    var st = document.createElement('style');
    st.id  = 'bd-ducky-inline';
    st.textContent = [

      /* root */
      '#bd-module-root{display:block;height:100%}',
      '#bd-wrap{display:flex;flex-direction:column;height:100%;background:#000;color:#e8e8e8;font-family:"Rajdhani","Share Tech Mono",sans-serif;overflow:hidden;position:relative}',

      /* ── TOOLBAR ── */
      '.bd-toolbar{display:flex;align-items:center;gap:7px;padding:6px 12px;background:#0a0a0a;border-bottom:1px solid #222;flex-shrink:0;flex-wrap:wrap}',
      '.bd-toolbar-left,.bd-toolbar-right{display:flex;gap:5px;align-items:center}',
      '.bd-toolbar-center{flex:1;display:flex;justify-content:center;align-items:center;gap:10px}',
      '.bd-module-badge{font-family:"Oswald",sans-serif;font-size:13px;font-weight:700;color:#c5a059;letter-spacing:3px;text-transform:uppercase;padding-right:10px;border-right:1px solid #262626;margin-right:4px;white-space:nowrap}',

      /* ── BUTTONS ── */
      '.bd-btn{background:#131313;border:1px solid #2c2c2c;color:#d0d0d0;font-family:"Share Tech Mono",monospace;font-size:14px;letter-spacing:.8px;padding:5px 11px;border-radius:3px;cursor:pointer;transition:all .13s;white-space:nowrap;text-transform:uppercase;line-height:1.4}',
      '.bd-btn:hover:not(:disabled){background:#1c1c1c;border-color:#4a4a4a;color:#ffffff}',
      '.bd-btn:disabled{opacity:.32;cursor:not-allowed}',
      '.bd-btn-active{border-color:#c5a059 !important;color:#c5a059 !important;background:rgba(197,160,89,.12) !important}',
      '.bd-btn-gold{background:rgba(197,160,89,.12);border-color:rgba(197,160,89,.5);color:#c5a059;font-weight:700}',
      '.bd-btn-gold:hover:not(:disabled){background:rgba(197,160,89,.25)}',
      '.bd-btn-ai{background:rgba(100,180,255,.07);border-color:rgba(100,180,255,.35);color:#90d0ff;font-weight:700}',
      '.bd-btn-ai:hover:not(:disabled){background:rgba(100,180,255,.18);color:#b8e4ff}',
      '.bd-btn-sm{font-size:13px;padding:4px 10px}',
      '.bd-btn-export{min-width:46px}',
      '.bd-btn-clrout{background:rgba(220,60,60,.08);border-color:rgba(220,60,60,.35)!important;color:#e06060!important}',
      '.bd-btn-clrout:hover:not(:disabled){background:rgba(220,60,60,.18)!important;color:#ff8888!important;border-color:rgba(220,60,60,.6)!important}',

      /* ── COORD PILLS ── */
      '.bd-coord-pill,.bd-count-pill{font-family:"Share Tech Mono",monospace;font-size:14px;letter-spacing:1px;padding:3px 10px;border-radius:3px;border:1px solid #333;background:#0c0c0c;color:#c5a059;white-space:nowrap}',
      '.bd-count-pill{color:#6ed4ff;border-color:rgba(92,200,255,.3)}',
      '.bd-status-pill{font-family:"Share Tech Mono",monospace;font-size:13px;letter-spacing:.4px;color:#bbbbbb;white-space:nowrap;margin-left:auto;overflow:hidden;text-overflow:ellipsis;max-width:440px}',

      /* ── URL BAR ── */
      '.bd-url-bar{display:flex;gap:6px;padding:5px 12px;background:#0a0a0a;border-bottom:1px solid #1c1c1c;flex-shrink:0;align-items:center}',
      '.bd-url-input{flex:1;background:#0d0d0d;border:1px solid #2e2e2e;color:#e8e8e8;font-family:"Share Tech Mono",monospace;font-size:14px;padding:6px 10px;border-radius:3px;outline:none;letter-spacing:.4px;min-width:0}',
      '.bd-url-input:focus{border-color:rgba(197,160,89,.6);box-shadow:0 0 0 1px rgba(197,160,89,.12)}',
      '.bd-url-input::placeholder{color:#777777}',
      '.bd-url-spacer{flex:0 0 8px}',

      /* ── BODY ── */
      '.bd-body{flex:1;display:flex;min-height:0;overflow:hidden}',

      /* ── CANVAS AREA ── */
      '.bd-canvas-area{flex:1;position:relative;overflow:auto;background:#050505;display:flex;align-items:center;justify-content:center;min-height:0;min-width:0}',
      '.bd-drop-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;height:100%;border:2px dashed #1e1e1e;border-radius:4px;cursor:pointer;transition:border-color .2s,background .2s;position:absolute;inset:0}',
      '.bd-drop-zone:hover,.bd-drag-over{border-color:rgba(197,160,89,.45);background:rgba(197,160,89,.03)}',
      '.bd-drop-icon{font-size:3rem;opacity:.22;pointer-events:none}',
      '.bd-drop-title{font-family:"Oswald",sans-serif;font-size:1.1rem;color:#aaaaaa;letter-spacing:3px;text-transform:uppercase;pointer-events:none}',
      '.bd-drop-sub{font-family:"Share Tech Mono",monospace;font-size:13px;color:#888888;letter-spacing:.8px;pointer-events:none}',
      '.bd-drop-hint{font-family:"Share Tech Mono",monospace;font-size:12px;color:#777777;letter-spacing:.5px;pointer-events:none}',
      '.bd-image-area{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:absolute;inset:0;overflow:auto;padding:12px}',
      '.bd-image-wrap{position:relative;display:inline-block;cursor:none;max-width:100%;max-height:100%;flex-shrink:0}',
      '.bd-main-img{display:block;max-width:100%;max-height:calc(100vh - 200px);width:auto;height:auto;pointer-events:none;user-select:none}',
      '.bd-canvas-overlay{position:absolute;top:0;left:0;pointer-events:none}',
      '.bd-cursor-canvas{z-index:10}',
      '.bd-grid-canvas{z-index:5}',
      '.bd-points-layer{position:absolute;inset:0;pointer-events:none;z-index:20}',

      /* ════════════════════════════════════════════════════════
         RIGHT PANEL
         normal: 270px  |  expanded: 370px  |  collapsed: 30px
         ════════════════════════════════════════════════════════ */
      '.bd-panel{width:270px;flex-shrink:0;background:#0a0a0a;border-left:1px solid #1e1e1e;display:flex;flex-direction:column;overflow:hidden;transition:width .22s cubic-bezier(.4,0,.2,1)}',
      '.bd-panel.bd-lp-expanded{width:370px}',
      '.bd-panel.bd-lp-collapsed{width:30px}',

      /* panel top bar */
      '.bd-panel-topbar{display:flex;align-items:center;gap:4px;padding:8px 8px 7px;border-bottom:1px solid #1c1c1c;flex-shrink:0;min-height:36px}',
      '.bd-panel-brand{font-family:"Oswald",sans-serif;font-size:14px;font-weight:700;color:#c5a059;letter-spacing:2.5px;text-transform:uppercase;flex:1;white-space:nowrap;overflow:hidden}',
      '.bd-panel-iconbtn{background:#131313;border:1px solid #2e2e2e;color:#cccccc;font-size:13px;padding:3px 8px;border-radius:2px;cursor:pointer;transition:all .13s;white-space:nowrap;font-family:"Share Tech Mono",monospace;letter-spacing:.5px}',
      '.bd-panel-iconbtn:hover{color:#ffffff;border-color:#4a4a4a;background:#1c1c1c}',
      '.bd-btn-lp-import{background:rgba(92,200,255,.08);border-color:rgba(92,200,255,.35)!important;color:#6dd4ff!important;font-size:13px}',
      '.bd-btn-lp-import:hover{background:rgba(92,200,255,.18)!important;color:#a0e8ff!important}',
      '.bd-btn-lp-clr{background:rgba(255,90,90,.05);border-color:rgba(255,90,90,.3)!important;color:#dd6666!important;font-size:13px}',
      '.bd-btn-lp-clr:hover{color:#ff8888!important;border-color:rgba(255,90,90,.5)!important}',

      /* ── TAB BAR ── */
      '.bd-tab-bar{display:flex;border-bottom:1px solid #1c1c1c;flex-shrink:0;background:#080808}',
      '.bd-tab{flex:1;background:none;border:none;border-bottom:2px solid transparent;color:#aaaaaa;font-family:"Share Tech Mono",monospace;font-size:13px;letter-spacing:1.2px;text-transform:uppercase;padding:8px 4px;cursor:pointer;transition:all .13s}',
      '.bd-tab:hover{color:#dddddd;background:rgba(255,255,255,.04)}',
      '.bd-tab.bd-tab-active{color:#c5a059;border-bottom-color:#c5a059;background:rgba(197,160,89,.05)}',

      /* ── TAB PANES ── */
      '.bd-tab-pane{flex:1;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column}',
      '.bd-tab-pane-hidden{display:none!important}',
      '.bd-tab-pane::-webkit-scrollbar{width:3px}',
      '.bd-tab-pane::-webkit-scrollbar-track{background:#060606}',
      '.bd-tab-pane::-webkit-scrollbar-thumb{background:#222;border-radius:2px}',

      /* ── LABELS TAB controls row ── */
      '.bd-pane-controls{display:flex;align-items:center;gap:5px;padding:7px 10px;border-bottom:1px solid #141414;flex-shrink:0;background:#080808;flex-wrap:wrap}',
      '.bd-pane-label{font-family:"Share Tech Mono",monospace;font-size:13px;color:#cccccc;letter-spacing:1.2px;text-transform:uppercase;flex:1}',
      '.bd-pill{background:#111;border:1px solid #2e2e2e;color:#cccccc;font-family:"Share Tech Mono",monospace;font-size:13px;padding:3px 10px;border-radius:2px;cursor:pointer;transition:all .13s;white-space:nowrap}',
      '.bd-pill:hover{border-color:#4a4a4a;color:#ffffff}',
      '.bd-pill-on{border-color:#c5a059!important;color:#c5a059!important;background:rgba(197,160,89,.09)!important}',

      /* ── LABEL ROWS — the key readability target ── */
      '.bd-lp-list{flex:1;overflow-y:auto;overflow-x:hidden;padding:2px 0}',
      '.bd-lp-list::-webkit-scrollbar{width:3px}',
      '.bd-lp-list::-webkit-scrollbar-track{background:#060606}',
      '.bd-lp-list::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px}',
      '.bd-lp-row{display:flex;align-items:center;gap:7px;padding:5px 10px;transition:background .12s}',
      '.bd-lp-row:hover{background:rgba(197,160,89,.05)}',
      '.bd-lp-row.bd-lp-pinned{background:rgba(197,160,89,.08)}',
      /* slot number: was .6rem #333 → now 13px #888 */
      '.bd-lp-num{font-family:"Share Tech Mono",monospace;font-size:13px;color:#999999;width:22px;text-align:right;flex-shrink:0;letter-spacing:.5px}',
      '.bd-lp-row.bd-lp-pinned .bd-lp-num{color:#c5a059;font-weight:700}',
      /* input: was .6rem #d8d8d8 → now 13px #e8e8e8 */
      '.bd-lp-input{flex:1;background:transparent;border:none;border-bottom:1px solid #222;color:#e8e8e8;font-family:"Share Tech Mono",monospace;font-size:13px;padding:4px 5px 3px;outline:none;letter-spacing:.3px;width:100%;min-width:0;transition:border-color .13s}',
      '.bd-lp-input:focus{border-bottom-color:rgba(197,160,89,.55);color:#fff}',
      '.bd-lp-input::placeholder{color:#777777;font-size:12px}',
      '.bd-lp-row.bd-lp-pinned .bd-lp-input{color:#c5a059}',
      /* EXPANDED: bump to 15px */
      '.bd-lp-expanded .bd-lp-input{font-size:15px}',
      '.bd-lp-expanded .bd-lp-num{font-size:14px;width:24px}',
      '.bd-lp-expanded .bd-lp-row{padding:6px 14px}',
      /* dots */
      '.bd-lp-dot{width:6px;height:6px;border-radius:50%;background:transparent;flex-shrink:0;transition:background .15s,box-shadow .15s}',
      '.bd-lp-dot.bd-lp-dot-next{background:#c5a059;box-shadow:0 0 7px rgba(197,160,89,.75)}',
      '.bd-lp-dot.bd-lp-dot-placed{background:#00e87a;box-shadow:0 0 5px rgba(0,232,122,.6)}',

      /* ── MODES TAB ── */
      '.bd-mode-list{padding:6px 0;border-bottom:1px solid #141414}',
      '.bd-mode-row{display:flex;align-items:center;gap:10px;padding:10px 12px;transition:background .12s}',
      '.bd-mode-row:hover{background:rgba(255,255,255,.025)}',
      '.bd-mode-info{flex:1;min-width:0}',
      /* mode name: 13px #e8e8e8 */
      '.bd-mode-name{display:block;font-family:"Share Tech Mono",monospace;font-size:13px;color:#e8e8e8;letter-spacing:.4px;margin-bottom:3px}',
      /* mode desc: 11px #7a7a7a */
      '.bd-mode-desc{display:block;font-family:"Share Tech Mono",monospace;font-size:12px;color:#bbbbbb;letter-spacing:.3px}',
      '.bd-mode-section-title{font-family:"Share Tech Mono",monospace;font-size:12px;color:#888888;letter-spacing:2.5px;text-transform:uppercase;padding:14px 12px 5px}',

      /* shortcut list */
      '.bd-shortcut-list{padding:2px 0 12px}',
      '.bd-sc-row{display:flex;align-items:center;gap:10px;padding:5px 12px}',
      '.bd-sc-key{font-family:"Share Tech Mono",monospace;font-size:13px;color:#c5a059;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:3px;padding:2px 8px;white-space:nowrap;flex-shrink:0;min-width:52px;text-align:center}',
      /* shortcut desc: 12px #9a9a9a */
      '.bd-sc-desc{font-family:"Share Tech Mono",monospace;font-size:13px;color:#cccccc;letter-spacing:.3px}',

      /* ── EXPORT TAB ── */
      '.bd-export-section{padding:10px 10px 5px}',
      '.bd-export-section-title{font-family:"Share Tech Mono",monospace;font-size:12px;color:#888888;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:7px}',
      '.bd-export-btn{display:flex;align-items:center;gap:11px;width:100%;background:#0f0f0f;border:1px solid #272727;border-radius:3px;padding:10px 11px;cursor:pointer;transition:all .13s;margin-bottom:5px;text-align:left}',
      '.bd-export-btn:hover:not(:disabled){background:#171717;border-color:#3e3e3e}',
      '.bd-export-btn:disabled{opacity:.28;cursor:not-allowed}',
      '.bd-export-btn-icon{font-family:"Share Tech Mono",monospace;font-size:15px;color:#c5a059;width:22px;text-align:center;flex-shrink:0}',
      '.bd-export-btn-body{flex:1;min-width:0}',
      /* export name: 13px #e8e8e8 */
      '.bd-export-btn-name{display:block;font-family:"Share Tech Mono",monospace;font-size:13px;color:#e8e8e8;letter-spacing:.4px;margin-bottom:2px}',
      /* export desc: 11px #7a7a7a */
      '.bd-export-btn-desc{display:block;font-family:"Share Tech Mono",monospace;font-size:12px;color:#bbbbbb;letter-spacing:.3px}',
      '.bd-export-btn-key{font-family:"Share Tech Mono",monospace;font-size:12px;color:#999999;background:#0c0c0c;border:1px solid #2a2a2a;border-radius:2px;padding:2px 6px;white-space:nowrap;flex-shrink:0}',
      '.bd-export-btn:hover .bd-export-btn-key{color:#777;border-color:#383838}',
      '.bd-export-btn:hover .bd-export-btn-name{color:#fff}',
      '.bd-export-btn-labeled{border-color:rgba(92,200,255,.22)!important}',
      '.bd-export-btn-labeled .bd-export-btn-icon{color:#5cc8ff}',
      '.bd-export-btn-labeled:hover:not(:disabled){border-color:rgba(92,200,255,.42)!important}',
      '.bd-export-btn-copy{border-color:rgba(197,160,89,.22)!important}',
      '.bd-export-btn-copy:hover:not(:disabled){border-color:rgba(197,160,89,.42)!important}',
      '.bd-export-btn-ai{border-color:rgba(100,180,255,.2)!important}',
      '.bd-export-btn-ai .bd-export-btn-icon{color:#80c8ff}',
      '.bd-export-btn-ai:hover:not(:disabled){border-color:rgba(100,180,255,.4)!important;background:rgba(100,180,255,.04)!important}',

      /* collapsed rail */
      '.bd-lp-rail{width:30px;display:flex;flex-direction:column;align-items:center;background:#060606;height:100%;border-left:1px solid #111}',
      '.bd-btn-rail{width:100%;background:none;border:none;color:#777777;font-family:"Share Tech Mono",monospace;font-size:12px;letter-spacing:1.5px;cursor:pointer;padding:14px 0 8px;text-align:center;line-height:2;transition:color .15s}',
      '.bd-btn-rail:hover{color:#c5a059}',

      /* ── BOTTOM OUTPUT BAR ── */
      '.bd-output-bar{display:flex;align-items:center;gap:6px;padding:5px 12px;background:#0a0a0a;border-top:1px solid #1e1e1e;flex-shrink:0;flex-wrap:wrap}',
      '.bd-output-bar-label{font-family:"Share Tech Mono",monospace;font-size:14px;color:#bbbbbb;letter-spacing:2px;text-transform:uppercase;margin-right:2px}',
      '.bd-output-wrap{flex-shrink:0;border-top:1px solid #1e1e1e}',
      '.bd-output{width:100%;height:140px;background:#030303;border:none;color:#00e87a;font-family:"Share Tech Mono",monospace;font-size:13px;padding:10px 14px;resize:none;outline:none;line-height:1.7;letter-spacing:.3px;display:block}',

      /* ── PINS ── */
      '.bd-pin{position:absolute;width:22px;height:22px;transform:translate(-50%,-50%);pointer-events:all;cursor:grab}',
      '.bd-pin:active{cursor:grabbing}',
      '.bd-pin-dot{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:5px;height:5px;border-radius:50%;background:#e2b96f;box-shadow:0 0 0 1px #000,0 0 0 2px rgba(197,160,89,.7);transition:width .1s,height .1s,box-shadow .1s}',
      '.bd-pin:hover .bd-pin-dot{width:7px;height:7px;background:#fff;box-shadow:0 0 0 1.5px #000,0 0 0 3px #c5a059,0 0 10px rgba(197,160,89,.6)}',
      '.bd-pin-num{position:absolute;bottom:calc(50% + 7px);left:50%;transform:translateX(-50%);font-family:"Share Tech Mono",monospace;font-size:13px;color:#f0c060;background:rgba(0,0,0,.92);padding:2px 5px;border-radius:2px;white-space:nowrap;pointer-events:none;line-height:1.3;letter-spacing:.5px;border:1px solid rgba(197,160,89,.3)}',
      '.bd-pin-label{position:absolute;top:calc(50% + 7px);left:50%;transform:translateX(-50%);font-family:"Share Tech Mono",monospace;font-size:13px;color:#7adeff;background:rgba(0,0,0,.92);padding:2px 7px;border-radius:2px;white-space:nowrap;pointer-events:none;border:1px solid rgba(92,200,255,.45);letter-spacing:.4px;transition:opacity .18s}',
      '.bd-pin-label.bd-label-hidden{opacity:0;pointer-events:none}',

      /* ════════════════════════════════════════════════════════
         CONTEXT MENU — Windows-10-style
         Clean card, proper item height, checkmark column,
         keyboard hint right-aligned, danger items in red,
         no section label clutter — just clean dividers
         ════════════════════════════════════════════════════════ */
      '.bd-ctx-menu{position:fixed;background:#1a1a1a;border:1px solid #303030;border-radius:6px;padding:4px 0;z-index:9999;min-width:230px;max-width:280px;box-shadow:0 8px 32px rgba(0,0,0,.85),0 2px 8px rgba(0,0,0,.6);user-select:none}',

      /* pin header — gold banner when on a pin */
      '.bd-ctx-header{display:flex;align-items:center;gap:8px;padding:8px 12px 7px;border-bottom:1px solid #2a2a2a;margin-bottom:3px}',
      '.bd-ctx-header-icon{font-size:14px;flex-shrink:0}',
      '.bd-ctx-header-text{font-family:"Share Tech Mono",monospace;font-size:12px;color:#c5a059;letter-spacing:1px;font-weight:700;flex:1}',

      /* divider */
      '.bd-ctx-divider{height:1px;background:#2a2a2a;margin:3px 0}',

      /* menu item */
      '.bd-ctx-item{display:grid;grid-template-columns:20px 22px 1fr auto;align-items:center;width:100%;padding:6px 10px 6px 8px;background:none;border:none;cursor:pointer;text-align:left;transition:background .08s;gap:4px;min-height:32px}',
      '.bd-ctx-item:hover:not(:disabled){background:rgba(255,255,255,.06)}',
      '.bd-ctx-item:active:not(:disabled){background:rgba(255,255,255,.1)}',
      '.bd-ctx-item:disabled{opacity:.3;cursor:default}',

      /* checkmark column */
      '.bd-ctx-check{font-size:12px;color:#c5a059;text-align:center;width:16px;flex-shrink:0}',
      '.bd-ctx-checked{color:#c5a059}',

      /* icon column */
      '.bd-ctx-item-icon{font-size:13px;color:#888;text-align:center;width:18px;flex-shrink:0}',
      '.bd-ctx-item:hover .bd-ctx-item-icon{color:#c5c5c5}',

      /* text */
      '.bd-ctx-item-text{font-family:"Rajdhani","Share Tech Mono",sans-serif;font-size:14px;color:#e0e0e0;letter-spacing:.3px;white-space:nowrap}',
      '.bd-ctx-item:hover .bd-ctx-item-text{color:#ffffff}',

      /* hint (keyboard shortcut) */
      '.bd-ctx-item-hint{font-family:"Share Tech Mono",monospace;font-size:12px;color:#aaaaaa;letter-spacing:.5px;white-space:nowrap;text-align:right}',
      '.bd-ctx-item:hover .bd-ctx-item-hint{color:#cccccc}',

      /* danger variant */
      '.bd-ctx-item-danger .bd-ctx-item-text{color:#cc5555}',
      '.bd-ctx-item-danger .bd-ctx-item-icon{color:#cc5555}',
      '.bd-ctx-item-danger:hover:not(:disabled){background:rgba(200,60,60,.12)!important}',
      '.bd-ctx-item-danger:hover .bd-ctx-item-text{color:#ff7777}',
      '.bd-ctx-item-danger:hover .bd-ctx-item-icon{color:#ff7777}',

      /* ── MODALS ── */
      '.bd-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;z-index:9100;backdrop-filter:blur(6px)}',
      '.bd-modal{background:#0e0e0e;border:1px solid rgba(197,160,89,.3);border-radius:5px;padding:24px 26px;min-width:320px;box-shadow:0 20px 70px rgba(0,0,0,.95)}',
      '.bd-modal-wide{min-width:460px;max-width:580px}',
      '.bd-modal-title{font-family:"Oswald",sans-serif;font-size:14px;font-weight:700;color:#c5a059;letter-spacing:3px;text-transform:uppercase;margin-bottom:14px}',
      '.bd-modal-desc{font-family:"Share Tech Mono",monospace;font-size:13px;color:#aaaaaa;line-height:1.75;margin-bottom:14px;letter-spacing:.3px}',
      '.bd-modal-input{width:100%;background:#090909;border:1px solid #2e2e2e;color:#e8e8e8;font-family:"Share Tech Mono",monospace;font-size:14px;padding:9px 11px;border-radius:3px;outline:none;margin-bottom:14px;letter-spacing:.3px}',
      '.bd-modal-input:focus{border-color:rgba(197,160,89,.6)}',
      '.bd-modal-textarea{width:100%;height:120px;background:#090909;border:1px solid #2e2e2e;color:#5cc8ff;font-family:"Share Tech Mono",monospace;font-size:12px;padding:9px 11px;border-radius:3px;outline:none;resize:vertical;margin-bottom:14px;line-height:1.65;letter-spacing:.3px}',
      '.bd-modal-textarea-tall{height:210px;color:#aaa}',
      '.bd-modal-textarea:focus{border-color:rgba(92,200,255,.4)}',
      '.bd-modal-actions{display:flex;gap:9px;justify-content:flex-end;flex-wrap:wrap}',
      '.bd-modal-hint{font-family:"Share Tech Mono",monospace;font-size:13px;color:#888888;margin-top:10px;letter-spacing:.3px;min-height:1em}',

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
  var points=[], undoStack=[], redoStack=[], labelSlots=[];
  var imgNatW=0, imgNatH=0, imgDispW=0, imgDispH=0;
  var imgLoaded=false, ctxMenuOpen=false, ctxTargetIdx=-1;
  var gridMode='none', showCrosshair=true, labelsVisible=true;
  var liveLabelMode=true, snapToGrid=false;
  var isDragging=false, dragIdx=-1, dragOffX=0, dragOffY=0;
  var crosshairSize=60, CROSS_MIN=20, CROSS_MAX=200;
  var panelState='normal', activeTab='labels';

  for (var _i=0; _i<MAX_LABELS; _i++) labelSlots.push('');


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
  /* bottom bar exports */
  var $exportCss      = _q('#bd-export-css');
  var $exportJson     = _q('#bd-export-json');
  var $exportAi       = _q('#bd-export-ai');
  var $copyAll        = _q('#bd-copy-all');
  var $clearOutput    = _q('#bd-clear-output');
  var $outputBox      = _q('#bd-output');
  /* panel export */
  var $pxExpAi        = _q('#bd-px-exp-ai');
  var $pxExpJson      = _q('#bd-px-exp-json');
  var $pxExpCss       = _q('#bd-px-exp-css');
  var $pxExpCssLbl    = _q('#bd-px-exp-css-lbl');
  var $pxCopy         = _q('#bd-px-copy');
  var $pxAiMeet       = _q('#bd-px-ai-meet');
  /* context menu */
  var $ctxMenu        = _q('#bd-ctx-menu');
  var $ctxHeader      = _q('#bd-ctx-header');
  var $ctxHeaderText  = _q('#bd-ctx-header-text');
  var $ctxPinGroup    = _q('#bd-ctx-pin-group');
  var $ctxDivPin      = _q('#bd-ctx-div-pin');
  var $ctxDelete      = _q('#bd-ctx-delete');
  var $ctxLabel       = _q('#bd-ctx-label');
  var $ctxToggleLabel = _q('#bd-ctx-toggle-label');
  var $ctxTlblText    = _q('#bd-ctx-tlbl-text');
  var $ctxChkLabel    = _q('#bd-ctx-chk-label');
  var $ctxMoveUp      = _q('#bd-ctx-moveup');
  var $ctxMoveDn      = _q('#bd-ctx-movedn');
  var $ctxUndo        = _q('#bd-ctx-undo');
  var $ctxRedo        = _q('#bd-ctx-redo');
  var $ctxClearPins   = _q('#bd-ctx-clear-pins');
  var $ctxLiveToggle  = _q('#bd-ctx-live-toggle');
  var $ctxChkLive     = _q('#bd-ctx-chk-live');
  var $ctxLabelsVis   = _q('#bd-ctx-labels-vis');
  var $ctxChkLabels   = _q('#bd-ctx-chk-labels');
  var $ctxCrosshair   = _q('#bd-ctx-crosshair');
  var $ctxChkCross    = _q('#bd-ctx-chk-cross');
  var $ctxGrid        = _q('#bd-ctx-grid');
  var $ctxChkGrid     = _q('#bd-ctx-chk-grid');
  var $ctxGridText    = _q('#bd-ctx-grid-text');
  var $ctxSnap        = _q('#bd-ctx-snap');
  var $ctxChkSnap     = _q('#bd-ctx-chk-snap');
  var $ctxExpAi       = _q('#bd-ctx-exp-ai');
  var $ctxExpJson     = _q('#bd-ctx-exp-json');
  var $ctxExpCss      = _q('#bd-ctx-exp-css');
  var $ctxExpCssLbl   = _q('#bd-ctx-exp-css-lbl');
  /* modals */
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
  /* toolbar */
  var $gridBtn        = _q('#bd-grid-btn');
  var $snapBtn        = _q('#bd-snap-btn');
  var $crossBtn       = _q('#bd-cross-btn');
  var $labelsBtn      = _q('#bd-labels-btn');
  var $liveBtn        = _q('#bd-live-btn');
  /* panel */
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
  /* modes tab mirrors */
  var $modeLive       = _q('#bd-mode-live');
  var $modeLabels     = _q('#bd-mode-labels');
  var $modeCross      = _q('#bd-mode-cross');
  var $modeGrid       = _q('#bd-mode-grid');
  var $modeSnap       = _q('#bd-mode-snap');
  /* tab panes */
  var $paneLabels     = _q('#bd-pane-labels');
  var $paneModes      = _q('#bd-pane-modes');
  var $paneExport     = _q('#bd-pane-export');
  var $tabLabels      = _q('#bd-tab-labels');
  var $tabModes       = _q('#bd-tab-modes');
  var $tabExport      = _q('#bd-tab-export');
  /* misc */
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
     8. TAB SWITCHING
     ════════════════════════════════════════════════════════════════ */
  function _setTab(tab) {
    activeTab = tab;
    var panes = {labels:$paneLabels, modes:$paneModes, export:$paneExport};
    var tabs  = {labels:$tabLabels,  modes:$tabModes,  export:$tabExport};
    Object.keys(panes).forEach(function(k){ if(panes[k]) panes[k].classList.toggle('bd-tab-pane-hidden', k!==tab); });
    Object.keys(tabs).forEach(function(k){  if(tabs[k])  tabs[k].classList.toggle('bd-tab-active', k===tab); });
  }
  if ($tabLabels) $tabLabels.addEventListener('click', function(){ _setTab('labels'); });
  if ($tabModes)  $tabModes.addEventListener('click',  function(){ _setTab('modes');  });
  if ($tabExport) $tabExport.addEventListener('click', function(){ _setTab('export'); });


  /* ════════════════════════════════════════════════════════════════
     9. PANEL STATE MACHINE
     ════════════════════════════════════════════════════════════════ */
  function _setPanelState(state) {
    panelState = state;
    $lpPanel.classList.remove('bd-lp-expanded','bd-lp-collapsed');
    if (state === 'expanded') {
      $lpPanel.classList.add('bd-lp-expanded');
      $lpRail.style.display='none';
      if($lpModeRow)     $lpModeRow.style.display='';
      if($lpExpandBtn)   {$lpExpandBtn.textContent='⤡';$lpExpandBtn.title='Normal size (E)';$lpExpandBtn.style.display='';}
      if($lpCollapseBtn) $lpCollapseBtn.style.display='';
      if($lpTitleTxt)    $lpTitleTxt.style.display='';
    } else if (state === 'collapsed') {
      $lpPanel.classList.add('bd-lp-collapsed');
      $lpRail.style.display='flex';
      if($lpModeRow)     $lpModeRow.style.display='none';
      if($lpCollapseBtn) $lpCollapseBtn.style.display='none';
      if($lpExpandBtn)   $lpExpandBtn.style.display='none';
      if($lpTitleTxt)    $lpTitleTxt.style.display='none';
    } else {
      $lpRail.style.display='none';
      if($lpModeRow)     $lpModeRow.style.display='';
      if($lpExpandBtn)   {$lpExpandBtn.textContent='⤢';$lpExpandBtn.title='Expand panel (E)';$lpExpandBtn.style.display='';}
      if($lpCollapseBtn) $lpCollapseBtn.style.display='';
      if($lpTitleTxt)    $lpTitleTxt.style.display='';
    }
    setTimeout(function(){if(imgLoaded){_measureImage();resizeGridCanvas();resizeCursorCanvas();renderPoints();}},260);
  }
  if($lpExpandBtn)   $lpExpandBtn.addEventListener('click',   function(){_setPanelState(panelState==='expanded'?'normal':'expanded');});
  if($lpCollapseBtn) $lpCollapseBtn.addEventListener('click', function(){_setPanelState('collapsed');});
  if($lpExpandRail)  $lpExpandRail.addEventListener('click',  function(){_setPanelState('normal');});


  /* ════════════════════════════════════════════════════════════════
     10. LABEL PANEL I/O
     ════════════════════════════════════════════════════════════════ */
  function _readSlots() {
    for (var i=0; i<MAX_LABELS; i++) {
      var inp=_q('#bd-lp-input-'+(i+1));
      labelSlots[i]=inp?inp.value.trim():'';
    }
  }
  function _writeSlots(arr) {
    for (var i=0; i<MAX_LABELS; i++) {
      var inp=_q('#bd-lp-input-'+(i+1));
      if(inp) inp.value=(arr&&arr[i])?arr[i]:'';
      labelSlots[i]=(arr&&arr[i])?arr[i]:'';
    }
    _updatePanelDots();
  }
  function _updatePanelDots() {
    var nextIdx=points.length;
    for (var i=0; i<MAX_LABELS; i++) {
      var dot=_q('#bd-lp-dot-'+(i+1));
      var row=_q('#bd-lp-row-'+(i+1));
      if(!dot||!row) continue;
      dot.className='bd-lp-dot'; row.classList.remove('bd-lp-pinned');
      if(i<points.length){ dot.classList.add('bd-lp-dot-placed'); row.classList.add('bd-lp-pinned'); }
      else if(i===nextIdx&&liveLabelMode){ dot.classList.add('bd-lp-dot-next'); }
    }
    var ar=_q('#bd-lp-row-'+(nextIdx+1));
    if(ar) ar.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  for (var _si=1; _si<=MAX_LABELS; _si++) {
    (function(slot){
      var inp=_q('#bd-lp-input-'+slot);
      if(!inp) return;
      inp.addEventListener('input',function(){
        labelSlots[slot-1]=inp.value.trim();
        if(slot<=points.length){points[slot-1].label=labelSlots[slot-1];renderPoints();}
        _updatePanelDots();
      });
      inp.addEventListener('dblclick',function(){if(slot<=points.length)_openLabelModal(slot-1);});
    }(_si));
  }


  /* ════════════════════════════════════════════════════════════════
     11. IMAGE LOAD
     ════════════════════════════════════════════════════════════════ */
  function loadImageSrc(src) {
    imgLoaded=false; $img.src='';
    $img.classList.remove('vj-artwork__img--loaded'); $img.classList.add('vj-artwork__img');
    $dropZone.style.display='none'; $imageArea.style.display='flex';
    $img.onload=function(){
      imgNatW=$img.naturalWidth; imgNatH=$img.naturalHeight;
      imgLoaded=true; points=[]; undoStack=[]; redoStack=[];
      requestAnimationFrame(function(){
        _measureImage(); resizeGridCanvas(); resizeCursorCanvas();
        renderGrid(); renderPoints(); updateCtxMenuState(); _updatePanelDots();
        _setStatus('Loaded \u00b7 '+imgNatW+'\u00d7'+imgNatH+' \u00b7 Click to place pins');
        if(root.VJ&&root.VJ.updateRes) root.VJ.updateRes(imgNatW,imgNatH);
        if(root.VJ&&root.VJ.snapImage) root.VJ.snapImage($img);
      });
    };
    $img.onerror=function(){_setStatus('\u26a0 Could not load image.');$dropZone.style.display='flex';$imageArea.style.display='none';};
    $img.src=src;
  }
  function _measureImage(){var r=$img.getBoundingClientRect();imgDispW=r.width;imgDispH=r.height;}


  /* ════════════════════════════════════════════════════════════════
     12. COORD CONVERSION
     ════════════════════════════════════════════════════════════════ */
  function _toNatural(ex,ey){
    var r=$img.getBoundingClientRect();
    var nx=Math.round(((ex-r.left)/r.width)*imgNatW);
    var ny=Math.round(((ey-r.top)/r.height)*imgNatH);
    return {x:Math.max(0,Math.min(imgNatW,nx)),y:Math.max(0,Math.min(imgNatH,ny))};
  }
  function _toDisplay(nx,ny){_measureImage();return {x:(nx/imgNatW)*imgDispW,y:(ny/imgNatH)*imgDispH};}


  /* ════════════════════════════════════════════════════════════════
     13. UNDO / REDO
     ════════════════════════════════════════════════════════════════ */
  function _pushUndo(){undoStack.push(JSON.stringify(points));if(undoStack.length>80)undoStack.shift();redoStack=[];_updateUndoBtns();}
  function _updateUndoBtns(){if($undoBtn)$undoBtn.disabled=!undoStack.length;if($redoBtn)$redoBtn.disabled=!redoStack.length;}
  function doUndo(){if(!undoStack.length)return;redoStack.push(JSON.stringify(points));points=JSON.parse(undoStack.pop());renderPoints();updateCtxMenuState();_updateUndoBtns();_updatePanelDots();_setStatus('Undo \u00b7 '+points.length+' pin'+(points.length!==1?'s':''));}
  function doRedo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(points));points=JSON.parse(redoStack.pop());renderPoints();updateCtxMenuState();_updateUndoBtns();_updatePanelDots();_setStatus('Redo \u00b7 '+points.length+' pin'+(points.length!==1?'s':''));}


  /* ════════════════════════════════════════════════════════════════
     14. POINT OPERATIONS
     ════════════════════════════════════════════════════════════════ */
  function _getSlotLabel(idx){_readSlots();return(liveLabelMode&&idx<MAX_LABELS)?(labelSlots[idx]||''):'';}
  function _addPoint(nx,ny){var lbl=_getSlotLabel(points.length);_pushUndo();points.push({x:nx,y:ny,label:lbl,labelVisible:true});renderPoints();updateCtxMenuState();_updatePanelDots();_setStatus('Pin '+(points.length)+(lbl?' \u00b7 '+lbl:'')+' \u2192 '+nx+', '+ny);}
  function _deletePoint(idx){if(idx<0||idx>=points.length)return;_pushUndo();points.splice(idx,1);renderPoints();updateCtxMenuState();_updatePanelDots();}
  function _movePointUp(idx){if(idx<=0)return;_pushUndo();var t=points[idx];points[idx]=points[idx-1];points[idx-1]=t;renderPoints();_updatePanelDots();}
  function _movePointDown(idx){if(idx>=points.length-1)return;_pushUndo();var t=points[idx];points[idx]=points[idx+1];points[idx+1]=t;renderPoints();_updatePanelDots();}
  function _togglePointLabel(idx){if(idx<0||idx>=points.length)return;_pushUndo();points[idx].labelVisible=!points[idx].labelVisible;renderPoints();}


  /* ════════════════════════════════════════════════════════════════
     15. RENDER POINTS
     ════════════════════════════════════════════════════════════════ */
  function renderPoints(){
    if(!$pointsLayer)return; $pointsLayer.innerHTML=''; if(!imgLoaded)return; _measureImage();
    points.forEach(function(pt,i){
      var dp=_toDisplay(pt.x,pt.y);
      var pin=document.createElement('div'); pin.className='bd-pin'; pin.style.left=dp.x+'px'; pin.style.top=dp.y+'px';
      var dot=document.createElement('div'); dot.className='bd-pin-dot';
      var num=document.createElement('div'); num.className='bd-pin-num'; num.textContent=i+1;
      pin.appendChild(dot); pin.appendChild(num);
      if(pt.label){
        var lbl=document.createElement('div');
        lbl.className='bd-pin-label'+((!labelsVisible||pt.labelVisible===false)?' bd-label-hidden':'');
        lbl.textContent=pt.label; pin.appendChild(lbl);
      }
      (function(idx){
        pin.addEventListener('contextmenu',function(e){e.preventDefault();e.stopPropagation();_openCtxMenu(e.clientX,e.clientY,idx);});
        pin.addEventListener('dblclick',function(e){e.stopPropagation();_openLabelModal(idx);});
        pin.addEventListener('mousedown',function(e){
          if(e.button!==0)return; e.stopPropagation(); isDragging=true; dragIdx=idx;
          var r2=$img.getBoundingClientRect(); var dp2=_toDisplay(pt.x,pt.y);
          dragOffX=e.clientX-(r2.left+dp2.x); dragOffY=e.clientY-(r2.top+dp2.y);
        });
      }(i));
      $pointsLayer.appendChild(pin);
    });
    if($countDisplay) $countDisplay.textContent=points.length+' pin'+(points.length!==1?'s':'');
  }


  /* ════════════════════════════════════════════════════════════════
     16. GRID CANVAS
     ════════════════════════════════════════════════════════════════ */
  function resizeGridCanvas(){
    if(!$gridCanvas||!$img||!imgLoaded)return;
    var r=$img.getBoundingClientRect();
    $gridCanvas.width=Math.round(r.width); $gridCanvas.height=Math.round(r.height);
    $gridCanvas.style.width=r.width+'px'; $gridCanvas.style.height=r.height+'px'; renderGrid();
  }
  function renderGrid(){
    if(!gCtx||!imgLoaded)return;
    var w=$gridCanvas.width,h=$gridCanvas.height; gCtx.clearRect(0,0,w,h); if(gridMode==='none')return;
    gCtx.lineWidth=1;
    if(gridMode==='rule3'||gridMode==='full'){gCtx.strokeStyle='rgba(197,160,89,0.28)';[1/3,2/3].forEach(function(t){gCtx.beginPath();gCtx.moveTo(t*w,0);gCtx.lineTo(t*w,h);gCtx.stroke();gCtx.beginPath();gCtx.moveTo(0,t*h);gCtx.lineTo(w,t*h);gCtx.stroke();});}
    if(gridMode==='center'||gridMode==='full'){gCtx.strokeStyle='rgba(92,200,255,0.3)';gCtx.beginPath();gCtx.moveTo(w/2,0);gCtx.lineTo(w/2,h);gCtx.stroke();gCtx.beginPath();gCtx.moveTo(0,h/2);gCtx.lineTo(w,h/2);gCtx.stroke();}
    if(gridMode==='full'){gCtx.strokeStyle='rgba(197,160,89,0.06)';var step=Math.max(20,Math.round(Math.min(w,h)/10));for(var x=0;x<=w;x+=step){gCtx.beginPath();gCtx.moveTo(x,0);gCtx.lineTo(x,h);gCtx.stroke();}for(var y=0;y<=h;y+=step){gCtx.beginPath();gCtx.moveTo(0,y);gCtx.lineTo(w,y);gCtx.stroke();}}
  }


  /* ════════════════════════════════════════════════════════════════
     17. CROSSHAIR CANVAS
     ════════════════════════════════════════════════════════════════ */
  function resizeCursorCanvas(){
    if(!$cursorCanvas||!$img||!imgLoaded)return;
    var r=$img.getBoundingClientRect();
    $cursorCanvas.width=Math.round(r.width); $cursorCanvas.height=Math.round(r.height);
    $cursorCanvas.style.width=r.width+'px'; $cursorCanvas.style.height=r.height+'px';
  }
  /* ── Adaptive crosshair: samples image brightness under cursor ── */
  function _sampleBrightness(lx, ly) {
    if (!$img || !imgLoaded) return 0;
    try {
      var tmpC = document.createElement('canvas');
      var sr = 10; /* sample radius */
      tmpC.width = sr * 2; tmpC.height = sr * 2;
      var tCtx = tmpC.getContext('2d');
      /* scale cursor coords back to natural image coords */
      var scaleX = imgNatW / imgDispW;
      var scaleY = imgNatH / imgDispH;
      var nx = Math.round(lx * scaleX) - sr;
      var ny = Math.round(ly * scaleY) - sr;
      tCtx.drawImage($img, nx, ny, sr*2, sr*2, 0, 0, sr*2, sr*2);
      var d = tCtx.getImageData(0, 0, sr*2, sr*2).data;
      var total = 0, count = d.length / 4;
      for (var i = 0; i < d.length; i += 4) {
        total += 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
      }
      return total / count; /* 0=black, 255=white */
    } catch(e) { return 0; }
  }

  function _renderCursor(lx,ly){
    if(!cCtx||!imgLoaded)return;
    var w=$cursorCanvas.width,h=$cursorCanvas.height;
    cCtx.clearRect(0,0,w,h); if(!showCrosshair)return;

    /* Adaptive color: bright bg → dark crosshair; dark bg → white crosshair */
    var brightness = _sampleBrightness(lx, ly);
    var isLight = brightness > 140;
    var lineColor    = isLight ? 'rgba(0,0,0,0.92)'   : 'rgba(255,255,255,0.92)';
    var tickColor    = isLight ? 'rgba(0,0,0,0.55)'   : 'rgba(255,255,255,0.45)';
    var centerColor  = isLight ? 'rgba(0,0,0,1)'      : 'rgba(255,255,255,1)';
    var labelColor   = isLight ? 'rgba(0,0,0,0.85)'   : 'rgba(197,160,89,0.9)';

    var R=crosshairSize,gap=8,tick=6; cCtx.save();
    cCtx.strokeStyle=lineColor; cCtx.lineWidth=1.5; cCtx.setLineDash([]);

    /* main cross lines */
    cCtx.beginPath();cCtx.moveTo(lx,ly-gap);cCtx.lineTo(lx,Math.max(0,ly-R));cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx,ly+gap);cCtx.lineTo(lx,Math.min(h,ly+R));cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx-gap,ly);cCtx.lineTo(Math.max(0,lx-R),ly);cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx+gap,ly);cCtx.lineTo(Math.min(w,lx+R),ly);cCtx.stroke();

    /* corner ticks */
    cCtx.strokeStyle=tickColor; cCtx.lineWidth=1.5;
    cCtx.beginPath();cCtx.moveTo(lx-R,ly-tick);cCtx.lineTo(lx-R,ly);cCtx.lineTo(lx-R+tick,ly);cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx+R,ly-tick);cCtx.lineTo(lx+R,ly);cCtx.lineTo(lx+R-tick,ly);cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx-R,ly+tick);cCtx.lineTo(lx-R,ly);cCtx.lineTo(lx-R+tick,ly);cCtx.stroke();
    cCtx.beginPath();cCtx.moveTo(lx+R,ly+tick);cCtx.lineTo(lx+R,ly);cCtx.lineTo(lx+R-tick,ly);cCtx.stroke();

    /* center dot — contrasting outline + fill */
    cCtx.beginPath();cCtx.arc(lx,ly,3,0,Math.PI*2);
    cCtx.fillStyle=centerColor;cCtx.fill();
    cCtx.strokeStyle=isLight?'rgba(255,255,255,0.9)':'rgba(0,0,0,0.6)';
    cCtx.lineWidth=1;cCtx.stroke();

    /* label text */
    var nextLbl='';
    if(liveLabelMode&&points.length<MAX_LABELS){_readSlots();nextLbl=labelSlots[points.length]||'';}
    cCtx.font='12px "Share Tech Mono",monospace';cCtx.textAlign='left';cCtx.textBaseline='top';
    cCtx.fillStyle=labelColor;
    cCtx.fillText('\u00d7'+(R*2)+(nextLbl?'  \u25b8 '+nextLbl:''),lx+R+6,ly+2);
    cCtx.restore();
  }


  /* ════════════════════════════════════════════════════════════════
     18. CONTEXT MENU — Windows-10-style
     ════════════════════════════════════════════════════════════════ */
  function _syncCtxCheckmarks() {
    /* live labels */
    if($ctxChkLive)  {$ctxChkLive.textContent=liveLabelMode?'\u2713':'';  $ctxChkLive.classList.toggle('bd-ctx-checked',liveLabelMode);}
    /* label overlay */
    if($ctxChkLabels){$ctxChkLabels.textContent=labelsVisible?'\u2713':'';$ctxChkLabels.classList.toggle('bd-ctx-checked',labelsVisible);}
    /* crosshair */
    if($ctxChkCross) {$ctxChkCross.textContent=showCrosshair?'\u2713':'';  $ctxChkCross.classList.toggle('bd-ctx-checked',showCrosshair);}
    /* grid */
    var gridOn=(gridMode!=='none');
    var gMap={none:'Grid: Off',rule3:'Grid: 1/3',center:'Grid: Center',full:'Grid: Full'};
    if($ctxChkGrid)  {$ctxChkGrid.textContent=gridOn?'\u2713':'';           $ctxChkGrid.classList.toggle('bd-ctx-checked',gridOn);}
    if($ctxGridText) $ctxGridText.textContent=gMap[gridMode]||'Grid: Off';
    /* snap */
    if($ctxChkSnap)  {$ctxChkSnap.textContent=snapToGrid?'\u2713':'';      $ctxChkSnap.classList.toggle('bd-ctx-checked',snapToGrid);}
  }

  function _openCtxMenu(cx, cy, idx) {
    ctxTargetIdx=idx; ctxMenuOpen=true;

    /* show/hide pin-specific group */
    var onPin = (idx >= 0);
    if($ctxHeader)   $ctxHeader.style.display   = onPin ? '' : 'none';
    if($ctxPinGroup) $ctxPinGroup.style.display  = onPin ? '' : 'none';
    if($ctxDivPin)   $ctxDivPin.style.display    = onPin ? '' : 'none';

    if (onPin) {
      var pt = points[idx];
      if($ctxHeaderText) $ctxHeaderText.textContent = 'Pin '+(idx+1)+(pt&&pt.label?' — '+pt.label:'');
      if($ctxMoveUp) $ctxMoveUp.disabled=(idx===0);
      if($ctxMoveDn) $ctxMoveDn.disabled=(idx===points.length-1);
      /* toggle label text */
      var vis = pt && pt.labelVisible !== false;
      if($ctxChkLabel)  {$ctxChkLabel.textContent=vis?'\u2713':''; $ctxChkLabel.classList.toggle('bd-ctx-checked',vis);}
      if($ctxTlblText)  $ctxTlblText.textContent = vis ? 'Hide Label' : 'Show Label';
    }

    /* undo / redo / clear */
    if($ctxUndo)      $ctxUndo.disabled=!undoStack.length;
    if($ctxRedo)      $ctxRedo.disabled=!redoStack.length;
    if($ctxClearPins) $ctxClearPins.disabled=!points.length;
    /* exports */
    [$ctxExpAi,$ctxExpJson,$ctxExpCss,$ctxExpCssLbl].forEach(function(el){if(el)el.disabled=!points.length;});

    /* sync checkmarks for view toggles */
    _syncCtxCheckmarks();

    /* smart position — keep menu in viewport */
    $ctxMenu.style.display='block';
    var mw=$ctxMenu.offsetWidth||235, mh=$ctxMenu.offsetHeight||420;
    var left=(cx+mw>window.innerWidth)  ? cx-mw : cx;
    var top  =(cy+mh>window.innerHeight)? cy-mh : cy;
    $ctxMenu.style.left=Math.max(0,left)+'px';
    $ctxMenu.style.top =Math.max(0,top)+'px';
  }

  function _closeCtxMenu(){
    ctxMenuOpen=false; ctxTargetIdx=-1;
    if($ctxMenu) $ctxMenu.style.display='none';
  }

  function updateCtxMenuState(){
    _updateUndoBtns();
    var has=points.length>0;
    if($clearBtn)   $clearBtn.disabled=!has;
    if($exportCss)  $exportCss.disabled=!has;
    if($exportJson) $exportJson.disabled=!has;
    if($exportAi)   $exportAi.disabled=!has;
    if($copyAll)    $copyAll.disabled=!has;
    [$pxExpAi,$pxExpJson,$pxExpCss,$pxExpCssLbl,$pxCopy].forEach(function(el){if(el)el.disabled=!has;});
  }


  /* ════════════════════════════════════════════════════════════════
     19. LABEL EDIT MODAL
     ════════════════════════════════════════════════════════════════ */
  function _openLabelModal(idx){
    ctxTargetIdx=idx; if(!$labelModal)return;
    $labelInput.value=(idx>=0&&points[idx])?(points[idx].label||''):'';
    $labelModal.style.display='flex';
    setTimeout(function(){if($labelInput){$labelInput.focus();$labelInput.select();}},50);
  }
  function _closeLabelModal(){if($labelModal)$labelModal.style.display='none';}
  function _saveLabelModal(){
    var val=$labelInput?$labelInput.value.trim():'';
    if(ctxTargetIdx>=0&&points[ctxTargetIdx]!==undefined){
      _pushUndo(); points[ctxTargetIdx].label=val;
      if(ctxTargetIdx<MAX_LABELS){var si=_q('#bd-lp-input-'+(ctxTargetIdx+1));if(si)si.value=val;labelSlots[ctxTargetIdx]=val;}
      renderPoints();
    }
    _closeLabelModal();
  }


  /* ════════════════════════════════════════════════════════════════
     20. LABEL IMPORT
     ════════════════════════════════════════════════════════════════ */
  function _parseImportText(raw){
    raw=raw.trim();if(!raw)return null;
    if(raw[0]==='['){try{var a=JSON.parse(raw);if(Array.isArray(a))return a.map(String);}catch(e){}}
    var lines=raw.split('\n').map(function(l){return l.trim();}).filter(Boolean)
      .map(function(l){return l.replace(/^\d+[\.\)]\s*/,'').replace(/^\d+\s+/,'').trim();}).filter(Boolean);
    return lines.length?lines:null;
  }
  function _openImportModal(){
    if(!$importModal)return;
    var cur=labelSlots.filter(Boolean);
    $importTextarea.value=cur.length?JSON.stringify(cur,null,2):'';
    $importStatus.textContent=cur.length?cur.length+' labels currently in slots':'';
    $importModal.style.display='flex';
    setTimeout(function(){$importTextarea.focus();},50);
  }
  function _closeImportModal(){if($importModal)$importModal.style.display='none';}
  function _applyImport(){
    var raw=$importTextarea?$importTextarea.value:'';
    var parsed=_parseImportText(raw);
    if(!parsed){$importStatus.textContent='\u26a0 Nothing to parse. Check format.';return;}
    var arr=parsed.slice(0,MAX_LABELS); _writeSlots(arr);
    if(points.length){_pushUndo();points.forEach(function(pt,i){if(i<arr.length)pt.label=arr[i];});renderPoints();}
    $importStatus.textContent='\u2713 '+arr.length+' label'+(arr.length!==1?'s':'')+' loaded.';
    _setStatus('Labels imported: '+arr.length);
  }


  /* ════════════════════════════════════════════════════════════════
     21. LIVE LABEL / MODE TOGGLES
     ════════════════════════════════════════════════════════════════ */
  function _setLiveMode(on){
    liveLabelMode=on;
    var lbl=(on?'\u9673':'\u25cb')+' Live';
    if($liveBtn)     {$liveBtn.classList.toggle('bd-btn-active',on);$liveBtn.textContent=lbl;}
    if($lpLiveToggle){$lpLiveToggle.classList.toggle('bd-pill-on',on);$lpLiveToggle.textContent=on?'ON':'OFF';}
    if($modeLive)    {$modeLive.classList.toggle('bd-pill-on',on);$modeLive.textContent=on?'ON':'OFF';}
    _updatePanelDots();
    _setStatus('Live Labels: '+(on?'ON':'OFF'));
  }

  function _syncModesPillLabels(){
    if($modeLabels){$modeLabels.classList.toggle('bd-pill-on',labelsVisible);$modeLabels.textContent=labelsVisible?'ON':'OFF';}
    if($modeCross) {$modeCross.classList.toggle('bd-pill-on',showCrosshair);$modeCross.textContent=showCrosshair?'ON':'OFF';}
    if($modeGrid)  {var gmap={none:'OFF',rule3:'1/3',center:'+',full:'ALL'};$modeGrid.classList.toggle('bd-pill-on',gridMode!=='none');$modeGrid.textContent=gmap[gridMode]||'OFF';}
    if($modeSnap)  {$modeSnap.classList.toggle('bd-pill-on',snapToGrid);$modeSnap.textContent=snapToGrid?'ON':'OFF';}
  }


  /* ════════════════════════════════════════════════════════════════
     22. EXPORT BUILDERS
     ════════════════════════════════════════════════════════════════ */
  function _buildCss(withLabels){
    if(!points.length)return '/* No pins */';
    var lines=['/* Bulls-Eye Ducky v55 \u00b7 '+imgNatW+'\u00d7'+imgNatH+' px */'];
    points.forEach(function(pt,i){
      var comment=(withLabels&&pt.label)?' /* '+pt.label+' */':'';
      lines.push('.point-'+(i+1)+' { left: '+pt.x+'px; top: '+pt.y+'px; }'+comment);
    });
    return lines.join('\n');
  }
  function _buildJson(){
    _readSlots();
    return JSON.stringify({source:'Bulls-Eye Ducky v55',naturalSize:{width:imgNatW,height:imgNatH},
      labelSlots:labelSlots.slice(0,MAX_LABELS),
      points:points.map(function(pt,i){return{index:i+1,x:pt.x,y:pt.y,label:pt.label||''};})
    },null,2);
  }
  function _buildAi(){
    _readSlots();
    var lines=['Bulls-Eye Ducky \u00b7 Coordinate Export',
      'Image: '+imgNatW+' \u00d7 '+imgNatH+' px (natural pixel coords, top-left origin)',
      'Total pins: '+points.length,''];
    if(labelSlots.some(Boolean)){
      lines.push('Label Manifest:');
      labelSlots.forEach(function(s,i){if(s)lines.push('  '+(i+1)+'. '+s);});
      lines.push('');
    }
    lines.push('Pins:');
    points.forEach(function(pt,i){lines.push('  '+(i+1)+'. x='+pt.x+', y='+pt.y+(pt.label?'  ['+pt.label+']':''));});
    lines.push('','Coordinates are natural pixel values. Use for CSS, SVG, canvas, or spatial AI layout prompting.');
    return lines.join('\n');
  }
  function _showOutput(text){
    if(!$outputBox)return;
    $outputBox.value=text;
    $outputBox.parentElement.style.display='block';
    if($clearOutput) $clearOutput.style.display='inline-flex';
    $outputBox.focus();$outputBox.select();
  }
  function _copyToClipboard(text,msg){
    msg=msg||'\u2713 Copied to clipboard';
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){_setStatus(msg);}).catch(function(){_fallbackCopy(text,msg);});}
    else _fallbackCopy(text,msg);
  }
  function _fallbackCopy(text,msg){
    var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0;top:0;left:0;width:1px;height:1px';
    document.body.appendChild(ta);ta.focus();ta.select();
    try{document.execCommand('copy');_setStatus(msg||'\u2713 Copied');}catch(e){}
    document.body.removeChild(ta);
  }
  function _setStatus(msg){if($statusMsg)$statusMsg.textContent=msg;}


  /* ════════════════════════════════════════════════════════════════
     23. DROP ZONE / FILE INPUT
     ════════════════════════════════════════════════════════════════ */
  $dropZone.addEventListener('dragover',function(e){e.preventDefault();$dropZone.classList.add('bd-drag-over');});
  $dropZone.addEventListener('dragleave',function(){$dropZone.classList.remove('bd-drag-over');});
  $dropZone.addEventListener('drop',function(e){
    e.preventDefault();$dropZone.classList.remove('bd-drag-over');
    var f=e.dataTransfer.files[0];
    if(f&&f.type.startsWith('image/')){var r=new FileReader();r.onload=function(ev){loadImageSrc(ev.target.result);};r.readAsDataURL(f);}
  });
  $dropZone.addEventListener('click',function(){$fileInput.click();});
  $fileInput.addEventListener('change',function(){
    var f=$fileInput.files[0];if(!f)return;
    var r=new FileReader();r.onload=function(ev){loadImageSrc(ev.target.result);};r.readAsDataURL(f);$fileInput.value='';
  });
  $loadUrlBtn.addEventListener('click',function(){var u=$urlInput.value.trim();if(u)loadImageSrc(u);});
  $urlInput.addEventListener('keydown',function(e){if(e.key==='Enter')$loadUrlBtn.click();});


  /* ════════════════════════════════════════════════════════════════
     24. IMAGE MOUSE EVENTS
     ════════════════════════════════════════════════════════════════ */
  $imageArea.addEventListener('mousemove',function(e){
    if(!imgLoaded)return;
    var r=$img.getBoundingClientRect(),lx=e.clientX-r.left,ly=e.clientY-r.top;
    if(lx<0||ly<0||lx>r.width||ly>r.height)return;
    _renderCursor(lx,ly);
    var c=_toNatural(e.clientX,e.clientY);
    if($coordDisplay)$coordDisplay.textContent=c.x+', '+c.y;
    if(root.VJ&&root.VJ.updateHUD)root.VJ.updateHUD(c.x,c.y);
  });
  $imageArea.addEventListener('mouseleave',function(){
    if(cCtx)cCtx.clearRect(0,0,$cursorCanvas.width,$cursorCanvas.height);
    if($coordDisplay)$coordDisplay.textContent='\u2014, \u2014';
  });
  $imageArea.addEventListener('click',function(e){
    if(!imgLoaded||isDragging)return;
    if(e.target.closest&&e.target.closest('.bd-pin'))return;
    if(ctxMenuOpen){_closeCtxMenu();return;}
    var c=_toNatural(e.clientX,e.clientY),nx=c.x,ny=c.y;
    if(snapToGrid&&imgNatW>0){var step=Math.max(1,Math.round(Math.min(imgNatW,imgNatH)/10));nx=Math.round(nx/step)*step;ny=Math.round(ny/step)*step;}
    _addPoint(nx,ny);
  });
  /* right-click on canvas (not on a pin) — open menu without pin group */
  $imageArea.addEventListener('contextmenu',function(e){
    e.preventDefault();
    if(e.target.closest&&e.target.closest('.bd-pin'))return;
    _openCtxMenu(e.clientX,e.clientY,-1);
  });
  $imageArea.addEventListener('wheel',function(e){
    if(!imgLoaded)return;e.preventDefault();
    crosshairSize=Math.max(CROSS_MIN,Math.min(CROSS_MAX,crosshairSize+(e.deltaY>0?-8:8)));
    var r=$img.getBoundingClientRect(),lx=e.clientX-r.left,ly=e.clientY-r.top;
    if(lx>=0&&ly>=0&&lx<=r.width&&ly<=r.height)_renderCursor(lx,ly);
  },{passive:false});

  document.addEventListener('mousemove',function(e){
    if(!isDragging||dragIdx<0)return;
    var r=$img.getBoundingClientRect();
    var lx=(e.clientX-dragOffX)-r.left,ly=(e.clientY-dragOffY)-r.top;
    var nx=Math.max(0,Math.min(imgNatW,Math.round((lx/r.width)*imgNatW)));
    var ny=Math.max(0,Math.min(imgNatH,Math.round((ly/r.height)*imgNatH)));
    points[dragIdx].x=nx;points[dragIdx].y=ny;renderPoints();
    if($coordDisplay)$coordDisplay.textContent=nx+', '+ny;
  });
  document.addEventListener('mouseup',function(){if(isDragging){isDragging=false;dragIdx=-1;renderPoints();}});
  document.addEventListener('click',function(e){if(ctxMenuOpen&&$ctxMenu&&!$ctxMenu.contains(e.target))_closeCtxMenu();});


  /* ════════════════════════════════════════════════════════════════
     25. CONTEXT MENU ACTIONS
     ════════════════════════════════════════════════════════════════ */
  if($ctxDelete)      $ctxDelete.addEventListener('click',      function(){_deletePoint(ctxTargetIdx);_closeCtxMenu();});
  if($ctxLabel)       $ctxLabel.addEventListener('click',       function(){var i=ctxTargetIdx;_closeCtxMenu();_openLabelModal(i);});
  if($ctxToggleLabel) $ctxToggleLabel.addEventListener('click', function(){_togglePointLabel(ctxTargetIdx);_closeCtxMenu();});
  if($ctxMoveUp)      $ctxMoveUp.addEventListener('click',      function(){_movePointUp(ctxTargetIdx);_closeCtxMenu();});
  if($ctxMoveDn)      $ctxMoveDn.addEventListener('click',      function(){_movePointDown(ctxTargetIdx);_closeCtxMenu();});
  if($ctxLiveToggle)  $ctxLiveToggle.addEventListener('click',  function(){_setLiveMode(!liveLabelMode);_syncCtxCheckmarks();/* keep open — mode toggle */});
  if($ctxLabelsVis)   $ctxLabelsVis.addEventListener('click',   function(){if($labelsBtn)$labelsBtn.click();_syncCtxCheckmarks();});
  if($ctxCrosshair)   $ctxCrosshair.addEventListener('click',   function(){if($crossBtn)$crossBtn.click();_syncCtxCheckmarks();});
  if($ctxGrid)        $ctxGrid.addEventListener('click',        function(){if($gridBtn)$gridBtn.click();_syncCtxCheckmarks();});
  if($ctxSnap)        $ctxSnap.addEventListener('click',        function(){if($snapBtn)$snapBtn.click();_syncCtxCheckmarks();});
  if($ctxUndo)        $ctxUndo.addEventListener('click',        function(){doUndo();_closeCtxMenu();});
  if($ctxRedo)        $ctxRedo.addEventListener('click',        function(){doRedo();_closeCtxMenu();});
  if($ctxClearPins)   $ctxClearPins.addEventListener('click',   function(){if(!points.length)return;_pushUndo();points=[];renderPoints();updateCtxMenuState();_updatePanelDots();_setStatus('All pins cleared');_closeCtxMenu();});
  if($ctxExpAi)       $ctxExpAi.addEventListener('click',       function(){_showOutput(_buildAi());_setStatus('AI Prompt ready');_closeCtxMenu();});
  if($ctxExpJson)     $ctxExpJson.addEventListener('click',     function(){_showOutput(_buildJson());_setStatus('JSON ready');_closeCtxMenu();});
  if($ctxExpCss)      $ctxExpCss.addEventListener('click',      function(){_showOutput(_buildCss(false));_setStatus('CSS ready');_closeCtxMenu();});
  if($ctxExpCssLbl)   $ctxExpCssLbl.addEventListener('click',   function(){_showOutput(_buildCss(true));_setStatus('CSS + Labels ready');_closeCtxMenu();});


  /* ════════════════════════════════════════════════════════════════
     26. TOOLBAR ACTIONS
     ════════════════════════════════════════════════════════════════ */
  if($clearBtn) $clearBtn.addEventListener('click',function(){if(!points.length)return;_pushUndo();points=[];renderPoints();updateCtxMenuState();_updatePanelDots();_setStatus('All pins cleared');});
  if($undoBtn)  $undoBtn.addEventListener('click',doUndo);
  if($redoBtn)  $redoBtn.addEventListener('click',doRedo);
  if($resetImg) $resetImg.addEventListener('click',function(){
    imgLoaded=false;points=[];undoStack=[];redoStack=[];
    $img.src='';$imageArea.style.display='none';$dropZone.style.display='flex';
    if($outputBox){$outputBox.value='';$outputBox.parentElement.style.display='none';}
    if($clearOutput) $clearOutput.style.display='none';
    renderPoints();updateCtxMenuState();_updatePanelDots();
    _setStatus('Ready \u00b7 Drop or browse an image');
    if(root.VJ&&root.VJ.updateHUD)root.VJ.updateHUD(0,0);
    if(root.VJ&&root.VJ.updateRes)root.VJ.updateRes(0,0);
  });
  if($gridBtn) $gridBtn.addEventListener('click',function(){
    var modes=['none','rule3','center','full'];
    var labels={none:'Grid: Off',rule3:'Grid: \u2153',center:'Grid: \u271a',full:'Grid: All'};
    gridMode=modes[(modes.indexOf(gridMode)+1)%modes.length];
    $gridBtn.textContent=labels[gridMode];renderGrid();_syncModesPillLabels();
  });
  if($snapBtn) $snapBtn.addEventListener('click',function(){
    snapToGrid=!snapToGrid;$snapBtn.classList.toggle('bd-btn-active',snapToGrid);
    _setStatus('Snap: '+(snapToGrid?'ON':'OFF'));_syncModesPillLabels();
  });
  if($crossBtn) $crossBtn.addEventListener('click',function(){
    showCrosshair=!showCrosshair;$crossBtn.classList.toggle('bd-btn-active',showCrosshair);
    if(!showCrosshair&&cCtx)cCtx.clearRect(0,0,$cursorCanvas.width,$cursorCanvas.height);
    _syncModesPillLabels();
  });
  if($labelsBtn) $labelsBtn.addEventListener('click',function(){
    labelsVisible=!labelsVisible;$labelsBtn.classList.toggle('bd-btn-active',labelsVisible);
    renderPoints();_setStatus('Labels: '+(labelsVisible?'Visible':'Hidden'));_syncModesPillLabels();
  });
  if($liveBtn)      $liveBtn.addEventListener('click',      function(){_setLiveMode(!liveLabelMode);});
  if($lpLiveToggle) $lpLiveToggle.addEventListener('click', function(){_setLiveMode(!liveLabelMode);});
  /* modes tab pills */
  if($modeLive)   $modeLive.addEventListener('click',   function(){_setLiveMode(!liveLabelMode);});
  if($modeLabels) $modeLabels.addEventListener('click', function(){if($labelsBtn)$labelsBtn.click();});
  if($modeCross)  $modeCross.addEventListener('click',  function(){if($crossBtn)$crossBtn.click();});
  if($modeGrid)   $modeGrid.addEventListener('click',   function(){if($gridBtn)$gridBtn.click();});
  if($modeSnap)   $modeSnap.addEventListener('click',   function(){if($snapBtn)$snapBtn.click();});


  /* ════════════════════════════════════════════════════════════════
     27. LABEL PANEL BUTTONS
     ════════════════════════════════════════════════════════════════ */
  if($lpImportBtn) $lpImportBtn.addEventListener('click',_openImportModal);
  if($lpClearBtn)  $lpClearBtn.addEventListener('click',function(){
    _writeSlots([]);
    if(points.length){_pushUndo();points.forEach(function(pt){pt.label='';});renderPoints();}
    _setStatus('Label slots cleared');
  });
  if($importApply)  $importApply.addEventListener('click',  _applyImport);
  if($importClear)  $importClear.addEventListener('click',  function(){_writeSlots([]);$importStatus.textContent='All slots cleared.';});
  if($importCancel) $importCancel.addEventListener('click', _closeImportModal);


  /* ════════════════════════════════════════════════════════════════
     28. LABEL EDIT MODAL
     ════════════════════════════════════════════════════════════════ */
  if($labelSave)   $labelSave.addEventListener('click',   _saveLabelModal);
  if($labelCancel) $labelCancel.addEventListener('click', _closeLabelModal);
  if($labelInput)  $labelInput.addEventListener('keydown',function(e){if(e.key==='Enter')_saveLabelModal();if(e.key==='Escape')_closeLabelModal();});


  /* ════════════════════════════════════════════════════════════════
     29. EXPORT BUTTONS
     ════════════════════════════════════════════════════════════════ */
  /* bottom bar */
  if($exportCss)  $exportCss.addEventListener('click',  function(){_showOutput(_buildCss(true));_setStatus('CSS + Labels ready');});
  if($exportJson) $exportJson.addEventListener('click', function(){_showOutput(_buildJson());_setStatus('JSON ready');});
  if($exportAi)   $exportAi.addEventListener('click',   function(){_showOutput(_buildAi());_setStatus('AI Prompt ready');});
  if($copyAll)    $copyAll.addEventListener('click',    function(){_copyToClipboard(($outputBox&&$outputBox.value)?$outputBox.value:_buildJson());});
  if($clearOutput) $clearOutput.addEventListener('click', function(){
    if($outputBox){$outputBox.value='';}
    if($outputBox) $outputBox.parentElement.style.display='none';
    $clearOutput.style.display='none';
    _setStatus('Output cleared');
  });
  /* panel export tab */
  if($pxExpAi)     $pxExpAi.addEventListener('click',     function(){_showOutput(_buildAi());_setStatus('AI Prompt ready');});
  if($pxExpJson)   $pxExpJson.addEventListener('click',   function(){_showOutput(_buildJson());_setStatus('JSON ready');});
  if($pxExpCss)    $pxExpCss.addEventListener('click',    function(){_showOutput(_buildCss(false));_setStatus('CSS ready');});
  if($pxExpCssLbl) $pxExpCssLbl.addEventListener('click', function(){_showOutput(_buildCss(true));_setStatus('CSS + Labels ready');});
  if($pxCopy)      $pxCopy.addEventListener('click',      function(){_copyToClipboard(($outputBox&&$outputBox.value)?$outputBox.value:_buildJson());});
  if($pxAiMeet)    $pxAiMeet.addEventListener('click',    function(){if($aiPromptBox)$aiPromptBox.value=DUCKY_SYSTEM_PROMPT;if($aiStatus)$aiStatus.textContent='';if($aiModal)$aiModal.style.display='flex';setTimeout(function(){if($aiPromptBox){$aiPromptBox.focus();$aiPromptBox.select();}},60);});


  /* ════════════════════════════════════════════════════════════════
     30. AI MEET DUCKY TOOLBAR BUTTON
     ════════════════════════════════════════════════════════════════ */
  if($aiMeetBtn)   $aiMeetBtn.addEventListener('click',   function(){if($aiPromptBox)$aiPromptBox.value=DUCKY_SYSTEM_PROMPT;if($aiStatus)$aiStatus.textContent='';if($aiModal)$aiModal.style.display='flex';setTimeout(function(){if($aiPromptBox){$aiPromptBox.focus();$aiPromptBox.select();}},60);});
  if($aiCopyBtn)   $aiCopyBtn.addEventListener('click',   function(){_copyToClipboard(DUCKY_SYSTEM_PROMPT,'\u2713 Prompt copied!');if($aiStatus)$aiStatus.textContent='\u2713 Copied! Paste into ChatGPT, Claude, Gemini, etc.';});
  if($aiCancelBtn) $aiCancelBtn.addEventListener('click', function(){if($aiModal)$aiModal.style.display='none';});


  /* ════════════════════════════════════════════════════════════════
     31. KEYBOARD SHORTCUTS
     ════════════════════════════════════════════════════════════════ */
  document.addEventListener('keydown',function(e){
    if(!_mountEl.classList.contains('vj-mod--active'))return;
    if(e.target.matches('input,textarea,select'))return;
    if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();doUndo();return;}
    if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toUpperCase()==='Z'))){e.preventDefault();doRedo();return;}
    var k=e.key.toLowerCase();
    if(k==='backspace'||k==='delete'){if(points.length)_deletePoint(points.length-1);return;}
    if(k==='l'){if($labelsBtn)$labelsBtn.click();return;}
    if(k==='v'){_setLiveMode(!liveLabelMode);return;}
    if(k==='c'){if($crossBtn)$crossBtn.click();return;}
    if(k==='g'){if($gridBtn)$gridBtn.click();return;}
    if(k==='s'){if($snapBtn)$snapBtn.click();return;}
    if(k==='x'){if($clearBtn&&!$clearBtn.disabled)$clearBtn.click();return;}
    if(k==='e'){_setPanelState(panelState==='expanded'?'normal':panelState==='collapsed'?'normal':'expanded');return;}
    if(k==='a'){if($exportAi&&!$exportAi.disabled){_showOutput(_buildAi());_setStatus('AI Prompt ready');}return;}
    if(k==='j'){if($exportJson&&!$exportJson.disabled){_showOutput(_buildJson());_setStatus('JSON ready');}return;}
    if(k==='k'&&!e.shiftKey){if($exportCss&&!$exportCss.disabled){_showOutput(_buildCss(false));_setStatus('CSS ready');}return;}
    if(k==='k'&&e.shiftKey) {if($exportCss&&!$exportCss.disabled){_showOutput(_buildCss(true));_setStatus('CSS + Labels ready');}return;}
    if(e.key==='Escape'){_closeCtxMenu();_closeLabelModal();_closeImportModal();if($aiModal)$aiModal.style.display='none';}
  });


  /* ════════════════════════════════════════════════════════════════
     32. WINDOW RESIZE
     ════════════════════════════════════════════════════════════════ */
  var _rTimer;
  window.addEventListener('resize',function(){
    clearTimeout(_rTimer);
    _rTimer=setTimeout(function(){if(!imgLoaded)return;_measureImage();resizeGridCanvas();resizeCursorCanvas();renderPoints();},120);
  });


  /* ════════════════════════════════════════════════════════════════
     33. EXPOSE GLOBALS
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
     34. INIT
     ════════════════════════════════════════════════════════════════ */
  updateCtxMenuState();
  _updatePanelDots();
  _setLiveMode(true);
  _syncModesPillLabels();
  _setPanelState('normal');
  _setTab('labels');
  _setStatus('Ready \u00b7 Fill label slots \u00b7 Drop or browse an image \u00b7 Right-click = menu');
  console.log('[BeDucky] v57 mounted OK.');

}(window));
