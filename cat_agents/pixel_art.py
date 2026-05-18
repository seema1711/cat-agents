"""Pixel art cat templates and ANSI colour rendering."""

from __future__ import annotations

ANSI_RESET = "\033[0m"

# Foreground colour codes indexed by name
COLOURS: dict[str, str] = {
    "black":   "\033[30m",
    "red":     "\033[91m",
    "orange":  "\033[33m",
    "yellow":  "\033[93m",
    "green":   "\033[92m",
    "cyan":    "\033[96m",
    "white":   "\033[97m",
    "gray":    "\033[37m",
    "magenta": "\033[95m",
    "reset":   ANSI_RESET,
}

# Each template uses characters:
#   █  solid block        ░  light shade
#   ▓  dark shade         ▒  medium shade
#   ◉  eye                ●  eye (closed/sleepy)
#   ω  happy mouth        ~  tail
#   v  ear interior       ∧  ear tip
# Templates keyed as (pose, size)

TEMPLATES: dict[tuple[str, str], list[str]] = {

    # ─── SITTING ───────────────────────────────────────────────────────────────
    ("sitting", "small"): [
        r" /\_/\ ",
        r"( ◉ ◉)",
        r" \ ω / ",
        r"  )█(  ",
        r" /   \ ",
    ],
    ("sitting", "medium"): [
        r"   /\_____/\   ",
        r"  / ◉     ◉ \  ",
        r" (    ω ω    ) ",
        r"  \   ___   /  ",
        r"   )_|█ █|_(   ",
        r"  / /     \ \  ",
        r" (_/       \_) ",
    ],
    ("sitting", "large"): [
        r"      /\___/\      ",
        r"     /  ◉ ◉  \     ",
        r"    ( •  ω  • )    ",
        r"     \  ___  /     ",
        r"      )  █  (      ",
        r"     / /   \ \     ",
        r"    / /     \ \    ",
        r"   (_/       \_)   ",
    ],

    # ─── SLEEPING ──────────────────────────────────────────────────────────────
    ("sleeping", "small"): [
        r"  zzz  ",
        r" /\_/\ ",
        r"( ● ●)",
        r" (___) ",
        r"~~~~~~~",
    ],
    ("sleeping", "medium"): [
        r"     z z z      ",
        r"  /\_________/\ ",
        r" / ●         ● \\",
        r"|    ~~~~~~~    |",
        r" \  _________ / ",
        r"  ~~~~~~~~~~~~~~",
    ],
    ("sleeping", "large"): [
        r"           z Z z Z      ",
        r"   /\________________/\ ",
        r"  / ●                ● \\",
        r" |      ~ ~ ~ ~ ~      | ",
        r"  \  __________________/ ",
        r"   ~~~~~~~~~~~~~~~~~~~~~ ",
    ],

    # ─── STRETCHING ────────────────────────────────────────────────────────────
    ("stretching", "small"): [
        r" /\_/\  ",
        r"( ◉ ◉) ",
        r" )   (  ",
        r"/     \ ",
        r"\_____.)",
    ],
    ("stretching", "medium"): [
        r"   /\_/\        ",
        r"  ( ◉ ◉)  ~~~   ",
        r"   \   /        ",
        r"   /   \        ",
        r"  /     \  ___  ",
        r" /       \/   \ ",
        r"(_________\___/ ",
    ],
    ("stretching", "large"): [
        r"    /\_/\               ",
        r"   ( ◉ ◉ )   ~ ~ ~ ~   ",
        r"    \   /               ",
        r"    /   \               ",
        r"   /     \   ________   ",
        r"  /       \_/        \  ",
        r" /                    \ ",
        r"(______________________)",
    ],

    # ─── POUNCING ──────────────────────────────────────────────────────────────
    ("pouncing", "small"): [
        r"  /\_/\ ",
        r" (◉  ◉)",
        r"  >ω<  ",
        r" / \/\ ",
        r"(     )",
    ],
    ("pouncing", "medium"): [
        r"   /\_/\    ",
        r"  (◉    ◉)  ",
        r"  (  >ω<  ) ",
        r"  / \/\/\   ",
        r" / /    \ \ ",
        r"(_/      \_)",
    ],
    ("pouncing", "large"): [
        r"     /\_____/\      ",
        r"    / ◉     ◉ \     ",
        r"   (    >ω<    )    ",
        r"   (           )    ",
        r"    \/\/\/\/\/\/    ",
        r"   /            \   ",
        r"  /              \  ",
        r" (_________________)",
    ],

    # ─── CURIOUS ───────────────────────────────────────────────────────────────
    ("curious", "small"): [
        r" /\_/\ ",
        r"( ◉ ~)",
        r" \ ? / ",
        r"  )█(  ",
        r" /   \ ",
    ],
    ("curious", "medium"): [
        r"   /\_____/\   ",
        r"  / ◉     ~ \  ",
        r" (     ?     ) ",
        r"  \   ___   /  ",
        r"   )_|█ █|_(   ",
        r"  (  /   \  )  ",
        r" (_/       \_) ",
    ],
    ("curious", "large"): [
        r"      /\_____/\      ",
        r"     / ◉       \     ",
        r"    (  •  ?  ~  )    ",
        r"     \   ___   /     ",
        r"      )   █   (      ",
        r"     / /     \ \     ",
        r"    (_/       \_)    ",
    ],

    # ─── GRUMPY ────────────────────────────────────────────────────────────────
    ("grumpy", "small"): [
        r" /\_/\ ",
        r"(>◉ ◉<)",
        r" ( - ) ",
        r"  )█(  ",
        r" /   \ ",
    ],
    ("grumpy", "medium"): [
        r"   /\___/\     ",
        r"  (>◉   ◉<)    ",
        r"  (    -    )  ",
        r"   \   ___  /  ",
        r"    )_|█ █|_(  ",
        r"   /  \   /  \ ",
        r"  (_)       (_)",
    ],
    ("grumpy", "large"): [
        r"      /\___/\       ",
        r"     / >◉  ◉< \     ",
        r"    (   -----   )   ",
        r"     \   ___   /    ",
        r"      )   █   (     ",
        r"     / /     \ \    ",
        r"    (_/       \_)   ",
    ],
}

