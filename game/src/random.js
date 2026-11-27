// Small seeded random generator (mulberry32) so screenshot scenes are
// identical on every load. No Math.random anywhere in scene layout.
function makeRng(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngRange(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

function rngPick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}
