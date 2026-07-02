"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function EntryPage() {
  const { status } = useAuth();
  const router     = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    router.replace(status === "authenticated" ? "/menu" : "/login");
  }, [status, router]);

  return (
    <div className="h-dvh flex flex-col items-center justify-center" style={{ background:"#0D1117" }}>
      <motion.div
        initial={{ opacity:0, scale:0.8 }}
        animate={{ opacity:1, scale:1 }}
        transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
        className="flex flex-col items-center gap-5"
      >
        <h1 className="font-display font-extrabold gold" style={{ fontSize:"3.5rem" }}>
          अक्षरवन
        </h1>
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <motion.div key={i} className="rounded-full"
              style={{ width:10, height:10, background:"var(--firefly)" }}
              animate={{ opacity:[0.3,1,0.3], y:[0,-8,0] }}
              transition={{ duration:1, repeat:Infinity, delay:i*0.18 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
