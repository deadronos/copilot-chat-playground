import { useGame } from './hooks/useGame';
import { useUIStore } from './stores/uiStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

/* eslint-disable react-hooks/refs */
// Note: ESLint incorrectly flags Zustand store values as refs.
// The values returned from useGame (isRunning, isPaused, redScore, blueScore)
// are NOT refs - they are primitive values from Zustand selectors that trigger re-renders.
export function RedVsBlue() {
  const game = useGame({
    width: 800,
    height: 600,
    autoStart: false,
  });

  const showDebug = useUIStore((state) => state.showDebug);
  const setShowDebug = useUIStore((state) => state.setShowDebug);

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h1 className="text-3xl font-bold">Red vs Blue</h1>
      
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          {/* Canvas */}
          <div className="border-2 border-gray-300 rounded">
            <canvas
              ref={game.canvasRef}
              className="block"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>

          {/* Scores */}
          <div className="flex justify-around items-center py-2">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500">{game.redScore}</div>
              <div className="text-sm text-gray-600">Red Team</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500">{game.blueScore}</div>
              <div className="text-sm text-gray-600">Blue Team</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-center">
            {!game.isRunning ? (
              <Button onClick={game.start} variant="default">
                Start Game
              </Button>
            ) : game.isPaused ? (
              <Button onClick={game.resume} variant="default">
                Resume
              </Button>
            ) : (
              <Button onClick={game.pause} variant="default">
                Pause
              </Button>
            )}
            
            <Button onClick={game.stop} variant="outline" disabled={!game.isRunning}>
              Stop
            </Button>
            
            <Button onClick={game.reset} variant="outline">
              Reset
            </Button>
          </div>

          {/* Spawn Controls */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={game.spawnRed}
              disabled={!game.isRunning || game.isPaused}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Spawn Red
            </Button>
            <Button
              onClick={game.spawnBlue}
              disabled={!game.isRunning || game.isPaused}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Spawn Blue
            </Button>
          </div>

          {/* Debug Toggle */}
          <div className="flex items-center gap-2 justify-center">
            <input
              type="checkbox"
              id="debug-toggle"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="debug-toggle" className="cursor-pointer">
              Show Debug Info
            </Label>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 text-center border-t pt-4">
            <p><strong>Instructions:</strong></p>
            <p>Click "Start Game" to begin. Use "Spawn Red" and "Spawn Blue" to add entities.</p>
            <p>Entities move across the canvas and score points when they reach the opposite side.</p>
            <p>When entities from different teams collide, they both disappear!</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
