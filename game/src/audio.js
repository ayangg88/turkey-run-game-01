// Synthesized WebAudio sounds only — no audio files.
// Every effect is an oscillator (or two) with a small envelope.
var AudioFX = (function () {
  var ctx = null;
  var muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    var c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    var t = c.currentTime;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  return {
    unlock: function () { ensure(); },
    isMuted: function () { return muted; },
    toggleMute: function () { muted = !muted; return muted; },
    jump: function () { tone(280, 0.22, 'sine', 0.20, 620); },
    slide: function () { tone(180, 0.16, 'triangle', 0.12, 90); },
    corn: function () { tone(880, 0.10, 'sine', 0.16); tone(1320, 0.12, 'sine', 0.12); },
    feather: function () { tone(660, 0.12, 'triangle', 0.16, 990); tone(990, 0.16, 'triangle', 0.14, 1480); },
    pie: function () { tone(523, 0.12, 'sine', 0.16); tone(659, 0.12, 'sine', 0.16); tone(784, 0.22, 'sine', 0.16); },
    hurt: function () { tone(220, 0.25, 'sawtooth', 0.16, 70); },
    alarm: function () { tone(980, 0.14, 'square', 0.10); tone(740, 0.14, 'square', 0.10); },
    caught: function () {
      tone(392, 0.22, 'sawtooth', 0.18, 330);
      tone(311, 0.22, 'sawtooth', 0.18, 262);
      tone(233, 0.5, 'sawtooth', 0.20, 110);
    },
    fanfare: function () {
      var notes = [523, 659, 784, 1047];
      for (var i = 0; i < notes.length; i++) {
        (function (f, d) { setTimeout(function () { tone(f, 0.22, 'triangle', 0.18); }, d); })(notes[i], i * 130);
      }
      setTimeout(function () { tone(1319, 0.5, 'triangle', 0.18); }, 560);
    },
    click: function () { tone(600, 0.06, 'sine', 0.10); }
  };
})();
