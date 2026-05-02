# Cat Agents

A VS Code extension that turns your Claude Code agents into animated pixel-art cats in a virtual cat office — a cat-themed port of [pixel-agents](https://github.com/pablodelucca/pixel-agents).

Each Claude Code session you run becomes a little cat on screen. Cats type when a tool is active, display a `zzz` bubble when waiting for your input, and a `!` bubble when they need permission.

## Features

- **Live agent tracking** — watches Claude Code JSONL transcripts in real time
- **Pixel-art cats** — 8 color variants (orange tabby, gray, black, white, cream, brown, blue-gray, ginger), assigned per agent
- **Animations** — sit/type (2 frames), walk in all 4 directions, matrix spawn/despawn effect
- **Office layout** — tile-based grid with cat cushion seats
- **Agent overlay** — chips showing each cat's name and current tool
- **Zoom & pan** — scroll wheel to zoom, middle-click drag to pan

## Project Structure

```
cat-agents/
├── src/                          # VS Code extension (Node.js / TypeScript)
│   ├── extension.ts              # Activation entry point
│   ├── CatAgentsViewProvider.ts  # Webview host & message broker
│   ├── agentManager.ts           # Terminal spawning, project dir resolution
│   ├── fileWatcher.ts            # JSONL polling (500ms interval)
│   ├── transcriptParser.ts       # Parses tool events, tokens, waiting state
│   ├── constants.ts
│   └── types.ts
└── webview-ui/                   # React + Canvas UI (Vite build)
    └── src/
        ├── App.tsx               # Main component, game loop, controls
        ├── hooks/
        │   └── useExtensionMessages.ts  # Extension ↔ webview message handler
        └── office/
            ├── types.ts
            └── engine/
                ├── catRenderer.ts   # 16×16 pixel cat sprite data + ImageData builder
                ├── characters.ts    # Cat AI: wander, type, idle state machine
                ├── officeState.ts   # Grid, seats, character lifecycle
                ├── renderer.ts      # Canvas 2D: tiles, cats, bubbles, matrix fx
                └── gameLoop.ts      # requestAnimationFrame loop
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- VS Code ≥ 1.105.0

### Build

```bash
# Install root dependencies
npm install

# Install webview dependencies
cd webview-ui && npm install && cd ..

# Build everything
npm run build
```

### Development

```bash
# Watch mode (extension + webview hot reload)
npm run watch
```

Then press `F5` in VS Code to launch the Extension Development Host.

### Package

```bash
npm run package
```

## How It Works

1. The extension activates on VS Code startup and registers a webview panel in the activity bar.
2. When a Claude Code session starts, its JSONL transcript file (in `~/.claude/projects/`) is detected and polled every 500ms.
3. Transcript lines are parsed for `tool_use` blocks, token usage, and waiting signals.
4. The webview receives messages (`agentToolStart`, `agentStatus`, `agentTokenUsage`, etc.) and updates each cat's state accordingly.
5. A Canvas 2D game loop renders the office at 60fps.

## Cat Colors

| Index | Color       |
|-------|-------------|
| 0     | Orange tabby |
| 1     | Gray        |
| 2     | Black       |
| 3     | White       |
| 4     | Cream       |
| 5     | Brown tabby |
| 6     | Blue-gray   |
| 7     | Ginger      |

## License

MIT
