// Game loop, state machine and wiring. States: title, play, paused,
// escaped, caught. Screenshot mode (?shot=...) renders one preset scene.
(function () {
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  Input.attach(canvas);

  var q = Shots.query();
  var shotMode = q.shot || null;
  var seed = parseInt(q.seed || '1', 10) || 1;

  var s = null;
  var best = 0;
  try { best = parseInt(window.localStorage.getItem('turkey-run-best') || '0', 10) || 0; } catch (e) { best = 0; }

  function newGame() {
    var st = Shots.baseState(seed);
    st.state = 'play';
    st.best = best;
    st.muted = AudioFX.isMuted();
    return st;
  }

  function startShot() {
    s = Shots.apply(shotMode, seed);
    s.best = Math.max(best, 1240);
    return s;
  }

  if (shotMode) {
    s = startShot();
    // Screenshot mode: render the preset scene once (and keep the loop
    // running so flames/alarms animate, but the layout never changes).
    Render.render(ctx, s);
    var raf = window.requestAnimationFrame || function (f) { setTimeout(f, 33); };
    (function loop() {
      s.time += 1;
      Render.render(ctx, s);
      raf(loop);
    })();
    return;
  }

  s = newGame();
  s.state = 'title';

  // Buttons: re-registered whenever the screen changes.
  function registerButtons() {
    Input.clearButtons();
    var W = CONFIG.W;
    if (s.state === 'title') {
      Input.registerButton({ x: W / 2 - 130, y: 430, w: 260, h: 64, fn: function () { startRun(); } });
    } else if (s.state === 'play' || s.paused) {
      Input.registerButton({ x: W - 116, y: 12, w: 48, h: 40, fn: function () { togglePause(); } });
      Input.registerButton({ x: W - 60, y: 12, w: 48, h: 40, fn: function () { toggleMute(); } });
    }
    if (s.state === 'escaped' || s.state === 'caught') {
      Input.registerButton({ x: W / 2 - 130, y: 450, w: 260, h: 60, fn: function () { startRun(); } });
    }
  }

  function startRun() {
    AudioFX.unlock();
    AudioFX.click();
    s = newGame();
    s.state = 'play';
    registerButtons();
  }

  function togglePause() {
    if (s.state !== 'play') return;
    s.paused = !s.paused;
    AudioFX.click();
    registerButtons();
  }

  function toggleMute() {
    s.muted = AudioFX.toggleMute();
    AudioFX.click();
  }

  function saveBest() {
    var d = Math.floor(s.turkey.distanceM);
    if (d > best) {
      best = d;
      try { window.localStorage.setItem('turkey-run-best', String(d)); } catch (e) {}
    }
    s.best = best;
  }

  function endRun(escaped) {
    s.state = escaped ? 'escaped' : 'caught';
    saveBest();
    if (escaped) AudioFX.fanfare(); else AudioFX.caught();
    registerButtons();
  }

  function spawnAhead() {
    var rng = s.rng;
    var stageIdx = World.stageIndexFor(s.turkey.distanceM);
    var kind = World.pickObstacle(rng, stageIdx);
    s.obstacles.push(World.makeObstacle(kind, s.spawnX, rng));
    // Corn arc over jumpable hazards, a line over puddles.
    var def = World.OBSTACLES[kind];
    if (def.act === 'jump') {
      for (var i = 0; i < 3; i++) {
        s.pickups.push(World.makePickup('corn', s.spawnX + def.w / 2 - 44 + i * 44, CONFIG.GROUND_Y - 150));
      }
    } else if (def.act === 'slow') {
      for (var j = 0; j < 4; j++) {
        s.pickups.push(World.makePickup('corn', s.spawnX + j * 30, CONFIG.GROUND_Y - 70));
      }
    }
    // Rare golden feather / pie
    var r = rng();
    if (r < 0.10) s.pickups.push(World.makePickup('feather', s.spawnX + 180, CONFIG.GROUND_Y - 190));
    else if (r < 0.14) s.pickups.push(World.makePickup('pie', s.spawnX + 180, CONFIG.GROUND_Y - 80));
    s.spawnX += World.nextGap(rng, stageIdx, s.turkey.distanceM);
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function obstacleBox(o) {
    if (o.kind === 'knife') {
      var swing = Math.sin(s.time * 0.06 + o.phase);
      var bladeTop = CONFIG.GROUND_Y - o.h + 10 + (swing + 1) * 26;
      // Blade high: only a standing turkey hits it; blade low: only a
      // jumping turkey hits it — sliding under or jumping over both work.
      if (swing > 0) return { x: o.x, y: bladeTop, w: o.w, h: 60 };
      return { x: o.x, y: bladeTop, w: o.w, h: 40 };
    }
    if (o.kind === 'puddle') return { x: o.x, y: CONFIG.GROUND_Y - 14, w: o.w, h: 14 };
    return { x: o.x, y: CONFIG.GROUND_Y - o.h, w: o.w, h: o.h };
  }

  function update(dt) {
    if (s.state !== 'play') return;
    // Pause/mute keys must work even while paused, so check them first.
    if (Input.wasPressed('KeyP')) { togglePause(); return; }
    if (Input.wasPressed('KeyM')) toggleMute();
    if (s.paused) return;
    s.time += dt;

    // Input
    if (Input.wasPressed('Space') || Input.wasPressed('ArrowUp')) Turkey.jump(s.turkey);
    if (Input.wasPressed('ArrowDown')) Turkey.startSlide(s.turkey);
    if (Input.wasPressed('KeyR')) startRun();

    var advance = Turkey.update(s.turkey, Input, dt);
    s.scroll += advance;

    // Spawning
    while (s.spawnX < CONFIG.W + 400) spawnAhead();

    // Move world
    for (var i = s.obstacles.length - 1; i >= 0; i--) {
      var o = s.obstacles[i];
      o.x -= advance;
      if (o.x + o.w < -80) { s.obstacles.splice(i, 1); continue; }
      // Knife blade animation state
      var box = obstacleBox(o);
      var tb = Turkey.hitBox(s.turkey);
      if (!o.hit && rectsOverlap(tb, box)) {
        if (o.kind === 'puddle') {
          s.turkey.speed = Math.max(CONFIG.MIN_SPEED, s.turkey.speed - 0.9);
          o.hit = true;
        } else if (Turkey.hurt(s.turkey)) {
          o.hit = true;
          s.farmer.x += 60; // stumble lets the farmer close in
        }
      }
    }
    for (var j = s.pickups.length - 1; j >= 0; j--) {
      var p = s.pickups[j];
      p.x -= advance;
      if (p.x < -40) { s.pickups.splice(j, 1); continue; }
      if (!p.taken) {
        var pb = { x: p.x - 14, y: p.y - 16, w: 28, h: 32 };
        if (rectsOverlap(Turkey.hitBox(s.turkey), pb)) {
          p.taken = true;
          Turkey.collect(s.turkey, p.kind);
        }
      }
    }

    Farmer.update(s.farmer, s.turkey, dt);

    if (s.turkey.escaped) { endRun(true); return; }
    if (Farmer.caught(s.farmer, s.turkey)) { endRun(false); return; }
  }

  registerButtons();

  var last = performance.now();
  function loop(now) {
    var dt = Math.min(3, Math.max(0.5, (now - last) / 16.666));
    last = now;
    if (s.state === 'title') {
      s.time += dt;
      if (Input.wasPressed('Space') || Input.wasPressed('Enter')) startRun();
    } else if (s.state === 'escaped' || s.state === 'caught') {
      s.time += dt;
      if (Input.wasPressed('KeyR') || Input.wasPressed('Space') || Input.wasPressed('Enter')) startRun();
    } else {
      update(dt);
    }
    Render.render(ctx, s);
    Input.clearPressed();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
