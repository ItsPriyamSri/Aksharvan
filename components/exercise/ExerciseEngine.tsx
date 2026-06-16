"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Level } from "@/types/content";
import { buildObjectMap, buildLetterMap, buildWordMap } from "@/lib/content/level1";
import { useExerciseState }     from "@/hooks/useExerciseState";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import ProgressBar              from "./ProgressBar";
import CharacterPromptBar       from "./CharacterPromptBar";
import AnswerFeedback           from "./AnswerFeedback";
import MicButton                from "./MicButton";
import NameObjectExercise       from "./NameObjectExercise";
import FirstSoundExercise       from "./FirstSoundExercise";
import BlendExercise            from "./BlendExercise";
import MatchBuildExercise       from "./MatchBuildExercise";
import MemoryExercise           from "./MemoryExercise";

const FOREST_GRADIENTS: Record<string,string> = {
  color:     "linear-gradient(180deg,#120a20 0%,#2a1845 55%,#1a0f2e 100%)",
  grass:     "linear-gradient(180deg,#080f08 0%,#0d2510 55%,#06160a 100%)",
  trees:     "linear-gradient(180deg,#050e08 0%,#1a4a28 55%,#0a2015 100%)",
  rivers:    "linear-gradient(180deg,#050b18 0%,#0d2840 55%,#0a2030 100%)",
  animals:   "linear-gradient(180deg,#050f08 0%,#1a4a28 40%,#2E7D5B 100%)",
  birds_sky: "linear-gradient(180deg,#0a1828 0%,#1a4a38 40%,#2d7a50 100%)",
};

type Props = { level:Level; sublevelIndex:number; onComplete:()=>void; onBack:()=>void; };

