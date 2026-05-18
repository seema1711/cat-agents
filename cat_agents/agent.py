"""Claude-powered cat pixel art agent with tool use."""

from __future__ import annotations

import json
import sys
from typing import Any

import anthropic

from .pixel_art import (
    VALID_BREEDS,
    VALID_POSES,
    VALID_SIZES,
    list_valid_options,
    render_cat,
)

MODEL = "claude-opus-4-7"

# ─── Tool definitions ──────────────────────────────────────────────────────────

TOOLS: list[dict[str, Any]] = [
    {
        "name": "draw_cat",
        "description": (
            "Render a pixel art cat in the terminal using Unicode block characters and ANSI colours. "
            "Call this to produce the actual cat artwork. "
            "Choose pose, size, and breed/colour based on the user's description."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "pose": {
                    "type": "string",
                    "enum": VALID_POSES,
                    "description": "The cat's pose or mood.",
                },
                "size": {
                    "type": "string",
                    "enum": VALID_SIZES,
                    "description": "How big to draw the cat.",
                },
                "breed": {
                    "type": "string",
                    "enum": VALID_BREEDS,
                    "description": "Coat colour / breed for the colour palette.",
                },
                "name": {
                    "type": "string",
                    "description": "Optional name to display above the cat.",
                },
            },
            "required": ["pose", "size", "breed"],
        },
    },
    {
        "name": "list_options",
        "description": "Return the available poses, sizes, and breeds so you can pick the best match.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "show_gallery",
        "description": (
            "Render several cats at once to form a gallery. "
            "Each entry specifies pose, size, breed, and optional name."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "cats": {
                    "type": "array",
                    "description": "List of cat configurations.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "pose":  {"type": "string", "enum": VALID_POSES},
                            "size":  {"type": "string", "enum": VALID_SIZES},
                            "breed": {"type": "string", "enum": VALID_BREEDS},
                            "name":  {"type": "string"},
                        },
                        "required": ["pose", "size", "breed"],
                    },
                }
            },
            "required": ["cats"],
        },
    },
]

# ─── Tool execution ────────────────────────────────────────────────────────────

def _execute_tool(name: str, tool_input: dict[str, Any]) -> str:
    if name == "draw_cat":
        art = render_cat(
            pose=tool_input["pose"],
            size=tool_input["size"],
            breed=tool_input["breed"],
            name=tool_input.get("name", ""),
        )
        # Print immediately so the user sees it as it's produced
        print("\n" + art + "\n")
        return f"Drew a {tool_input['size']} {tool_input['breed']} cat in {tool_input['pose']} pose."

    if name == "list_options":
        opts = list_valid_options()
        return opts

    if name == "show_gallery":
        cats = tool_input.get("cats", [])
        separator = "\n" + "─" * 40 + "\n"
        print(separator)
        for cat_cfg in cats:
            art = render_cat(
                pose=cat_cfg["pose"],
                size=cat_cfg["size"],
                breed=cat_cfg["breed"],
                name=cat_cfg.get("name", ""),
            )
            print(art)
            print(separator)
        return f"Gallery of {len(cats)} cats displayed."

    return f"Unknown tool: {name}"


# ─── Agent loop ────────────────────────────────────────────────────────────────

SYSTEM = """\
You are a cheerful pixel art cat generator agent. When the user describes what kind \
of cat they want, choose the best combination of pose, size, and breed/colour, then \
call the appropriate drawing tool to render it.

• If the request is vague, pick something delightful and surprising.
• You may call list_options first if you're unsure what's available.
• For requests involving multiple cats, use show_gallery.
• After drawing, add a brief, playful description (1–2 sentences) in plain text.
• Keep your text replies short — let the art speak.
"""


def run(prompt: str, *, verbose: bool = False) -> None:
    """Run the agent for a single user prompt."""
    client = anthropic.Anthropic()
    messages: list[dict[str, Any]] = [{"role": "user", "content": prompt}]

    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM,
            tools=TOOLS,          # type: ignore[arg-type]
            messages=messages,    # type: ignore[arg-type]
        )

        if verbose:
            print(f"[stop_reason={response.stop_reason}]", file=sys.stderr)

        # Collect tool calls and text from this response
        tool_calls = [b for b in response.content if b.type == "tool_use"]
        text_blocks = [b for b in response.content if b.type == "text"]

        # Append assistant message to history
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn" or not tool_calls:
            # Print any final text
            for block in text_blocks:
                print(block.text)
            break

        # Print any text that accompanies tool calls
        for block in text_blocks:
            print(block.text)

        # Execute tools and build tool-result message
        tool_results = []
        for call in tool_calls:
            result = _execute_tool(call.name, call.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": call.id,
                "content": result,
            })

        messages.append({"role": "user", "content": tool_results})
