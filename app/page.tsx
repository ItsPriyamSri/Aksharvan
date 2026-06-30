"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const backgroundUrl = "/hindi%20Home%20Screen%20toto%20compress.gif";

const entrance = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: "easeOut",
    },
  },
};

const buttonMotion = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 260, damping: 22 },
};

export default function HeroPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/menu");
  }, [status, router]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Background GIF */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />

      {/* Buttons */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={entrance}
        className="relative z-10 flex min-h-screen flex-col justify-end px-6 pb-10"
      >
        <div className="mx-auto mb-10 mt-6 flex w-[90vw] max-w-[380px] flex-col gap-4">
          <motion.div
            {...buttonMotion}
            className="overflow-hidden rounded-[16px] bg-white shadow-[0_22px_60px_rgba(0,0,0,0.16)]"
          >
            <Link
              href="/signup"
              className="flex h-[56px] w-full items-center justify-center text-sm font-semibold text-black"
            >
              Get Started
            </Link>
          </motion.div>

          <motion.div
            {...buttonMotion}
            className="overflow-hidden rounded-[16px] border border-white/25 bg-white/10 backdrop-blur-xl"
          >
            <Link
              href="/login"
              className="flex h-[56px] w-full items-center justify-center text-sm font-semibold text-black"
            >
              I already have an account
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
