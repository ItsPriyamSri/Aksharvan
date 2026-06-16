"use client";

import { motion } from "framer-motion";

export default function LoadingScreen({ message="लोड हो रहा है…" }: { message?:string }) {
  return (
    <div className="h-dvh flex flex-col items-center justify-center gap-5" style={{ background:"linear-gradient(180deg,#060B18,#0D1117,#141B35)" }}>
      <motion.h1 initial={{opacity:0,scale:0.85}} animate={{opacity:1,scale:1}} transition={{duration:0.5,ease:[0.16,1,0.3,1]}}
        className="font-display font-extrabold gold text-5xl">अक्षरवन</motion.h1>
      <div className="flex gap-2">
        {[0,1,2].map(i=>(
          <motion.div key={i} className="rounded-full" style={{ width:10,height:10,background:"var(--firefly)" }}
            animate={{ opacity:[0.3,1,0.3],y:[0,-8,0],scale:[1,1.2,1] }}
            transition={{ duration:1.0,repeat:Infinity,delay:i*0.18,ease:"easeInOut" }} />
        ))}
      </div>
      <p className="font-body text-sm" style={{ color:"rgba(255,248,237,0.4)" }}>{message}</p>
    </div>
  );
}
