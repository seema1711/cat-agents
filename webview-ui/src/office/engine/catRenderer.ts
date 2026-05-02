import { CAT_COLORS } from '../../constants';
import { CharacterState, Direction } from '../types';

// Palette indices used in sprite templates
// 0=transparent, 1=body, 2=dark-body, 3=outline, 4=eye, 5=nose, 6=ear-pink, 7=white
type P = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Each sprite is 16 rows × 16 columns of palette indices
type Frame = P[][];

const T: P = 0, C: P = 1, D: P = 2, B: P = 3, E: P = 4, N: P = 5, I: P = 6, W: P = 7;

// ---------------------------------------------------------------------------
// Sprite definitions – all cats are 16×16
// ---------------------------------------------------------------------------

const SIT_FRAME_0: Frame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,B,T,T,T,T,T,T,T,T,B,T,T,T],
  [T,T,B,I,B,T,T,T,T,T,B,I,B,T,T,T],
  [T,T,B,C,I,B,T,T,T,B,I,C,B,T,T,T],
  [T,T,T,B,C,C,B,B,B,B,C,C,B,T,T,T],
  [T,T,B,C,C,C,C,C,C,C,C,C,C,B,T,T],
  [T,B,C,C,E,B,C,C,C,C,B,E,C,C,B,T],
  [T,B,C,C,B,E,C,C,C,C,E,B,C,C,B,T],
  [T,B,C,C,C,C,C,N,C,C,C,C,C,C,B,T],
  [T,B,C,W,W,C,C,C,C,C,C,W,W,C,B,T],
  [T,T,B,C,C,C,C,C,C,C,C,C,C,B,T,T],
  [T,T,T,B,C,C,C,C,C,C,C,C,B,T,T,T],
  [T,B,C,C,C,C,C,C,C,C,C,C,C,C,B,T],
  [B,C,C,D,C,C,C,C,C,C,C,C,D,C,C,B],
  [B,C,B,T,B,C,C,C,C,C,C,B,T,B,C,B],
  [T,B,B,T,T,B,B,T,T,T,B,B,T,T,B,B],
];

const SIT_FRAME_1: Frame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,B,T,T,T,T,T,T,T,T,B,T,T,T],
  [T,T,B,I,B,T,T,T,T,T,B,I,B,T,T,T],
  [T,T,B,C,I,B,T,T,T,B,I,C,B,T,T,T],
  [T,T,T,B,C,C,B,B,B,B,C,C,B,T,T,T],
  [T,T,B,C,C,C,C,C,C,C,C,C,C,B,T,T],
  [T,B,C,C,E,B,C,C,C,C,B,E,C,C,B,T],
  [T,B,C,C,B,C,C,C,C,C,C,B,C,C,B,T],  // eyes half-closed
  [T,B,C,C,C,C,C,N,C,C,C,C,C,C,B,T],
  [T,B,C,W,W,C,C,C,C,C,C,W,W,C,B,T],
  [T,T,B,C,C,C,C,C,C,C,C,C,C,B,T,T],
  [T,T,T,B,C,C,C,C,C,C,C,C,B,T,T,T],
  [T,B,C,C,C,C,C,C,C,C,C,C,C,C,B,T],
  [B,C,C,D,C,C,C,C,C,C,C,C,D,C,C,B],
  [B,C,B,T,B,C,C,C,C,C,C,B,T,B,C,B],
  [T,B,B,T,T,B,B,T,T,T,B,B,T,T,B,B],
];

