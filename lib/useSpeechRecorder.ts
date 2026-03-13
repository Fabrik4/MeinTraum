"use client"

import { useState, useRef, useCallback, useEffect } from "react"

type RecordingState = "idle" | "recording" | "transcribing" | "error"

export function useSpeechRecorder(onTranscript: (text: string) => void) {
  const [state, setState] = useState<RecordingState>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const onTranscriptRef = useRef(onTranscript)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => () => { if (resetTimerRef.current) clearTimeout(resetTimerRef.current) }, [])

  const start = useCallback(async () => {
    setErrorMsg(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Bestes verfügbares Format wählen
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4"

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Stream stoppen
        stream.getTracks().forEach((t) => t.stop())

        const blob = new Blob(chunksRef.current, { type: mimeType })
        if (blob.size < 1000) {
          setState("idle")
          return
        }

        setState("transcribing")
        try {
          const form = new FormData()
          const ext = mimeType.includes("mp4") ? "mp4" : "webm"
          form.append("audio", blob, `recording.${ext}`)

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: form,
          })
          const data = await res.json()

          if (data.text) {
            onTranscriptRef.current(data.text)
            setState("idle")
          } else {
            throw new Error(data.error || "Kein Text erkannt")
          }
        } catch (err: any) {
          setErrorMsg(err.message || "Transkription fehlgeschlagen")
          setState("error")
          resetTimerRef.current = setTimeout(() => setState("idle"), 3000)
        }
      }

      recorder.start()
      setState("recording")
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setErrorMsg("Mikrofon-Zugriff verweigert")
      } else {
        setErrorMsg("Mikrofon nicht verfügbar")
      }
      setState("error")
      resetTimerRef.current = setTimeout(() => setState("idle"), 3000)
    }
  }, [])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  return { state, errorMsg, start, stop }
}