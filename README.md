# Kermit Eaglercraft Client

Customized Eaglercraft 1.12 client with a custom title screen, panorama,
textures, rotating quotes, character preview, and Impact-style client modules.

## Run the client

### Small online version

1. Double-click `index.html`.
2. Click **Click to Play**.

This file is about 2.7 MB. It requires an internet connection because it loads
the game code and asset packages from the public
`KermitTheConqueror/Eaglercraft-Hack-Client` GitHub repository.

Keep the GitHub files public and do not rename these remote files:

- `classes.js`
- `kermit-client.js`
- `assets.bin`
- `custom-textures.bin`

## Controls

- **Right Shift:** Open or close the module menu.
- **Y:** Choose the Haste level when Haste is enabled.
- **C:** Hold to zoom when Zoom is enabled.
- **V:** Toggle Teleport/Freecam.

Module settings are saved by the browser. Available modules include Auto
Attack, Auto Dodge, Keystrokes, CPS, Fullbright, Teleport/Freecam, Flying,
Haste, High Jump, Speed, Always Run, XP Boost, No Fall, Water Walk, and Zoom.

## Optional local server

`START_EAGLERCRAFT.bat` and `server.mjs` are retained for local HTTP testing,
but neither is needed to launch the online HTML version.

## Troubleshooting

- If `index.html` does not start, confirm that internet access is available and
  the four required GitHub Raw files are still public.
- If loading appears stuck, close the tab and reopen the file instead of
  repeatedly clicking the start screen.
