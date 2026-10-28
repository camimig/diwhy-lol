#!/usr/bin/env python3
"""Record image dimensions and loading hints in the committed static HTML.

Run after adding or replacing images: python3 tools/update_image_metadata.py
Requires Pillow (python3 -m pip install Pillow). Image files are never modified.
"""

from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
PAGE = PUBLIC / "index.html"


class GalleryImages(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_gallery = False
        self.sources = []

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == "main" and attributes.get("id") == "visual-gallery":
            self.in_gallery = True
        if tag == "img" and self.in_gallery:
            self.sources.append(attributes.get("data-src") or attributes["src"])

    def handle_endtag(self, tag):
        if tag == "main":
            self.in_gallery = False


def main():
    html = PAGE.read_text()
    gallery = GalleryImages()
    gallery.feed(html)
    eager_sources = set(gallery.sources[:4])
    gallery_sources = set(gallery.sources)
    count = 0

    def update(match):
        nonlocal count
        tag = match.group()
        source = re.search(r'\b(?:data-)?src="([^"]+)"', tag).group(1)
        with Image.open(PUBLIC / unquote(source)) as image:
            width, height = image.size
            if image.getexif().get(274) in (5, 6, 7, 8):
                width, height = height, width

        tag = re.sub(
            r'\s+(?:width|height|loading|decoding|fetchpriority)="[^"]*"', "", tag
        )
        eager = source in eager_sources
        source_attribute = "src" if eager else "data-src"
        tag = re.sub(r'\b(?:data-)?src=', source_attribute + "=", tag, count=1)
        attributes = f' width="{width}" height="{height}" decoding="async"'
        if source in gallery_sources:
            attributes += ' loading="eager" fetchpriority="high"' if eager else ' loading="lazy"'
        count += 1
        return tag[:-1] + attributes + ">"

    updated = re.sub(r"<img\b[^>]*>", update, html)
    if updated != html:
        PAGE.write_text(updated)
    print(f"Updated metadata for {count} images; image files are unchanged.")


if __name__ == "__main__":
    main()
