/**
 * spotlight.js
 * Spotlight mini-game for every design page.
 * Move the spotlight to reveal the hidden design — and find the eagle for confetti!
 */

(function () {
  'use strict';

  var SPOTLIGHT_R  = 120;   // spotlight radius (px)
  var EAGLE_W      = 80;    // eagle display size
  var EAGLE_H      = 80;
  var HIT_R        = 55;    // how close the spotlight centre must be to the eagle centre
  var CONFETTI_N   = 100;
  var CONFETTI_DUR = 3200;  // ms confetti lasts

  var COLORS = ['#00e5ff','#b8ff3d','#ff6b6b','#ffd93d','#c77dff','#ff9f1c','#2ec4b6','#ffffff'];

  function initSpotlight(canvas, imgSrc, eagleSrc) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0;
    var mx = -9999, my = -9999;
    var ex = 0, ey = 0;           // eagle centre
    var confetti = [];
    var confettiEnd = 0;
    var eagleFound = false;
    var loadedCount = 0;

    var img   = new Image();
    var eagle = new Image();
    img.crossOrigin   = 'anonymous';
    eagle.crossOrigin = 'anonymous';

    function onLoad() {
      loadedCount++;
      if (loadedCount < 2) return;
      resize();
      requestAnimationFrame(loop);
    }
    img.onload   = onLoad;
    eagle.onload = onLoad;
    img.src   = imgSrc;
    eagle.src = eagleSrc;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      W = canvas.width  = Math.round(rect.width);
      H = canvas.height = Math.round(W * 9 / 16);
      placeEagle();
    }

    function placeEagle() {
      if (!W) return;
      var m = EAGLE_W + 10;
      ex = m + Math.random() * (W - m * 2);
      ey = m + Math.random() * (H - m * 2);
    }

    // ── Input tracking ──────────────────────────────────────────────────────
    function getPos(e) {
      var r   = canvas.getBoundingClientRect();
      var src = e.touches ? e.touches[0] : e;
      return [
        (src.clientX - r.left) * (W / r.width),
        (src.clientY - r.top)  * (H / r.height)
      ];
    }
    canvas.addEventListener('mousemove',  function(e){ var p=getPos(e); mx=p[0]; my=p[1]; });
    canvas.addEventListener('touchmove',  function(e){ e.preventDefault(); var p=getPos(e); mx=p[0]; my=p[1]; }, { passive:false });
    canvas.addEventListener('mouseleave', function(){ mx=-9999; my=-9999; });
    canvas.addEventListener('touchend',   function(){ mx=-9999; my=-9999; });
    window.addEventListener('resize', resize);

    // ── Confetti burst ───────────────────────────────────────────────────────
    function burst() {
      confettiEnd = performance.now() + CONFETTI_DUR;
      confetti = [];
      for (var i = 0; i < CONFETTI_N; i++) {
        confetti.push({
          x  : W  * Math.random(),
          y  : -20 - Math.random() * 80,
          vx : (Math.random() - 0.5) * 7,
          vy :  1.5 + Math.random() * 4,
          w  :  6   + Math.random() * 9,
          h  :  4   + Math.random() * 6,
          rot: Math.random() * Math.PI * 2,
          dr : (Math.random() - 0.5) * 0.2,
          col: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
      }
    }

    // ── Main render loop ─────────────────────────────────────────────────────
    function loop() {
      requestAnimationFrame(loop);
      if (!W || !H) return;

      ctx.clearRect(0, 0, W, H);

      // 1. Design image
      ctx.drawImage(img, 0, 0, W, H);

      // 2. Eagle (silhouette — will be covered by darkness unless spotlight is on it)
      ctx.save();
      ctx.drawImage(eagle, ex - EAGLE_W / 2, ey - EAGLE_H / 2, EAGLE_W, EAGLE_H);
      ctx.restore();

      // 3. Dark overlay with spotlight hole (radial gradient)
      var grd = ctx.createRadialGradient(mx, my, SPOTLIGHT_R * 0.35, mx, my, SPOTLIGHT_R);
      grd.addColorStop(0,   'rgba(0,0,0,0)');
      grd.addColorStop(0.7, 'rgba(0,0,0,0.15)');
      grd.addColorStop(1,   'rgba(0,0,0,1)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // 4. Confetti particles
      var now = performance.now();
      if (now < confettiEnd) {
        for (var i = 0; i < confetti.length; i++) {
          var p = confetti[i];
          p.x  += p.vx;
          p.y  += p.vy;
          p.vy += 0.18;
          p.rot += p.dr;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.col;
          ctx.globalAlpha = Math.max(0, 1 - (now - (confettiEnd - CONFETTI_DUR)) / CONFETTI_DUR);
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      // 5. Eagle hit detection
      var dist = Math.sqrt((mx - ex) * (mx - ex) + (my - ey) * (my - ey));
      if (!eagleFound && dist < HIT_R) {
        eagleFound = true;
        burst();
        setTimeout(function () {
          placeEagle();
          eagleFound = false;
        }, 900);
      }
    }
  }

  // ── Auto-init ─────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('canvas.spotlight-canvas').forEach(function (canvas) {
      var imgSrc   = canvas.dataset.img;
      var eagleSrc = canvas.dataset.eagle;
      if (imgSrc && eagleSrc) initSpotlight(canvas, imgSrc, eagleSrc);
    });
  });

})();
