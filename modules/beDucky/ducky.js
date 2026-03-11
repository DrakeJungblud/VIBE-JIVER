/**
 * BE Ducky v55.1 - Lead Engineering Build
 * Professional Production Standard | Zero-Clutter Edition
 * Features: High-Contrast Readability, Mutual Exclusivity Logic, Pin Header Banner
 */

(function() {
  const VERSION = "55.1";
  const st = document.createElement('style');
  st.id = 'bd-ducky-styles';
  st.textContent = `
    /* ═══════════════════════════════════════════
       INLINE UI STYLES - HIGH CONTRAST
       ═══════════════════════════════════════════ */
    :root {
      --gold: #c5a059;
      --bg-dark: #0a0a0a;
      --text-bright: #e8e8e8;
      --text-dim: #7a7a7a;
      --danger: #ff4444;
    }

    #bd-wrap {
      display: flex;
      width: 100%;
      height: 100%;
      background: #000;
      color: var(--text-bright);
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    /* Label Panel Structure */
    .bd-label-panel {
      display: flex;
      flex-direction: column;
      background: var(--bg-dark);
      border-left: 1px solid #1a1a1a;
      width: 220px;
      transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .bd-lp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 1px solid #222;
    }

    .bd-lp-title {
      font-size: 13px;
      font-weight: 800;
      color: var(--gold);
      letter-spacing: 2px;
    }

    .bd-lp-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }

    .bd-lp-row {
      display: flex;
      align-items: center;
      padding: 4px 12px;
      gap: 10px;
    }

    .bd-lp-num {
      font-size: 13px;
      color: var(--text-dim);
      width: 20px;
    }

    .bd-lp-input {
      flex: 1;
      background: transparent;
      border: none;
      border-bottom: 1px solid #222;
      color: var(--text-bright);
      font-size: 13px;
      padding: 4px 0;
      outline: none;
    }

    .bd-lp-input:focus { border-bottom-color: var(--gold); }

    /* Expanded Mode Typing Class */
    .bd-lp-expanded .bd-lp-input { font-size: 15px; padding: 6px 0; }

    /* Windows-10 Context Menu */
    .bd-ctx-menu {
      position: fixed;
      background: #0d0d0d;
      border: 1px solid #333;
      min-width: 260px;
      padding: 6px 0;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      z-index: 10000;
      border-radius: 4px;
    }

    .bd-ctx-banner {
      padding: 8px 16px;
      background: rgba(197, 160, 89, 0.1);
      border-bottom: 1px solid #333;
      margin-bottom: 4px;
    }

    .bd-ctx-banner-text {
      color: var(--gold);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .bd-ctx-item {
      display: grid;
      grid-template-columns: 28px 1fr auto;
      align-items: center;
      padding: 8px 16px;
      font-size: 13px;
      color: var(--text-bright);
      cursor: pointer;
    }

    .bd-ctx-item:hover { background: rgba(255,255,255,0.05); }
    .bd-ctx-item.danger { color: var(--danger); }
    .bd-ctx-item.danger:hover { background: rgba(255, 68, 68, 0.1); }

    .bd-ctx-key {
      font-size: 10px;
      color: var(--text-dim);
      background: #1a1a1a;
      padding: 2px 6px;
      border-radius: 2px;
    }

    .bd-lp-rail {
      display: none;
      flex-direction: column;
      align-items: center;
      padding-top: 20px;
      gap: 20px;
    }
    .bd-lp-collapsed .bd-lp-rail { display: flex; }
    .bd-lp-collapsed .bd-lp-header, .bd-lp-collapsed .bd-lp-list { display: none; }
  `;
  document.head.appendChild(st);

  // --- LOGIC ENGINE ---
  const DuckyLogic = {
    isExpanded: false,
    isCollapsed: false,

    toggleExpanded() {
      this.isExpanded = !this.isExpanded;
      if (this.isExpanded) this.isCollapsed = false;
      this.updateUI();
    },

    toggleCollapsed() {
      this.isCollapsed = !this.isCollapsed;
      if (this.isCollapsed) this.isExpanded = false;
      this.updateUI();
    },

    updateUI() {
      const lp = document.getElementById('bd-label-panel');
      lp.classList.remove('bd-lp-expanded', 'bd-lp-collapsed');
      if (this.isExpanded) lp.classList.add('bd-lp-expanded');
      if (this.isCollapsed) lp.classList.add('bd-lp-collapsed');
      
      // Dispatch resize for canvas refresh
      setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
    }
  };

  // Initialization & Rendering
  function init() {
    const wrap = document.getElementById('bd-wrap');
    if (!wrap) return;

    // Create Label Panel
    const panel = document.createElement('aside');
    panel.id = 'bd-label-panel';
    panel.className = 'bd-label-panel';
    panel.innerHTML = `
      <div class="bd-lp-header">
        <span class="bd-lp-title">LABELS</span>
        <div class="bd-lp-controls">
          <button id="btn-exp" style="background:none; border:none; color:#777; cursor:pointer;">⤢</button>
          <button id="btn-col" style="background:none; border:none; color:#777; cursor:pointer;">◀</button>
        </div>
      </div>
      <div class="bd-lp-list" id="lp-list"></div>
      <div class="bd-lp-rail">
        <div style="color:#c5a059; font-weight:bold;">L</div>
      </div>
    `;
    wrap.appendChild(panel);

    const list = document.getElementById('lp-list');
    for (let i = 1; i <= 20; i++) {
      const row = document.createElement('div');
      row.className = 'bd-lp-row';
      row.innerHTML = `<span class="bd-lp-num">${i}</span><input class="bd-lp-input" placeholder="...">`;
      list.appendChild(row);
    }

    document.getElementById('btn-exp').onclick = () => DuckyLogic.toggleExpanded();
    document.getElementById('btn-col').onclick = () => DuckyLogic.toggleCollapsed();

    // Keybindings
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key.toLowerCase() === 'e') DuckyLogic.toggleExpanded();
      if (e.key.toLowerCase() === 'c') DuckyLogic.toggleCollapsed();
    });
  }

  init();
})();
