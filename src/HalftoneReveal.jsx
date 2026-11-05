import React,{useEffect,useRef}from'react';

export default function HalftoneReveal({
  src,mode='mono',shape='dot',cellSize=6,angle=45,inkColor='#f4f1ea',
  paperColor='#120f17',revealRadius=160,dotScale=1,contrast=1.1,
  brightness=0,invert=false,roughness=0,misregistration=0,fit='contain',
  accentColor='#ff4f2a',softness=.6,linger=1.2,reverse=false,
  wander=false,clickBurst=false,intro=true
}){
  const canvasRef=useRef(null),wrapRef=useRef(null),pointer=useRef({x:-9999,y:-9999,active:false,last:0,bursts:[]});
  useEffect(()=>{
    const canvas=canvasRef.current,wrap=wrapRef.current,ctx=canvas.getContext('2d',{alpha:true});
    const image=new Image();image.crossOrigin='anonymous';image.src=src;
    let frame=0,raf=0,width=0,height=0,dpr=1,off=document.createElement('canvas'),offCtx=off.getContext('2d',{willReadFrequently:true}),pixels=null,cols=0,rows=0,cell=Math.max(3,cellSize),start=performance.now(),alive=true;
    const resize=()=>{const r=wrap.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);cell=Math.max(3,cellSize);cols=Math.ceil(width/cell);rows=Math.ceil(height/cell);off.width=cols;off.height=rows;drawImage();};
    const drawImage=()=>{if(!image.complete||!image.naturalWidth)return;offCtx.clearRect(0,0,cols,rows);const scale=fit==='cover'?Math.max(cols/image.naturalWidth,rows/image.naturalHeight):Math.min(cols/image.naturalWidth,rows/image.naturalHeight);const iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;offCtx.drawImage(image,(cols-iw)/2,(rows-ih)/2,iw,ih);try{pixels=offCtx.getImageData(0,0,cols,rows).data}catch(e){pixels=null}};
    const pointerMove=e=>{const r=canvas.getBoundingClientRect();pointer.current.x=e.clientX-r.left;pointer.current.y=e.clientY-r.top;pointer.current.active=true;pointer.current.last=performance.now()};
    const pointerLeave=()=>{pointer.current.active=false};
    const click=e=>{if(!clickBurst)return;const r=canvas.getBoundingClientRect();pointer.current.bursts.push({x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now()})};
    const draw=now=>{if(!alive)return;ctx.clearRect(0,0,width,height);if(pixels){const p=pointer.current,elapsed=(now-start)/1000,introProgress=intro?Math.min(1,elapsed/.95):1;const angleRad=angle*Math.PI/180,cos=Math.cos(angleRad),sin=Math.sin(angleRad),maxR=cell*.72;
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=(y*cols+x)*4,a=pixels[i+3]/255;if(a<.05)continue;let lum=(.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2])/255;lum=Math.max(0,Math.min(1,(lum-.5)*contrast+.5+brightness));if(invert)lum=1-lum;const darkness=1-lum;let radius=Math.max(.25,Math.pow(darkness,.85)*maxR*dotScale);const px=(x+.5)*cell,py=(y+.5)*cell;const dist=Math.hypot(px-p.x,py-p.y);let reveal=p.active?Math.max(0,1-dist/revealRadius):0;if(!p.active&&linger>0)reveal=Math.max(0,1-dist/revealRadius)*Math.max(0,1-(now-p.last)/(linger*1000));if(reverse)reveal=1-reveal;for(const b of p.bursts){const age=(now-b.t)/1000,ring=Math.abs(Math.hypot(px-b.x,py-b.y)-age*360);if(age<1.1&&ring<26)reveal=Math.max(reveal,1-ring/26)}const introDist=Math.hypot(px-width/2,py-height/2);if(intro)reveal=Math.max(reveal,Math.max(0,1-introDist/(Math.max(width,height)*introProgress*.8+1)));radius=radius+(maxR-radius)*Math.max(0,Math.min(1,reveal));if(radius<.35)continue;const rotX=px*cos-py*sin,rotY=px*sin+py*cos;const cx=rotX*cos+rotY*sin,cy=-rotX*sin+rotY*cos;ctx.beginPath();if(shape==='square')ctx.rect(cx-radius,cy-radius,radius*2,radius*2);else if(shape==='diamond'){ctx.moveTo(cx,cy-radius);ctx.lineTo(cx+radius,cy);ctx.lineTo(cx,cy+radius);ctx.lineTo(cx-radius,cy);ctx.closePath()}else if(shape==='line'){ctx.rect(cx-radius,cy-radius*.3,radius*2,radius*.6)}else ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle=mode==='duotone'&&darkness>.65?accentColor:inkColor;ctx.fill()}
      // Reveal the original transparent portrait beneath the halftone dots
      // inside the pointer radius so the subject becomes clearly visible on hover.
      if(p.active && image.complete && image.naturalWidth){
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x,p.y,revealRadius,0,Math.PI*2);
        ctx.clip();
        const scale=fit==='cover'?Math.max(width/image.naturalWidth,height/image.naturalHeight):Math.min(width/image.naturalWidth,height/image.naturalHeight);
        const iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;
        ctx.drawImage(image,(width-iw)/2,(height-ih)/2,iw,ih);
        ctx.restore();
      }
      pointer.current.bursts=pointer.current.bursts.filter(b=>(now-b.t)<1100);
    raf=requestAnimationFrame(draw)};
    image.onload=()=>{resize()};image.onerror=()=>{ctx.clearRect(0,0,width,height)};const observer=new ResizeObserver(resize);observer.observe(wrap);resize();raf=requestAnimationFrame(draw);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerleave',pointerLeave);canvas.addEventListener('click',click);
    return()=>{alive=false;cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerleave',pointerLeave);canvas.removeEventListener('click',click)};
  },[src,mode,shape,cellSize,angle,inkColor,paperColor,revealRadius,dotScale,contrast,brightness,invert,roughness,misregistration,fit,accentColor,softness,linger,reverse,wander,clickBurst,intro]);
  return <div ref={wrapRef} className="halftone-reveal" role="img" aria-label="Interactive halftone portrait. Move your pointer over the image to reveal details."><canvas ref={canvasRef}/></div>;
}
