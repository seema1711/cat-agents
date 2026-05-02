import { DEFAULT_GRID_HEIGHT, DEFAULT_GRID_WIDTH, TILE_SIZE } from '../../constants';
import { Character, CharacterState, Direction, OfficeLayout, Seat, TileType } from '../types';
import { createCharacter, setCharacterIdle, setCharacterTyping, updateCharacter } from './characters';

export class OfficeState {
  layout: OfficeLayout;
  characters: Map<number, Character> = new Map();
  walkableTiles: Set<string> = new Set();
  private nextSeatIdx = 0;

  constructor() {
    this.layout = this.defaultLayout();
    this.rebuildWalkable();
  }

  private defaultLayout(): OfficeLayout {
    const w = DEFAULT_GRID_WIDTH;
    const h = DEFAULT_GRID_HEIGHT;
    const tiles: number[][] = [];
    for (let y = 0; y < h; y++) {
      const row: number[] = [];
      for (let x = 0; x < w; x++) {
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
          row.push(TileType.WALL_TOP);
        } else {
          row.push(TileType.FLOOR);
        }
      }
      tiles.push(row);
    }

    const seats: Seat[] = [
      { tileX: 3, tileY: 3, facing: Direction.DOWN },
      { tileX: 6, tileY: 3, facing: Direction.DOWN },
      { tileX: 9, tileY: 3, facing: Direction.DOWN },
      { tileX: 12, tileY: 3, facing: Direction.DOWN },
      { tileX: 3, tileY: 7, facing: Direction.UP },
      { tileX: 6, tileY: 7, facing: Direction.UP },
      { tileX: 9, tileY: 7, facing: Direction.UP },
      { tileX: 12, tileY: 7, facing: Direction.UP },
    ];

    return { width: w, height: h, tiles, seats, floorColor: '#1e2a3a', wallColor: '#0f1924' };
  }

  private rebuildWalkable(): void {
    this.walkableTiles.clear();
    const { tiles, width, height } = this.layout;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y]?.[x] === TileType.FLOOR) {
          this.walkableTiles.add(`${x},${y}`);
        }
      }
    }
  }

  addAgent(id: number, name: string, colorIndex: number): void {
    if (this.characters.has(id)) return;
    const seat = this.getNextSeat();
    const tileX = seat?.tileX ?? Math.floor(DEFAULT_GRID_WIDTH / 2);
    const tileY = seat?.tileY ?? Math.floor(DEFAULT_GRID_HEIGHT / 2);
    const char = createCharacter(id, name, colorIndex, tileX, tileY);
    if (seat) {
      char.seat = seat;
      char.direction = seat.facing;
    }
    this.characters.set(id, char);
  }

  removeAgent(id: number): void {
    const char = this.characters.get(id);
    if (char) {
      char.despawning = true;
      char.matrixProgress = 1;
      setTimeout(() => this.characters.delete(id), 800);
    }
  }

  setAgentTyping(id: number, toolName?: string): void {
    const char = this.characters.get(id);
    if (!char) return;
    setCharacterTyping(char);
    char.activeToolName = toolName;
  }

  setAgentIdle(id: number): void {
    const char = this.characters.get(id);
    if (!char) return;
    setCharacterIdle(char);
    char.activeToolName = undefined;
  }

  setAgentWaiting(id: number, waiting: boolean): void {
    const char = this.characters.get(id);
    if (!char) return;
    char.isWaiting = waiting;
    if (waiting) {
      char.bubbleTimer = 5;
      setCharacterIdle(char);
    }
  }

  setAgentPermission(id: number, show: boolean): void {
    const char = this.characters.get(id);
    if (!char) return;
    char.hasPermission = show;
    if (show) char.permBubbleTimer = 8;
  }

  setAgentTokens(id: number, input: number, output: number): void {
    const char = this.characters.get(id);
    if (!char) return;
    char.inputTokens = input;
    char.outputTokens = output;
  }

  update(dt: number): void {
    for (const char of this.characters.values()) {
      updateCharacter(char, dt, this.walkableTiles, this.layout.width, this.layout.height);
    }
  }

  private getNextSeat(): Seat | undefined {
    const seats = this.layout.seats;
    if (seats.length === 0) return undefined;
    const seat = seats[this.nextSeatIdx % seats.length];
    this.nextSeatIdx++;
    return seat;
  }

  getCharacterAt(px: number, py: number, offsetX: number, offsetY: number, zoom: number): Character | undefined {
    for (const char of this.characters.values()) {
      const sx = (char.x + offsetX) * zoom;
      const sy = (char.y + offsetY) * zoom;
      const hw = (TILE_SIZE * zoom) / 2;
      if (Math.abs(px - sx) < hw && Math.abs(py - sy) < hw) return char;
    }
    return undefined;
  }

  applyLayout(layout: OfficeLayout): void {
    this.layout = layout;
    this.rebuildWalkable();
    for (const char of this.characters.values()) {
      if (!this.walkableTiles.has(`${Math.floor(char.x / TILE_SIZE)},${Math.floor(char.y / TILE_SIZE)}`)) {
        const first = [...this.walkableTiles][0];
        if (first) {
          const [wx, wy] = first.split(',').map(Number) as [number, number];
          char.x = wx * TILE_SIZE + TILE_SIZE / 2;
          char.y = wy * TILE_SIZE + TILE_SIZE / 2;
        }
      }
    }
  }
}
