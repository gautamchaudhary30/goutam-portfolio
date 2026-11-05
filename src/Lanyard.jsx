import React, { useEffect, useRef } from 'react';

export default function Lanyard({
  frontImage,
  backImage,
  strapImage,
  imageFit = 'cover',
  cardColor = '#ffffff',
  orientation = 'portrait',
  finish = 'glossy',
  cornerRadius = 0.3,
  size = 0.6,
  anchor = 'center',
  strapLength = 0.5,
  strapColor = '#111111',
  strapWidth = 0.65,
  metal = 'silver',
  gravity = 1,
  damping = 0.5,
  elasticity = 0.5,
  breeze = 0.5,
  interactive = true,
  intro = true
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas.getContext('2d');
    const image = new Image();
    image.src = frontImage;
    let width = 0, height = 0, dpr = 1, raf = 0, alive = true;
    let angle = 0, velocity = 0, target = 0, dragging = false, lastX = 0;
    let pointerX = 0, pointerY = 0, introTime = performance.now();

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const roundedRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    };

    const drawImageCover = (img, x, y, w, h) => {
      if (!img.complete || !img.naturalWidth) return;
      const scale = imageFit === 'contain'
        ? Math.min(w / img.naturalWidth, h / img.naturalHeight)
        : Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.save();
      roundedRect(x, y, w, h, 5);
      ctx.clip();
      ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
      ctx.restore();
    };

    const draw = now => {
      if (!alive) return;
      ctx.clearRect(0, 0, width, height);

      const introFactor = intro ? Math.min(1, Math.max(0, (now - introTime) / 900)) : 1;
      const cardW = Math.min(width * 0.64, 292) * size / 0.6;
      const cardH = orientation === 'landscape' ? cardW * 0.7 : cardW * 1.38;
      const pivotX = anchor === 'left' ? width * 0.34 : anchor === 'right' ? width * 0.66 : width * 0.5;
      const pivotY = 20;
      const cardX = -cardW / 2;
      const cardY = Math.max(130, height * (0.22 + strapLength * 0.12));
      const gravityForce = 0.0009 * gravity;
      if (!dragging) {
        const breezeForce = Math.sin(now / 1300) * breeze * 0.00008;
        velocity += (-angle * gravityForce * 1.8) + breezeForce;
        velocity *= 0.985 + damping * 0.012;
        angle += velocity;
        angle += (target - angle) * (0.006 + elasticity * 0.006);
        angle = Math.max(-0.55, Math.min(0.55, angle));
      }

      const cardTop = cardY;
      const strapEndX = pivotX + Math.sin(angle) * cardTop;
      const strapEndY = pivotY + Math.cos(angle) * cardTop;

      ctx.save();
      ctx.strokeStyle = strapColor;
      ctx.lineWidth = Math.max(5, cardW * 0.035 * strapWidth);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.quadraticCurveTo(pivotX + Math.sin(angle) * cardTop * 0.32, cardTop * 0.46, strapEndX, strapEndY - 12);
      ctx.stroke();

      // Metal clip and connector
      ctx.fillStyle = metal === 'gold' ? '#c7a45b' : '#b9bec5';
      ctx.strokeStyle = metal === 'gold' ? '#80652f' : '#747b84';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pivotX - 9, strapEndY - 17, 18, 27, 5);
      ctx.fill();
      ctx.stroke();

      ctx.translate(pivotX, strapEndY + 4);
      ctx.rotate(angle * introFactor);
      ctx.translate(cardX, 0);

      const radius = Math.min(cardW, cardH) * cornerRadius * 0.12;
      ctx.shadowColor = 'rgba(0,0,0,.28)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 18;
      ctx.fillStyle = cardColor;
      roundedRect(0, 0, cardW, cardH, radius);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.save();
      roundedRect(7, 7, cardW - 14, cardH - 14, Math.max(3, radius - 3));
      ctx.clip();
      if (image.complete && image.naturalWidth) {
        drawImageCover(image, 7, 7, cardW - 14, cardH - 14);
      } else {
        ctx.fillStyle = '#e9e9e9';
        ctx.fillRect(7, 7, cardW - 14, cardH - 14);
      }
      if (finish === 'glossy') {
        const gloss = ctx.createLinearGradient(0, 0, cardW, cardH);
        gloss.addColorStop(0, 'rgba(255,255,255,.34)');
        gloss.addColorStop(0.38, 'rgba(255,255,255,.04)');
        gloss.addColorStop(0.5, 'rgba(255,255,255,0)');
        gloss.addColorStop(1, 'rgba(255,255,255,.12)');
        ctx.fillStyle = gloss;
        ctx.fillRect(0, 0, cardW, cardH);
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 1;
      roundedRect(1, 1, cardW - 2, cardH - 2, radius);
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    const point = e => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onDown = e => {
      if (!interactive) return;
      const p = point(e);
      pointerX = p.x; pointerY = p.y; lastX = p.x; dragging = true;
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onMove = e => {
      if (!dragging) return;
      const p = point(e);
      const dx = p.x - lastX;
      lastX = p.x;
      angle += dx * 0.012;
      velocity = dx * 0.0018;
    };
    const onUp = () => { dragging = false; };
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    resize();
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onUp);
    raf = requestAnimationFrame(draw);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onUp);
    };
  }, [frontImage, imageFit, cardColor, orientation, finish, cornerRadius, size, anchor, strapLength, strapColor, strapWidth, metal, gravity, damping, elasticity, breeze, interactive, intro]);

  return <div ref={wrapRef} className="lanyard-scene">
    <canvas ref={canvasRef} aria-label="Interactive swinging portrait ID card" />
  </div>;
}
