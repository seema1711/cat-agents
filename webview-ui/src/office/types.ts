export enum TileType {
  VOID = 0,
  FLOOR = 1,
  WALL_TOP = 2,
  WALL_SIDE = 3,
}

export enum CharacterState {
  IDLE = 'idle',
  WALK = 'walk',
  TYPE = 'type',
}

export enum Direction {
  DOWN = 0,
  LEFT = 1,
  RIGHT = 2,
  UP = 3,
}

export interface Seat {
  tileX: number;
  tileY: number;
  facing: Direction;
}

export interface Character {
  id: number;
  name: string;
  colorIndex: number;
  x: number;
  y: number;
  state: CharacterState;
  direction: Direction;
  animFrame: number;
  animTimer: number;
  idleTimer: number;
  path: Array<[number, number]>;
  seat?: Seat;
  isWaiting: boolean;
  hasPermission: boolean;
  activeToolName?: string;
  inputTokens: number;
  outputTokens: number;
  matrixProgress: number;
  spawning: boolean;
  despawning: boolean;
  bubbleTimer: number;
  permBubbleTimer: number;
}

export interface OfficeLayout {
  width: number;
  height: number;
  tiles: number[][];
  seats: Seat[];
  floorColor: string;
  wallColor: string;
}
