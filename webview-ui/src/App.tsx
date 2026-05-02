import { useCallback, useEffect, useRef, useState } from 'react';
import { CAMERA_LERP, DEFAULT_GRID_HEIGHT, DEFAULT_GRID_WIDTH, TILE_SIZE, ZOOM_MAX, ZOOM_MIN } from './constants';
import { useExtensionMessages } from './hooks/useExtensionMessages';
import { OfficeState } from './office/engine/officeState';
import { renderFrame } from './office/engine/renderer';
import { startGameLoop } from './office/engine/gameLoop';
import { vscode } from './vscodeApi';
import { isBrowserRuntime } from './runtime';

interface AgentChip {
  id: number;
  name: string;
  isWaiting: boolean;
  hasPermission: boolean;
  toolName?: string;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const officeStateRef = useRef<OfficeState>(new OfficeState());
  const [zoom, setZoom] = useState(3);
  const [showLabels, setShowLabels] = useState(true);
  const [agents, setAgents] = useState<AgentChip[]>([]);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const cameraOffset = useRef({ x: 0, y: 0 });
  const targetOffset = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);

  // Sync zoom ref
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const syncAgentChips = useCallback(() => {
    const chips: AgentChip[] = [];
    for (const char of officeStateRef.current.characters.values()) {
      chips.push({
        id: char.id,
        name: char.name,
        isWaiting: char.isWaiting,
        hasPermission: char.hasPermission,
        toolName: char.activeToolName,
      });
    }
    setAgents([...chips]);
  }, []);

  useExtensionMessages(officeStateRef, syncAgentChips);

  // Center camera
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gridPxW = DEFAULT_GRID_WIDTH * TILE_SIZE;
    const gridPxH = DEFAULT_GRID_HEIGHT * TILE_SIZE;
    const cx = (canvas.width / zoom - gridPxW) / 2;
    const cy = (canvas.height / zoom - gridPxH) / 2;
    cameraOffset.current = { x: cx, y: cy };
    targetOffset.current = { x: cx, y: cy };
  }, [zoom]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const stop = startGameLoop(canvas, {
      update(dt) {
        officeStateRef.current.update(dt);
        // Smooth camera
        const cam = cameraOffset.current;
        const tgt = targetOffset.current;
        cam.x += (tgt.x - cam.x) * CAMERA_LERP;
        cam.y += (tgt.y - cam.y) * CAMERA_LERP;
      },
      render(ctx) {
        renderFrame(ctx, officeStateRef.current.layout, officeStateRef.current.characters, {
          zoom: zoomRef.current,
          offsetX: cameraOffset.current.x,
          offsetY: cameraOffset.current.y,
          showLabels,
        });
      },
    });

    return stop;
  }, [showLabels]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvas.width = entry.contentRect.width;
        canvas.height = entry.contentRect.height;
      }
    });
    obs.observe(canvas.parentElement!);
    return () => obs.disconnect();
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * delta)));
  }, []);

  // Pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = (e.clientX - lastMouse.current.x) / zoomRef.current;
    const dy = (e.clientY - lastMouse.current.y) / zoomRef.current;
    targetOffset.current.x += dx;
    targetOffset.current.y += dy;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);
  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

  // Dev mode: inject mock agents in browser
  useEffect(() => {
    if (!isBrowserRuntime) return;
    setTimeout(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'existingAgents',
          agents: [
            { id: 1, folderName: 'whiskers', sessionId: 'test-1', isWaiting: false, activeTools: [{ toolId: 'tool1', toolName: 'Bash', status: 'Bash' }] },
            { id: 2, folderName: 'mittens', sessionId: 'test-2', isWaiting: true, activeTools: [] },
            { id: 3, folderName: 'shadow', sessionId: 'test-3', isWaiting: false, activeTools: [] },
          ],
        },
      }));
    }, 300);
  }, []);

  const handleFocusAgent = (id: number) => {
    vscode.postMessage({ type: 'focusAgent', agentId: id });
  };

  return (
    <div className="cat-panel">
      <div
        className="cat-canvas-wrapper"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

        {/* Agent chips overlay */}
        <div className="cat-overlay">
          {agents.map((a) => (
            <div
              key={a.id}
              className="cat-agent-chip"
              onClick={() => handleFocusAgent(a.id)}
              title={a.toolName ?? a.name}
            >
              <span
                className={`dot ${a.hasPermission ? 'dot-waiting' : a.isWaiting ? 'dot-idle' : a.toolName ? 'dot-active' : 'dot-idle'}`}
              />
              <span>{a.toolName ? `${a.name}: ${a.toolName}` : a.name}</span>
            </div>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="zoom-controls">
          <button onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 1))} title="Zoom in">+</button>
          <button onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 1))} title="Zoom out">−</button>
        </div>
      </div>

      <div className="cat-toolbar">
        <button
          onClick={() => vscode.postMessage({ type: 'openClaude' })}
          title="Spawn new Claude agent as a cat"
        >
          + Cat
        </button>
        <button
          onClick={() => setShowLabels((v) => !v)}
          title="Toggle agent labels"
        >
          {showLabels ? 'Hide Labels' : 'Show Labels'}
        </button>
        <span className="label">
          {agents.length} cat{agents.length !== 1 ? 's' : ''} · zoom {zoom.toFixed(1)}×
        </span>
      </div>
    </div>
  );
}
