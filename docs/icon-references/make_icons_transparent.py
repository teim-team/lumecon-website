from PIL import Image
import numpy as np
from pathlib import Path
import argparse

def remove_checkerboard_background(img: Image.Image) -> Image.Image:
    """
    Remove a light gray/white checkerboard preview background from a flat icon image.
    This works best when the icon itself uses saturated colors and the background is near-white.
    """
    img = img.convert("RGBA")
    arr = np.array(img).astype(np.int16)
    rgb = arr[:, :, :3]

    brightness = rgb.mean(axis=2)
    channel_spread = rgb.max(axis=2) - rgb.min(axis=2)

    bg_mask = (brightness > 220) & (channel_spread < 18)

    alpha = np.where(bg_mask, 0, 255).astype(np.uint8)

    near_bg = (brightness > 205) & (channel_spread < 25) & (~bg_mask)
    alpha[near_bg] = np.clip((255 - brightness[near_bg]) * 5, 80, 255).astype(np.uint8)

    out = arr.astype(np.uint8)
    out[:, :, 3] = alpha
    return Image.fromarray(out, "RGBA")

def main():
    parser = argparse.ArgumentParser(description="Remove checkerboard background from icon images.")
    parser.add_argument("input", help="Input image path")
    parser.add_argument("output", help="Output PNG path")
    args = parser.parse_args()

    img = Image.open(args.input)
    transparent = remove_checkerboard_background(img)
    transparent.save(args.output)

if __name__ == "__main__":
    main()
