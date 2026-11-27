// The farmer: the chaser. He runs behind the turkey, speeds up when the
// turkey slows or stalls, and closes in fast after the turkey is hurt.
// If he reaches the turkey, the run ends — caught.
var Farmer = (function () {
  function create() {
    return {
      x: CONFIG.PLAYER_X - CONFIG.FARMER_START_GAP,
      y: CONFIG.GROUND_Y - 92,
      w: 64, h: 92,
      speed: CONFIG.FARMER_BASE_SPEED,
      runPhase: 0,
      spotted: false,
      alarmTimer: 0,
      searchTimer: 0
    };
  }

  function gap(f, t) { return t.x - f.x; }

  function update(f, t, dt) {
    var g = gap(f, t);
    // He chases harder the closer he gets, and pounces when the turkey stalls.
    var target = CONFIG.FARMER_BASE_SPEED;
    if (t.speed < CONFIG.BASE_SPEED - 0.8) target += CONFIG.FARMER_SLOW_PENALTY;
    if (g < 260) target += CONFIG.FARMER_CATCHUP * (1 - g / 260);
    if (t.dead) target += 2.0;
    f.speed += (target - f.speed) * 0.04 * dt;
    f.x += f.speed * dt;
    f.runPhase += f.speed * 0.09 * dt;

    var wasSpotted = f.spotted;
    f.spotted = g < CONFIG.FARMER_ALARM_GAP;
    if (f.spotted && !wasSpotted) {
      AudioFX.alarm();
      f.alarmTimer = 40;
    }
    if (f.alarmTimer > 0) f.alarmTimer -= dt;

    // If the turkey dawdles far ahead, the farmer searches (pauses, looks).
    f.searchTimer += dt;
    return g;
  }

  function caught(f, t) {
    return gap(f, t) <= CONFIG.FARMER_CATCH_GAP || t.dead;
  }

  return { create: create, gap: gap, update: update, caught: caught };
})();
