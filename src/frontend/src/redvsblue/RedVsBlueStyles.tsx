import React from "react"

const RedVsBlueStyles: React.FC = () => (
  <style>{`
    body { margin: 0; background-color: #050510; color: white; font-family: 'Courier New', Courier, monospace; }
    canvas { display: block; }
    #ui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between; }
    .top-bar { background: rgba(0, 0, 0, 0.5); padding: 10px; display: flex; justify-content: center; gap: 40px; font-size: 24px; font-weight: bold; text-shadow: 0 0 5px black; }
    .red-text { color: #ff4d4d; }
    .blue-text { color: #4d4dff; }
    .controls { pointer-events: auto; background: rgba(0,0,0,0.8); padding: 15px; display: flex; justify-content: center; gap: 15px; border-top: 1px solid #333; }
    button { background: #333; color: white; border: 1px solid #555; padding: 10px 20px; font-family: inherit; font-size: 16px; cursor: pointer; transition: 0.2s; }
    button:hover { background: #555; } button:active { transform: translateY(1px); }
    .btn-red { border-bottom: 3px solid #ff4d4d; } .btn-blue { border-bottom: 3px solid #4d4dff; } .btn-reset { border-bottom: 3px solid white; }
  `}</style>
)

export default RedVsBlueStyles
