// The turkey: player physics, hearts, scoring, collision boxes.
var Turkey = (function () {
  function create() {
    return {
      x: CONFIG.PLAYER_X,
      y: CONFIG.GROUND_Y - 62,
      w: 66, h: 62,
      vy: 0,
      onGround: true,
      sliding: false,
      slideTimer: 0,
      speed: CONFIG.BASE_SPEED,
      distanceM: 0,
      score: 0,
      corn: 0,
      feathers: 0,
      hearts: CONFIG.START_HEARTS,
      invuln: 0,
      runPhase: 0,
      dead: false,
      escaped: false
    };
  }

  function jump(t) {
    if (!t.onGround || t.sliding) return false;
    t.vy = CONFIG.JUMP_V;
    t.onGround = false;
    AudioFX.jump();
    return true;
  }

  function startSlide(t) {
    if (!t.onGround) return;
    t.sliding = true;
    t.slideTimer = CONFIG.SLIDE_TIME;
    AudioFX.slide();
  }

  function hurt(t) {
    if (t.invuln > 0 || t.dead) return false;
    t.hearts -= 1;
    t.invuln = CONFIG.INVULN_FRAMES;
    t.speed = Math.max(CONFIG.MIN_SPEED, t.speed - 1.6);
    AudioFX.hurt();
    if (t.hearts <= 0) { t.dead = true; }
    return true;
  }

  function heal(t) {
    if (t.hearts < CONFIG.MAX_HEARTS) t.hearts += 1;
    AudioFX.pie();
  }

  function collect(t, kind) {
    if (kind === 'corn') { t.corn += 1; t.score += SCORE.corn; AudioFX.corn(); }
    else if (kind === 'feather') { t.feathers += 1; t.score += SCORE.feather; AudioFX.feather(); }
    else if (kind === 'pie') { heal(t); t.score += 50; }
  }

  // Bounding box used for hazard collision (smaller than the sprite).
  function hitBox(t) {
    if (t.sliding) return { x: t.x - 26, y: t.y + 26, w: 62, h: 30 };
    return { x: t.x - 22, y: t.y + 4, w: 48, h: 52 };
  }

  function update(t, input, dt) {
    // Speed control: arrows nudge the cruising speed.
    if (input.isDown('ArrowRight')) t.speed = Math.min(CONFIG.MAX_SPEED, t.speed + CONFIG.SPEED_KEY_STEP);
    if (input.isDown('ArrowLeft')) t.speed = Math.max(CONFIG.MIN_SPEED, t.speed - CONFIG.SPEED_KEY_STEP);
    // Ease back toward the base cruising speed.
    t.speed += (CONFIG.BASE_SPEED - t.speed) * 0.01;

    if (t.sliding) {
      t.slideTimer -= dt;
      if (t.slideTimer <= 0) t.sliding = false;
    }
    if (!t.onGround) {
      t.vy += CONFIG.GRAVITY * dt;
      t.y += t.vy * dt;
      if (t.y >= CONFIG.GROUND_Y - t.h) {
        t.y = CONFIG.GROUND_Y - t.h;
        t.vy = 0;
        t.onGround = true;
      }
    }
    t.runPhase += t.speed * 0.09 * dt;
    if (t.invuln > 0) t.invuln -= dt;

    var advance = t.speed * dt;
    t.distanceM += advance * CONFIG.METERS_PER_PX;
    t.score += advance * CONFIG.METERS_PER_PX * SCORE.meter;

    if (t.distanceM >= CONFIG.STAGE_LENGTH_M * CONFIG.STAGE_COUNT) {
      t.escaped = true;
    }
    return advance;
  }

  return {
    create: create,
    jump: jump,
    startSlide: startSlide,
    hurt: hurt,
    heal: heal,
    collect: collect,
    hitBox: hitBox,
    update: update
  };
})();
