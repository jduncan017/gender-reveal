"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

const FAMILY_EMAILS: string[] = [
  "christian.duncan@yahoo.com",
  "dmanson924@gmail.com",
  "jacqueline.duncan2000@yahoo.com",
  "jennad6710@gmail.com",
  "emailjoshduncan@gmail.com",
];

const CONFETTI_COLORS = ["#22c55e", "#16a34a", "#facc15", "#eab308", "#a3e635"];

function fireCelebrationConfetti() {
  const duration = 4000;
  const end = Date.now() + duration;

  void confetti({
    particleCount: 100,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    colors: CONFETTI_COLORS,
    startVelocity: 40,
    gravity: 0.8,
    ticks: 250,
    zIndex: 9999,
  });

  const frame = () => {
    void confetti({
      particleCount: 3,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.6 },
      colors: CONFETTI_COLORS,
      zIndex: 9999,
    });
    void confetti({
      particleCount: 3,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.6 },
      colors: CONFETTI_COLORS,
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

export default function TheCallPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [congratsModal, setCongratsModal] = useState(true);
  const [showCongratsButton, setShowCongratsButton] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    fireCelebrationConfetti();
    const buttonTimer = setTimeout(() => setShowCongratsButton(true), 4000);
    return () => clearTimeout(buttonTimer);
  }, []);

  async function sendInvites() {
    setStatus("sending");
    setConfirmModal(false);
    try {
      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: FAMILY_EMAILS }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Something went wrong");
      }
      setStatus("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-linear-to-b from-green-50 via-yellow-50 to-green-50">
      {/* Congrats modal — z-40 so confetti (z-9999) renders on top */}
      {congratsModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white px-10 py-20 text-center shadow-2xl sm:px-14 sm:py-24">
            <p className="text-4xl font-extrabold text-green-800">
              Congrats, you&apos;re so close!
            </p>
            <p className="mt-4 text-lg text-green-600">
              You&apos;ve made it this far &mdash; just one more step!
            </p>
            {showCongratsButton && (
              <div className="animate-fade-in-up">
                <button
                  onClick={() => setCongratsModal(false)}
                  className="mt-10 rounded-xl bg-green-700 px-10 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-green-600 active:scale-95"
                >
                  Let&apos;s Go!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white px-10 py-12 text-center shadow-2xl">
            <p className="text-xl font-extrabold text-green-900">
              Send the Google Meet invite to the whole family?
            </p>
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex-1 rounded-xl border-2 border-gray-300 px-6 py-3 text-base font-bold text-gray-600 transition hover:bg-gray-100 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={sendInvites}
                className="flex-1 rounded-xl bg-green-700 px-6 py-3 text-base font-bold text-white shadow-lg transition hover:bg-green-600 active:scale-95"
              >
                Send it!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full bg-green-900 px-6 pt-12 pb-8 text-center shadow-lg shadow-green-900/20 sm:pt-16 sm:pb-10">
        <p className="mb-2 text-4xl">&#x1F4DE;</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          The Big Reveal
        </h1>
      </div>

      <div className="flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl border-2 border-green-800/10 bg-neutral-200/50 px-6 py-10 text-center">
          <p className="mb-2 text-5xl">&#x2728;</p>
          <h2 className="text-2xl font-extrabold text-green-900">
            Get ready to find out the gender!
          </h2>
          <p className="mt-4 text-gray-600">
            We&apos;re going to do the big reveal on a video call so everyone
            can be together for the moment!
          </p>

          <div className="mt-6 rounded-xl bg-gray-800 px-8 py-6">
            <p className="text-lg font-bold text-green-200">
              When: Tuesday, April 7
            </p>
            <p className="mt-2 text-base font-semibold text-green-100">
              7:00 &ndash; 8:00pm (Eastern Time)
            </p>
            <p className="mt-4 text-sm tracking-wider text-gray-300">
              If that time doesn&apos;t work for anyone, let Josh know and we
              can reschedule!
            </p>
          </div>

          <p className="mt-6 text-gray-600">
            Hit the button below to send a Google Meet invite to the whole
            family. Everyone will get an email with the link and instructions to
            join the video call.
          </p>

          <div className="mt-8 space-y-4">
            {status === "idle" && (
              <button
                onClick={() => setConfirmModal(true)}
                className="w-full rounded-xl bg-green-700 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-green-600 hover:shadow-xl active:scale-95"
              >
                Send the Invite to Everyone!
              </button>
            )}

            {status === "sending" && (
              <div className="text-green-800">
                <p className="text-lg font-semibold">Sending invites...</p>
              </div>
            )}

            {status === "sent" && (
              <div className="space-y-3">
                <p className="text-3xl">&#x2705;</p>
                <p className="text-lg font-bold text-green-800">
                  Invites sent!
                </p>
                <p className="text-sm text-gray-500">
                  Everyone should check their email for the Google Meet link.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-2 text-sm font-semibold text-green-700 underline transition hover:text-green-600"
                >
                  Send again
                </button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <p className="text-lg font-bold text-red-700">
                  Something went wrong
                </p>
                <p className="text-sm text-red-500">{errorMsg}</p>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setErrorMsg("");
                  }}
                  className="mt-2 rounded-lg bg-green-700 px-6 py-2 text-sm font-bold text-white transition hover:bg-green-600"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
