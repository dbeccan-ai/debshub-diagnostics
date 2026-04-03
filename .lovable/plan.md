

# Add Homescreen Icon (Favicon + PWA)

## What We're Doing
Copy the uploaded shield/chart icon image into the project and configure it as the favicon and Apple touch icon so the app displays this icon on device homescreens and browser tabs. Also update the page title and meta descriptions to reflect "DEBs Diagnostic Hub."

## Changes

### 1. Copy the uploaded image
Copy `user-uploads://ChatGPT_Image_Apr_3_2026_01_15_02_PM.png` to `public/icon-512.png`

### 2. Generate smaller icon sizes
Use a script to create `public/favicon.png` (32x32) and `public/apple-touch-icon.png` (180x180) from the uploaded image.

### 3. Update `index.html`
- Add `<link rel="icon" href="/favicon.png" type="image/png">`
- Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
- Update `<title>` to "DEBs Diagnostic Hub"
- Update meta description and OG tags to reflect the brand
- Delete `public/favicon.ico` if it exists

### 4. Add `public/manifest.json`
Create a basic web app manifest so the icon appears when users "Add to Home Screen":
```json
{
  "name": "DEBs Diagnostic Hub",
  "short_name": "DEBs Hub",
  "icons": [
    { "src": "/favicon.png", "sizes": "32x32", "type": "image/png" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "start_url": "/",
  "display": "standalone",
  "background_color": "#001F3F",
  "theme_color": "#001F3F"
}
```
Link it in `index.html` with `<link rel="manifest" href="/manifest.json">`.

## Files Changed

| File | Change |
|------|--------|
| `public/icon-512.png` | New — copied from upload |
| `public/favicon.png` | New — resized 32x32 |
| `public/apple-touch-icon.png` | New — resized 180x180 |
| `public/manifest.json` | New — PWA manifest |
| `index.html` | Add icon links, manifest link, update title/meta |

