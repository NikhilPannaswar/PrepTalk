"use client";

import { useEffect, useRef, useState } from "react";

interface CameraFeedProps {
  className?: string;
}

const CameraFeed = ({ className }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Request camera access
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 640 },
            facingMode: "user"
          },
          audio: false
        });

        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    startCamera();

    // Cleanup function to stop camera when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Stop camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-800 border-2 border-gray-600`}>
        <div className="text-center p-4">
          <div className="text-red-400 mb-2 text-2xl">📹</div>
          <p className="text-gray-300 text-xs">Camera unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden bg-black`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
          <div className="text-center">
            <div className="animate-spin text-xl mb-2">⚙️</div>
            <p className="text-gray-300 text-xs">Starting camera...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover scale-x-[-1] ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-500`}
      />
      {/* Optional: Add a subtle border to make the circular shape more defined */}
      <div className="absolute inset-0 border-2 border-white/10 rounded-full pointer-events-none"></div>
    </div>
  );
};

export default CameraFeed;