// Walking right – 4 frames
const WALK_R_0: Frame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,B,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,B,I,B,T,T,T,T,T,T],
  [T,T,T,T,T,T,B,C,C,I,B,T,T,T,T,T],
  [T,T,T,T,T,B,C,C,C,C,C,B,T,T,T,T],
  [T,T,T,T,B,C,C,E,B,C,C,C,B,T,T,T],
  [T,T,T,T,B,C,C,B,E,C,C,C,C,B,T,T],
  [T,T,T,T,B,C,C,C,C,N,C,W,C,B,T,T],
  [T,T,T,T,T,B,C,C,C,C,C,C,B,T,T,T],
  [T,T,T,T,T,T,B,C,C,C,C,B,T,T,T,T],
  [T,T,T,T,T,B,C,C,C,C,C,C,B,T,T,T],
  [T,T,T,T,B,C,C,D,C,C,D,C,C,B,T,T],
  [T,T,T,B,C,C,C,C,C,C,C,C,C,C,B,T],
  [T,T,B,C,C,B,T,T,B,C,C,C,B,T,T,T],
  [T,T,B,C,B,T,T,T,T,B,C,C,B,T,T,T],
  [T,T,T,B,B,T,T,T,T,T,B,B,T,T,T,T],
];
const WALK_R_1: Frame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,B,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,B,I,B,T,T,T,T,T,T],
  [T,T,T,T,T,T,B,C,C,I,B,T,T,T,T,T],
  [T,T,T,T,T,B,C,C,C,C,C,B,T,T,T,T],
  [T,T,T,T,B,C,C,E,B,C,C,C,B,T,T,T],
  [T,T,T,T,B,C,C,B,E,C,C,C,C,B,T,T],
  [T,T,T,T,B,C,C,C,C,N,C,W,C,B,T,T],
  [T,T,T,T,T,B,C,C,C,C,C,C,B,T,T,T],
  [T,T,T,T,T,T,B,C,C,C,C,B,T,T,T,T],
  [T,T,T,T,T,B,C,C,C,C,C,C,B,T,T,T],
  [T,T,T,T,B,C,C,D,C,C,D,C,C,B,T,T],
  [T,T,T,B,C,C,C,C,C,C,C,C,C,C,B,T],
  [T,T,T,B,C,C,B,T,B,C,C,C,B,T,T,T],  // legs together
  [T,T,T,T,B,C,B,T,T,B,C,B,T,T,T,T],
  [T,T,T,T,T,B,B,T,T,T,B,B,T,T,T,T],
];
const WALK_R_2: Frame = WALK_R_0;  // stride mirror
const WALK_R_3: Frame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,B,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,B,I,B,T,T,T,T,T,T],
  [T,T,T,T,T,T,B,C,C,I,B,T,T,T,T,T],
  [T,T,T,T,T,B,C,C,C,C,C,B,T,T,T,T],
  [T,T,T,T,B,C,C,E,B,C,C,C,B,T,T,T],
  [T,T,T,T,B,C,C,B,E,C,C,C,C,B,T,T],
  [T,T,T,T,B,C,C,C,C,N,C,W,C,B,T,T],
  [T,T,T,T,T,B,C,C,C,C,C,C,B,T,T,T],
  [T,T,T,T,T,T,B,C,C,C,C,B,T,T,T,T],
  [T,T,T,T,T,B,C,C,C,C,C,C,B,T,T,T],
  [T,T,T,T,B,C,C,D,C,C,D,C,C,B,T,T],
  [T,T,T,B,C,C,C,C,C,C,C,C,C,C,B,T],
  [T,T,B,C,C,C,B,T,B,C,C,B,T,T,T,T],  // opposite stride
  [T,T,T,B,C,B,T,T,T,T,B,C,B,T,T,T],
  [T,T,T,T,B,B,T,T,T,T,T,B,B,T,T,T],
];

// Walking up – back view
const WALK_U_0: Frame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,B,T,T,T,T,T,T,T,T,B,T,T,T],
  [T,T,B,C,B,T,T,T,T,T,B,C,B,T,T,T],
  [T,T,B,D,C,B,T,T,T,B,C,D,B,T,T,T],
  [T,T,T,B,C,C,B,B,B,B,C,C,B,T,T,T],
  [T,T,B,C,C,C,C,C,C,C,C,C,C,B,T,T],
  [T,B,C,C,C,C,C,C,C,C,C,C,C,C,B,T],
  [T,B,C,C,C,C,C,C,C,C,C,C,C,C,B,T],
  [T,B,C,C,D,C,C,C,C,C,C,D,C,C,B,T],
  [T,B,C,C,C,C,C,C,C,C,C,C,C,C,B,T],
  [T,T,B,C,C,C,C,C,C,C,C,C,C,B,T,T],
  [T,T,T,B,C,C,C,C,C,C,C,C,B,T,T,T],
  [T,T,B,C,C,C,C,C,C,C,C,C,C,B,T,T],
  [T,B,C,C,B,T,T,B,B,T,T,B,C,C,B,T],
  [T,B,C,B,T,T,T,T,T,T,T,T,B,C,B,T],
  [T,T,B,B,T,T,T,T,T,T,T,T,T,B,B,T],
];
const WALK_U_1: Frame = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,B,T,T,T,T,T,T,T,T,B,T,T,T],
  [T,T,B,C,B,T,T,T,T,T,B,C,B,T,T,T],
  [T,T,B,D,C,B,T,T,T,B,C,D,B,T,T,T],
  [T,T,T,B,C,C,B,B,B,B,C,C,B,T,T,T],
  [T,T,B,C,C,C,C,C,C,C,C,C,C,B,T,T],
  [T,B,C,C,C,C,C,C,C,C,C,C,C,C,B,T],
  [T,B,C,C,C,C,C,C,C,C,C,C,C,C,B,T],
  [T,B,C,C,D,C,C,C,C,C,C,D,C,C,B,T],
  [T,B,C,C,C,C,C,C,C,C,C,C,C,C,B,T],
  [T,T,B,C,C,C,C,C,C,C,C,C,C,B,T,T],
  [T,T,T,B,C,C,C,C,C,C,C,C,B,T,T,T],
  [T,T,B,C,C,C,C,C,C,C,C,C,C,B,T,T],
  [T,B,C,C,C,B,T,B,B,T,B,C,C,C,B,T], // legs closer together
  [T,T,B,C,B,T,T,T,T,T,T,B,C,B,T,T],
  [T,T,T,B,B,T,T,T,T,T,T,T,B,B,T,T],
];

