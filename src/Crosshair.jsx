import React, { useEffect, useRef } from 'react';

export default function Crosshair({ containerRef, color = '#ffffff', targetEffect = 'lock', thickness = 1, opacity = 0.85, smoothing = 0.35, showCoordinates = true, lineStyle = 'solid', blendMode = 'normal', gap = 0, fade = 0, clickPulse = true, hideCursor = false }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current, container = containerRef?.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = 1, raf = 0, alive = true;
    let pointer = { x: -100, y: -100 }, current = { x: -100, y: -100 }, target = null, pulseAt = 0, visible = false;
    const resize = () => {
      const rect = container.getBoundingClientRect(); width = Math.max(container.scrollWidth, rect.width); height = Math.max(container.scrollHeight, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
      canvas.style.width = width+'px'; canvas.style.height = height+'px'; ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const pos = e => { const r=container.getBoundingClientRect(); return {x:e.clientX-r.left+container.scrollLeft,y:e.clientY-r.top+container.scrollTop}; };
    const move = e => {
      pointer=pos(e); visible=true;
      const el=e.target?.closest?.('a,button,[role="button"],input,textarea,select,.project,.chips span');
      if(el && targetEffect==='lock'){const r=el.getBoundingClientRect(),c=container.getBoundingClientRect();target={x:r.left+r.width/2-c.left+container.scrollLeft,y:r.top+r.height/2-c.top+container.scrollTop,w:r.width,h:r.height};} else target=null;
    };
    const leave=()=>{visible=false;target=null;};
    const click=e=>{if(clickPulse){pointer=pos(e);pulseAt=performance.now();}};
    const draw=now=>{
      if(!alive)return; ctx.clearRect(0,0,width,height); const ease=Math.max(.04,Math.min(.95,smoothing)), dest=target||pointer;
      current.x+=(dest.x-current.x)*ease; current.y+=(dest.y-current.y)*ease;
      if(visible && current.x>-50){
        ctx.save();ctx.globalAlpha=opacity;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=thickness;ctx.globalCompositeOperation=blendMode==='difference'?'difference':'source-over';ctx.setLineDash(lineStyle==='dashed'?[5,5]:[]);
        if(target){const w=target.w/2+8,h=target.h/2+8;ctx.strokeRect(current.x-w,current.y-h,w*2,h*2);}
        else {const g=gap;ctx.beginPath();ctx.moveTo(current.x-18-g,current.y);ctx.lineTo(current.x-g,current.y);ctx.moveTo(current.x+g,current.y);ctx.lineTo(current.x+18+g,current.y);ctx.moveTo(current.x,current.y-18-g);ctx.lineTo(current.x,current.y-g);ctx.moveTo(current.x,current.y+g);ctx.lineTo(current.x,current.y+18+g);ctx.stroke();ctx.beginPath();ctx.arc(current.x,current.y,2,0,Math.PI*2);ctx.fill();}
        if(showCoordinates){ctx.font='10px monospace';ctx.fillText(Math.round(current.x)+' / '+Math.round(current.y),current.x+14,current.y+(target?target.h/2+22:28));}
        if(clickPulse&&pulseAt){const age=now-pulseAt;if(age<520){ctx.globalAlpha=opacity*(1-age/520);ctx.beginPath();ctx.arc(pointer.x,pointer.y,8+age*.055,0,Math.PI*2);ctx.stroke();}else pulseAt=0;}
        ctx.restore();
      } raf=requestAnimationFrame(draw);
    };
    const observer=new ResizeObserver(resize);observer.observe(container);resize();
    container.addEventListener('pointermove',move);container.addEventListener('pointerleave',leave);container.addEventListener('click',click);window.addEventListener('resize',resize);
    raf=requestAnimationFrame(draw);
    return ()=>{alive=false;cancelAnimationFrame(raf);observer.disconnect();container.removeEventListener('pointermove',move);container.removeEventListener('pointerleave',leave);container.removeEventListener('click',click);window.removeEventListener('resize',resize);};
  },[containerRef,color,targetEffect,thickness,opacity,smoothing,showCoordinates,lineStyle,blendMode,gap,fade,clickPulse]);
  return <canvas ref={canvasRef} className="crosshair-overlay" aria-hidden="true" style={{pointerEvents:'none',position:'absolute',inset:0,zIndex:50,opacity:hideCursor?0:1}} />;
}