export default function ExerciseEngine({ level,sublevelIndex,onComplete,onBack }: Props) {
  const sublevel  = level.sublevels[sublevelIndex];
  const objectMap = useMemo(()=>buildObjectMap(level),[level]);
  const letterMap = useMemo(()=>buildLetterMap(level),[level]);
  const wordMap   = useMemo(()=>buildWordMap(level),[level]);

  const { phase,currentIndex,totalExercises,missCount,selectedOptionId,feedbackText,submitAnswer,advance } =
    useExerciseState(sublevel.exercises,level.feedback,sublevelIndex);

  const { isListening,isSupported,isProcessing,transcript,error:speechErr,startListening,stopListening } =
    useSpeechRecognition();

  const [micState, setMicState] = React.useState<"idle"|"listening"|"processing"|"success"|"error">("idle");

  React.useEffect(()=>{ if(isListening) setMicState("listening"); else if(isProcessing) setMicState("processing"); },[isListening,isProcessing]);
  React.useEffect(()=>{ setMicState("idle"); stopListening(); },[currentIndex,stopListening]);
  React.useEffect(()=>{ if(phase==="complete"){ const t=setTimeout(onComplete,950); return()=>clearTimeout(t); } },[phase,onComplete]);

  const exercise = sublevel.exercises[currentIndex];
  if (!exercise) return null;

  const isLastEx    = currentIndex===totalExercises-1;
  const isTapEx     = ["name_object","first_sound","blend"].includes(exercise.type);
  const bg          = FOREST_GRADIENTS[sublevel.restorationStage]??FOREST_GRADIENTS.trees;
  const canUseMic   = isTapEx && phase==="answering" && isSupported;

  function getExpected(): string[] {
    if (exercise.type==="name_object") return exercise.options.map(id=>objectMap.get(id)?.nameHi??"").filter(Boolean);
    if (exercise.type==="first_sound") return exercise.options.map(id=>letterMap.get(id)?.glyph??"").filter(Boolean);
    if (exercise.type==="blend")       return exercise.options.map(id=>wordMap.get(id)?.glyph??"").filter(Boolean);
    return [];
  }
  function getCorrectId(): string {
    if (exercise.type==="name_object"||exercise.type==="first_sound"||exercise.type==="blend") return exercise.correct;
    return "";
  }

  const handleMic = () => {
    if (!isSupported) return;
    if (isListening) { stopListening(); setMicState("idle"); return; }
    if (phase!=="answering"||!isTapEx) return;
    startListening(getExpected(),(matched,text,matchedOpt)=>{
      if (matched&&matchedOpt) {
        let id = "";
        if (exercise.type==="name_object") { for(const oid of exercise.options){ const c=objectMap.get(oid); if(c?.nameHi===matchedOpt||c?.nameRoman===matchedOpt){id=oid;break;} } }
        else if(exercise.type==="first_sound"){ for(const lid of exercise.options){ const c=letterMap.get(lid); if(c?.glyph===matchedOpt){id=lid;break;} } }
        else if(exercise.type==="blend"){ for(const wid of exercise.options){ const c=wordMap.get(wid); if(c?.glyph===matchedOpt){id=wid;break;} } }
        if (id) { setMicState("success"); setTimeout(()=>{ submitAnswer(id,getCorrectId()); setMicState("idle"); },350); }
        else { setMicState("error"); setTimeout(()=>setMicState("idle"),2000); }
      } else { setMicState("error"); setTimeout(()=>setMicState("idle"),2000); }
    });
  };

  function renderExercise() {
    switch(exercise.type) {
      case "name_object":  return <NameObjectExercise exercise={exercise} objectMap={objectMap} phase={phase} selectedId={selectedOptionId} onSelect={id=>submitAnswer(id,exercise.correct)} missCount={missCount}/>;
      case "first_sound":  return <FirstSoundExercise exercise={exercise} objectMap={objectMap} letterMap={letterMap} phase={phase} selectedId={selectedOptionId} onSelect={id=>submitAnswer(id,exercise.correct)}/>;
      case "blend":        return <BlendExercise exercise={exercise} letterMap={letterMap} wordMap={wordMap} phase={phase} selectedId={selectedOptionId} onSelect={id=>submitAnswer(id,exercise.correct)}/>;
      case "match_build":  return <MatchBuildExercise exercise={exercise} letterMap={letterMap} phase={phase} onSuccess={advance}/>;
      case "memory":       return <MemoryExercise exercise={exercise} letterMap={letterMap} phase={phase} onSuccess={advance}/>;
      default: return null;
    }
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ background:bg }}>
      {/* Ambient particles */}
      {[{x:8,y:20,s:3,d:4,del:0},{x:82,y:15,s:4,d:5,del:1.2},{x:50,y:55,s:3,d:6,del:2.5},{x:20,y:78,s:4,d:4.5,del:0.8},{x:90,y:45,s:3,d:5,del:1.8}].map((p,i)=>(
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left:`${p.x}%`,top:`${p.y}%`,width:p.s,height:p.s,background:"var(--firefly)",boxShadow:`0 0 ${p.s*3}px var(--firefly-glow)` }}
          animate={{ y:[0,-15,0],opacity:[0.2,0.7,0.2] }} transition={{ duration:p.d,repeat:Infinity,delay:p.del }} />
      ))}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-3 pt-3 pb-1">
        <button type="button" onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center min-h-0 transition-all"
          style={{ background:"rgba(255,248,237,0.06)",border:"1px solid rgba(255,248,237,0.1)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex flex-col items-center gap-1">
          <p className="font-body text-xs" style={{ color:"rgba(255,248,237,0.4)" }}>
            {level.title} · {sublevelIndex+1}/{level.sublevels.length}
          </p>
          <ProgressBar current={currentIndex} total={totalExercises}/>
        </div>
        <div className="flex gap-1.5">
          {sublevel.letters.map(l=>(
            <div key={l.id} className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:"rgba(124,92,191,0.2)",border:"1.5px solid rgba(124,92,191,0.4)" }}>
              <span className="akshar font-bold text-surface" style={{ fontSize:"1.25rem" }}>{l.glyph}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Character prompt */}
      <div className="relative z-10 px-3 py-2">
        <CharacterPromptBar promptTextHi={exercise.promptTextHi} feedbackText={feedbackText} phase={phase}/>
      </div>

      {/* Exercise area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-4 overflow-y-auto pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={`${sublevelIndex}-${currentIndex}`}
            initial={{opacity:0,scale:0.95,x:18}} animate={{opacity:1,scale:1,x:0}} exit={{opacity:0,scale:0.95,x:-14}}
            transition={{duration:0.22,ease:[0.16,1,0.3,1]}}
            className="w-full flex flex-col items-center gap-3">
            {renderExercise()}
          </motion.div>
        </AnimatePresence>

        {isTapEx && <AnswerFeedback phase={phase} feedbackText={feedbackText} missCount={missCount} onAdvance={advance} isLastExercise={isLastEx}/>}

        {/* Mic button */}
        {canUseMic && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.35}}>
            <MicButton state={micState} onTap={handleMic} transcript={transcript} error={speechErr}/>
          </motion.div>
        )}
      </main>

      {/* Sub-level complete overlay */}
      <AnimatePresence>
        {phase==="complete" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background:"rgba(0,0,0,0.88)" }}>
            {/* Burst particles */}
            {Array.from({length:24},(_,i)=>{
              const a=(i/24)*360,r=70+(i%4)*25;
              return (
                <motion.div key={i} className="absolute rounded-full"
                  style={{ width:5+(i%4),height:5+(i%4),background:i%3===0?"var(--firefly)":i%3===1?"var(--success)":"var(--tina)" }}
                  initial={{x:0,y:0,opacity:1,scale:1}}
                  animate={{x:Math.cos(a*Math.PI/180)*r,y:Math.sin(a*Math.PI/180)*r,opacity:0,scale:0}}
                  transition={{duration:0.85,delay:i*0.025,ease:"easeOut"}} />
              );
            })}
            <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}}
              transition={{type:"spring",stiffness:280,damping:16,delay:0.1}}
              className="flex flex-col items-center gap-3">
              <div className="text-8xl">✨</div>
              <p className="font-display font-extrabold gold text-center" style={{ fontSize:"2.5rem" }}>
                {level.feedback.correct[0]}
              </p>
              <p className="font-body text-center" style={{ color:"rgba(255,248,237,0.65)",fontSize:"1rem" }}>
                उप-स्तर {sublevelIndex+1} पूरा हुआ!
              </p>
              <div className="px-8 py-3 rounded-3xl" style={{ background:"rgba(0,200,150,0.15)",border:"2px solid rgba(0,200,150,0.35)" }}>
                <p className="akshar font-bold text-center" style={{ fontSize:"3rem",color:"var(--success)" }}>
                  {sublevel.word.glyph}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