// ---------------------------------------------------------------------------
// Sprite map lookup
// ---------------------------------------------------------------------------

type SpriteKey = `${CharacterState}:${Direction}:${number}`;

const SPRITE_MAP: Map<SpriteKey, Frame> = new Map([
  [`${CharacterState.TYPE}:${Direction.DOWN}:0`, SIT_FRAME_0],
  [`${CharacterState.TYPE}:${Direction.DOWN}:1`, SIT_FRAME_1],
  [`${CharacterState.TYPE}:${Direction.LEFT}:0`, SIT_FRAME_0],
  [`${CharacterState.TYPE}:${Direction.LEFT}:1`, SIT_FRAME_1],
  [`${CharacterState.TYPE}:${Direction.RIGHT}:0`, SIT_FRAME_0],
  [`${CharacterState.TYPE}:${Direction.RIGHT}:1`, SIT_FRAME_1],
  [`${CharacterState.TYPE}:${Direction.UP}:0`, SIT_FRAME_0],
  [`${CharacterState.TYPE}:${Direction.UP}:1`, SIT_FRAME_1],
  [`${CharacterState.IDLE}:${Direction.DOWN}:0`, SIT_FRAME_0],
  [`${CharacterState.IDLE}:${Direction.DOWN}:1`, SIT_FRAME_1],
  [`${CharacterState.WALK}:${Direction.RIGHT}:0`, WALK_R_0],
  [`${CharacterState.WALK}:${Direction.RIGHT}:1`, WALK_R_1],
  [`${CharacterState.WALK}:${Direction.RIGHT}:2`, WALK_R_2],
  [`${CharacterState.WALK}:${Direction.RIGHT}:3`, WALK_R_3],
  [`${CharacterState.WALK}:${Direction.UP}:0`, WALK_U_0],
  [`${CharacterState.WALK}:${Direction.UP}:1`, WALK_U_1],
  [`${CharacterState.WALK}:${Direction.DOWN}:0`, WALK_R_0],
  [`${CharacterState.WALK}:${Direction.DOWN}:1`, WALK_R_1],
]);

// ---------------------------------------------------------------------------
// Palette resolution
// ---------------------------------------------------------------------------

function getPaletteColor(idx: P, bodyRgb: [number, number, number]): [number, number, number, number] {
  const [r, g, b] = bodyRgb;
  switch (idx) {
    case 0: return [0, 0, 0, 0];
    case 1: return [r, g, b, 255];
    case 2: return [Math.floor(r * 0.65), Math.floor(g * 0.65), Math.floor(b * 0.65), 255];
    case 3: return [30, 20, 15, 255];
    case 4: return [80, 200, 80, 255];
    case 5: return [230, 155, 155, 255];
    case 6: return [255, 200, 200, 255];
    case 7: return [235, 235, 225, 255];
    default: return [0, 0, 0, 0];
  }
}

// ---------------------------------------------------------------------------
// ImageData cache
// ---------------------------------------------------------------------------

type CacheKey = `${CharacterState}:${Direction}:${number}:${number}`;
const imageDataCache = new Map<CacheKey, ImageData>();

function getFrame(state: CharacterState, direction: Direction, frame: number): Frame {
  const key: SpriteKey = `${state}:${direction}:${frame}`;
  return SPRITE_MAP.get(key) ?? SIT_FRAME_0;
}

function buildImageData(frame: Frame, colorIdx: number): ImageData {
  const body = CAT_COLORS[colorIdx % CAT_COLORS.length]!;
  const data = new Uint8ClampedArray(16 * 16 * 4);
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      const pixel = (frame[row]?.[col] ?? 0) as P;
      const [r, g, b, a] = getPaletteColor(pixel, body);
      const i = (row * 16 + col) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return new ImageData(data, 16, 16);
}

function flipFrameHorizontal(frame: Frame): Frame {
  return frame.map((row) => [...row].reverse() as P[]);
}

function buildFlippedImageData(frame: Frame, colorIdx: number): ImageData {
  return buildImageData(flipFrameHorizontal(frame), colorIdx);
}

export function getCatImageData(
  state: CharacterState,
  direction: Direction,
  frame: number,
  colorIdx: number,
): ImageData {
  const cacheKey: CacheKey = `${state}:${direction}:${frame}:${colorIdx}`;
  const cached = imageDataCache.get(cacheKey);
  if (cached) return cached;

  const frameData = getFrame(state, direction, frame);
  const flipped = direction === Direction.LEFT;
  const imgData = flipped
    ? buildFlippedImageData(frameData, colorIdx)
    : buildImageData(frameData, colorIdx);

  imageDataCache.set(cacheKey, imgData);
  return imgData;
}

export function getFrameCount(state: CharacterState, direction: Direction): number {
  if (state === CharacterState.TYPE || state === CharacterState.IDLE) return 2;
  if (state === CharacterState.WALK) {
    if (direction === Direction.LEFT || direction === Direction.RIGHT) return 4;
    return 2;
  }
  return 2;
}
