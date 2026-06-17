"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth }       from "@/contexts/AuthContext";
import { useAudio }      from "@/contexts/AudioContext";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { useProgress }   from "@/contexts/ProgressContext";
import LoadingScreen     from "@/components/ui/LoadingScreen";

const TINA_BUBBLES = ["खेलने चलें? 🌟","मैं हूँ यहाँ!","चलो सीखें!","आज मज़ा आएगा! 🎉"];
const TOTO_BUBBLES = ["नए अक्षर! 📚","मिलकर सीखें!","शाबाश! 🌈","मैं भी हूँ!"];

function Fly({ x,y,s,d,dl }: { x:number;y:number;s:number;d:number;dl:number }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ left:`${x}%`,top:`${y}%`,width:s,height:s,background:"#FFC84A",boxShadow:`0 0 ${s*5}px rgba(255,200,74,0.7)` }}
      animate={{ y:[0,-20,0],x:[0,8,-5,0],opacity:[0.2,1,0.2],scale:[1,1.4,1] }}
      transition={{ duration:d,repeat:Infinity,delay:dl,ease:"easeInOut" }}/>
  );
}

export default function MenuPage() {
  const { profile }                  = useAuth();
  const { unlockAudio, isMockMode }  = useAudio();
  const { progress }                 = useProgress();
  const router                       = useRouter();
  const { isChecking }               = useRouteGuard({ mode:"require-auth" });
  const [tapping, setTapping]        = useState(false);
  const [tinaIdx, setTinaIdx]        = useState(0);
  const [totoIdx, setTotoIdx]        = useState(0);
  const [bgSrc, setBgSrc]            = useState("/scenes/menu-portrait.jpeg");

  useEffect(() => {
    const update = () => setBgSrc(window.innerWidth < 640 ? "/scenes/menu-portrait.jpeg" : "/scenes/menu.jpeg");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // खेलो always goes to intro video
  const handlePlay = useCallback(() => {
    unlockAudio();
    setTapping(true);
    setTimeout(() => router.push("/intro"), 200);
  }, [router, unlockAudio]);

  useEffect(() => {
    const t = setInterval(() => setTinaIdx(i => (i+1) % TINA_BUBBLES.length), 3600);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setTotoIdx(i => (i+1) % TOTO_BUBBLES.length), 4200);
    return () => clearInterval(t);
  }, []);

  if (isChecking) return <LoadingScreen />;

  const completedSL = progress?.sublevels.filter(s => s.status === "completed").length ?? 0;

  const STARS = [[5,3],[22,7],[42,4],[62,2],[78,8],[92,5],[15,16],[52,13],[82,10],[32,20],[68,17],[48,1]];
  const FLIES = [
    {x:9,y:22,s:4,d:4.2,dl:0},{x:84,y:16,s:5,d:5,dl:1.1},{x:16,y:64,s:3,d:5.8,dl:2},
    {x:78,y:70,s:4,d:4.5,dl:0.6},{x:48,y:10,s:3,d:5.2,dl:1.7},{x:90,y:48,s:5,d:4.1,dl:2.9},
    {x:28,y:82,s:4,d:5.6,dl:0.8},{x:66,y:34,s:3,d:4.3,dl:2.3},{x:56,y:54,s:4,d:4.8,dl:1.4},
    {x:36,y:28,s:3,d:5.5,dl:3.1},{x:72,y:88,s:3,d:4.8,dl:0.4},{x:18,y:45,s:4,d:5,dl:1.9},
  ];

  return (
    <div className="relative h-dvh overflow-hidden select-none"
      style={{ backgroundImage:`url('${bgSrc}')`, backgroundSize:"cover", backgroundPosition:"center" }}>

      {/* Stars */}
      {STARS.map(([x,y],i) => (
        <motion.div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${x}%`,top:`${y}%`,width:1.5+(i%2),height:1.5+(i%2) }}
          animate={{ opacity:[0.1,0.85,0.1] }}
          transition={{ duration:2+i*0.5,repeat:Infinity,delay:i*0.38 }}/>
      ))}
      {FLIES.map((f,i) => <Fly key={i} {...f}/>)}

      {/* Moon */}
      <motion.div className="absolute rounded-full pointer-events-none"
        style={{ right:"9%",top:"4%",width:64,height:64,
          background:"radial-gradient(circle at 35% 35%,#FFFDE7,#FFD54F)",
          boxShadow:"0 0 40px 14px rgba(255,213,79,0.22),0 0 80px 28px rgba(255,213,79,0.09)" }}
        animate={{ y:[0,-6,0],opacity:[0.78,1,0.78] }}
        transition={{ duration:4.5,repeat:Infinity,ease:"easeInOut" }}/>

      {/* Tree silhouettes */}
      <svg className="absolute bottom-0 w-full pointer-events-none" viewBox="0 0 430 190"
        preserveAspectRatio="none" style={{height:190}}>
        <path d="M-5 190 L28 92 L61 190Z M45 190 L83 78 L121 190Z M248 190 L286 76 L324 190Z M318 190 L352 88 L386 190Z M398 190 L422 102 L446 190Z"
          fill="#071510" opacity="0.95"/>
        <path d="M0 172 Q107 155 215 165 Q323 175 430 158 L430 190 L0 190Z" fill="#050F0A"/>
        <path d="M0 182 Q107 172 215 179 Q323 186 430 172 L430 190 L0 190Z" fill="#040C08"/>
        {/* Fireflies in trees */}
        {[{cx:45,cy:168},{cx:155,cy:174},{cx:285,cy:170},{cx:380,cy:166}].map((p,i)=>(
          <motion.circle key={i} cx={p.cx} cy={p.cy} r="2.5" fill="#FFC84A"
            animate={{ opacity:[0,1,0],cy:[p.cy,p.cy-18,p.cy] }}
            transition={{ duration:2.8,repeat:Infinity,delay:i*0.9 }}/>
        ))}
      </svg>

      {/* ── CONTENT ──────────────────────────────────────────── */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Top bar — Settings top-right */}
        <div className="flex items-center justify-between px-5 pt-5">
          {/* Progress badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background:"rgba(0,200,150,0.1)",border:"1px solid rgba(0,200,150,0.18)", opacity: completedSL>0?1:0 }}>
            <span style={{fontSize:13}}>⭐</span>
            <span className="font-display font-bold text-sm" style={{color:"var(--success)"}}>{completedSL}/6</span>
          </div>

          {/* Settings — top right */}
          <button type="button" onClick={() => router.push("/settings")}
            className="w-10 h-10 rounded-full flex items-center justify-center min-h-0 transition-all"
            style={{ background:"rgba(255,248,237,0.07)",border:"1px solid rgba(255,248,237,0.12)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,248,237,0.7)" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>

        {/* Title */}
        <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{duration:0.7,ease:[0.16,1,0.3,1]}}
          className="flex flex-col items-center pt-2 pb-0 px-4">
          <h1 className="font-display font-extrabold text-center"
            style={{ fontSize:"clamp(2.4rem,10vw,3rem)",lineHeight:1,
              background:"linear-gradient(135deg,#FFE082,#FFC107,#FF8F00)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              filter:"drop-shadow(0 0 28px rgba(255,193,7,0.35))" }}>
            अक्षरवन
          </h1>
        </motion.div>

        {/* Characters + Play — flex-1 area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">

          {/* Characters at bottom corners */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between pointer-events-none">
            {/* Tina */}
            <motion.div initial={{opacity:0,x:-40}} animate={{opacity:1,x:0}} transition={{duration:0.8,delay:0.2,ease:[0.16,1,0.3,1]}}
              className="flex flex-col items-center gap-1 pb-2 pl-3 pointer-events-auto">
              <AnimatePresence mode="wait">
                <motion.div key={tinaIdx} initial={{opacity:0,y:5,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-4}} transition={{duration:0.22}}>
                  <div className="relative px-3 py-1.5 rounded-2xl rounded-bl-sm font-body font-semibold text-ink text-center max-w-[108px]"
                    style={{ background:"white",boxShadow:"0 0 0 2px var(--tina),0 4px 12px rgba(0,0,0,0.18)",fontSize:"11px" }}>
                    {TINA_BUBBLES[tinaIdx]}
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
                      style={{borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:"8px solid white"}}/>
                  </div>
                </motion.div>
              </AnimatePresence>
              <motion.img src="/characters/Tina_Puppet.png" alt="टीना"
                className="object-contain object-bottom"
                style={{ width:90,height:128,filter:"drop-shadow(0 0 14px var(--tina)) drop-shadow(0 6px 16px rgba(0,0,0,0.5))" }}
                animate={{ y:[0,-9,-3,-11,0],rotate:[0,-1.5,1,-1.5,0] }}
                transition={{ duration:5,repeat:Infinity,ease:"easeInOut" }} draggable={false}/>
              <div className="px-2 py-0.5 rounded-full font-display font-bold text-white" style={{background:"var(--tina)",fontSize:"10px"}}>टीना</div>
            </motion.div>

            {/* Toto */}
            <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{duration:0.8,delay:0.3,ease:[0.16,1,0.3,1]}}
              className="flex flex-col items-center gap-1 pb-2 pr-3 pointer-events-auto">
              <AnimatePresence mode="wait">
                <motion.div key={totoIdx} initial={{opacity:0,y:5,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-4}} transition={{duration:0.22}}>
                  <div className="relative px-3 py-1.5 rounded-2xl rounded-br-sm font-body font-semibold text-ink text-center max-w-[108px]"
                    style={{ background:"white",boxShadow:"0 0 0 2px var(--toto),0 4px 12px rgba(0,0,0,0.18)",fontSize:"11px" }}>
                    {TOTO_BUBBLES[totoIdx]}
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
                      style={{borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:"8px solid white"}}/>
                  </div>
                </motion.div>
              </AnimatePresence>
              <motion.img src="/characters/Toto_Puppet.png" alt="टोटो"
                className="object-contain object-bottom"
                style={{ width:90,height:128,transform:"scaleX(-1)",filter:"drop-shadow(0 0 14px var(--toto)) drop-shadow(0 6px 16px rgba(0,0,0,0.5))" }}
                animate={{ y:[0,-11,-4,-8,0],rotate:[0,1.5,-1,1.5,0] }}
                transition={{ duration:5.5,repeat:Infinity,ease:"easeInOut",delay:0.5 }} draggable={false}/>
              <div className="px-2 py-0.5 rounded-full font-display font-bold text-white" style={{background:"var(--toto)",fontSize:"10px"}}>टोटो</div>
            </motion.div>
          </div>

          {/* PLAY BUTTON — centre hero, above characters */}
          <motion.div initial={{opacity:0,scale:0.7}} animate={{opacity:1,scale:1}}
            transition={{type:"spring",stiffness:240,damping:16,delay:0.45}}
            className="z-20 flex flex-col items-center gap-3 mb-36">

            {/* Pulse rings */}
            {[1.55,2.0,2.45].map((s,i)=>(
              <motion.div key={i} className="absolute rounded-full pointer-events-none"
                style={{width:120,height:120,border:"2px solid rgba(255,200,74,0.45)"}}
                animate={{scale:[1,s],opacity:[0.45,0]}}
                transition={{duration:2.4,repeat:Infinity,delay:i*0.75,ease:"easeOut"}}/>
            ))}

            <motion.button type="button" onClick={handlePlay}
              animate={tapping?{scale:0.86}:{scale:1}}
              whileHover={{scale:1.05}}
              className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background:"linear-gradient(135deg,#FFE082,#FFC107,#FF8F00)",
                boxShadow:"0 0 0 5px rgba(255,193,7,0.2),0 12px 44px rgba(255,193,7,0.55),inset 0 2px 0 rgba(255,255,255,0.55)",
              }}>
              {tapping
                ? <motion.div className="w-8 h-8 border-4 rounded-full"
                    style={{borderColor:"rgba(26,16,37,0.3)",borderTopColor:"rgba(26,16,37,0.9)"}}
                    animate={{rotate:360}} transition={{duration:0.6,repeat:Infinity,ease:"linear"}}/>
                : <svg width="44" height="44" viewBox="0 0 24 24" fill="#1A0A00"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              }
            </motion.button>

            <div className="flex flex-col items-center gap-0.5">
              <span className="font-display font-extrabold text-white" style={{fontSize:"1.75rem",textShadow:"0 2px 14px rgba(0,0,0,0.6)"}}>
                खेलें
              </span>
              <span className="font-body" style={{fontSize:"0.72rem",color:"rgba(255,248,237,0.38)"}}>Play Game</span>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
