// Tuning constants for Turkey Run — Great Thanksgiving Escape.
// All distances in canvas pixels, all speeds in pixels per frame at 60fps.
var CONFIG = {
  W: 1280,
  H: 720,
  GROUND_Y: 600,
  GRAVITY: 0.85,
  JUMP_V: -16.5,
  BASE_SPEED: 6.2,
  MAX_SPEED: 11.5,
  MIN_SPEED: 2.5,
  SPEED_KEY_STEP: 0.12,
  SLIDE_TIME: 28,
  PLAYER_X: 300,
  METERS_PER_PX: 1 / 50,
  STAGE_LENGTH_M: 1200,
  STAGE_COUNT: 3,
  START_HEARTS: 3,
  MAX_HEARTS: 4,
  INVULN_FRAMES: 90,
  CORN_SCORE: 10,
  FEATHER_SCORE: 50,
  FARMER_START_GAP: 340,
  FARMER_CATCH_GAP: 46,
  FARMER_ALARM_GAP: 210,
  FARMER_BASE_SPEED: 5.6,
  FARMER_CATCHUP: 2.6,
  FARMER_SLOW_PENALTY: 1.8
};

var STAGES = [
  { name: 'STAGE 1 — FARMYARD', skyTop: '#7ec8f2', skyBot: '#fde3a7', ground: '#8a5a2b', grass: '#6fae4e', kind: 'farm' },
  { name: 'STAGE 2 — THE BARN', skyTop: '#c98d4b', skyBot: '#f2c98a', ground: '#7a4a24', grass: '#c9a35a', kind: 'barn' },
  { name: 'STAGE 3 — THE KITCHEN', skyTop: '#e8b04b', skyBot: '#f7dd9a', ground: '#6b4a3a', grass: '#d98a4a', kind: 'kitchen' }
];

var SCORE = { corn: 10, feather: 50, meter: 2 };
