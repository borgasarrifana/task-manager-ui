import { useState, useEffect, useRef } from "react"
import { ShieldCheck, ShieldX } from "lucide-react"
import { verifyEmail } from "../api"
import HudFrame from "./HudFrame.jsx"

function VerifyEmailPage({ verificationToken, onDone }) {
  const [state, setState] = useState("verifying") // "verifying" | "success" | "error"
  const [message, setMessage] = useState("")
  // Tokens are single-use: stop React StrictMode's double effect run from spending it twice
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    verifyEmail(verificationToken)
      .then(() => setState("success"))
      .catch((err) => {
        setMessage(err.message)
        setState("error")
      })
  }, [verificationToken])

  const accent =
    state === "success" ? "var(--color-green)" : state === "error" ? "var(--color-red)" : "var(--color-cyan)"

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <HudFrame size="lg" accent={accent} className="max-w-sm w-full" bodyClassName="p-6" style={{ zIndex: 10 }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="hud-status-dot" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}></span>
          <span className="hud-label">Identity Check</span>
        </div>

        <div className="flex flex-col items-center text-center gap-4 my-6" role="status" aria-live="polite">
          {state === "verifying" && <p className="hud-label">Verifying email...</p>}

          {state === "success" && (
            <>
              <ShieldCheck size={40} style={{ color: accent }} aria-hidden="true" />
              <h1 className="hud-title text-xl" style={{ color: accent, textShadow: `0 0 8px ${accent}` }}>
                Email verified
              </h1>
              <p className="hud-label">You'll now receive task reminders if they're enabled.</p>
            </>
          )}

          {state === "error" && (
            <>
              <ShieldX size={40} style={{ color: accent }} aria-hidden="true" />
              <h1 className="hud-title hud-title-danger text-xl">Link not valid</h1>
              <p className="hud-label">{message}</p>
              <p className="hud-label">Request a new link from your Account page.</p>
            </>
          )}
        </div>

        {state !== "verifying" && (
          <button type="button" onClick={onDone} className="hud-btn w-full py-3">
            Continue
          </button>
        )}
      </HudFrame>
    </div>
  )
}

export default VerifyEmailPage