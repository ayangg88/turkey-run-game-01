// Screenshot-mode scene presets. Reads the page query string:
//   ?shot=start   title screen
//   ?shot=play    mid-run farmyard gameplay (turkey mid-jump over an oven)
//   ?shot=kitchen kitchen-stage run with knives and oven flames
//   ?shot=end     ESCAPED end screen
// Each with &seed=1. Scenes are built through the same state objects the
// live game uses, and rendered by the same Render.render path, so these
// are real renders of the game — not mockups.
var Shots = (function () {
  function query() {
    var q = {};
    var raw = (window.location.search || '').replace(/^\?/, '');
    if (!raw) return q;
    var parts = raw.split('&');
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split('=');
      q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    }
    return q;
  }

  function baseState(seed) {
    var rng = makeRng(seed || 1);
    var s = {
      state: 'play',
      time: 42,
      scroll: 0,
      turkey: Turkey.create(),
      farmer: Farmer.create(),
      obstacles: [],
      pickups: [],
      paused: false,
      muted: true,
      best: 1240,
      seed: seed || 1,
      rng: rng,
      spawnX: 1350
    };
    return s;
  }

  function placeCornRow(s, x, y, n) {
    for (var i = 0; i < n; i++) {
      s.pickups.push(World.makePickup('corn', x + i * 44, y));
    }
  }

  function apply(mode, seed) {
    var s = baseState(seed);
    var rng = s.rng;
    if (mode === 'start') {
      s.state = 'title';
      s.time = 30;
      return s;
    }
    if (mode === 'end') {
      s.state = 'escaped';
      s.turkey.distanceM = 3600;
      s.turkey.score = 9840;
      s.turkey.corn = 47;
      s.turkey.feathers = 6;
      s.turkey.hearts = 2;
      s.time = 60;
      return s;
    }
    if (mode === 'kitchen') {
      s.turkey.distanceM = 2650; // stage 3
      s.turkey.score = 6120;
      s.turkey.corn = 31;
      s.turkey.feathers = 3;
      s.turkey.hearts = 2;
      s.turkey.y = CONFIG.GROUND_Y - 62 - 90; // mid-jump
      s.turkey.vy = -6;
      s.turkey.onGround = false;
      s.farmer.x = CONFIG.PLAYER_X - 150; // close behind
      s.farmer.spotted = true;
      s.farmer.alarmTimer = 30;
      s.obstacles.push(World.makeObstacle('oven', 520, rng));
      s.obstacles.push(World.makeObstacle('knife', 860, rng));
      s.obstacles.push(World.makeObstacle('oven', 1120, rng));
      placeCornRow(s, 640, CONFIG.GROUND_Y - 120, 4);
      s.pickups.push(World.makePickup('feather', 980, CONFIG.GROUND_Y - 150));
      s.time = 55;
      return s;
    }
    // 'play' — farmyard mid-run, turkey jumping an oven, farmer close
    s.turkey.distanceM = 640;
    s.turkey.score = 2310;
    s.turkey.corn = 18;
    s.turkey.feathers = 1;
    s.turkey.hearts = 3;
    s.turkey.y = CONFIG.GROUND_Y - 62 - 110; // mid-jump
    s.turkey.vy = -4;
    s.turkey.onGround = false;
    s.farmer.x = CONFIG.PLAYER_X - 170;
    s.farmer.spotted = true;
    s.farmer.alarmTimer = 30;
    s.obstacles.push(World.makeObstacle('oven', 500, rng));
    s.obstacles.push(World.makeObstacle('fence', 820, rng));
    s.obstacles.push(World.makeObstacle('hay', 1060, rng));
    s.obstacles.push(World.makeObstacle('pumpkin', 1240, rng));
    placeCornRow(s, 640, CONFIG.GROUND_Y - 130, 5);
    s.pickups.push(World.makePickup('feather', 900, CONFIG.GROUND_Y - 170));
    s.time = 48;
    return s;
  }

  return { query: query, apply: apply, baseState: baseState };
})();
