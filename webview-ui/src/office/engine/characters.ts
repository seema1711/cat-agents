import {
  IDLE_WAIT_MAX_SEC,
  IDLE_WAIT_MIN_SEC,
  TILE_SIZE,
  TYPE_FRAME_DURATION_SEC,
  WALK_FRAME_DURATION_SEC,
  WALK_SPEED_PX_PER_SEC,
  WANDER_STEPS_MAX,
  WANDER_STEPS_MIN,
} from '../../constants';
import { Character, CharacterState, Direction } from '../types';
import { getFrameCount } from './catRenderer';

export function createCharacter(
  id: number,
  name: string,
  colorIndex: number,
  tileX: number,
  tileY: number,
): Character {
  return {
    id,
    name,
    colorIndex,
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
    state: CharacterState.IDLE,
    direction: Direction.DOWN,
    animFrame: 0,
    animTimer: 0,
    idleTimer: randFloat(IDLE_WAIT_MIN_SEC, IDLE_WAIT_MAX_SEC),
    path: [],
    isWaiting: false,
    hasPermission: false,
    inputTokens: 0,
    outputTokens: 0,
    matrixProgress: 0,
    spawning: true,
    despawning: false,
    bubbleTimer: 0,
    permBubbleTimer: 0,
  };
}

export function updateCharacter(
  char: Character,
  dt: number,
  walkableTiles: Set<string>,
  gridW: number,
  gridH: number,
): void {
  if (char.spawning) {
    char.matrixProgress = Math.min(1, char.matrixProgress + dt / 0.8);
    if (char.matrixProgress >= 1) char.spawning = false;
    return;
  }
  if (char.despawning) {
    char.matrixProgress = Math.max(0, char.matrixProgress - dt / 0.6);
    return;
  }

  char.bubbleTimer = Math.max(0, char.bubbleTimer - dt);
  char.permBubbleTimer = Math.max(0, char.permBubbleTimer - dt);

  if (char.state === CharacterState.TYPE) {
    char.animTimer += dt;
    const dur = TYPE_FRAME_DURATION_SEC;
    if (char.animTimer >= dur) {
      char.animTimer -= dur;
      char.animFrame = (char.animFrame + 1) % getFrameCount(CharacterState.TYPE, char.direction);
    }
    return;
  }

  if (char.state === CharacterState.IDLE) {
    char.animTimer += dt;
    if (char.animTimer >= 1.0) {
      char.animTimer = 0;
      char.animFrame = (char.animFrame + 1) % 2;
    }
    char.idleTimer -= dt;
    if (char.idleTimer <= 0) {
      startWander(char, walkableTiles, gridW, gridH);
    }
    return;
  }

  if (char.state === CharacterState.WALK) {
    char.animTimer += dt;
    if (char.animTimer >= WALK_FRAME_DURATION_SEC) {
      char.animTimer -= WALK_FRAME_DURATION_SEC;
      char.animFrame = (char.animFrame + 1) % getFrameCount(CharacterState.WALK, char.direction);
    }

    if (char.path.length === 0) {
      char.state = CharacterState.IDLE;
      char.idleTimer = randFloat(IDLE_WAIT_MIN_SEC, IDLE_WAIT_MAX_SEC);
      char.animFrame = 0;
      return;
    }

    const [tx, ty] = char.path[0]!;
    const targetX = tx * TILE_SIZE + TILE_SIZE / 2;
    const targetY = ty * TILE_SIZE + TILE_SIZE / 2;
    const dx = targetX - char.x;
    const dy = targetY - char.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = WALK_SPEED_PX_PER_SEC * dt;

    if (dist <= step) {
      char.x = targetX;
      char.y = targetY;
      char.path.shift();
      if (char.path.length === 0) {
        char.state = CharacterState.IDLE;
        char.idleTimer = randFloat(IDLE_WAIT_MIN_SEC, IDLE_WAIT_MAX_SEC);
      }
    } else {
      char.x += (dx / dist) * step;
      char.y += (dy / dist) * step;
      updateDirection(char, dx, dy);
    }
  }
}

function updateDirection(char: Character, dx: number, dy: number): void {
  if (Math.abs(dx) > Math.abs(dy)) {
    char.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
  } else {
    char.direction = dy > 0 ? Direction.DOWN : Direction.UP;
  }
}

function startWander(
  char: Character,
  walkableTiles: Set<string>,
  gridW: number,
  gridH: number,
): void {
  const steps = randInt(WANDER_STEPS_MIN, WANDER_STEPS_MAX);
  const path: Array<[number, number]> = [];
  let curX = Math.floor(char.x / TILE_SIZE);
  let curY = Math.floor(char.y / TILE_SIZE);

  for (let i = 0; i < steps; i++) {
    const dirs: Array<[number, number]> = [
      [curX + 1, curY],
      [curX - 1, curY],
      [curX, curY + 1],
      [curX, curY - 1],
    ].filter(
      ([nx, ny]) =>
        nx >= 0 && ny >= 0 && nx < gridW && ny < gridH && walkableTiles.has(`${nx},${ny}`),
    ) as Array<[number, number]>;

    if (dirs.length === 0) break;
    const next = dirs[Math.floor(Math.random() * dirs.length)]!;
    path.push(next);
    [curX, curY] = next;
  }

  if (path.length > 0) {
    char.state = CharacterState.WALK;
    char.path = path;
    char.animFrame = 0;
    char.animTimer = 0;
  } else {
    char.idleTimer = randFloat(IDLE_WAIT_MIN_SEC, IDLE_WAIT_MAX_SEC);
  }
}

export function setCharacterTyping(char: Character): void {
  char.state = CharacterState.TYPE;
  char.path = [];
  char.animFrame = 0;
  char.animTimer = 0;
}

export function setCharacterIdle(char: Character): void {
  if (char.state === CharacterState.TYPE) {
    char.state = CharacterState.IDLE;
    char.idleTimer = randFloat(IDLE_WAIT_MIN_SEC, IDLE_WAIT_MAX_SEC);
  }
}

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(randFloat(min, max + 1));
}
