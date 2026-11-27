// Keyboard + mouse/touch input. Tracks held keys and click buttons.
// Buttons are rectangles in canvas space; click handlers are registered
// by the game with a label, rect and callback.
var Input = (function () {
  var keys = {};
  var pressed = {};
  var buttons = [];
  var canvas = null;
  var scale = 1;

  function keyDown(e) {
    var k = e.code || e.key;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(k) >= 0) {
      e.preventDefault();
    }
    if (!keys[k]) pressed[k] = true;
    keys[k] = true;
  }
  function keyUp(e) {
    var k = e.code || e.key;
    keys[k] = false;
  }
  function isDown(code) { return !!keys[code]; }
  function wasPressed(code) {
    var v = !!pressed[code];
    pressed[code] = false;
    return v;
  }
  function clearPressed() { pressed = {}; }

  function canvasPos(e) {
    var r = canvas.getBoundingClientRect();
    var cx = (e.clientX - r.left) * (canvas.width / r.width);
    var cy = (e.clientY - r.top) * (canvas.height / r.height);
    return { x: cx, y: cy };
  }
  function onPointer(e) {
    if (!canvas) return;
    var p = canvasPos(e);
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        b.fn();
        return;
      }
    }
    if (Input.onTap) Input.onTap(p);
  }

  function attach(c) {
    canvas = c;
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    canvas.addEventListener('pointerdown', onPointer);
  }

  return {
    attach: attach,
    isDown: isDown,
    wasPressed: wasPressed,
    clearPressed: clearPressed,
    registerButton: function (b) { buttons.push(b); },
    clearButtons: function () { buttons.length = 0; },
    onTap: null,
    keys: keys
  };
})();
