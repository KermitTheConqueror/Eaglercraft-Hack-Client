CUSTOM EAGLERCRAFT 1.12
======================

This package includes the customized title, panorama, rotating quotes,
character preview, and Impact-style browser client created in Codex.

IMPACT-STYLE CLIENT CONTROLS
- Press and release RIGHT SHIFT to open or close the module menu. The menu
  appears only after RIGHT SHIFT is released. Pressing another key while it
  is held cancels the shortcut.
- Press Y to choose the Haste level from 0 to 255. Haste must also be enabled
  in the module menu.
- Enable Regeneration to receive Regeneration 225. It does not require cheats
  or OP in the built-in singleplayer server. Disable it to remove the effect.
- Hold C to zoom when the Zoom module is enabled.
- Available modules: Auto Attack, Auto Dodge, Keystrokes, CPS, Fake Player,
  Fullbright, Freecam, Water Walk, and Zoom.
- Module settings are saved in your browser.
- Fullbright uses a solid-white Minecraft lightmap equivalent to the included
  Fullbright 1.12 OptiFine resource pack.
- Freecam keeps the server-side player at the activation point and enables
  local flight/no-clip movement through blocks. Disabling it sends the current
  Freecam coordinates to the server, teleporting the player there.
- Press V while playing to switch Freecam on or off without opening the menu.
- Water Walk prevents downward movement while the player is touching water,
  allowing normal movement across the surface without enabling cheats.
- Auto Dodge detects nearby arrows traveling toward the player and applies a
  single sideways jump only when no solid block obstructs the arrow's path.
- Auto Attack sends rapid left-click attacks while the game controls the mouse.
  It continuously selects and faces the closest living mob or player within
  three blocks. When that target dies or leaves reach, it switches to the next
  closest reachable target.
- Fake Player asks for a name and spawns a client-side player two blocks in
  front of you. On multiplayer servers, the fake player is visible only to
  your client and is not a real server-connected player.
- In singleplayer only, normal movement packets continue during Freecam so
  mobs can be attacked using the usual reach rules. Multiplayer remains
  non-interactive.

HOW TO RUN ON WINDOWS
1. Extract the ZIP file.
2. Open the extracted folder.
3. Double-click index.html.

index.html loads the game code and asset packages from the configured
GitHub Raw URLs. Internet access is required.

For the previous self-contained offline build, open offline-index.html.

ASSET PACKAGING
- index.html is a small online build that uses GitHub-hosted code and assets.
- offline-index.html contains the self-contained offline build.
