// All canvas drawing: scenery, turkey, farmer, hazards, pickups, HUD
// and every screen. Pure drawing — no game logic lives here.
var Render = (function () {
  var W = CONFIG.W, H = CONFIG.H, GY = CONFIG.GROUND_Y;

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function sky(ctx, stage, t) {
    var g = ctx.createLinearGradient(0, 0, 0, GY);
    g.addColorStop(0, stage.skyTop);
    g.addColorStop(1, stage.skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, GY + 2);
    // Sun
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.arc(1080, 110, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,217,77,0.35)';
    ctx.beginPath(); ctx.arc(1080, 110, 74, 0, Math.PI * 2); ctx.fill();
    // Drifting clouds (outdoors only — the kitchen is indoors)
    if (stage.kind !== 'kitchen') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (var i = 0; i < 5; i++) {
        var cx = ((i * 317 + t * 0.4) % (W + 260)) - 130;
        var cy = 70 + i * 42;
        ellipse(ctx, cx, cy, 62, 20, 'rgba(255,255,255,0.9)');
        ellipse(ctx, cx + 44, cy + 8, 44, 16, 'rgba(255,255,255,0.9)');
      }
    }
  }

  function hills(ctx, stage, scroll) {
    if (stage.kind === 'kitchen') return; // kitchen is indoors: no hills
    ctx.fillStyle = stage.kind === 'kitchen' ? '#c98a5a' : '#7fb069';
    for (var i = 0; i < 4; i++) {
      var hx = ((i * 430 - scroll * 0.2) % (W + 400)) - 200;
      ctx.beginPath();
      ctx.ellipse(hx, GY + 6, 300, 90, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  }

  // Small dark pill behind a floating hint label so it stays readable
  // over trees, pans and flames.
  function labelPill(ctx, text, cx, cy) {
    ctx.font = 'bold 15px sans-serif';
    var w = ctx.measureText(text).width + 18;
    ctx.fillStyle = 'rgba(43,26,18,0.82)';
    rr(ctx, cx - w / 2, cy - 16, w, 24, 8); ctx.fill();
    ctx.fillStyle = '#f7e8c9';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, cy + 1);
  }

  function backgroundProps(ctx, stage, scroll, rngSeed) {
    // Trees / barn / kitchen counters, drawn from a seeded layout.
    var rng = makeRng(rngSeed);
    var items = [];
    for (var i = 0; i < 14; i++) {
      items.push({ x: rng() * W, kind: rngPick(rng, ['tree', 'tree', 'fencepost', 'haystack', 'barrel']) });
    }
    var kitchenDrawn = false;
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      var x = ((it.x - scroll * 0.45) % (W + 160) + W + 160) % (W + 160) - 80;
      var base = GY - 4;
      if (stage.kind === 'kitchen') {
        if (kitchenDrawn) continue;
        kitchenDrawn = true;
        // Tiled kitchen wall: big window + a rail of hanging pans up high,
        // counters along the floor. Nothing floats at ground level.
        ctx.strokeStyle = 'rgba(120,70,20,0.18)'; ctx.lineWidth = 2;
        for (var ty = 0; ty < GY; ty += 64) {
          ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke();
        }
        for (var tx = 0; tx < W; tx += 64) {
          ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, GY); ctx.stroke();
        }
        // Window with a warm evening sky
        ctx.fillStyle = '#f7d9a0';
        rr(ctx, 560, 90, 260, 170, 10); ctx.fill();
        ctx.fillStyle = '#ff9a3d';
        ctx.beginPath(); ctx.arc(690, 220, 42, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8a5a3b'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(690, 90); ctx.lineTo(690, 260); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(560, 175); ctx.lineTo(820, 175); ctx.stroke();
        // Pan rail near the ceiling
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(80, 96, 400, 8);
        for (var pi = 0; pi < 4; pi++) {
          var px2 = 120 + pi * 90;
          ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(px2, 104); ctx.lineTo(px2, 122); ctx.stroke();
          ctx.fillStyle = '#9a9a9a';
          ctx.beginPath(); ctx.arc(px2, 142, 20, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#c8c8c8';
          ctx.beginPath(); ctx.arc(px2 - 5, 137, 8, 0, Math.PI * 2); ctx.fill();
        }
        // Counter cabinets along the floor
        ctx.fillStyle = '#8a5a3b';
        ctx.fillRect(0, GY - 96, W, 96);
        ctx.fillStyle = '#d9b48a';
        ctx.fillRect(0, GY - 102, W, 8);
        ctx.strokeStyle = 'rgba(60,30,10,0.5)'; ctx.lineWidth = 3;
        for (var cx2 = 60; cx2 < W; cx2 += 130) {
          ctx.strokeRect(cx2, GY - 84, 100, 76);
          ctx.beginPath(); ctx.arc(cx2 + 50, GY - 46, 5, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (it.kind === 'tree') {
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(x - 6, base - 70, 12, 70);
        ellipse(ctx, x, base - 95, 46, 40, stage.kind === 'barn' ? '#c98a3a' : '#d97b2e');
        ellipse(ctx, x - 26, base - 70, 28, 24, '#e8a13c');
        ellipse(ctx, x + 26, base - 70, 28, 24, '#e8a13c');
      } else if (it.kind === 'haystack') {
        ctx.fillStyle = '#d9a441';
        ctx.beginPath(); ctx.arc(x, base, 52, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#b07f22'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, base, 34, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (it.kind === 'barrel') {
        ctx.fillStyle = '#8a5a2b';
        rr(ctx, x - 18, base - 52, 36, 52, 8); ctx.fill();
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(x - 18, base - 40, 36, 4);
        ctx.fillRect(x - 18, base - 18, 36, 4);
      }
    }
    if (stage.kind === 'farm') {
      // Red barn on the horizon
      ctx.fillStyle = '#b03a2e';
      ctx.fillRect(880, GY - 190, 220, 190);
      ctx.fillStyle = '#7a241c';
      ctx.beginPath();
      ctx.moveTo(860, GY - 190); ctx.lineTo(990, GY - 260); ctx.lineTo(1120, GY - 190);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f7e8c9';
      ctx.fillRect(960, GY - 120, 60, 120);
      ctx.strokeStyle = '#7a241c'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(960, GY - 60); ctx.lineTo(1020, GY - 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(990, GY - 120); ctx.lineTo(990, GY); ctx.stroke();
    }
  }

  function ground(ctx, stage, scroll) {
    ctx.fillStyle = stage.grass;
    ctx.fillRect(0, GY, W, 14);
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GY + 14, W, H - GY - 14);
    // Dirt speckles scrolling with the world
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (var i = 0; i < 40; i++) {
      var sx = ((i * 173 - scroll) % (W + 40) + W + 40) % (W + 40) - 20;
      var sy = GY + 26 + (i * 37) % 80;
      ctx.fillRect(sx, sy, 8, 4);
    }
    // Grass tufts
    ctx.strokeStyle = stage.grass; ctx.lineWidth = 3;
    for (var j = 0; j < 24; j++) {
      var gx = ((j * 211 - scroll * 1.0) % (W + 60) + W + 60) % (W + 60) - 30;
      ctx.beginPath();
      ctx.moveTo(gx, GY); ctx.lineTo(gx - 5, GY - 12);
      ctx.moveTo(gx + 4, GY); ctx.lineTo(gx + 9, GY - 10);
      ctx.stroke();
    }
  }

  function drawTurkey(ctx, t, blink) {
    if (t.invuln > 0 && Math.floor(t.invuln / 6) % 2 === 0 && !blink) return;
    var x = t.x, y = t.y;
    var legSwing = Math.sin(t.runPhase) * 10;
    ctx.save();
    ctx.translate(x, y);
    if (t.sliding) {
      // Low slide: body flattened, tail up
      ellipse(ctx, 0, 44, 40, 16, '#8a5a2b');
      ellipse(ctx, 34, 34, 14, 10, '#6b3f1d');
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath(); ctx.arc(38, 28, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8893a';
      ctx.beginPath(); ctx.moveTo(46, 28); ctx.lineTo(58, 32); ctx.lineTo(46, 36); ctx.closePath(); ctx.fill();
      ctx.restore();
      return;
    }
    // Tail feathers (fanned)
    ctx.fillStyle = '#a8642a';
    for (var i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate(i * 0.32);
      ctx.beginPath(); ctx.ellipse(-26, -26, 10, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#7a4a1e';
    for (var k = -2; k <= 2; k++) {
      ctx.save(); ctx.rotate(k * 0.32);
      ctx.beginPath(); ctx.ellipse(-26, -26, 5, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // Legs
    ctx.strokeStyle = '#e8893a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-8, 52); ctx.lineTo(-8 + legSwing, 62); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, 52); ctx.lineTo(10 - legSwing, 62); ctx.stroke();
    // Body
    ellipse(ctx, 0, 26, 34, 30, '#8a5a2b');
    ellipse(ctx, -6, 30, 26, 22, '#a06a35');
    // Wing
    ctx.fillStyle = '#6b3f1d';
    ctx.beginPath(); ctx.ellipse(-4, 24, 20, 13, -0.4, 0, Math.PI * 2); ctx.fill();
    // Head + beak + wattle
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath(); ctx.arc(30, -6, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8893a';
    ctx.beginPath(); ctx.moveTo(40, -8); ctx.lineTo(54, -3); ctx.lineTo(40, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d43d2a';
    ctx.beginPath(); ctx.ellipse(36, 6, 5, 8, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(33, -9, 3, 0, Math.PI * 2); ctx.fill();
    // Little red comb
    ctx.fillStyle = '#d43d2a';
    ctx.beginPath(); ctx.arc(26, -18, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(32, -19, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawFarmer(ctx, f) {
    var x = f.x, y = f.y;
    var legSwing = Math.sin(f.runPhase) * 12;
    ctx.save();
    ctx.translate(x, y);
    // Legs (overalls)
    ctx.strokeStyle = '#3a5a8a'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, 62); ctx.lineTo(-6 + legSwing, 92); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, 62); ctx.lineTo(8 - legSwing, 92); ctx.stroke();
    // Body: plaid shirt + overalls
    ctx.fillStyle = '#c0392b';
    rr(ctx, -22, 18, 46, 48, 10); ctx.fill();
    ctx.fillStyle = '#3a5a8a';
    rr(ctx, -18, 44, 38, 26, 6); ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(-22, 34, 46, 4);
    // Arms pumping
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-18, 26); ctx.lineTo(-30, 44 - legSwing); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, 26); ctx.lineTo(32, 44 + legSwing); ctx.stroke();
    // Head, beard, straw hat
    ctx.fillStyle = '#f2c9a0';
    ctx.beginPath(); ctx.arc(2, 2, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath(); ctx.ellipse(2, 12, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath(); ctx.ellipse(2, -12, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-12, -26, 28, 14);
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(7, -1, 3, 0, Math.PI * 2); ctx.fill();
    // Pitchfork in hand
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(34, 20); ctx.lineTo(44, -34); ctx.stroke();
    ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(44, -34); ctx.lineTo(38, -48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(44, -34); ctx.lineTo(44, -50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(44, -34); ctx.lineTo(50, -48); ctx.stroke();
    ctx.restore();
  }

  function drawObstacle(ctx, o, time) {
    var gy = GY;
    var x = o.x, y = gy - o.h;
    if (o.kind === 'fence') {
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(x - 4, y + 6, 8, o.h - 6);
      ctx.fillRect(x + o.w - 4, y + 6, 8, o.h - 6);
      ctx.fillStyle = '#a06a35';
      ctx.fillRect(x - 8, y + 12, o.w + 16, 10);
      ctx.fillRect(x - 8, y + 34, o.w + 16, 10);
    } else if (o.kind === 'hay') {
      ctx.fillStyle = '#d9a441';
      ctx.beginPath(); ctx.ellipse(x + o.w / 2, gy - 6, o.w / 2 + 6, o.h / 2, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#b07f22'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + 8, gy - 10); ctx.lineTo(x + 8, gy - o.h + 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + o.w - 8, gy - 10); ctx.lineTo(x + o.w - 8, gy - o.h + 14); ctx.stroke();
    } else if (o.kind === 'pumpkin') {
      var px = x + o.w / 2, py = gy - o.h / 2;
      ctx.fillStyle = '#e87a1e';
      ctx.beginPath(); ctx.ellipse(px, py, 30, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c85a10'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(px, py, 16, 26, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#3a7a2e';
      ctx.fillRect(px - 3, py - 32, 7, 12);
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(px - 8, py - 6, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 8, py - 6, 3, 0, Math.PI * 2); ctx.fill();
    } else if (o.kind === 'puddle') {
      ctx.fillStyle = '#7a9ab0';
      ctx.beginPath(); ctx.ellipse(x + o.w / 2, gy - 4, o.w / 2, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.ellipse(x + o.w / 2 - 14, gy - 6, 22, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a3a1a';
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      labelPill(ctx, 'MUD — SLOWS YOU DOWN', x + o.w / 2, gy - 22);
    } else if (o.kind === 'oven') {
      // Brick oven with roaring fire
      ctx.fillStyle = '#8a3a2a';
      rr(ctx, x - 6, y, o.w + 12, o.h, 12); ctx.fill();
      ctx.fillStyle = '#5a2418';
      ctx.beginPath(); ctx.arc(x + o.w / 2, gy - 30, 34, 0, Math.PI * 2); ctx.fill();
      var fl = Math.sin(time * 0.35 + o.phase) * 6;
      ctx.fillStyle = '#ff8a1e';
      ctx.beginPath();
      ctx.moveTo(x + o.w / 2 - 26, gy - 8);
      ctx.quadraticCurveTo(x + o.w / 2 - 18, gy - 58 - fl, x + o.w / 2, gy - 66 - fl);
      ctx.quadraticCurveTo(x + o.w / 2 + 18, gy - 58 - fl, x + o.w / 2 + 26, gy - 8);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.moveTo(x + o.w / 2 - 14, gy - 8);
      ctx.quadraticCurveTo(x + o.w / 2 - 8, gy - 40 - fl, x + o.w / 2, gy - 46 - fl);
      ctx.quadraticCurveTo(x + o.w / 2 + 8, gy - 40 - fl, x + o.w / 2 + 14, gy - 8);
      ctx.closePath(); ctx.fill();
      labelPill(ctx, 'OVEN — JUMP IT!', x + o.w / 2, y - 14);
      // Chimney smoke
      ctx.fillStyle = 'rgba(120,120,120,0.5)';
      ctx.beginPath(); ctx.arc(x + o.w - 6, y - 14 - ((time * 0.6 + o.phase * 20) % 40), 10, 0, Math.PI * 2); ctx.fill();
    } else if (o.kind === 'knife') {
      // Carving knife on a stand, blade swinging up and down
      var swing = Math.sin(time * 0.06 + o.phase);
      var bladeTop = y + 10 + (swing + 1) * 26;
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(x - 6, gy - 26, o.w + 12, 26);
      ctx.fillStyle = '#c0c0c0';
      ctx.save();
      ctx.translate(x + o.w / 2, bladeTop);
      ctx.rotate(swing * 0.5);
      ctx.beginPath();
      ctx.moveTo(-6, 0); ctx.lineTo(10, 0); ctx.lineTo(34, 22); ctx.lineTo(10, 34); ctx.lineTo(-6, 34);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x + o.w / 2 - 16, bladeTop + 26, 32, 8);
      labelPill(ctx, swing > 0 ? 'SLIDE UNDER!' : 'JUMP OVER!', x + o.w / 2, y - 14);
    }
  }

  function drawPickup(ctx, p, time) {
    var bob = Math.sin(time * 0.12 + p.phase) * 4;
    var x = p.x, y = p.y + bob;
    if (p.kind === 'corn') {
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath(); ctx.ellipse(x, y, 9, 14, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d9a41e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 5, y - 8); ctx.lineTo(x - 5, y + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 1, y - 9); ctx.lineTo(x + 1, y + 9); ctx.stroke();
      ctx.fillStyle = '#3a7a2e';
      ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x - 6, y - 22); ctx.lineTo(x + 6, y - 22); ctx.closePath(); ctx.fill();
    } else if (p.kind === 'feather') {
      ctx.fillStyle = '#ffd94d';
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.5);
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3c0';
      ctx.beginPath(); ctx.ellipse(0, -6, 4, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#d9a41e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x, y + 26); ctx.stroke();
    } else if (p.kind === 'pie') {
      ctx.fillStyle = '#d43d2a';
      ctx.beginPath(); ctx.moveTo(x - 16, y + 10); ctx.lineTo(x + 16, y + 10); ctx.lineTo(x, y - 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath(); ctx.moveTo(x - 16, y + 10); ctx.lineTo(x + 16, y + 10); ctx.lineTo(x + 10, y + 16); ctx.lineTo(x - 10, y + 16); ctx.closePath(); ctx.fill();
    }
  }

  function heart(ctx, x, y, full) {
    ctx.fillStyle = full ? '#e63946' : 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.bezierCurveTo(x - 12, y - 4, x - 6, y - 14, x, y - 6);
    ctx.bezierCurveTo(x + 6, y - 14, x + 12, y - 4, x, y + 8);
    ctx.fill();
  }

  function button(ctx, b, label) {
    ctx.fillStyle = 'rgba(43,26,18,0.85)';
    rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 2;
    rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.stroke();
    ctx.fillStyle = '#fff3c0';
    ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }

  function hud(ctx, s) {
    var t = s.turkey;
    ctx.fillStyle = 'rgba(43,26,18,0.72)';
    rr(ctx, 16, 12, 330, 92, 12); ctx.fill();
    ctx.fillStyle = '#fff3c0';
    ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('SCORE ' + Math.floor(t.score), 30, 44);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('DIST ' + Math.floor(t.distanceM) + ' m', 30, 72);
    ctx.fillText('CORN ' + t.corn, 30, 94);
    // Hearts top-right of the panel
    for (var i = 0; i < CONFIG.MAX_HEARTS; i++) {
      heart(ctx, 250 + i * 26, 34, i < t.hearts);
    }
    // Stage banner
    var stage = World.stageAt(t.distanceM);
    ctx.fillStyle = 'rgba(43,26,18,0.72)';
    rr(ctx, W / 2 - 190, 12, 380, 40, 12); ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(stage.name, W / 2, 39);
    // Pause + mute buttons
    button(ctx, { x: W - 116, y: 12, w: 48, h: 40 }, s.paused ? '▶' : '❚❚');
    button(ctx, { x: W - 60, y: 12, w: 48, h: 40 }, s.muted ? '✕' : '♪');
    // Farmer proximity meter
    var g = Farmer.gap(s.farmer, t);
    ctx.fillStyle = 'rgba(43,26,18,0.72)';
    rr(ctx, 16, 116, 200, 26, 8); ctx.fill();
    ctx.fillStyle = g < CONFIG.FARMER_ALARM_GAP ? '#e63946' : '#6fae4e';
    var frac = Math.max(0, Math.min(1, 1 - g / 400));
    rr(ctx, 20, 120, 192 * frac, 18, 6); ctx.fill();
    ctx.fillStyle = '#fff3c0';
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(g < CONFIG.FARMER_ALARM_GAP ? 'FARMER CLOSE!' : 'FARMER', 24, 160);
  }

  function alarmVignette(ctx, s) {
    if (!s.farmer.spotted) return;
    var g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
    g.addColorStop(0, 'rgba(230,57,70,0)');
    g.addColorStop(1, 'rgba(230,57,70,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('!', W - 300, 210);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SPOTTED — RUN!', W - 300, 240);
  }

  function titleScreen(ctx, s) {
    var stage = STAGES[0];
    sky(ctx, stage, s.time);
    backgroundProps(ctx, stage, 0, 7);
    hills(ctx, stage, 0);
    ground(ctx, stage, 0);
    // Big friendly turkey + farmer silhouettes on the title
    var fake = { x: 330, y: GY - 62, w: 66, h: 62, vy: 0, onGround: true, sliding: false, slideTimer: 0, speed: 0, invuln: 0, runPhase: s.time * 0.05, dead: false };
    drawTurkey(ctx, fake, true);
    var fakeF = { x: 150, y: GY - 92, w: 64, h: 92, speed: 0, runPhase: s.time * 0.05, spotted: false, alarmTimer: 0 };
    drawFarmer(ctx, fakeF);
    // Title panel
    ctx.fillStyle = 'rgba(43,26,18,0.78)';
    rr(ctx, W / 2 - 420, 90, 840, 300, 20); ctx.fill();
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 3;
    rr(ctx, W / 2 - 420, 90, 840, 300, 20); ctx.stroke();
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 64px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('TURKEY RUN', W / 2, 170);
    ctx.fillStyle = '#fff3c0';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('The Great Thanksgiving Escape', W / 2, 216);
    ctx.font = '20px sans-serif';
    ctx.fillText('Outrun the farmer. Dodge ovens, knives and fences.', W / 2, 258);
    ctx.fillText('Grab corn, golden feathers and pie. Reach the safe woods!', W / 2, 288);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffd94d';
    ctx.fillText('BEST DISTANCE: ' + Math.floor(s.best) + ' m', W / 2, 330);
    ctx.fillText('SPACE jump  •  DOWN slide  •  ← → speed  •  R restart  •  M mute', W / 2, 362);
    // Start button
    button(ctx, { x: W / 2 - 130, y: 430, w: 260, h: 64 }, '▶  START RUN');
    ctx.fillStyle = '#fff3c0';
    ctx.font = '18px sans-serif';
    ctx.fillText('or press SPACE', W / 2, 530);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = 'rgba(255,243,192,0.75)';
    ctx.fillText('3 stages: Farmyard → Barn → Kitchen. Escape all three to win!', W / 2, 560);
  }

  function pausedOverlay(ctx) {
    ctx.fillStyle = 'rgba(20,10,6,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff3c0';
    ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2 - 20);
    ctx.font = '20px sans-serif';
    ctx.fillText('Press P or click ▶ to keep running', W / 2, H / 2 + 24);
  }

  function endScreen(ctx, s, escaped) {
    var t = s.turkey;
    ctx.fillStyle = escaped ? 'rgba(20,60,25,0.72)' : 'rgba(60,15,10,0.72)';
    ctx.fillRect(0, 0, W, H);
    if (escaped) {
      // Confetti
      var rng = makeRng(99);
      for (var i = 0; i < 90; i++) {
        ctx.fillStyle = rngPick(rng, ['#ffd94d', '#e63946', '#6fae4e', '#7ec8f2', '#f2c14e']);
        ctx.fillRect(rng() * W, (rng() * H + s.time * 2) % H, 10, 6);
      }
    }
    ctx.fillStyle = 'rgba(43,26,18,0.85)';
    rr(ctx, W / 2 - 400, 130, 800, 400, 20); ctx.fill();
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 3;
    rr(ctx, W / 2 - 400, 130, 800, 400, 20); ctx.stroke();
    ctx.textAlign = 'center';
    if (escaped) {
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 62px sans-serif';
      ctx.fillText('ESCAPED!', W / 2, 220);
      ctx.fillStyle = '#fff3c0';
      ctx.font = '26px sans-serif';
      ctx.fillText('You made it to the safe woods. Happy Thanksgiving!', W / 2, 268);
    } else {
      ctx.fillStyle = '#ff8a7a';
      ctx.font = 'bold 62px sans-serif';
      ctx.fillText('CAUGHT!', W / 2, 220);
      ctx.fillStyle = '#fff3c0';
      ctx.font = '26px sans-serif';
      ctx.fillText('The farmer got you! Dinner is served...', W / 2, 268);
    }
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#ffd94d';
    ctx.fillText('FINAL SCORE  ' + Math.floor(t.score), W / 2, 340);
    ctx.fillStyle = '#fff3c0';
    ctx.font = '22px sans-serif';
    ctx.fillText('Distance ' + Math.floor(t.distanceM) + ' m   •   Corn ' + t.corn + '   •   Feathers ' + t.feathers, W / 2, 384);
    ctx.fillText('Best distance: ' + Math.floor(Math.max(s.best, t.distanceM)) + ' m', W / 2, 418);
    button(ctx, { x: W / 2 - 130, y: 450, w: 260, h: 60 }, '↻  RUN AGAIN');
    ctx.font = '18px sans-serif';
    ctx.fillText('or press R', W / 2, 540);
  }

  function render(ctx, s) {
    var stage = World.stageAt(s.turkey.distanceM);
    if (s.state === 'title') {
      titleScreen(ctx, s);
      return;
    }
    sky(ctx, stage, s.time);
    backgroundProps(ctx, stage, s.scroll, 7);
    hills(ctx, stage, s.scroll);
    ground(ctx, stage, s.scroll);
    for (var i = 0; i < s.pickups.length; i++) {
      if (!s.pickups[i].taken) drawPickup(ctx, s.pickups[i], s.time);
    }
    for (var j = 0; j < s.obstacles.length; j++) {
      drawObstacle(ctx, s.obstacles[j], s.time);
    }
    drawFarmer(ctx, s.farmer);
    drawTurkey(ctx, s.turkey, false);
    hud(ctx, s);
    alarmVignette(ctx, s);
    if (s.state === 'escaped') endScreen(ctx, s, true);
    else if (s.state === 'caught') endScreen(ctx, s, false);
    else if (s.paused) pausedOverlay(ctx);
  }

  return {
    render: render,
    button: button,
    titleScreen: titleScreen,
    endScreen: endScreen
  };
})();
