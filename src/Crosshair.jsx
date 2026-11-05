import React, { useEffect, useRef } from 'react';

export default function Crosshair({
  containerRef, color = '#ffffff', targetEffect = 'lock', thickness = 1,
  opacity = 0.85, smoothing = 0.35, showCoordinates = true,
  lineStyle = 'solid', blendMode = 'normal', gap = 0,
  fade = 0, clickPulse = true, hideCursor = false
}) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = 1, raf = 0, alive = true;
    let pointer = {x:-100,y:-100}, current = {x:-100,y:-100};
    let target = null, pulseAt = 0, visible = false, lastMove = 0;

    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
      canvas.style.width = width+'px'; canvas.style.height = height+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const move = e => {
      pointer = {x:e.clientX,y:e.clientY}; visible = true; lastMove = performance.now();
      const el = e.target?.closest?.('a,button,[role="button"],input,textarea,select,.project,.chips span');
      if (el && targetEffect === 'lock') {
        const r=el.getBoundingClientRect();
        target={x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};
      } else target=null;
    };
    const leave = () => { visible=false; target=null; };
    const click = e => { if(clickPulse){pointer={x:e.clientX,y:e.clientY};pulseAt=performance.now();} };
    const draw = now => {
      if(!alive)return;
      ctx.clearRect(0,0,width,height);
      const ease=Math.max(.04,Math.min(.95,smoothing)), dest=target||pointer;
      current.x+=(dest.x-current.x)*ease; current.y+=(dest.y-current.y)*ease;
      if(visible && current.x>-50 && current.y>-50 && current.x<width+50 && current.y<height+50){
        ctx.save();ctx.globalAlpha=opacity;ctx.strokeStyle=color;ctx.fillStyle=color;
        ctx.lineWidth=thickness;ctx.globalCompositeOperation=blendMode==='difference'?'difference':'source-over';
        ctx.setLineDash(lineStyle==='dashed'?[5,5]:[]);
        if(target){
          const w=target.w/2+8,h=target.h/2+8;
          ctx.strokeRect(current.x-w,current.y-h,w*2,h*2);
          const arm=7;
          [[-w,-h],[w,-h],[-w,h],[w,h]].forEach(([x,y])=>{
            ctx.beginPath();ctx.moveTo(current.x+x+(x<0?0:-arm),current.y+y);
            ctx.lineTo(current.x+x+(x<0?arm:0),current.y+y);
            ctx.moveTo(current.x+x,current.y+y+(y<0?0:-arm));
            ctx.lineTo(current.x+x,current.y+y+(y<0?arm:0));ctx.stroke();
          });
        } else {
          const g=gap;ctx.beginPath();
          ctx.moveTo(current.x-18-g,current.y);ctx.lineTo(current.x-g,current.y);
          ctx.moveTo(current.x+g,current.y);ctx.lineTo(current.x+18+g,current.y);
          ctx.moveTo(current.x,current.y-18-g);ctx.lineTo(current.x,current.y-g);
          ctx.moveTo(current.x,current.y+g);ctx.lineTo(current.x,current.y+18+g);
          ctx.stroke();ctx.beginPath();ctx.arc(current.x,current.y,2,0,Math.PI*2);ctx.fill();
        }
        if(showCoordinates){ctx.font='10px monospace';ctx.fillText(Math.round(current.x)+' / '+Math.round(current.y),current.x+14,current.y+(target?target.h/2+22:28));}
        if(clickPulse&&pulseAt){const age=now-pulseAt;if(age<520){ctx.globalAlpha=opacity*(1-age/520);ctx.beginPath();ctx.arc(pointer.x,pointer.y,8+age*.055,0,Math.PI*2);ctx.stroke();}else pulseAt=0;}
        ctx.restore();
      }
      raf=requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize',resize);
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerdown',click,{passive:true});
    window.addEventListener('blur',leave);
    raf=requestAnimationFrame(draw);
    return ()=>{alive=false;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',click);window.removeEventListener('blur',leave);};
  },[containerRef,color,targetEffect,thickness,opacity,smoothing,showCoordinates,lineStyle,blendMode,gap,fade,clickPulse]);
  return <canvas ref={canvasRef} className="crosshair-overlay" aria-hidden="true" style={{pointerEvents:'none',position:'fixed',left:0,top:0,zIndex:99999,opacity:hideCursor?0:1}} />;
}
