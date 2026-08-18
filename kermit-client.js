(function () {
	"use strict";

	var STORAGE_KEY = "eagler-impact-client-v1";
	var defaults = {
		clientenabled: false,
		autoattack: false,
		autododge: false,
		emergencyhome: false,
		keystrokes: true,
		cps: true,
		fullbright: false,
		freecam: false,
		flying: false,
		haste: false,
		hastelevel: 10,
		highjump: false,
		speed: false,
		nohunger: false,
		xpboost: false,
		nofall: false,
		waterwalk: false,
		zoom: true
	};
	var state = loadState();
	var keys = Object.create(null);
	var clicks = { left: [], right: [] };
	var menuOpen = false;
	var hastePanelOpen = false;
	var zoomHeld = false;
	var shiftHeld = false;
	var shiftChorded = false;
	var chatInputActive = false;
	var pointerLockRestorePending = false;
	var root;
	var keysPanel;
	var menu;
	var hastePanel;
	var hasteLevelText;
	var hasteRange;
	var hasteNumber;
	var cpsText;
	var clockText;
	var autoAttackTimer = null;
	var bundledPackTimer = null;
	var lightmapHookAvailable = true;
	var bundledPackImportBusy = false;
	var bundledPackQueue = new URLSearchParams(location.search).has("texture-packs") ? [
		{ url: "texture-packs/MandalasGUI_1.12_Compatible.zip", name: "MandalasGUI Legacy Darkmode 1.12.zip" },
		{ url: "texture-packs/Minecraft_1.14_for_1.12_Compatible.zip", name: "Minecraft 1.14 Textures for 1.12.zip" }
	] : [];

	function loadState() {
		var saved = {};
		try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (ignored) {}
		delete saved.airplace;
		delete saved.attackimmunity;
		delete saved.chestoresp;
		delete saved.haste225;
		delete saved.haste127;
		delete saved.haste4;
		delete saved.haste10;
		delete saved.ghostmode;
		delete saved.hud;
		delete saved.crosshair;
		delete saved.fps;
		delete saved.keepinventory;
		delete saved.freecam;
		delete saved.fly;
		delete saved.spectator;
		delete saved.rapidbow;
		delete saved.autofood;
		delete saved.regeneration;
		delete saved.automlg;
		// Never resume freecam automatically after a page reload.
		saved.freecam = false;
		return Object.assign({}, defaults, saved);
	}

	function saveState() {
		try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (ignored) {}
	}

	window.__eaglerKermitClientEnabled = !!state.clientenabled;
	window.__eaglerSetKermitClientEnabled = function (enabled) {
		state.clientenabled = !!enabled;
		window.__eaglerKermitClientEnabled = state.clientenabled;
		if (!state.clientenabled) {
			menuOpen = false;
			hastePanelOpen = false;
		}
		saveState();
		applyState();
		return state.clientenabled;
	};
	window.__eaglerToggleKermitClient = function () {
		return window.__eaglerSetKermitClientEnabled(!state.clientenabled);
	};

	function importNextBundledTexturePack() {
		if (bundledPackImportBusy || !bundledPackQueue.length) return;
		var input = document.querySelector('input[type="file"][accept="application/zip"]');
		if (!input || input.dataset.kermitPackImport) return;
		input.dataset.kermitPackImport = "1";
		bundledPackImportBusy = true;
		var pack = bundledPackQueue[0];
		fetch(pack.url).then(function (response) {
			if (!response.ok) throw new Error("HTTP " + response.status);
			return response.blob();
		}).then(function (blob) {
			var transfer = new DataTransfer();
			transfer.items.add(new File([blob], pack.name, { type: "application/zip" }));
			input.files = transfer.files;
			bundledPackQueue.shift();
			input.dispatchEvent(new Event("change", { bubbles: true }));
		}).catch(function (error) {
			console.error("Could not import bundled texture pack:", error);
		}).finally(function () {
			bundledPackImportBusy = false;
			if (!bundledPackQueue.length && bundledPackTimer !== null) {
				clearInterval(bundledPackTimer);
				bundledPackTimer = null;
			}
		});
	}

	function style(el, values) {
		Object.keys(values).forEach(function (key) { el.style[key] = values[key]; });
		return el;
	}

	function make(tag, className, text) {
		var el = document.createElement(tag);
		if (className) el.className = className;
		if (typeof text === "string") el.textContent = text;
		return el;
	}

	function isPlaying() {
		return !!document.pointerLockElement;
	}

	function isTextEntryActive(event) {
		var target = event.target || document.activeElement;
		if (!target) return false;
		var tagName = String(target.tagName || "").toLowerCase();
		return tagName === "input" || tagName === "textarea" || tagName === "select" || !!target.isContentEditable;
	}

	function opensChat(event) {
		return event.code === "KeyT" || event.code === "Slash" || event.key === "/";
	}

	function closesChat(event) {
		return event.code === "Enter" || event.code === "NumpadEnter" || event.code === "Escape";
	}

	function addKey(parent, label, code, wide) {
		var el = make("div", "impact-key" + (wide ? " wide" : ""), label);
		el.dataset.code = code;
		parent.appendChild(el);
	}

	function createUI() {
		root = make("div", "impact-client-root");
		root.innerHTML = '<style>' +
			'.impact-client-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none;contain:layout style;font-family:Arial,Helvetica,sans-serif;color:#fff;text-shadow:1px 1px 2px #000;}' +
			'.kermit-clock{position:absolute;right:14px;top:12px;padding:7px 11px;background:rgba(0,0,0,.52);border:1px solid rgba(255,255,255,.24);font:bold 14px/1 Arial,Helvetica,sans-serif;letter-spacing:.04em;box-shadow:0 3px 14px rgba(0,0,0,.35);}' +
			'.impact-keys{position:absolute;left:12px;bottom:12px;width:104px;display:grid;grid-template-columns:repeat(3,32px);grid-auto-rows:32px;gap:4px;text-align:center;font:bold 12px/32px Arial}' +
			'.impact-key{background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.22);box-shadow:inset 0 0 0 1px rgba(0,0,0,.3)}.impact-key.on{background:rgba(255,55,55,.78);border-color:#ff9a9a}.impact-key.blank{visibility:hidden}.impact-key.wide{grid-column:span 3}.impact-cps{grid-column:span 3;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.22);font-size:10px;line-height:24px;height:24px}' +
			'.impact-menu{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(760px,88vw);background:rgba(15,15,18,.94);border:1px solid #4b4b50;box-shadow:0 10px 45px #000;pointer-events:auto;text-shadow:none}' +
			'.impact-menu-head{height:42px;display:flex;align-items:center;padding:0 14px;background:linear-gradient(90deg,#b31525,#ff3c3c);font-weight:800;font-style:italic;font-size:20px}.impact-menu-head span{margin-left:auto;font:11px Arial;color:#ffd9d9}' +
			'.impact-modules{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px}.impact-module{display:flex;align-items:center;padding:10px;background:#242428;border-left:3px solid #555;cursor:pointer;user-select:none}.impact-module:hover{background:#2d2d32}.impact-module.on{border-left-color:#ff394c;background:#302328}.impact-module-name{font-weight:bold;font-size:13px}.impact-module-desc{font-size:10px;color:#aaa;margin-top:3px}.impact-toggle{margin-left:auto;width:32px;height:16px;border-radius:9px;background:#555;position:relative}.impact-toggle:after{content:"";position:absolute;width:12px;height:12px;left:2px;top:2px;border-radius:50%;background:#ddd;transition:left .12s}.impact-module.on .impact-toggle{background:#e62d42}.impact-module.on .impact-toggle:after{left:18px;background:white}.impact-help{padding:0 14px 12px;color:#999;font-size:10px}' +
			'.haste-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,86vw);padding:16px;background:rgba(15,15,18,.97);border:1px solid #ff394c;box-shadow:0 10px 45px #000;pointer-events:auto;text-shadow:none}.haste-title{font-size:18px;font-weight:bold;margin-bottom:12px}.haste-value{color:#ff6978}.haste-controls{display:grid;grid-template-columns:1fr 76px;gap:10px;align-items:center}.haste-controls input{width:100%;box-sizing:border-box}.haste-number{background:#242428;color:white;border:1px solid #666;padding:6px}.haste-close{margin-top:12px;width:100%;padding:8px;border:0;background:#d52e40;color:white;font-weight:bold;cursor:pointer}.haste-note{margin-top:9px;color:#aaa;font-size:10px}' +
			'@media(max-width:560px){.impact-modules{grid-template-columns:1fr}.impact-menu{max-height:85vh;overflow:auto}}' +
			'</style>';

		clockText = make("div", "kermit-clock", "");
		root.appendChild(clockText);
		updateClock();

		keysPanel = make("div", "impact-keys");
		addKey(keysPanel, "", "", false); keysPanel.lastChild.classList.add("blank");
		addKey(keysPanel, "W", "KeyW", false);
		addKey(keysPanel, "", "", false); keysPanel.lastChild.classList.add("blank");
		addKey(keysPanel, "A", "KeyA", false);
		addKey(keysPanel, "S", "KeyS", false);
		addKey(keysPanel, "D", "KeyD", false);
		addKey(keysPanel, "SPACE", "Space", true);
		cpsText = make("div", "impact-cps", "LMB 0 CPS   |   RMB 0 CPS");
		keysPanel.appendChild(cpsText);
		root.appendChild(keysPanel);

		createMenu();
		createHastePanel();
		document.body.appendChild(root);
		applyState();
	}

	function createMenu() {
	var labels = {
		freecam: "Teleport",
		nohunger: "Always Run"
		};
		var descriptions = {
			autoattack: "Attack the closest reachable mob or player with critical hits until it leaves range",
			autododge: "Sidestep incoming arrows only when their path is not blocked",
			emergencyhome: "Send /home after fresh damage leaves you at one and a half hearts or less",
			keystrokes: "WASD and space key display",
			cps: "Left and right clicks per second",
			fullbright: "Brighten dark scenes",
			freecam: "Move through blocks, then turn it off at your destination to teleport there",
			flying: "Fly freely with Space to rise and Shift to descend",
			haste: "Adjustable mining haste; press Y to choose the level",
			highjump: "Boost normal ground jumps to about three blocks high",
			speed: "Run about 65% faster using stable movement acceleration",
			nohunger: "Sprint normally at any hunger level while keeping real hunger and eating",
			xpboost: "Make each collected experience orb grant about 30 levels",
			nofall: "Report grounded while falling to prevent fall damage",
			waterwalk: "Stay on the water surface without sinking",
			zoom: "Hold C to zoom the game view"
		};
		menu = make("div", "impact-menu");
		var head = make("div", "impact-menu-head");
		head.innerHTML = 'KERMIT <span>CLIENT MODULES</span>';
		menu.appendChild(head);
		var modules = make("div", "impact-modules");
		Object.keys(descriptions).forEach(function (name) {
			var row = make("div", "impact-module");
			row.dataset.module = name;
			row.innerHTML = '<div><div class="impact-module-name">' + (labels[name] || name).toUpperCase() + '</div><div class="impact-module-desc">' + descriptions[name] + '</div></div><div class="impact-toggle"></div>';
			row.addEventListener("click", function (event) {
				state[name] = !state[name];
				saveState();
				applyState();
			});
			modules.appendChild(row);
		});
		menu.appendChild(modules);
		menu.appendChild(make("div", "impact-help", "Tap and release RIGHT SHIFT by itself to open or close this menu. Press Y to adjust Haste and V to toggle Teleport. Shift combinations are ignored."));
		root.appendChild(menu);
	}

	function normalizedHasteLevel(value) {
		value = Math.round(Number(value));
		return isFinite(value) ? Math.max(0, Math.min(255, value)) : 10;
	}

	function setHasteLevel(value) {
		state.hastelevel = normalizedHasteLevel(value);
		if (hasteRange) hasteRange.value = state.hastelevel;
		if (hasteNumber) hasteNumber.value = state.hastelevel;
		if (hasteLevelText) hasteLevelText.textContent = state.hastelevel;
		saveState();
		applyState();
	}

	function createHastePanel() {
		hastePanel = make("div", "haste-panel");
		var title = make("div", "haste-title");
		title.innerHTML = 'HASTE LEVEL: <span class="haste-value">10</span>';
		hasteLevelText = title.querySelector(".haste-value");
		hastePanel.appendChild(title);
		var controls = make("div", "haste-controls");
		hasteRange = document.createElement("input");
		hasteRange.type = "range";
		hasteRange.min = "0";
		hasteRange.max = "255";
		hasteRange.step = "1";
		hasteNumber = document.createElement("input");
		hasteNumber.type = "number";
		hasteNumber.min = "0";
		hasteNumber.max = "255";
		hasteNumber.className = "haste-number";
		hasteRange.addEventListener("input", function () { setHasteLevel(hasteRange.value); });
		hasteNumber.addEventListener("change", function () { setHasteLevel(hasteNumber.value); });
		controls.appendChild(hasteRange);
		controls.appendChild(hasteNumber);
		hastePanel.appendChild(controls);
		hastePanel.appendChild(make("div", "haste-note", "Choose a level from 0 to 255. The Haste module must be enabled in the Kermit menu."));
		var close = make("button", "haste-close", "DONE");
		close.addEventListener("click", function () {
			hastePanelOpen = false;
			applyState();
		});
		hastePanel.appendChild(close);
		root.appendChild(hastePanel);
		setHasteLevel(state.hastelevel);
	}

	function getGameSurface() {
		var container = document.getElementById("game_frame") || document.body;
		return container.querySelector("canvas") || container.firstElementChild;
	}

	function applyVisualEffects() {
		var surface = getGameSurface();
		if (!surface || surface === root) return;
		var zoomActive = state.clientenabled && state.zoom && zoomHeld;
		surface.style.transformOrigin = zoomActive ? "50% 50%" : "";
		surface.style.transform = zoomActive ? "scale(2.2)" : "";
		// The CSS fallback is used only if WebGL lightmap interception is unavailable.
		surface.style.filter = state.clientenabled && state.fullbright && !lightmapHookAvailable ? "brightness(1.65) contrast(0.85)" : "";
	}

	function applyState() {
		window.__eaglerKermitClientEnabled = !!state.clientenabled;
		window.__eaglerKermitMenuOpen = !!state.clientenabled && (menuOpen || hastePanelOpen || pointerLockRestorePending);
		if (!root) return;
		var enabled = !!state.clientenabled;
		var playing = isPlaying();
		keysPanel.style.display = enabled && state.keystrokes && playing ? "grid" : "none";
		cpsText.style.display = state.cps ? "block" : "none";
		menu.style.display = enabled && menuOpen ? "block" : "none";
		hastePanel.style.display = enabled && hastePanelOpen ? "block" : "none";
		menu.querySelectorAll(".impact-module").forEach(function (el) {
			el.classList.toggle("on", !!state[el.dataset.module]);
		});
		window.__eaglerFullbrightEnabled = enabled && !!state.fullbright;
		window.__eaglerAirPlaceEnabled = false;
		window.__eaglerAttackImmunityEnabled = false;
		window.__eaglerFreecamEnabled = enabled && !!state.freecam;
		window.__eaglerFlyingEnabled = enabled && !!state.flying;
		window.__eaglerHasteEnabled = enabled && !!state.haste;
		window.__eaglerHasteMultiplier = 1 + normalizedHasteLevel(state.hastelevel) * 0.2;
		window.__eaglerHighJumpEnabled = enabled && !!state.highjump;
		window.__eaglerSpeedEnabled = enabled && !!state.speed;
		window.__eaglerNoHungerEnabled = false;
		window.__eaglerAlwaysRunEnabled = enabled && !!state.nohunger;
		window.__eaglerNoFallEnabled = enabled && !!state.nofall;
		window.__eaglerWaterWalkEnabled = enabled && !!state.waterwalk;
		window.__eaglerAutoDodgeEnabled = enabled && !!state.autododge;
		window.__eaglerEmergencyHomeEnabled = enabled && !!state.emergencyhome;
		window.__eaglerAutoAttackEnabled = enabled && !!state.autoattack;
		window.__eaglerXPBoostEnabled = enabled && !!state.xpboost;
		window.__eaglerGhostModeEnabled = false;
		if (!enabled || !state.autoattack) {
			window.__eaglerAutoAttackTarget = null;
			window.__eaglerAutoAttackScanAt = 0;
		}
		updateAutoAttackTimer();
		applyVisualEffects();
	}

	function updateKeys() {
		if (!keysPanel) return;
		keysPanel.querySelectorAll(".impact-key[data-code]").forEach(function (el) {
			el.classList.toggle("on", !!keys[el.dataset.code]);
		});
	}

	function trimClicks(now) {
		clicks.left = clicks.left.filter(function (t) { return now - t < 1000; });
		clicks.right = clicks.right.filter(function (t) { return now - t < 1000; });
		if (cpsText) cpsText.textContent = "LMB " + clicks.left.length + " CPS   |   RMB " + clicks.right.length + " CPS";
	}

	function updateClock() {
		if (!clockText) return;
		clockText.textContent = new Date().toLocaleTimeString([], {
			hour: "numeric",
			minute: "2-digit"
		});
	}

	function autoAttackPulse() {
		if (!state.clientenabled || !state.autoattack || !window.__eaglerAutoAttackTarget || menuOpen || !isPlaying()) return;
		var surface = getGameSurface();
		if (!surface || surface === root) return;
		var options = { bubbles: true, cancelable: true, button: 0, buttons: 1, view: window };
		surface.dispatchEvent(new MouseEvent("mousedown", options));
		surface.dispatchEvent(new MouseEvent("mouseup", {
			bubbles: true,
			cancelable: true,
			button: 0,
			buttons: 0,
			view: window
		}));
	}

	function updateAutoAttackTimer() {
		var shouldRun = !!state.clientenabled && !!state.autoattack;
		if (shouldRun && autoAttackTimer === null) {
			autoAttackTimer = setInterval(autoAttackPulse, 1000 / 30);
		} else if (!shouldRun && autoAttackTimer !== null) {
			clearInterval(autoAttackTimer);
			autoAttackTimer = null;
		}
	}

	function isRightShift(event) {
		return event.code === "ShiftRight" || event.key === "ShiftRight" ||
			event.keyIdentifier === "ShiftRight" ||
			(event.key === "Shift" && event.location === 2) ||
			(event.keyCode === 16 && event.location === 2);
	}

	function requestGamePointerLock() {
		var surface = getGameSurface();
		if (!surface || surface === root || document.pointerLockElement) return;
		var request = surface.requestPointerLock || surface.mozRequestPointerLock;
		if (request) {
			try { request.call(surface); } catch (ignored) {}
		}
	}

	window.addEventListener("keydown", function (event) {
		keys[event.code] = true;
		var textEntryActive = isTextEntryActive(event);
		if (!chatInputActive && !textEntryActive && !menuOpen && !hastePanelOpen && isPlaying() && opensChat(event)) {
			chatInputActive = true;
		}
		var blockGameplayHotkeys = chatInputActive || textEntryActive;
		if (chatInputActive && closesChat(event)) chatInputActive = false;
		if (event.code === "Space") window.__eaglerHighJumpPressed = true;
		if (isRightShift(event)) {
			if (!event.repeat) shiftChorded = false;
			shiftHeld = true;
		} else if (shiftHeld && !event.repeat) {
			shiftChorded = true;
		}
		if (event.code === "KeyC" && state.zoom && !menuOpen) {
			zoomHeld = true;
			applyVisualEffects();
		}
		if (state.clientenabled && event.code === "KeyV" && !event.repeat && !menuOpen && !blockGameplayHotkeys && isPlaying()) {
			state.freecam = !state.freecam;
			saveState();
			applyState();
		}
		if (state.clientenabled && event.code === "KeyY" && !event.repeat && !shiftHeld && !menuOpen && !blockGameplayHotkeys) {
			hastePanelOpen = !hastePanelOpen;
			if (hastePanelOpen && document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
			applyState();
			event.preventDefault();
		}
		if (!event.repeat) updateKeys();
	}, true);

	window.addEventListener("keyup", function (event) {
		keys[event.code] = false;
		if (event.code === "Space") window.__eaglerHighJumpPressed = false;
		if (isRightShift(event) || (shiftHeld && event.key === "Shift")) {
			shiftHeld = false;
			if (state.clientenabled && !shiftChorded) {
				menuOpen = !menuOpen;
				pointerLockRestorePending = !menuOpen && isPlaying() && !document.pointerLockElement;
				applyState();
				if (menuOpen && document.pointerLockElement && document.exitPointerLock) {
					document.exitPointerLock();
				} else if (!menuOpen && isPlaying()) {
					requestGamePointerLock();
				}
			}
			shiftChorded = false;
		}
		if (event.code === "KeyC") {
			zoomHeld = false;
			applyVisualEffects();
		}
		updateKeys();
	}, true);

	window.addEventListener("mousedown", function (event) {
		if (!isPlaying()) return;
		var now = performance.now();
		if (event.button === 0) clicks.left.push(now);
		if (event.button === 2) clicks.right.push(now);
	}, true);

	document.addEventListener("pointerlockchange", function () {
		if (document.pointerLockElement) {
			chatInputActive = false;
			pointerLockRestorePending = false;
			menuOpen = false;
			hastePanelOpen = false;
		}
		if (!document.pointerLockElement) {
			window.__eaglerHighJumpPressed = false;
			shiftHeld = false;
			shiftChorded = false;
		}
		applyState();
	});

	window.addEventListener("blur", function () {
		chatInputActive = false;
		shiftHeld = false;
		shiftChorded = false;
		window.__eaglerHighJumpPressed = false;
	});

	setInterval(function () {
		trimClicks(performance.now());
	}, 1000);
	setInterval(updateClock, 1000);
	if (bundledPackQueue.length) {
		bundledPackTimer = setInterval(importNextBundledTexturePack, 250);
	}

	window.addEventListener("load", function () {
		setTimeout(createUI, 600);
	});
})();
