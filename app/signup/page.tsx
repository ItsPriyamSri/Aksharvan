"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Nunito } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

const AGES = ["4", "5", "6", "7", "8", "9", "10"];

export default function SignupPage() {
  const [name, setName]           = useState("");
  const [age, setAge]             = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [ageFocused, setAgeFocused]   = useState(false);
  const [btnHovered, setBtnHovered]   = useState(false);
  const [btnPressed, setBtnPressed]   = useState(false);

  const welcomeMsg = name ? `Welcome, ${name}! 🎉` : "You're all set! 🎉";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: nunito.style.fontFamily,
        background:
          "radial-gradient(circle at 30% 20%, #FFF3E6 0%, #FCE9D6 45%, #F6DCC2 100%)",
      }}
    >
      <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>

        {/* Billi — floats above the card, anchored to top-right corner */}
        <motion.img
          src="/billi-cat.gif"
          alt="Billi the cat"
          draggable={false}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          style={{
            position: "absolute",
            top: -128,
            right: -18,
            width: 160,
            height: "auto",
            zIndex: 3,
            pointerEvents: "none",
            filter: "drop-shadow(0 8px 12px rgba(180,120,60,0.22))",
            rotate: -2,
            transformOrigin: "bottom center",
          }}
        />

        {/* Card */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            background: "#FFFFFF",
            borderRadius: "28px",
            padding: "48px 40px 40px",
            boxShadow:
              "0 24px 60px -18px rgba(196,128,66,0.38), 0 4px 14px rgba(196,128,66,0.12)",
            border: "1px solid #F4E3D2",
          }}
        >
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: "34px",
              fontWeight: 900,
              letterSpacing: "-0.5px",
              color: "#3A2A1C",
            }}
          >
            Sign up
          </h1>
          <p
            style={{
              margin: "0 0 32px",
              fontSize: "15px",
              fontWeight: 600,
              color: "#B79277",
            }}
          >
            {"Billi's been waiting for you 🐱"}
          </p>

          {/* Name */}
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              color: "#8A6B52",
              marginBottom: "8px",
            }}
          >
            Name
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => { setName(e.target.value); setSubmitted(false); }}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            style={{
              width: "100%",
              padding: "15px 18px",
              marginBottom: "24px",
              fontFamily: "inherit",
              fontSize: "16px",
              fontWeight: 600,
              color: "#3A2A1C",
              background: nameFocused ? "#FFFFFF" : "#FCF6F0",
              border: `2px solid ${nameFocused ? "#F2A65A" : "#F0E1D2"}`,
              borderRadius: "14px",
              outline: "none",
              transition: "border-color .15s, background .15s",
              boxSizing: "border-box",
            }}
          />

          {/* Age */}
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              color: "#8A6B52",
              marginBottom: "8px",
            }}
          >
            Age
          </label>
          <div style={{ position: "relative", marginBottom: "32px" }}>
            <select
              value={age}
              onChange={(e) => { setAge(e.target.value); setSubmitted(false); }}
              onFocus={() => setAgeFocused(true)}
              onBlur={() => setAgeFocused(false)}
              style={{
                width: "100%",
                padding: "15px 44px 15px 18px",
                fontFamily: "inherit",
                fontSize: "16px",
                fontWeight: 600,
                color: age ? "#3A2A1C" : "#B0987F",
                background: ageFocused ? "#FFFFFF" : "#FCF6F0",
                border: `2px solid ${ageFocused ? "#F2A65A" : "#F0E1D2"}`,
                borderRadius: "14px",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
                cursor: "pointer",
                transition: "border-color .15s, background .15s",
                boxSizing: "border-box",
              }}
            >
              <option value="" disabled>Select your age</option>
              {AGES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            {/* Custom chevron */}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#C49A78",
                fontSize: "12px",
                lineHeight: 1,
              }}
            >
              ▾
            </span>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => { setBtnHovered(false); setBtnPressed(false); }}
            onMouseDown={() => setBtnPressed(true)}
            onMouseUp={() => setBtnPressed(false)}
            onTouchStart={() => setBtnPressed(true)}
            onTouchEnd={() => setBtnPressed(false)}
            style={{
              width: "100%",
              padding: "16px",
              fontFamily: "inherit",
              fontSize: "17px",
              fontWeight: 800,
              color: "#FFFFFF",
              background: "linear-gradient(180deg, #F7B36B 0%, #F0974A 100%)",
              border: "none",
              borderRadius: "16px",
              cursor: "pointer",
              boxShadow:
                btnHovered && !btnPressed
                  ? "0 14px 26px -6px rgba(240,151,74,0.7)"
                  : "0 10px 22px -6px rgba(240,151,74,0.6)",
              transform:
                btnHovered && !btnPressed
                  ? "translateY(-2px)"
                  : "translateY(0)",
              transition: "transform .12s, box-shadow .12s",
            }}
          >
            Sign up
          </button>

          {submitted && (
            <p
              style={{
                margin: "18px 0 0",
                textAlign: "center",
                fontSize: "15px",
                fontWeight: 700,
                color: "#5BA85C",
              }}
            >
              {welcomeMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
