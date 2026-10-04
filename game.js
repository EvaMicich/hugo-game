/* Hugo designed the world. Everything here is drawn locally; no assets or network needed. */
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const W=1200,H=700,levels=[625,455,310];
const pool={x:638,y:332,w:512,h:106,minX:690,maxX:1090,minY:365,maxY:403,entryX:750};
let state,clock=0,last=0,muted=false,audio,view={scale:1,x:0,y:0};
const colors=['#ef786e','#f4bc55','#83ba87','#6abbd1','#b39bd1'];
function reset(){state={scene:'world',x:580,y:625,level:0,facing:1,queue:[],action:null,pats:0,activities:[false,false,false,false,false],stickers:[],stickerMode:false,selectedSticker:0,stickerOpened:0,dogHappyUntil:0,dogSplashUntil:0,swimming:false,swimFacing:1,swimEffects:[],swimEmission:0,particles:[],arrows:[],won:false,celebrating:false};document.querySelector('#back').hidden=true;}
reset();
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;view.scale=Math.min(innerWidth/W,innerHeight/H);view.x=(innerWidth-W*view.scale)/2;view.y=(innerHeight-H*view.scale)/2;ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function sound(notes=[500],duration=.12){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();notes.forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*duration;o.type='sine';o.frequency.setValueAtTime(hz,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.08,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration)})}catch{}}
document.querySelector('#sound').onclick=()=>{muted=!muted;document.querySelector('#sound').textContent=muted?'♫̸':'♪';document.querySelector('#sound').setAttribute('aria-label',muted?'Enable sound':'Mute sound')};
document.querySelector('#back').onclick=()=>{if(state.won||state.action)return;state.scene='world';state.stickerMode=false;state.queue=[];state.x=640;state.y=310;state.level=2;document.querySelector('#back').hidden=true;checkWin()};
function burst(x,y,type='spark',count=12){for(let i=0;i<count;i++)state.particles.push({x,y,vx:(Math.random()-.5)*150,vy:-60-Math.random()*100,life:1.3,type,color:colors[i%5]})}
function walk(x,y){state.queue.push({type:'walk',x,y})}
function inPool(x,y){return x>pool.x&&x<pool.x+pool.w&&y>325&&y<pool.y+pool.h+6;}
function swimTo(x,y){const target={type:'swim',x:Math.max(pool.minX,Math.min(pool.maxX,x)),y:Math.max(pool.minY,Math.min(pool.maxY,y)),time:0};state.queue=[];state.action=target;}
function waterEffect(type,x,y,extra={}){if(state.swimEffects.length<120)state.swimEffects.push({type,x,y,age:0,life:type==='ripple'?1.3:type==='bubble'?.75:.85,...extra});}
function bigSplash(x,y){
 for(let i=0;i<28;i++){const spread=(i-13.5)/13.5;waterEffect('drop',x+spread*14,y,{vx:spread*(100+Math.random()*65),vy:-130-Math.random()*140,life:1.1,size:3+Math.random()*4})}
 for(let i=0;i<3;i++)waterEffect('ripple',x,y,{delay:i*.13,life:1.7,big:true});
 waterEffect('crown',x,y,{life:.55});waterEffect('sploosh',x,y-67,{life:.85});
 if(state.scene==='world'&&Math.abs(x-922)<280){state.dogSplashUntil=clock+1.3;state.dogHappyUntil=clock+1.3}
 splashSound();
}
function splashSound(){
 sound([150,90,260,420],.085);if(muted||!audio)return;
 try{const length=Math.floor(audio.sampleRate*.4),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/length,2);const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();filter.type='lowpass';filter.frequency.setValueAtTime(1400,audio.currentTime);filter.frequency.exponentialRampToValueAtTime(180,audio.currentTime+.4);gain.gain.value=.14;source.buffer=buffer;source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start()}catch{}
}
function route(level,x){if(state.swimming){walk(state.x,310);state.queue.push({type:'exit'});}let l=state.level;while(l!==level){let up=l<level,ladder=(up?l:l-1)===0?350:430;walk(ladder,levels[l]);l+=up?1:-1;state.queue.push({type:'climb',x:ladder,y:levels[l],level:l})}walk(x,levels[level]);}
function act(type,duration=1.2,extra={}){state.queue.push({type,duration,...extra})}
function tap(x,y){if(state.won){if(x>480&&x<720&&y>480&&y<590){reset();sound([400,600])}return}
 if(state.scene==='world'&&state.swimming&&(!state.action||state.action.type==='swim')){if(inPool(x,y)){swimTo(x,y);waterEffect('ripple',state.action.x,state.action.y,{life:.6});return}state.action=null;state.queue=[];}
 if(state.action||state.queue.length)return;burst(x,y,'tap',5);
 if(state.scene==='house'){
  if(state.stickerMode){
   if(x>=974&&x<=1084&&y>=601&&y<=700){state.stickerMode=false;sound([660,440],.07);checkWin();return}
   if(y>=601&&y<=700&&x>=116&&x<956){state.selectedSticker=Math.min(5,Math.floor((x-116)/140));sound([620+state.selectedSticker*60],.07);return}
   if(x>=90&&x<=1110&&y>=145&&y<601&&state.stickers.length<32){state.stickers.push({x,y,kind:state.selectedSticker,born:clock,rotation:(Math.random()-.5)*.24});sound([680,940],.065);burst(x,y,'spark',4);if(state.stickers.length>=3)state.activities[3]=true;}return;
  }
  const items=[{x:220,y:470,id:0},{x:940,y:330,id:1},{x:470,y:530,id:2},{x:570,y:250,id:3},{x:790,y:520,id:4}];
  const obj=items.map(o=>({...o,d:Math.hypot((x-o.x)/1.3,y-o.y)})).sort((a,b)=>a.d-b.d)[0];if(obj.d<125){walk(obj.x,obj.id===1?400:570);act('activity',obj.id===3?.7:2.6,{id:obj.id})}else walk(Math.max(130,Math.min(1070,x)),570);return;
 }
 if(x>830&&x<1055&&y>190&&y<340){route(2,900);act('pat',1.2);return}
 if(x>515&&x<765&&y>110&&y<320){route(2,625);act('house',.45);return}
 if(inPool(x,y)){route(2,720);act('pool',1.7,{x:Math.max(pool.minX,Math.min(pool.maxX,x)),y:Math.max(pool.minY,Math.min(pool.maxY,y))});return}
 if(x>62&&x<290&&y>325&&y<485){route(1,315);act('shoot',2.5);return}
 if(Math.abs(x-350)<58&&y>450&&y<640){route(state.level===0?1:0,350);return}
 if(Math.abs(x-430)<58&&y>260&&y<450){route(state.level===2?1:2,430);return}
 const level=y<345?2:y<505?1:0;route(level,Math.max(level===2?115:level===1?80:35,Math.min(level===1?530:1140,x)));
}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();sound([],0);tap((e.clientX-view.x)/view.scale,(e.clientY-view.y)/view.scale)});
function checkWin(){if(!state.stickerMode&&state.pats>=4&&state.activities.every(Boolean)){state.celebrating=true;state.queue=[];state.won=true;document.querySelector('#back').hidden=true;burst(600,260,'confetti',100);sound([523,659,784,1047],.17)}}
function update(dt){clock+=dt;for(const p of state.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt}state.particles=state.particles.filter(p=>p.life>0);
 for(const e of state.swimEffects){e.age+=dt;if(e.type==='drop'){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=510*dt}if(e.type==='bubble')e.y-=20*dt;}state.swimEffects=state.swimEffects.filter(e=>e.age<e.life+(e.delay||0));
 if(state.swimming){const target=state.action?.type==='swim'?Math.sign(state.action.x-state.x)||state.facing:state.facing;state.swimFacing+=(target-state.swimFacing)*Math.min(1,dt*9);}
 if(!state.action&&state.queue.length){state.action={...state.queue.shift(),time:0,startX:state.x,startY:state.y};}
 const a=state.action;if(!a)return;a.time+=dt;
 if(a.type==='swim'){
  const dx=a.x-state.x,dy=a.y-state.y,d=Math.hypot(dx,dy),step=190*dt;if(Math.abs(dx)>1)state.facing=Math.sign(dx);
  if(d<=step){state.x=a.x;state.y=a.y;state.action=null;waterEffect('ripple',state.x,state.y,{life:.8});return}
  state.x+=dx/d*step;state.y+=dy/d*step;state.swimEmission+=dt;
  if(state.swimEmission>=.11){state.swimEmission%=.11;const behind=state.x-state.facing*22;waterEffect('wake',behind,state.y+2,{life:.7,dir:state.facing});waterEffect('bubble',behind+(Math.random()-.5)*9,state.y+6,{size:2+Math.random()*2});waterEffect('drop',state.x+Math.sin(clock*9)*24,state.y+2,{vx:(Math.random()-.5)*45,vy:-35-Math.random()*25,size:2,life:.35});if(Math.sin(clock*9)>.5)waterEffect('ripple',state.x,state.y,{life:.65});}return;
 }
 if(a.type==='pool'){
  if(a.time<.35){state.y=a.startY+Math.sin(a.time/.35*Math.PI)*10;}
  else if(a.time<.95){const p=(a.time-.35)/.6;state.x=a.startX+(pool.entryX-a.startX)*p;state.y=a.startY+(370-a.startY)*p-Math.sin(p*Math.PI)*78;}
  else if(!a.impact){a.impact=true;state.swimming=true;state.x=pool.entryX;state.y=370;state.swimFacing=state.facing;bigSplash(state.x,state.y);}
 }
 if(a.type==='activity'){
  state.facing=a.id===1?-1:1;
  const beat=Math.floor(a.time/.55);if(beat!==(a.beat??-1)){a.beat=beat;if(a.id===1&&beat<3)sound([330+beat*90],.09);if(a.id===2&&beat<4)sound([520,660+beat*45],.07);if(a.id===4&&beat>0&&beat<4)sound([420+beat*80],.08);if(a.id===0&&beat===1)sound([390,520],.1);}
 }
 if(a.type==='pat'&&!a.affection){a.affection=true;burst(928,237,'heart',4);sound([480,650],.09);}
 if(a.type==='walk'||a.type==='climb'){const dx=a.x-state.x,dy=a.y-state.y,d=Math.hypot(dx,dy),step=(a.type==='climb'?130:240)*dt;state.facing=dx===0?state.facing:Math.sign(dx);if(d<=step){state.x=a.x;state.y=a.y;if(a.type==='climb'){state.level=a.level;sound([440],.06)}state.action=null}else{state.x+=dx/d*step;state.y+=dy/d*step}return}
 if(a.type==='shoot'){if(a.time<.7)state.arrows=[{x:315+(170-315)*a.time/.7,y:400,dir:-1}];else if(a.time<.95){state.arrows=[];if(!a.hit){a.hit=true;burst(170,400);sound([850,450])}}else if(a.time<1.55){state.arrows=[{x:170+(315-170)*(a.time-.95)/.6,y:400,dir:1}]}else{state.arrows=[];state.x=315+Math.min(1,(a.time-1.55)/.35)*65;if(!a.bonk){a.bonk=true;burst(315,410,'spark');sound([250,150,350])}}}
 if(a.time<(a.duration||1))return;
 if(a.type==='pat'){state.pats=Math.min(4,state.pats+1);state.dogHappyUntil=clock+1.4;burst(920,225,'heart',5);sound([550,740,880]);checkWin()}
 if(a.type==='house'){state.scene='house';state.x=140;state.y=570;document.querySelector('#back').hidden=false}
 if(a.type==='pool'){state.action=null;swimTo(a.x,a.y);return}
 if(a.type==='exit'){state.swimming=false;state.y=310;burst(state.x,320,'water')}
 if(a.type==='activity'){if(a.id===3){state.stickerMode=true;state.stickerOpened=clock;sound([520,700,880],.08)}else{state.activities[a.id]=true;burst(state.x,state.y-70,'spark',7);sound([440,660,800]);checkWin()}}
 state.action=null;
}
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function rect(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function line(points,c,width=4){ctx.strokeStyle=c;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}
function poly(points,c){ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function text(str,x,y,size=24,c='#375b58'){ctx.fillStyle=c;ctx.font=`700 ${size}px Trebuchet MS, sans-serif`;ctx.textAlign='center';ctx.fillText(str,x,y)}
function star(x,y,size,c){const p=[];for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,r=i%2?size*.45:size;p.push([x+Math.cos(a)*r,y+Math.sin(a)*r])}poly(p,c)}
function heart(x,y,s,c='#ef786e'){ellipse(x-s*.3,y,s*.4,s*.4,c);ellipse(x+s*.3,y,s*.4,s*.4,c);poly([[x-s*.68,y],[x+s*.68,y],[x,y+s*.9]],c)}
function paw(x,y,s,c){ellipse(x,y+s*.15,s*.45,s*.35,c);for(let i=0;i<4;i++)ellipse(x+(i-1.5)*s*.29,y-s*.35+Math.abs(i-1.5)*s*.1,s*.14,s*.19,c)}
function cloud(x,y,s){ellipse(x,y,60*s,16*s,'#fffdf0');ellipse(x-24*s,y-10*s,25*s,23*s,'#fffdf0');ellipse(x+15*s,y-16*s,32*s,29*s,'#fffdf0')}
function platform(x,y,w,depth){rect(x,y,w,depth,22,'#d7b885');rect(x,y,w,22,10,'#70ae75');line([[x+14,y+6],[x+w-14,y+6]],'#9acd81',5);for(let i=0;i<w/47;i++){let gx=x+20+i*47;line([[gx,y+5],[gx-4,y-6],[gx+3,y-2],[gx+7,y-9]],'#70ae75',2)}for(let i=0;i<w/70;i++)ellipse(x+30+i*70,y+42,3,2,'#bd9b6c')}
function ladder(x,y1,y2){line([[x-23,y1+5],[x-23,y2]],'#9b6b45',11);line([[x+23,y1+5],[x+23,y2]],'#9b6b45',11);for(let y=y1+18;y<y2;y+=26){line([[x-23,y],[x+23,y]],'#edcc88',9);line([[x-20,y-2],[x+20,y-2]],'#fff0c0',2)}}
function dog(x,y){
 const pat=state.action?.type==='pat',near=state.scene==='world'&&state.level===2&&Math.abs(state.x-x)<165&&!state.swimming;
 const happy=pat||clock<state.dogHappyUntil,speed=happy?19:near?11:5,wag=Math.sin(clock*speed),hop=happy?Math.max(0,Math.sin(clock*11))*7:0;
 ellipse(x,y+2,43-hop*.5,7,'#456b5325');ctx.save();ctx.translate(x,y-hop);ctx.scale(1+(happy?Math.sin(clock*11)*.035:0),1-(happy?Math.sin(clock*11)*.04:0));
 line([[24,-27],[39+wag*9,-38],[48+wag*11,-48+wag*5]],'#ad754c',10);
 rect(-22,-23,11,22,5,'#ac714b');rect(18,-23,11,22,5,'#ac714b');ellipse(2,-28,33,20,'#c89060');ellipse(-13,-22,14,15,'#edd0a3');rect(-27,-19,12,20,5,'#c89060');rect(9,-18,12,19,5,'#c89060');
 const tilt=clock<state.dogSplashUntil?-.18:near?Math.sin(clock*2)*.07:0;ctx.save();ctx.translate(-25,-48);ctx.rotate(tilt);ellipse(0,0,25,24,'#d6a372');ellipse(-19,4+wag*(happy?3:1),10,21,'#935c3e');ellipse(19,3-wag*(happy?3:1),8,18,'#a56c46');ellipse(2,11,17,12,'#f6e2ba');
 if(happy){line([[-9,-3],[-5,-5],[-1,-3]],'#403d37',2.4);line([[8,-3],[12,-5],[16,-3]],'#403d37',2.4)}else{ellipse(-5,-4,3,4,'#403d37');ellipse(12,-4,3,4,'#403d37');ellipse(-6,-5,1,1,'#fff8e9');ellipse(11,-5,1,1,'#fff8e9')}
 ellipse(5,7,6,4,'#403d37');line([[5,11],[5,15],[10,17],[14,14]],'#765543',2);if(happy||near)rect(8,15,7,10,4,'#ee8b89');ctx.restore();line([[-35,-27],[-8,-24]],'#76b9b0',5);ellipse(-19,-22,4,5,'#f2c76a');ctx.restore();
 if(pat)heart(x+8,y-87+Math.sin(clock*4)*3,11);
}
function activityPose(){
 const a=state.action;if(a?.type!=='activity')return null;
 const t=a.time,p=Math.min(1,t/.5),ease=p*p*(3-2*p);let x=state.x,y=state.y,rotation=0,seated=false,kneel=false;
 if(a.id===0){y+=(523-y)*ease+Math.sin(t*9)*3*(1-p);seated=p>.45;}
 if(a.id===1){if(t<.5){y-=62*ease+Math.sin(p*Math.PI)*30;x-=12*ease;}else if(t<1.7){const b=(t-.5)/1.2;y=338-Math.abs(Math.sin(b*Math.PI*2))*35;x-=12;}else{const f=Math.min(1,(t-1.7)/.4);x-=12+f*20;y=338+f*9;rotation=-f*Math.PI/2;}seated=true;}
 if(a.id===2){y+=12*ease;kneel=true;}
 if(a.id===4){x-=58*ease;y+=10*ease;seated=true;}
 return {x,y,rotation,seated,kneel,id:a.id,t};
}
function person(){
 const a=state.action,jumping=a?.type==='pool'&&a.time>=.35&&a.time<.95,pose=jumping?{x:state.x,y:state.y,seated:true,rotation:-.15*Math.sin((a.time-.35)/.6*Math.PI)}:activityPose(),paddling=state.swimming&&a?.type==='swim',walking=!state.swimming&&a?.type==='walk',climbing=a?.type==='climb',pat=a?.type==='pat',playing=pose?.id===2||pose?.id===4;
 let x=pose?.x??state.x,y=pose?.y??state.y;const stride=Math.sin(clock*13),breathe=Math.sin(clock*3),bob=walking?-Math.abs(stride)*3:climbing?Math.sin(clock*12)*2:pose?0:breathe*1.2;
 if(state.swimming&&a?.type==='pool'&&a.time<1.18)return;
 if(!state.swimming)ellipse(state.x,state.y+1,20,5,'#375b5828');ctx.save();
 if(state.swimming){ctx.beginPath();ctx.rect(pool.x,0,pool.w,y+9);ctx.clip();const depth=a?.type==='pool'?45*(1-Math.min(1,(a.time-1.18)/.42)):0;y+=52+depth+Math.sin(clock*(paddling?9:3))*2;}
 ctx.translate(x,y+bob);const turn=state.swimming?(state.swimFacing>=0?1:-1)*(.82+.18*Math.abs(state.swimFacing)):pat?1:state.facing;ctx.scale(turn,1);if(a?.type==='pool'&&a.time<.35)ctx.scale(1.08,.87);ctx.rotate(pose?.rotation??(paddling?Math.sin(clock*9)*.045:walking?stride*.035:pat?-.05:0));
 if(!state.swimming){
  if(pose?.seated){const swing=Math.sin(clock*4)*4;line([[-9,-25],[-4,-12],[13,-9+swing]],'#455c74',9);line([[8,-25],[16,-16],[28,-12-swing]],'#526b83',9);rect(9,-13+swing,18,8,4,'#765643');rect(24,-16-swing,18,8,4,'#765643');}
  else if(pose?.kneel){line([[-8,-25],[-18,-9],[-3,-5]],'#455c74',10);line([[8,-25],[20,-8],[9,-3]],'#526b83',10);rect(-8,-8,18,8,4,'#765643');}
  else{for(const side of [-1,1]){const step=walking?stride*side*10:climbing?Math.sin(clock*12)*side*6:0;line([[side*8,-25],[side*9+step*.5,-14],[side*9+step,-5-Math.max(0,step)*.35]],side<0?'#455c74':'#526b83',9);rect(side*9+step-7,-8-Math.max(0,step)*.35,18,8,4,'#765643');line([[side*9+step-5,-2-Math.max(0,step)*.35],[side*9+step+9,-2-Math.max(0,step)*.35]],'#b2926e',2)}}
 }
 rect(-17,-55,34,33,12,'#edb452');rect(-16,-32,32,9,4,'#dfa044');line([[-7,-51],[0,-46],[7,-51]],'#f7d184',3);ellipse(0,-37,2,2,'#fff0be');
 for(const side of [-1,1]){let hx=side*24,hy=-29+(walking?stride*side*7:0);if(climbing){hx=side*24;hy=-61+Math.sin(clock*12)*side*8;}if(pat&&side===1){hx=34;hy=-50+Math.sin(clock*12)*5;}if(playing&&side===1){hx=35;hy=-32+Math.sin(clock*9)*10;}if(state.swimming){hx=side*(26+Math.cos(clock*(paddling?9:3)+side)*10);hy=-52+Math.sin(clock*(paddling?9:3)+side)*6;}if(jumping){hx=side*20;hy=-35;}if(pose?.id===1){hx=side*30;hy=-48;}if(pose?.id===4&&pose.t>2){hx=side*29;hy=-65;}line([[side*13,-47],[side*20,(hy-47)/2],[hx,hy]],'#edb452',9);ellipse(hx,hy,5,5,'#f2c6a3');}
 ellipse(0,-67,23,24,'#f2c6a3');ellipse(-21,-66,5,7,'#edb896');ellipse(21,-66,5,7,'#edb896');ellipse(-2,-85,23,13,'#72503c');ellipse(-19,-77,7,13,'#72503c');ellipse(-6,-87,15,10,'#805b43');poly([[-9,-88],[7,-90],[16,-77],[6,-79]],'#72503c');
 const blink=clock%4.7<.13,pleased=pat||pose?.seated||playing||state.swimming;for(const ex of [-7,9]){if(blink||pleased)line([[ex-3,-69],[ex,-71],[ex+3,-69]],'#403d37',2.2);else{ellipse(ex,-70,2.7,3.5,'#403d37');ellipse(ex-.7,-71,1,1,'#fff8e9')}}ellipse(-13,-62,4,2.5,'#eaa28e');ellipse(15,-62,4,2.5,'#eaa28e');line([[-3,-59],[2,-56],[8,-59]],'#ae6c54',2.3);
 if(a?.type==='shoot'&&a.time<.95){line([[22,-48],[35,-56],[38,-44],[35,-29],[22,-36]],'#8e6443',3);line([[22,-48],[22,-36]],'#e5dab8',2)}ctx.restore();
 if(state.swimming)for(let i=0;i<3;i++)line([[x-30+i*22,state.y+5],[x-20+i*22,state.y+8+Math.sin(clock*5)*2],[x-10+i*22,state.y+5]],'#e1fbf4',3);
}
function poolEffects(surface){
 ctx.save();if(surface){ctx.beginPath();ctx.roundRect(pool.x+26,pool.y+18,pool.w-52,pool.h-32,25);ctx.clip();}
 for(const e of state.swimEffects){const age=e.age-(e.delay||0);if(age<0)continue;const p=age/e.life;ctx.globalAlpha=Math.max(0,1-p);
  if(surface&&e.type==='ripple'){ctx.strokeStyle='#e3fcf5';ctx.lineWidth=e.big?3:1.8;ctx.beginPath();ctx.ellipse(e.x,e.y,8+age*(e.big?130:35),3+age*(e.big?23:9),0,0,Math.PI*2);ctx.stroke();}
  if(surface&&e.type==='wake'){line([[e.x+e.dir*9,e.y-3],[e.x-e.dir*(8+age*24),e.y-7-age*4]],'#e3fcf5',2);line([[e.x+e.dir*9,e.y+3],[e.x-e.dir*(8+age*24),e.y+7+age*4]],'#e3fcf5',2);}
  if(surface&&e.type==='bubble'){ctx.strokeStyle='#e3fcf5';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(e.x,e.y,e.size,0,Math.PI*2);ctx.stroke();}
  if(!surface&&e.type==='drop')ellipse(e.x,e.y,e.size,e.size*1.6,'#dcfaf4');
  if(!surface&&e.type==='crown'){const h=Math.sin(p*Math.PI)*64;for(const side of [-1,1]){poly([[e.x,e.y+5],[e.x+side*20,e.y-h],[e.x+side*38,e.y-h*.62],[e.x+side*61,e.y-h*.85],[e.x+side*80,e.y],[e.x+side*28,e.y+10]],'#b9eef0');line([[e.x+side*15,e.y-3],[e.x+side*22,e.y-h+8],[e.x+side*35,e.y-h*.6]],'#effffc',4)}}
  if(!surface&&e.type==='sploosh'){ctx.save();ctx.translate(e.x,e.y-age*19);ctx.rotate(-.08);text('SPLOOSH!',0,0,24+Math.sin(Math.min(1,p*3)*Math.PI)*5,'#fff9e9');ctx.restore();}
 }ctx.restore();
}
function world(){rect(0,0,W,H,0,'#a6dfee');ellipse(1030,95,44,44,'#ffdb83');ellipse(1030,95,55,55,'#ffdb8333');cloud(180+Math.sin(clock*.08)*20,100,.95);cloud(435+Math.sin(clock*.1)*15,64,.55);cloud(850+Math.sin(clock*.09)*18,100,.7);poly([[0,500],[120,390],[330,530],[600,380],[870,530],[1200,370],[1200,700],[0,700]],'#98c8a0');poly([[0,570],[250,465],[500,590],[770,470],[1100,570],[1200,530],[1200,700],[0,700]],'#87ba88');platform(0,625,1200,100);platform(60,455,505,75);platform(110,310,1040,66);
 // House and kennel sit on the upper lawn, as in Hugo’s plan.
 rect(532,180,210,130,8,'#fff0cf');poly([[510,185],[637,102],[764,185]],'#c77862');line([[515,181],[637,99],[759,181]],'#aa6657',7);rect(674,118,25,42,3,'#aa6657');rect(603,230,57,80,20,'#729da3');ellipse(647,271,4,4,'#f3d57d');for(const x of [555,682]){rect(x,213,37,39,6,'#aadce2');line([[x+18,214],[x+18,250]],'#fff8e6',4);line([[x+2,232],[x+35,232]],'#fff8e6',4)}if(state.pats===4){ellipse(630,260,50+Math.sin(clock*3)*5,58,'#ffe29a33');star(625,210+Math.sin(clock*3)*6,12,'#f5be59')}
 rect(1010,232,95,78,7,'#e6b87b');poly([[993,236],[1058,184],[1122,236]],'#b96f5a');rect(1037,263,43,48,21,'#846448');paw(1058,245,12,'#fff0cc');dog(922,310);
 // A long pool in front of the upper terrace.
 rect(pool.x,pool.y,pool.w,pool.h,34,'#f8f0d7');rect(pool.x+16,pool.y+11,pool.w-32,pool.h-23,28,'#65bccc');rect(pool.x+26,pool.y+18,pool.w-52,pool.h-32,25,'#81d6df');for(let row=0;row<2;row++)for(let i=0;i<12;i++){let x=687+i*35,y=364+row*29;line([[x,y+Math.sin(clock*2+i+row)*3],[x+10,y+3+Math.sin(clock*2+i+row)*3],[x+20,y+Math.sin(clock*2+i+row)*3]],'#c5f0ea',3)}poolEffects(true);line([[707,320],[707,360]],'#fff9e7',5);line([[730,320],[730,360]],'#fff9e7',5);line([[707,341],[730,341]],'#fff9e7',4);
 ladder(350,455,625);ladder(430,310,455);line([[134,452],[155,409],[187,409],[209,452]],'#96734d',9);for(let i=0;i<5;i++)ellipse(170,384,66-i*12,66-i*12,['#83b8bc','#e88276','#efbd59','#f7e8b5','#7caca0'][i]);ellipse(170,384,6,6,'#536c66');
 for(let i=0;i<22;i++){let x=30+i*54;line([[x,625],[x+Math.sin(clock+i)*3,612]],'#548d60',2);if(i%3===0){ellipse(x,608,4,4,i%2?'#fff1c3':'#f4aea1');ellipse(x,608,1.5,1.5,'#e6b14e')}}
 text('HUGO’S LITTLE WORLD',245,40,22);text('a little place to play',245,65,14,'#528184');
 person();poolEffects(false);for(const arrow of state.arrows){line([[arrow.x-arrow.dir*25,arrow.y],[arrow.x,arrow.y]],'#72503c',4);poly([[arrow.x+arrow.dir*8,arrow.y],[arrow.x-arrow.dir*3,arrow.y-5],[arrow.x-arrow.dir*3,arrow.y+5]],'#e5e6d2')}
}
function chair(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);rect(-30,-90,60,61,11,'#8daaa1');rect(-35,-40,70,15,7,'#71968a');line([[-25,-27],[-29,0]],'#a27754',8);line([[25,-27],[29,0]],'#a27754',8);ctx.restore()}
function bed(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);rect(-100,-80,200,85,12,'#c8976a');rect(-94,-70,188,54,10,'#fff1d6');rect(-80,-66,48,36,12,'#fffdf0');rect(-25,-68,113,51,9,'#a1b8d3');for(let i=0;i<5;i++)star(-10+i*21,-44,5,'#e4eef3');ctx.restore()}
function toys(x,y,s=1){const playing=s===1&&state.action?.type==='activity'&&state.action.id===2,t=playing?state.action.time:0;ctx.save();ctx.translate(x,y);ctx.scale(s,s);const lift=playing?Math.max(0,Math.sin(t*7))*17:0;rect(-50,-30-lift,32,32,3,'#ef9a72');rect(-13,-43,33,44,3,'#90b9a1');rect(26,-20,33,22,3,'#e9bc62');star(-34,-14-lift,8,'#fff3d4');ellipse(6,-25,7,7,'#fff0d5');const bx=60+(playing?Math.sin(t*5)*24:0),by=-53-(playing?Math.abs(Math.sin(t*7))*27:0);ellipse(bx,by,19,19,'#7eabc0');line([[bx-16,by],[bx+16,by]],'#fff0ce',3);if(playing){star(-15,-65+Math.sin(t*6)*8,6,'#efbd59');star(33,-78,5,'#a1b8d3')}ctx.restore()}
function board(x,y,s=1){const playing=s===1&&state.action?.type==='activity'&&state.action.id===4,t=playing?state.action.time:0;ctx.save();ctx.translate(x,y);ctx.scale(s,s);ellipse(0,5,88,23,'#b88d66');rect(-78,-55,156,58,9,'#fff0cc');for(let i=0;i<12;i++)rect(-65+i%6*23,-46+Math.floor(i/6)*23,20,20,3,colors[i%5]);const move=playing?Math.min(3,Math.floor(t/.55)):0,hop=playing?Math.sin((t%.55)/.55*Math.PI)*7:0;ellipse(-32+move*23,-36-hop,7,7,'#527f80');ellipse(39-(move>1?23:0),-13,7,7,'#b96f5a');ctx.save();ctx.translate(69,-29);ctx.rotate(playing&&t<1.1?Math.sin(t*15)*.5:0);rect(-11,-11,22,22,4,'#fffdf0');ellipse(-4,-4,2,2,'#586d63');ellipse(4,5,2,2,'#586d63');ctx.restore();if(playing&&t>2)star(5,-78,12+Math.sin(t*8)*2,'#efbd59');ctx.restore()}
function stickerBox(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);rect(-42,-45,84,60,8,'#fff9e7');star(-19,-18,15,'#eaba59');heart(18,-21,15);ellipse(20,2,7,7,'#88b5b2');ctx.restore()}
function stickerPicture(kind,x,y,size=22){
 ctx.save();ctx.translate(x,y);ctx.scale(size/22,size/22);
 if(kind===0)star(0,0,22,'#eeba55');
 if(kind===1)heart(0,-5,23);
 if(kind===2)paw(0,0,25,'#8db9ad');
 if(kind===3){for(let i=0;i<4;i++){ctx.strokeStyle=['#ed8b73','#eeba55','#8db9ad','#9dabd2'][i];ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,12,24-i*5,Math.PI,2*Math.PI);ctx.stroke()}ellipse(-23,12,8,5,'#fff9ed');ellipse(23,12,8,5,'#fff9ed');}
 if(kind===4){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(Math.cos(a)*13,Math.sin(a)*13,10,10,'#e9a3b3')}ellipse(0,0,9,9,'#f4cc69');ellipse(-3,-1,1.5,2,'#675e48');ellipse(3,-1,1.5,2,'#675e48');}
 if(kind===5){ellipse(0,0,22,22,'#eeba55');ellipse(-7,-4,2.5,3.5,'#675e48');ellipse(7,-4,2.5,3.5,'#675e48');line([[-9,6],[-5,10],[0,12],[5,10],[9,6]],'#675e48',2.5);ellipse(-13,5,4,2,'#ef9a72');ellipse(13,5,4,2,'#ef9a72');}
 ctx.restore();
}
function stickerTray(){
 const age=Math.min(1,(clock-state.stickerOpened)/.3),offset=(1-age)*(1-age)*105;ctx.save();ctx.translate(0,offset);
 rect(100,610,1000,86,28,'#bb967330');rect(100,601,1000,86,28,'#fff9e9');
 for(let i=0;i<6;i++){const x=186+i*140,selected=i===state.selectedSticker;rect(x-59,608,118,71,21,selected?'#bdd6bf':'#eee4cf');if(selected){line([[x-51,617],[x-51,670]],'#7caa88',3);star(x+43,620,6,'#fff9ed')}stickerPicture(i,x,645,29+(selected?Math.sin(clock*3)*1.5:0));}
 rect(979,608,98,71,22,'#81b3a0');line([[1009,645],[1023,657],[1049,631]],'#fff9e9',7);ctx.restore();
}
function house(){rect(0,0,W,H,0,'#e9d4b5');rect(90,105,1020,500,22,'#fff0d9');rect(90,455,1020,160,0,'#dfba8e');for(let y=475;y<610;y+=45)line([[94,y],[1106,y]],'#cda67d',2);for(let i=0;i<12;i++)for(let j=0;j<4;j++)ellipse(130+i*85,140+j*80,3,3,'#e1c5a4');rect(140,145,175,145,12,'#a3cdd2');cloud(226,224,.6);line([[227,147],[227,287]],'#fff9ed',9);line([[145,218],[310,218]],'#fff9ed',9);rect(134,138,187,15,5,'#bf9a73');poly([[140,153],[169,153],[157,292],[135,292]],'#e6a19a');poly([[289,153],[317,153],[322,292],[303,292]],'#e6a19a');ellipse(550,574,245,57,'#91b8af');ellipse(550,574,214,45,'#a6c9bc');chair(220,535);bed(940,390);toys(470,550);board(790,560);stickerBox(570,250);line([[565,160],[565,191]],'#b88d66',3);star(565,155,19,'#e8bc61');rect(843,155,112,82,6,'#ba906b');rect(851,163,96,66,3,'#a9d7ce');poly([[856,223],[885,184],[910,216],[930,196],[945,223]],'#77a68a');ellipse(928,178,10,10,'#f8d783');
 person();
 for(const st of state.stickers){const age=Math.min(1,(clock-st.born)/.24),pop=age<1?.35+.65*age+Math.sin(age*Math.PI)*.25:1;ctx.save();ctx.translate(st.x,st.y);ctx.rotate(st.rotation);stickerPicture(st.kind,0,0,22*pop);ctx.restore()}
 if(state.action?.type==='activity'&&state.action.id===1&&state.action.time>1.7)heart(1010,280+Math.sin(clock*4)*4,13,'#e9a3b3');
 if(state.stickerMode){stickerTray();const t=clock-state.stickerOpened;if(state.stickers.length===0&&t<4){const hx=660+Math.sin(t*2)*25,hy=340+Math.sin(t*3)*12;ellipse(hx,hy,30,30,'#fff9e980');stickerPicture(state.selectedSticker,hx,hy,18);line([[hx+21,hy+33],[hx+21,hy+9]],'#fff9ed',8);ellipse(hx+21,hy+33,11,12,'#fff9ed');}}
}
function hud(){rect(447,14,306,60,30,'#fff9e9ed');for(let i=0;i<4;i++)paw(498+i*68,44,25,i<state.pats?'#bd8058':'#dcd6c3');if(state.scene==='house'){rect(365,80,470,65,28,'#fff9e9f0');for(let i=0;i<5;i++){let x=413+i*92;ellipse(x,112,26,26,state.activities[i]?'#bdd4a9':'#e8e2d0');if(i===0)chair(x,128,.36);if(i===1)bed(x,123,.22);if(i===2)toys(x,123,.37);if(i===3)star(x,111,16,'#e9b951');if(i===4)board(x,121,.28);if(state.activities[i]){ellipse(x+20,94,10,10,'#658d68');text('✓',x+20,99,14,'#fff')}}}}
function render(){ctx.save();ctx.clearRect(0,0,innerWidth,innerHeight);ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale);state.scene==='world'?world():house();hud();for(const p of state.particles){ctx.globalAlpha=Math.max(0,p.life);if(p.type==='heart')heart(p.x,p.y,10,p.color);else if(p.type==='water')ellipse(p.x,p.y,3,6,'#cdf9fa');else if(p.type==='tap'){ctx.strokeStyle='#fff9e9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,5+(1.3-p.life)*12,0,7);ctx.stroke()}else star(p.x,p.y,p.type==='confetti'?6:5,p.color)}ctx.globalAlpha=1;if(state.won){rect(0,0,W,H,0,'#375b5855');rect(380,155,440,440,42,'#fff5dc');star(600,251,62,'#f0be58');heart(600,244,24,'#ed8b73');text('YOU DID IT!',600,370,44);text('Hugo’s happy little world',600,412,21);for(let i=0;i<4;i++)paw(522+i*52,451,17,'#bd8058');rect(480,495,240,76,30,'#81b3a0');text('↻',600,550,56,'#fff9e9')}ctx.restore()}
function frame(t){const dt=Math.min((t-last)/1000,.04);last=t;update(dt);render();requestAnimationFrame(frame)}requestAnimationFrame(frame);


