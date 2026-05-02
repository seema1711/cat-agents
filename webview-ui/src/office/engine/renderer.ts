import { MATRIX_COLOR, TILE_SIZE } from '../../constants';
import { Character, CharacterState, Direction, OfficeLayout, TileType } from '../types';
import { getCatImageData } from './catRenderer';

interface RenderOptions {
  zoom: number;
  offsetX: number;
  offsetY: number;
  showLabels: boolean;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  layout: OfficeLayout,
  characters: Map<number, Character>,
  opts: RenderOptions,
): void {
  const { zoom, offsetX, offsetY } = opts;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, w, h);

  renderTiles(ctx, layout, offsetX, offsetY, zoom);
  renderCharacters(ctx, characters, offsetX, offsetY, zoom, opts.showLabels);
}

function renderTiles(
  ctx: CanvasRenderingContext2D,
  layout: OfficeLayout,
  offsetX: number,
  offsetY: number,
  zoom: number,
): void {
  const ts = TILE_SIZE * zoom;
  for (let ty = 0; ty < layout.height; ty++) {
    for (let tx = 0; tx < layout.width; tx++) {
      const tileType = layout.tiles[ty]?.[tx] ?? TileType.VOID;
      if (tileType === TileType.VOID) continue;

      const sx = Math.floor((tx * TILE_SIZE + offsetX) * zoom);
      const sy = Math.floor((ty * TILE_SIZE + offsetY) * zoom);

      if (tileType === TileType.WALL_TOP || tileType === TileType.WALL_SIDE) {
        ctx.fillStyle = layout.wallColor;
        ctx.fillRect(sx, sy, Math.ceil(ts), Math.ceil(ts));
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx + 0.5, sy + 0.5, Math.ceil(ts) - 1, Math.ceil(ts) - 1);
      } else {
        ctx.fillStyle = layout.floorColor;
        ctx.fillRect(sx, sy, Math.ceil(ts), Math.ceil(ts));
        // subtle grid dot
        if (zoom >= 2) {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(sx, sy, 1, 1);
        }
      }
    }
  }

  // Render seat cushions
  for (const seat of layout.seats) {
    const sx = Math.floor((seat.tileX * TILE_SIZE + offsetX) * zoom);
    const sy = Math.floor((seat.tileY * TILE_SIZE + offsetY) * zoom);
    ctx.fillStyle = 'rgba(100, 80, 160, 0.4)';
    ctx.fillRect(sx + Math.floor(ts * 0.1), sy + Math.floor(ts * 0.5), Math.ceil(ts * 0.8), Math.ceil(ts * 0.4));
    ctx.strokeStyle = 'rgba(160,120,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sx + Math.floor(ts * 0.1), sy + Math.floor(ts * 0.5), Math.ceil(ts * 0.8), Math.ceil(ts * 0.4));
  }
}

function renderCharacters(
  ctx: CanvasRenderingContext2D,
  characters: Map<number, Character>,
  offsetX: number,
  offsetY: number,
  zoom: number,
  showLabels: boolean,
): void {
  const sorted = [...characters.values()].sort((a, b) => a.y - b.y);

  for (const char of sorted) {
    renderCharacter(ctx, char, offsetX, offsetY, zoom, showLabels);
  }
}

function renderCharacter(
  ctx: CanvasRenderingContext2D,
  char: Character,
  offsetX: number,
  offsetY: number,
  zoom: number,
  showLabels: boolean,
): void {
  const sx = Math.floor((char.x - TILE_SIZE / 2 + offsetX) * zoom);
  const sy = Math.floor((char.y - TILE_SIZE / 2 + offsetY) * zoom);
  const spriteW = Math.ceil(TILE_SIZE * zoom);
  const spriteH = Math.ceil(TILE_SIZE * zoom);

  if (char.spawning || char.despawning) {
    renderMatrixEffect(ctx, char, sx, sy, spriteW, spriteH);
    return;
  }

  // Draw cat sprite
  const imgData = getCatImageData(char.state, char.direction, char.animFrame, char.colorIndex);

  // Scale the 16×16 ImageData to zoom size
  const offscreen = getOffscreenCanvas(16, 16);
  offscreen.putImageData(imgData, 0, 0);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offscreen.canvas, sx, sy, spriteW, spriteH);

  // Waiting bubble (zzz)
  if (char.isWaiting && char.bubbleTimer > 0) {
    renderBubble(ctx, sx + spriteW / 2, sy, 'zzz', '#ffaa00');
  }

  // Permission bubble (!)
  if (char.hasPermission && char.permBubbleTimer > 0) {
    renderBubble(ctx, sx + spriteW / 2, sy, '!', '#ff4466');
  }

  // Label
  if (showLabels) {
    const label = char.activeToolName
      ? `${char.name}: ${char.activeToolName}`
      : char.name;
    ctx.font = `${Math.max(8, zoom * 5)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(label, sx + spriteW / 2 + 1, sy - 2 + 1);
    ctx.fillStyle = char.isWaiting ? '#ffaa00' : '#e0e0e0';
    ctx.fillText(label, sx + spriteW / 2, sy - 2);
  }
}

function renderMatrixEffect(
  ctx: CanvasRenderingContext2D,
  char: Character,
  sx: number,
  sy: number,
  w: number,
  h: number,
): void {
  const progress = char.spawning ? char.matrixProgress : 1 - char.matrixProgress;
  const visibleRows = Math.floor(progress * 16);

  ctx.save();
  ctx.globalAlpha = 0.85;

  for (let row = 0; row < visibleRows; row++) {
    for (let col = 0; col < 16; col++) {
      if (Math.random() > 0.4) {
        ctx.fillStyle = MATRIX_COLOR;
        const cx = sx + Math.floor(col * (w / 16));
        const cy = sy + Math.floor(row * (h / 16));
        ctx.fillRect(cx, cy, Math.max(1, Math.ceil(w / 16)), Math.max(1, Math.ceil(h / 16)));
      }
    }
  }

  ctx.restore();
}

function renderBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  text: string,
  color: string,
): void {
  const bw = 16;
  const bh = 10;
  const bx = cx - bw / 2;
  const by = topY - bh - 4;

  ctx.fillStyle = 'rgba(20,20,30,0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, by + bh / 2);
  ctx.textBaseline = 'alphabetic';
}

// Reusable OffscreenCanvasRenderingContext2D pool
interface OffscreenEntry {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}
const offscreenPool: Map<string, OffscreenEntry> = new Map();

function getOffscreenCanvas(w: number, h: number): CanvasRenderingContext2D {
  const key = `${w}x${h}`;
  let entry = offscreenPool.get(key);
  if (!entry) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx2 = canvas.getContext('2d')!;
    ctx2.imageSmoothingEnabled = false;
    entry = { canvas, ctx: ctx2 };
    offscreenPool.set(key, entry);
  }
  return entry.ctx;
}
