/* ============================================================
   BE DUCKY  v55  —  Vibe Jiver Module
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

/* ... [Rest of the 1,600+ lines of code] ... */
