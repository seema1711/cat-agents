#!/usr/bin/env python3
"""Cat Pixel Agents — entry point.

Usage:
    python main.py                        # interactive REPL
    python main.py "draw a sleepy tabby"  # single prompt
    python main.py --verbose "..."        # show debug info
"""

from __future__ import annotations

import sys

from cat_agents.agent import run


BANNER = r"""
   /\_____/\
  / ◉     ◉ \   Cat Pixel Agents
 (  • ω  •  )   Describe a cat and watch it appear!
  \  _____  /   (type 'quit' or Ctrl-C to exit)
   \/     \/
"""


def main() -> None:
    args = sys.argv[1:]
    verbose = "--verbose" in args
    if verbose:
        args = [a for a in args if a != "--verbose"]

    # Single-shot mode
    if args:
        prompt = " ".join(args)
        run(prompt, verbose=verbose)
        return

    # Interactive REPL
    print(BANNER)
    while True:
        try:
            prompt = input("🐱 > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nMeow! Goodbye~")
            break

        if not prompt:
            continue
        if prompt.lower() in {"quit", "exit", "q"}:
            print("Meow! Goodbye~")
            break

        run(prompt, verbose=verbose)


if __name__ == "__main__":
    main()
