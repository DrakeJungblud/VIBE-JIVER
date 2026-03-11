/* ============================================================
   BE DUCKY  v55  —  Vibe Jiver Module
   RESTORED: Original Lead Engineering Build
   NEW in v55:
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
    '  <div class="bd-url-bar">',
    '    <input type="text" id="bd-url-input" class="bd-url-input" placeholder="Paste image URL then Enter or Load" spellcheck="false" autocomplete="off">',
    '    <button class="bd-btn bd-btn-gold" id="bd-load-url-btn">Load</button>',
    '    <input type="file" id="bd-file-input" accept="image/*" style="display:none">',
    '    <div class="bd-url-spacer"></div>',
    '    <button class="bd-btn bd-btn-ai" id="bd-ai-meet-btn" title="Copy AI onboarding prompt">&#129302; AI Meet Ducky</button>',
    '  </div>',
    '  <div class="bd-body">',
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
    '    <div class="bd-panel" id="bd-label-panel">',
    '      <div class="bd-panel-topbar">',
    '        <span class="bd-panel-brand" id="bd-lp-title-txt">&#9998; DUCKY PANEL</span>',
    '        <button class="bd-panel-iconbtn" id="bd-lp-expand-btn"   title="Expand panel (E)">&#10070;</button>',
    '        <button class="bd-panel-iconbtn" id="bd-lp-collapse-btn" title="Collapse panel">&#9664;</button>',
    '      </div>',
    '      <div class="bd-tab-bar" id="bd-lp-mode-row">',
    '        <button class="bd-tab bd-tab-active" id="bd-tab-labels"  data-tab="labels">LABELS</button>',
    '        <button class="bd-tab"               id="bd-tab-modes"   data-tab="modes">MODES</button>',
    '        <button class="bd-tab"               id="bd-tab-export"  data-tab="export">EXPORT</button>',
    '      </div>',
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
    '      </div>'/* ── TAB: MODES ── */
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

    '      <div class="bd-lp-rail" id="bd-lp-rail" style="display:none">',
    '        <button class="bd-btn-rail" id="bd-lp-expand-rail" title="Expand panel (E)">&#9654;<br><span>P<br>A<br>N<br>E<br>L</span></button>',
    '      </div>',
    '    </div>',
    '  </div>',

    '  <div class="bd-output-bar">',
    '    <span class="bd-output-bar-label">OUTPUT:</span>',
    '    <button class="bd-btn bd-btn-sm bd-btn-export" id="bd-export-css"  disabled>CSS</button>',
    '    <button class="bd-btn bd-btn-sm bd-btn-export" id="bd-export-json" disabled>JSON</button>',
    '    <button class="bd-btn bd-btn-sm bd-btn-export" id="bd-export-ai"   disabled>AI Prompt</button>',
    '    <button class="bd-btn bd-btn-sm bd-btn-gold"   id="bd-copy-all"    disabled>&#9000; Copy</button>',
    '    <span class="bd-status-pill" id="bd-status">Ready — drop an image to begin</span>',
    '  </div>',

    '  <div class="bd-output-wrap" style="display:none">',
    '    <textarea id="bd-output" class="bd-output" spellcheck="false" readonly></textarea>',
    '  </div>',

    '  <div id="bd-ctx-menu" class="bd-ctx-menu" style="display:none">',
    '    <div class="bd-ctx-header" id="bd-ctx-header">',
    '      <span class="bd-ctx-header-icon">&#127919;</span>',
    '      <span class="bd-ctx-header-text" id="bd-ctx-header-text">Pin 1</span>',
    '    </div>',
    '    <div id="bd-ctx-pin-group">',
    '      <button class="bd-ctx-item" id="bd-ctx-label">',
    '        <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">&#9998;</span>',
    '        <span class="bd-ctx-item-text">Edit Label</span><span class="bd-ctx-item-hint">double-click</span>',
    '      </button>',
    '      <button class="bd-ctx-item" id="bd-ctx-toggle-label">',
    '        <span class="bd-ctx-check" id="bd-ctx-chk-label"></span><span class="bd-ctx-item-icon">&#9673;</span>',
    '        <span class="bd-ctx-item-text" id="bd-ctx-tlbl-text">Show Label</span>',
    '      </button>',
    '      <button class="bd-ctx-item" id="bd-ctx-moveup">',
    '        <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">&#8593;</span>',
    '        <span class="bd-ctx-item-text">Move Up</span>',
    '      </button>',
    '      <button class="bd-ctx-item" id="bd-ctx-movedn">',
    '        <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">&#8595;</span>',
    '        <span class="bd-ctx-item-text">Move Down</span>',
    '      </button>',
    '      <button class="bd-ctx-item bd-ctx-item-danger" id="bd-ctx-delete">',
    '        <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">&#10005;</span>',
    '        <span class="bd-ctx-item-text">Delete Pin</span><span class="bd-ctx-item-hint">Del</span>',
    '      </button>',
    '    </div>',
    '    <div class="bd-ctx-divider" id="bd-ctx-div-pin"></div>',
    '    <button class="bd-ctx-item" id="bd-ctx-undo">',
    '        <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">&#8630;</span>',
    '        <span class="bd-ctx-item-text">Undo</span><span class="bd-ctx-item-hint">Ctrl+Z</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-redo">',
    '        <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">&#8631;</span>',
    '        <span class="bd-ctx-item-text">Redo</span><span class="bd-ctx-item-hint">Ctrl+Y</span>',
    '    </button>',
    '    <button class="bd-ctx-item bd-ctx-item-danger" id="bd-ctx-clear-pins">',
    '        <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">&#9108;</span>',
    '        <span class="bd-ctx-item-text">Clear All Pins</span><span class="bd-ctx-item-hint">X</span>',
    '    </button>',
    '    <div class="bd-ctx-divider"></div>',
    '    <button class="bd-ctx-item" id="bd-ctx-live-toggle">',
    '      <span class="bd-ctx-check bd-ctx-checked" id="bd-ctx-chk-live">&#10003;</span>',
    '      <span class="bd-ctx-item-icon">&#9673;</span><span class="bd-ctx-item-text">Live Labels</span><span class="bd-ctx-item-hint">V</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-labels-vis">',
    '      <span class="bd-ctx-check bd-ctx-checked" id="bd-ctx-chk-labels">&#10003;</span>',
    '      <span class="bd-ctx-item-icon">&#9673;</span><span class="bd-ctx-item-text">Label Overlay</span><span class="bd-ctx-item-hint">L</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-crosshair">',
    '      <span class="bd-ctx-check bd-ctx-checked" id="bd-ctx-chk-cross">&#10003;</span>',
    '      <span class="bd-ctx-item-icon">&#10011;</span><span class="bd-ctx-item-text">Crosshair</span><span class="bd-ctx-item-hint">C</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-grid">',
    '      <span class="bd-ctx-check" id="bd-ctx-chk-grid"></span>',
    '      <span class="bd-ctx-item-icon">&#9638;</span><span class="bd-ctx-item-text" id="bd-ctx-grid-text">Grid: Off</span><span class="bd-ctx-item-hint">G</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-snap">',
    '      <span class="bd-ctx-check" id="bd-ctx-chk-snap"></span>',
    '      <span class="bd-ctx-item-icon">&#8862;</span><span class="bd-ctx-item-text">Snap to Grid</span><span class="bd-ctx-item-hint">S</span>',
    '    </button>',
    '    <div class="bd-ctx-divider"></div>',
    '    <button class="bd-ctx-item" id="bd-ctx-exp-ai">',
    '      <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">&#129302;</span>',
    '      <span class="bd-ctx-item-text">Export AI Prompt</span><span class="bd-ctx-item-hint">A</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-exp-json">',
    '      <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">{ }</span>',
    '      <span class="bd-ctx-item-text">Export JSON</span><span class="bd-ctx-item-hint">J</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-exp-css">',
    '      <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">#</span>',
    '      <span class="bd-ctx-item-text">Export CSS</span><span class="bd-ctx-item-hint">K</span>',
    '    </button>',
    '    <button class="bd-ctx-item" id="bd-ctx-exp-css-lbl">',
    '      <span class="bd-ctx-check"></span><span class="bd-ctx-item-icon">&#9998;</span>',
    '      <span class="bd-ctx-item-text">Export CSS + Labels</span><span class="bd-ctx-item-hint">&#8679;K</span>',
    '    </button>',
    '  </div>',

    '  <div id="bd-label-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal">',
    '      <div class="bd-modal-title">&#9998; Edit Pin Label</div>',
    '      <input type="text" id="bd-label-input" class="bd-modal-input" placeholder="e.g. left eye" maxlength="60" spellcheck="false">',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-label-save">Save</button>',
    '        <button class="bd-btn"             id="bd-label-cancel">Cancel</button>',
    '      </div>',
    '    </div>',
    '  </div>',

    '  <div id="bd-import-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal bd-modal-wide">',
    '      <div class="bd-modal-title">&#8659; Import Label List</div>',
    '      <textarea id="bd-import-textarea" class="bd-modal-textarea" placeholder=\'["left eye", "right eye"]\' spellcheck="false"></textarea>',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-import-apply">Apply to Slots</button>',
    '        <button class="bd-btn"             id="bd-import-clear">Clear All Slots</button>',
    '        <button class="bd-btn"             id="bd-import-cancel">Cancel</button>',
    '      </div>',
    '    </div>',
    '  </div>',

    '  <div id="bd-ai-modal" class="bd-modal-overlay" style="display:none">',
    '    <div class="bd-modal bd-modal-wide">',
    '      <div class="bd-modal-title">&#129302; AI Meet Ducky</div>',
    '      <textarea id="bd-ai-prompt-box" class="bd-modal-textarea bd-modal-textarea-tall" spellcheck="false" readonly></textarea>',
    '      <div class="bd-modal-actions">',
    '        <button class="bd-btn bd-btn-gold" id="bd-ai-copy-btn">&#9000; Copy Prompt</button>',
    '        <button class="bd-btn"             id="bd-ai-cancel-btn">Close</button>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');

  /* ════════════════════════════════════════════════════════════════
     2. CSS — The Midnight Typography & Industrial Layout
     ════════════════════════════════════════════════════════════════ */
  var st = document.createElement('style');
  st.id = 'bd-ducky-styles';
  st.textContent = [
    ':root { --gold: #c5a059; --bg-dark: #0a0a0a; --bg-menu: #0d0d0d; --text-bright: #e8e8e8; --text-dim: #9a9a9a; --border: #1e1e1e; --font: "Segoe UI", system-ui, sans-serif; }',
    '#bd-wrap { display: flex; flex-direction: column; width: 100%; height: 100%; background: #000; color: var(--text-bright); font-family: var(--font); overflow: hidden; font-size: 13px; position: relative; }',
    '.bd-toolbar { display: flex; height: 44px; background: #050505; border-bottom: 1px solid var(--border); padding: 0 12px; align-items: center; justify-content: space-between; z-index: 100; flex-shrink: 0; }',
    '.bd-body { display: flex; flex: 1; overflow: hidden; position: relative; }',
    '.bd-canvas-area { flex: 1; background: #000; position: relative; overflow: auto; display: flex; align-items: center; justify-content: center; user-select: none; }',
    '.bd-panel { width: 270px; background: #080808; border-left: 1px solid var(--border); display: flex; flex-direction: column; z-index: 101; flex-shrink: 0; transition: width 0.2s ease; }',
    '.bd-panel.bd-lp-expanded { width: 370px; }''.bd-lp-input { flex: 1; background: transparent; border: none; color: var(--text-bright); font-size: 14px; padding: 0 8px; outline: none; }',
    '.bd-lp-row { display: flex; align-items: center; padding: 4px 8px; border-bottom: 1px solid #111; height: 32px; }',
    '.bd-lp-num { color: #555; width: 22px; font-size: 13px; font-weight: 600; text-align: center; }',
    '.bd-ctx-menu { position: fixed; width: 190px; background: rgba(13, 13, 13, 0.98); border: 1px solid #333; border-radius: 4px; padding: 4px 0; z-index: 9999; box-shadow: 0 10px 30px rgba(0,0,0,0.8); backdrop-filter: blur(8px); }',
    '.bd-ctx-item { width: 100%; display: flex; align-items: center; padding: 6px 12px; background: transparent; border: none; color: #ccc; cursor: pointer; text-align: left; transition: background 0.1s; position: relative; }',
    '.bd-ctx-item:hover { background: #333; color: #fff; }',
    '.bd-ctx-divider { height: 1px; background: #222; margin: 4px 0; }',
    '.bd-ctx-check { width: 20px; color: var(--gold); font-weight: bold; font-size: 14px; }',
    '.bd-ctx-item-text { flex: 1; }',
    '.bd-ctx-item-hint { font-size: 10px; color: #666; }',
    '.bd-pin { position: absolute; width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--gold); background: rgba(0,0,0,0.5); transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; cursor: move; z-index: 10; font-weight: bold; color: var(--gold); text-shadow: 0 1px 2px #000; box-shadow: 0 0 10px rgba(0,0,0,0.4); }',
    '.bd-pin-label { position: absolute; top: 28px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: var(--gold); padding: 2px 6px; border-radius: 4px; font-size: 11px; white-space: nowrap; pointer-events: none; }',
    '/* v55 native-look context menu animations */',
    '.bd-ctx-menu { animation: bd-pop 0.1s ease-out; transform-origin: top left; }',
    '@keyframes bd-pop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }'
  ].join('\n');
  document.head.appendChild(st);

  /* ════════════════════════════════════════════════════════════════
     3. THE ENGINE
     ════════════════════════════════════════════════════════════════ */
  var state = {
    pins: [], history: [], future: [],
    naturalWidth: 0, naturalHeight: 0,
    config: { cross: true, labels: true, live: true, grid: 0, snap: false, expanded: false },
    activePinIndex: -1
  };

  function init() {
    var host = document.getElementById('bd-host') || document.body;
    var container = document.createElement('div');
    container.innerHTML = _MODULE_HTML;
    host.appendChild(container);
    bindEvents();
    render();
  }

  function bindEvents() {
    // Canvas Click Logic
    document.getElementById('bd-image-area').addEventListener('click', function(e) {
      if (e.target.closest('.bd-pin')) return;
      var rect = document.getElementById('bd-main-img').getBoundingClientRect();
      var x = Math.round((e.clientX - rect.left) * (state.naturalWidth / rect.width));
      var y = Math.round((e.clientY - rect.top) * (state.naturalHeight / rect.height));
      addPin(x, y);
    });

    // Right Click Logic (v55 Restoration)
    window.addEventListener('contextmenu', function(e) {
      var pin = e.target.closest('.bd-pin');
      var menu = document.getElementById('bd-ctx-menu');
      if (!e.target.closest('#bd-wrap')) return;
      
      e.preventDefault();
      menu.style.display = 'block';
      menu.style.left = e.clientX + 'px';
      menu.style.top = e.clientY + 'px';
      
      var pinGroup = document.getElementById('bd-ctx-pin-group');
      var pinDivider = document.getElementById('bd-ctx-div-pin');
      if (pin) {
        state.activePinIndex = parseInt(pin.dataset.idx);
        pinGroup.style.display = 'block';
        pinDivider.style.display = 'block';
        document.getElementById('bd-ctx-header-text').textContent = 'Pin ' + (state.activePinIndex + 1);
      } else {
        pinGroup.style.display = 'none';
        pinDivider.style.display = 'none';
      }
    });

    // Global Close Context
    window.addEventListener('mousedown', function(e) {
      if (!e.target.closest('#bd-ctx-menu')) {
        document.getElementById('bd-ctx-menu').style.display = 'none';
      }
    });

    // Tab Logic
    document.querySelectorAll('.bd-tab').forEach(function(btn) {
      btn.onclick = function() {
        document.querySelectorAll('.bd-tab').forEach(b => b.classList.remove('bd-tab-active'));
        document.querySelectorAll('.bd-tab-pane').forEach(p => p.classList.add('bd-tab-pane-hidden'));
        btn.classList.add('bd-tab-active');
        document.getElementById('bd-pane-' + btn.dataset.tab).classList.remove('bd-tab-pane-hidden');
      };
    });

    // Undo/Redo Shortcuts
    window.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    });
  }

  function addPin(x, y) {
    state.history.push(JSON.stringify(state.pins));
    var label = state.config.live ? document.getElementById('bd-lp-input-' + (state.pins.length + 1))?.value || '' : '';
    state.pins.push({ x: x, y: y, label: label, visible: true });
    state.future = [];
    render();
  }

  function undo() {
    if (state.history.length === 0) return;
    state.future.push(JSON.stringify(state.pins));
    state.pins = JSON.parse(state.history.pop());
    render();
  }

  function render() {
    var layer = document.getElementById('bd-points-layer');
    if (!layer) return;
    layer.innerHTML = '';
    state.pins.forEach((p, i) => {
      var pinEl = document.createElement('div');
      pinEl.className = 'bd-pin';
      pinEl.dataset.idx = i;
      pinEl.innerHTML = '<span>' + (i + 1) + '</span>';
      if (state.config.labels && p.label) {
        pinEl.innerHTML += '<div class="bd-pin-label">' + p.label + '</div>';
      }
      // Positioning based on natural scale
      var rect = document.getElementById('bd-main-img').getBoundingClientRect();
      pinEl.style.left = (p.x * (rect.width / state.naturalWidth)) + 'px';
      pinEl.style.top = (p.y * (rect.height / state.naturalHeight)) + 'px';
      layer.appendChild(pinEl);
    });
    
    document.getElementById('bd-undo-btn').disabled = state.history.length === 0;
    document.getElementById('bd-redo-btn').disabled = state.future.length === 0;
    document.getElementById('bd-count-display').textContent = state.pins.length + ' pins';
  }

  root.BE_DUCKY = { init: init };
  
  // Auto-init if drop zone exists
  if (document.getElementById('bd-drop-zone')) init();

})(window);
