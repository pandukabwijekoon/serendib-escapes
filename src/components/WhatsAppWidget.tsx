"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, Send, X } from "lucide-react";

const WHATSAPP_NUMBER =
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94771234567").replace(
    /[^\d]/g,
    ""
  );

const QUICK_TOPICS = [
  {
    label: "Sri Lankan Local Packages (LKR)",
    message:
      "Hello Serendib Escapes! I am a Sri Lankan resident and would like details about your local tour packages and prices.",
  },
  {
    label: "Foreign Visitor Tours (USD)",
    message:
      "Hello Serendib Escapes! I am planning a visit to Sri Lanka and would like information on your private tours and airport pickup.",
  },
  {
    label: "Custom Multi-City Trip Quote",
    message:
      "Hello Serendib Escapes! I would like a custom quote combining Sigiriya, Ella, Mirissa, and Yala.",
  },
];

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);

  function buildWhatsAppUrl(text: string) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="no-print fixed right-5 bottom-20 z-40 flex flex-col items-end sm:right-7">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 w-[calc(100vw-2rem)] max-w-80 overflow-hidden rounded-2xl border border-white/15 bg-[#0D1411]/95 text-white shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#111A16] px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/20 text-[#25D366]">
                  <MessageCircle className="h-5 w-5" />
                  <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-[#111A16] bg-[#25D366]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Serendib Escapes
                  </p>
                  <p className="text-[11px] text-emerald-300/90">
                    Online • Replies in a few minutes
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close WhatsApp menu"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-2.5 p-4">
              <p className="text-xs leading-relaxed text-white/75">
                Hi! Choose a quick topic below or start a direct WhatsApp chat
                with our Kandy travel team.
              </p>

              <div className="space-y-2">
                {QUICK_TOPICS.map((topic) => (
                  <a
                    key={topic.label}
                    href={buildWhatsAppUrl(topic.message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs font-medium text-white/90 transition hover:border-[#25D366]/60 hover:bg-[#25D366]/10"
                  >
                    <span>{topic.label}</span>
                    <Send className="h-3.5 w-3.5 text-[#25D366]" />
                  </a>
                ))}
              </div>

              <a
                href={buildWhatsAppUrl(
                  "Hello Serendib Escapes! I would like to plan a trip to Sri Lanka."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-xs font-semibold text-[#062112] shadow-lg shadow-[#25D366]/20 transition hover:bg-[#2CE070]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Start WhatsApp Chat</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with us on WhatsApp"
        className="group flex items-center gap-2.5 rounded-full border border-[#25D366]/45 bg-[#0D1411]/90 py-2.5 pr-4 pl-3 text-white shadow-2xl shadow-black/50 backdrop-blur-md transition hover:scale-[1.03] hover:border-[#25D366]"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-[#062112]">
          <MessageCircle className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-[#25D366] opacity-75" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#25D366]" />
        </span>
        <span className="hidden text-xs font-semibold tracking-wide text-white sm:inline">
          WhatsApp Us
        </span>
      </button>
    </div>
  );
}
