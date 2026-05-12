"use client";
import React, { useState, useEffect, useCallback } from "react";
import { TextFlippingBoard } from "./ui/text-flipping-board";
import { Button } from "./ui/button";
import Link from "next/link";



const MESSAGES: string[] = [
  "PLAY GAMES.\nCOMPLETE QUESTS.\nGET REWARDED.",
  "READY?",
//   "I burned $20 \nfor this shit.",
//   "DONT WORRY \nBE HAPPY FFS.",
//   "LADIES AND GENTLEMEN \nWELCOME TO F#!@# C!@$",
];

export function Hero() {
  const [msgIdx, setMsgIdx] = useState(0);

  const next = useCallback(
    () => setMsgIdx((i) => (i + 1) % MESSAGES.length),
    [],
  );

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-8 py-20">
              <div className="flex justify-center gap-2 md:justify-start">
                <a href="#" className="flex items-center gap-2 font-medium">
                  moonshot
                </a>
              </div>
      <TextFlippingBoard text={MESSAGES[msgIdx]} />
      <div className="gap-4 flex">
    
      <Button asChild>
        <Link href="/#signup">Get Started</Link>
      </Button>

      <Button variant="secondary" asChild>
        <Link href="/login">Login</Link>
      </Button>
      </div>

    </div>
  );
}