# Palette: foreground + accent colour
PALETTE: dict[str, tuple[str, str]] = {
    "tabby":    ("orange",   "gray"),
    "black":    ("gray",     "white"),
    "orange":   ("orange",   "yellow"),
    "calico":   ("orange",   "white"),
    "white":    ("white",    "gray"),
    "gray":     ("gray",     "white"),
    "siamese":  ("white",    "cyan"),
    "tuxedo":   ("white",    "black"),
    "ginger":   ("red",      "orange"),
    "lavender": ("magenta",  "white"),
}

VALID_POSES = ["sitting", "sleeping", "stretching", "pouncing", "curious", "grumpy"]
VALID_SIZES = ["small", "medium", "large"]
VALID_BREEDS = list(PALETTE.keys())


def render_cat(pose: str, size: str, breed: str, name: str = "") -> str:
    """Return a coloured ANSI string for the given cat parameters."""
    key = (pose, size)
    if key not in TEMPLATES:
        # fallback to sitting/small
        key = ("sitting", "small")

    template = TEMPLATES[key]
    fg, accent = PALETTE.get(breed, ("white", "gray"))
    fg_code = COLOURS.get(fg, "")
    accent_code = COLOURS.get(accent, "")

    lines = []
    if name:
        header = f"{fg_code}✦ {name} ✦{ANSI_RESET}"
        lines.append(header)

    for line in template:
        # Colour certain chars with accent
        coloured = ""
        for ch in line:
            if ch in "◉●":
                coloured += f"{accent_code}{ch}{fg_code}"
            elif ch in "ω~?-><!":
                coloured += f"{accent_code}{ch}{fg_code}"
            else:
                coloured += ch
        lines.append(f"{fg_code}{coloured}{ANSI_RESET}")

    return "\n".join(lines)


def list_valid_options() -> str:
    return (
        f"Poses: {', '.join(VALID_POSES)}\n"
        f"Sizes: {', '.join(VALID_SIZES)}\n"
        f"Breeds/colours: {', '.join(VALID_BREEDS)}"
    )
