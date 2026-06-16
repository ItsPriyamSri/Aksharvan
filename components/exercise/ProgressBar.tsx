"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ProgressBar({ current, total }: { current:number; total:number }) {
  return (
    <div className="flex gap-1.5 items-center" role="progressbar" aria-valuenow={current+1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({length:total},(_,i)=>(
        <motion.div key={i}
          animate={{
            width: i===current?26:8,
            background: i<current?"var(--success)":i===current?"var(--firefly)":"rgba(255,248,237,0.18)",
          }}
          transition={{type:"spring",stiffness:280,damping:26}}
          className="h-2 rounded-full" />
      ))}
    </div>
  );
}
