import React from "react"

const RedVsBlueStyles: React.FC = () => (
  <style>{`
    body { margin: 0; background-color: #050510; color: white; font-family: 'Courier New', Courier, monospace; }
    canvas { display: block; }
    #ui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between; }
    .top-bar { background: rgba(0, 0, 0, 0.5); padding: 10px; display: flex; justify-content: center; gap: 40px; font-size: 24px; font-weight: bold; text-shadow: 0 0 5px black; }
    .red-text { color: #ff4d4d; }
    .blue-text { color: #4d4dff; }
    .controls { pointer-events: auto; background: rgba(0,0,0,0.8); padding: 15px; display: flex; justify-content: center; gap: 15px; border-top: 1px solid #333; flex-wrap: wrap; }
    button { background: #333; color: white; border: 1px solid #555; padding: 10px 20px; font-family: inherit; font-size: 16px; cursor: pointer; transition: 0.2s; }
    button:hover { background: #555; } button:active { transform: translateY(1px); }
    .btn-red { border-bottom: 3px solid #ff4d4d; } .btn-blue { border-bottom: 3px solid #4d4dff; } .btn-reset { border-bottom: 3px solid white; } .btn-copilot { border-bottom: 3px solid #10b981; }
    .auto-decisions-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; letter-spacing: 0.03em; text-transform: uppercase; }
    .auto-decisions-toggle input { accent-color: #10b981; width: 16px; height: 16px; }
    .rvb-toast { pointer-events: none; position: absolute; top: 70px; right: 20px; max-width: 320px; background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(148, 163, 184, 0.35); padding: 12px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; color: #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .rvb-toast strong { display: block; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #10b981; margin-bottom: 6px; }
    .top-bar { position: relative; }
    .ai-override-hud { position: absolute; right: 12px; top: 6px; background: rgba(17,24,39,0.95); color: #f8fafc; padding: 8px 10px; border-radius: 8px; font-size: 12px; border: 1px solid rgba(148,163,184,0.2); box-shadow: 0 6px 18px rgba(0,0,0,0.45); pointer-events: none; }
  `}</style>
)

export default RedVsBlueStyles
