"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (file: File) => void;
  disabled?: boolean;
};

export default function CameraCapture({ onCapture, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setup = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Unable to access webcam");
      }
    };

    void setup();

    return () => {
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  const capture = async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Unable to capture frame");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));

    if (!blob) {
      setError("Unable to encode image");
      return;
    }

    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file);
  };

  return (
    <div className="space-y-3">
      <video ref={videoRef} className="w-full rounded-xl border border-slate-300 bg-black object-cover" muted playsInline />
      <button
        type="button"
        onClick={capture}
        disabled={disabled}
        className="btn-primary w-full disabled:opacity-50 md:w-auto"
      >
        Capture & Submit
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
