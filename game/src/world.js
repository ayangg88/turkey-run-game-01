// Level, stage and obstacle generation. The world scrolls left; entities
// carry a world-x that decreases by the turkey's speed each frame.
// Spawning is deterministic from the run seed so screenshot scenes are stable.
var World = (function () {
  function stageIndexFor(distanceM) {
    var s = Math.floor(distanceM / CONFIG.STAGE_LENGTH_M);
    return Math.min(s, CONFIG.STAGE_COUNT - 1);
  }

  function stageAt(distanceM) {
    return STAGES[stageIndexFor(distanceM)];
  }

  // Obstacle kinds per stage. Each has a width, height and whether it
  // must be jumped (jump) or slid under (slide), or just slows (slow).
  var OBSTACLES = {
    fence:   { w: 26,  h: 64,  act: 'jump',  weight: [3, 1, 0] },
    hay:     { w: 74,  h: 58,  act: 'jump',  weight: [3, 2, 0] },
    pumpkin: { w: 56,  h: 52,  act: 'jump',  weight: [1, 3, 1], roll: true },
    puddle:  { w: 110, h: 14,  act: 'slow',  weight: [2, 1, 1] },
    oven:    { w: 120, h: 96,  act: 'jump',  weight: [0, 2, 4] },
    knife:   { w: 46,  h: 120, act: 'duck',  weight: [0, 2, 3] }
  };

  function pickObstacle(rng, stageIdx) {
    var kinds = Object.keys(OBSTACLES);
    var total = 0;
    var ws = kinds.map(function (k) { var w = OBSTACLES[k].weight[stageIdx]; total += w; return w; });
    var roll = rng() * total;
    for (var i = 0; i < kinds.length; i++) {
      roll -= ws[i];
      if (roll <= 0) return kinds[i];
    }
    return 'fence';
  }

  function makeObstacle(kind, x, rng) {
    var def = OBSTACLES[kind];
    var o = {
      kind: kind, x: x, w: def.w, h: def.h, act: def.act,
      roll: !!def.roll, phase: rng() * Math.PI * 2,
      bladeY: 0, bladeDir: 1, passed: false, hit: false
    };
    if (kind === 'knife') o.bladeY = rngRange(rng, 0, 1);
    return o;
  }

  function makePickup(kind, x, y) {
    return { kind: kind, x: x, y: y, taken: false, phase: Math.random() * 6 };
  }

  // Next spawn position: gap shrinks as the stage index and distance rise.
  function nextGap(rng, stageIdx, distanceM) {
    var base = 420 - stageIdx * 55 - Math.min(90, distanceM * 0.02);
    return Math.max(260, base + rng() * 220);
  }

  return {
    stageIndexFor: stageIndexFor,
    stageAt: stageAt,
    OBSTACLES: OBSTACLES,
    pickObstacle: pickObstacle,
    makeObstacle: makeObstacle,
    makePickup: makePickup,
    nextGap: nextGap
  };
})();
