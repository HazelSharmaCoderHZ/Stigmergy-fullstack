import React, { useEffect, useRef, useState } from 'react';

/**
 * Full-viewport electricity concept video. The clip already contains its own
 * text, so no headings, captions, or overlays are added. The video keeps its
 * aspect ratio (object-contain) and any unused space falls back to a clean dark
 * background. Native controls only appear if autoplay is blocked.
 */
export const ElectricityVideoSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const attempt = async () => {
      try {
        await video.play();
      } catch {
        // Autoplay was blocked (e.g. not muted or browser policy).
        setShowControls(true);
      }
    };
    void attempt();
  }, []);

  return (
    
<section
  id="electricity"
  aria-label="Electricity concept video"
  className="relative h-screen min-h-screen w-full overflow-hidden bg-black"
>
  <video
    ref={videoRef}
    className="absolute inset-0 h-full w-full object-cover"
    src="/electricity.mp4"
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
    controls={showControls}
  />
</section>

  );
};
