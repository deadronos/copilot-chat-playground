import React from "react"

const RedVsBlueStyles: React.FC = () => (
  <style>{`
    :root {
      --bg: #050510;
      --panel: rgba(6,10,20,0.6);
      --muted: #cbd5e1;
      --accent-red: #ff6b6b;
      --accent-blue: #5aa0ff;
      --accent-green: #10b981;
      --control-bg: rgba(6,10,20,0.85);
      --btn-bg: #0f1724;
      --btn-border: rgba(255,255,255,0.06);
    }

    body { margin: 0; background-color: var(--bg); color: var(--muted); font-family: 'Courier New', Courier, monospace; }
    canvas { display: block; }
    #ui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between; }

    /* Top HUD */
    .top-bar { background: var(--panel); padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; gap: 24px; font-size: 18px; font-weight: 700; max-width: 1100px; margin: 12px auto; border-radius: 10px; box-shadow: 0 6px 18px rgba(0,0,0,0.5); }
    .stat { display: flex; align-items: center; gap: 10px; }
    .stat-label { color: #e6eef8; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.95; }
    .stat-value { font-weight: 900; font-size: 20px; padding: 4px 8px; border-radius: 8px; background: rgba(255,255,255,0.02); }
    .stat-value.red { color: var(--accent-red); background: rgba(255,90,90,0.06); box-shadow: 0 2px 10px rgba(255,80,80,0.04); }
    .stat-value.blue { color: var(--accent-blue); background: rgba(90,160,255,0.06); box-shadow: 0 2px 10px rgba(90,160,255,0.04); }

    /* Controls */
    .controls { pointer-events: auto; background: var(--control-bg); padding: 14px 18px; display:flex; justify-content:center; border-top: 1px solid rgba(255,255,255,0.02); box-shadow: inset 0 1px 0 rgba(255,255,255,0.02); }
    .controls-inner { display:flex; gap:12px; align-items:center; width:100%; max-width:1100px; margin:0 auto; }
    .control-buttons { display:flex; gap:12px; align-items:center; }
    .control-toggles { display:flex; gap:12px; align-items:center; margin-left:auto; }

    button { background: var(--btn-bg); color: #f8fafc; border: 1px solid var(--btn-border); padding: 10px 18px; min-width: 110px; height: 44px; font-family: inherit; font-size: 14px; cursor: pointer; border-radius: 8px; display:inline-flex; align-items:center; justify-content:center; transition: transform 0.12s, box-shadow 0.12s, background 0.12s; box-shadow: 0 6px 18px rgba(0,0,0,0.5); }
    button:focus { outline: 2px solid rgba(255,255,255,0.06); outline-offset: 2px; }
    button:hover { transform: translateY(-2px); background: #111827; }

    .btn-red { border-left: 4px solid var(--accent-red); }
    .btn-blue { border-left: 4px solid var(--accent-blue); }
    .btn-reset { border-left: 4px solid rgba(255,255,255,0.12); }
    .btn-copilot { border-left: 4px solid var(--accent-green); }

    .auto-decisions-toggle, .allow-overrides-toggle { display: inline-flex; align-items: center; gap: 8px; color: #e6eef8; font-size: 13px; }
    .auto-decisions-toggle input, .allow-overrides-toggle input { accent-color: var(--accent-green); width: 18px; height: 18px; }

    .rvb-toast { pointer-events: none; position: absolute; top: 80px; right: 20px; max-width: 320px; background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(148, 163, 184, 0.25); padding: 12px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; color: #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .rvb-toast strong { display: block; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-green); margin-bottom: 6px; }

    .top-bar { position: relative; }
    .ai-override-hud { position: absolute; right: 12px; top: 6px; background: rgba(17,24,39,0.95); color: #f8fafc; padding: 8px 10px; border-radius: 8px; font-size: 12px; border: 1px solid rgba(148,163,184,0.12); box-shadow: 0 6px 18px rgba(0,0,0,0.45); pointer-events: none; }
  `}</style>
)

export default RedVsBlueStyles
