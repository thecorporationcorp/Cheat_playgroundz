# PWA Icons

## Required Icons

This PWA requires the following icon sizes:

- **icon-192.png** - 192x192px (required for PWA)
- **icon-512.png** - 512x512px (required for PWA)

## Design Specifications

### Visual Identity

- **Background**: Pure black (#000000)
- **Foreground**: White or red accent
- **Style**: Minimal, geometric, modern
- **Inspiration**: Lightning bolt (Zap icon) or abstract "P" lettermark

### Recommended Tool

Use [Figma](https://figma.com) or [RealFaviconGenerator](https://realfavicongenerator.net/) to create icons.

### Quick Icon Generation

If you have ImageMagick installed:

```bash
# Create a simple black square with white text
convert -size 512x512 xc:black \
  -gravity center \
  -font Arial-Bold \
  -pointsize 300 \
  -fill white \
  -annotate +0+0 'P' \
  icon-512.png

# Resize for 192px version
convert icon-512.png -resize 192x192 icon-192.png
```

### Placeholder Icons

For development, you can use solid color placeholders:

```bash
# Black square with red border
convert -size 192x192 xc:black -bordercolor red -border 2 icon-192.png
convert -size 512x512 xc:black -bordercolor red -border 4 icon-512.png
```

## Installation

Once you have your icons:

1. Place `icon-192.png` and `icon-512.png` in this directory
2. Verify they display correctly in DevTools → Application → Manifest
3. Test installation on mobile device
4. Ensure icons appear in home screen after installation

## Checklist

- [ ] Icons are square (1:1 aspect ratio)
- [ ] Icons are PNG format
- [ ] Icons have transparent background OR black background
- [ ] Icons are visually clear at small sizes
- [ ] Icons follow brand guidelines
- [ ] Icons tested on iOS and Android home screens
