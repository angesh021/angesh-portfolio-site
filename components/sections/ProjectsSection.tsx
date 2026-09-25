import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
// FIX: Import Variants to correctly type framer-motion variants object.
import { motion, AnimatePresence, useInView, Variants } from "framer-motion";
import {
  Github,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Image as ImageIcon,
  VideoOff,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Shield,
  Layers,
  Hexagon, Target, Lock, ShieldCheck, Box, Share2, Locate, GitBranch, FileText, GraduationCap, Expand, Globe, Monitor, RefreshCw, ExternalLink, Smartphone, Tablet, Copy, Check
} from "lucide-react";
import Section from "../layout/Section";
import { useI18n } from "../../hooks/useI18n";
import { useStreak } from "../../hooks/useStreak";
import { getContent } from "../../lib/contentService";
import type { Project } from "../../types";
import { AnalyticsTracker } from "../../lib/analyticsTracker";
import { WazuhIncidentResponseDashboard } from "../ui/WazuhIncidentResponseDashboard";
import { CiscoIseVisualizer } from "../ui/CiscoIseVisualizer";

// --- Helper Functions & Components ---
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "00:00";
  const floorSeconds = Math.floor(seconds);
  const min = Math.floor(floorSeconds / 60);
  const sec = floorSeconds % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

// --- Custom Video Player Component ---
const CustomVideoPlayer: React.FC<{
  videoUrl: string;
  title: string;
  autoPlay?: boolean;
}> = ({ videoUrl, title, autoPlay = false }) => {
  const youtubeId = useMemo(() => getYoutubeVideoId(videoUrl), [videoUrl]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(autoPlay);
  const [volume, setVolume] = useState(autoPlay ? 0 : 0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const controlsTimeout = useRef<number | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    if (isPlaying) {
      controlsTimeout.current = window.setTimeout(
        () => setControlsVisible(false),
        3000,
      );
    }
  }, [isPlaying]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (autoPlay && videoElement) {
      videoElement.muted = true; // Ensure muted for autoplay
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Gracefully handle common autoplay issues without polluting the console
          if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
            console.error("Autoplay error in modal:", error);
          }
        });
      }
    }

    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
    };
  }, [autoPlay]);

  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    } else if (!isHovered) {
      controlsTimeout.current = window.setTimeout(
        () => setControlsVisible(false),
        3000,
      );
    } else {
      showControls();
    }
  }, [isPlaying, isHovered, showControls]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.paused
        ? videoRef.current.play()
        : videoRef.current.pause();
    }
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = newVolume;
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (videoRef.current) videoRef.current.muted = false;
    }
    if (newVolume === 0 && !isMuted) setIsMuted(true);
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    if (videoRef.current) videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      setVolume(0.5);
      if (videoRef.current) videoRef.current.volume = 0.5;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      !progressRef.current ||
      !videoRef.current ||
      isNaN(duration) ||
      duration === 0
    )
      return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setProgress(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration);
    const onVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("volumechange", onVolumeChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, []);

  if (youtubeId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`}
        className="w-full h-full"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title={title}
        referrerPolicy="strict-origin-when-cross-origin"
      ></iframe>
    );
  }

  return (
    <div
      ref={containerRef}
      className="custom-video-player-v5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={showControls}
    >
      {mediaError ? (
        <div className="media-error-overlay-v5">
          <AlertTriangle size={32} />
          <span>Video Unavailable</span>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            muted={autoPlay}
            loop={!duration}
            className="h-full w-full bg-slate-100 object-contain dark:bg-[#05070d]"
            onError={() => setMediaError(true)}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <div
            className={`video-controls-overlay-v5 ${controlsVisible ? "visible" : ""}`}
          >
            {!isPlaying && (
              <button className="center-play-btn-v5" onClick={handlePlayPause}>
                <Play size={32} />
              </button>
            )}
            <div className="controls-bar-v5">
              <button onClick={handlePlayPause} className="control-btn">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="time-display">
                {formatTime(progress)} / {formatTime(duration)}
              </div>
              <div
                ref={progressRef}
                onClick={handleSeek}
                className="progress-bar-container"
              >
                <div className="progress-bar-track-v5">
                  <div
                    className="progress-bar-filled-v5"
                    style={{ width: `${(progress / duration) * 100}%` }}
                  />
                </div>
              </div>
              <div className="volume-container">
                <button onClick={handleMuteToggle} className="control-btn">
                  {isMuted || volume === 0 ? (
                    <VolumeX size={20} />
                  ) : (
                    <Volume2 size={20} />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider volume-slider-v5"
                />
              </div>
              <button onClick={toggleFullScreen} className="control-btn">
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const getProjectYear = (id: string): string => {
  const years: Record<string, string> = {
    "project-aura-ttt": "2026",
    "project-admin-dashboard": "2026",
    "project-enterprise-nac": "2025",
    "project-hse-vax": "2024",
    "project-network-lab": "2024",
    "project-home-soc-lab": "2024",
  };
  return years[id] || "2024";
};

const ImageWithFallback: React.FC<{
  url: string;
  projectId: string;
  alt: string;
  className?: string;
}> = ({ url, projectId, alt, className }) => {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (!url) return "";
    const filename = decodeURIComponent(url.split("/").pop() || "");
    const folder = projectId === "project-aura-ttt" ? "project-tictactoe" : projectId;
    return `/assets/projects/${folder}/${filename}`;
  });

  return (
    <motion.img
      src={imgSrc}
      onError={() => {
        if (imgSrc !== url) setImgSrc(url);
      }}
      alt={alt}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  );
};


const BrandLogo: React.FC<{
  src: string;
  alt: string;
  fallback?: React.ReactNode;
}> = ({ src, alt, fallback }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback ?? null}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="h-8 w-8 sm:h-9 sm:w-9 object-contain p-0.5"
      onError={() => setFailed(true)}
    />
  );
};

const getOfficialBrandLogo = (tag: string): { src: string; alt: string } | null => {
  const norm = tag.toLowerCase();
  const cdn = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

  if (norm.includes("wazuh")) return { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Wazuh_logo.svg/512px-Wazuh_logo.svg.png", alt: "Wazuh logo" };
  if (norm.includes("suricata")) return { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Suricata_Logo.svg/512px-Suricata_Logo.svg.png", alt: "Suricata logo" };
  if (norm.includes("zeek")) return { src: "https://zeek.org/wp-content/uploads/2019/09/zeek-logo-512x512.png", alt: "Zeek logo" };
  if (norm.includes("sysmon") || norm.includes("windows")) return { src: `${cdn}/windows8/windows8-original.svg`, alt: "Windows logo" };
  if (norm.includes("vmware")) return { src: `${cdn}/vmware/vmware-original.svg`, alt: "VMware logo" };
  if (norm.includes("python")) return { src: `${cdn}/python/python-original.svg`, alt: "Python logo" };
  if (norm.includes("react")) return { src: `${cdn}/react/react-original.svg`, alt: "React logo" };
  if (norm.includes("java")) return { src: `${cdn}/java/java-original.svg`, alt: "Java logo" };
  if (norm.includes("php")) return { src: `${cdn}/php/php-original.svg`, alt: "PHP logo" };
  if (norm.includes("mysql")) return { src: `${cdn}/mysql/mysql-original.svg`, alt: "MySQL logo" };
  if (norm.includes("javascript") || norm === "js") return { src: `${cdn}/javascript/javascript-original.svg`, alt: "JavaScript logo" };
  if (norm.includes("docker")) return { src: `${cdn}/docker/docker-original.svg`, alt: "Docker logo" };
  if (norm.includes("github")) return { src: `${cdn}/github/github-original.svg`, alt: "GitHub logo" };
  if (norm.includes("mitre")) return { src: "https://attack.mitre.org/theme/images/mitre_attack_logo.png", alt: "MITRE ATT&CK logo" };

  return null;
};

const PremiumProjectCard: React.FC<{
  project: Project;
  index: number;
  onClick: () => void;
  isLarge?: boolean;
}> = ({ project, index, onClick, isLarge = false }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const mediaList = useMemo(() => {
    const list: Array<{ type: 'video' | 'architecture' | 'gallery', url: string }> = [];
    if (project.videoPreviewUrl && project.videoPreviewUrl !== "#") {
      list.push({ type: 'video', url: project.videoPreviewUrl });
    }
    if (project.architectureUrl) {
      list.push({ type: 'architecture', url: project.architectureUrl });
    }
    if (project.galleryUrls && project.galleryUrls.length > 0) {
      project.galleryUrls.forEach(url => list.push({ type: 'gallery', url }));
    }
    return list;
  }, [project]);

  const currentMedia = mediaList[currentMediaIndex] || { type: 'video', url: project.videoPreviewUrl };
  
  const heroImageUrl = useMemo(() => {
    if (project.galleryUrls && project.galleryUrls.length > 0) {
      return project.galleryUrls[0];
    }
    return project.architectureUrl || "";
  }, [project]);

  const youtubeId = useMemo(() => {
    if (currentMedia.type === 'video') return getYoutubeVideoId(currentMedia.url);
    return null;
  }, [currentMedia]);

  const handleNextMedia = (e: React.MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev + 1) % Math.max(1, mediaList.length));
  };

  const handlePrevMedia = (e: React.MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev - 1 + Math.max(1, mediaList.length)) % Math.max(1, mediaList.length));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNextMedia(e as unknown as KeyboardEvent);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrevMedia(e as unknown as KeyboardEvent);
    }
  };

  // IntersectionObserver to handle fallback video autoplay on viewport entry
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      {
        threshold: 0.15, // Play when 15% visible
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const shouldPlay = isHovered || isInViewport;

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || videoError || youtubeId || currentMedia.type !== 'video') return;

    if (shouldPlay) {
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
            setVideoError(true);
          }
        });
      }
    } else {
      videoElement.pause();
    }

    return () => {
      if (videoElement) videoElement.pause();
    };
  }, [shouldPlay, videoError, youtubeId, currentMedia]);

  const displayTags = useMemo(() => project.tags.slice(0, 3), [project.tags]);
  const year = useMemo(() => getProjectYear(project.id), [project.id]);

  return (
    <motion.div
      ref={cardRef}
      id={`project-card-${index}`}
      layoutId={`project-card-${project.id}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setCurrentMediaIndex(0); }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      className="group flex flex-col cursor-pointer select-none outline-none w-full"
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${project.title}`}
    >
      <motion.div
        whileHover={{ scale: 1.02, y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={`relative w-full ${isLarge ? "aspect-[1.8/1] sm:aspect-[2/1] lg:aspect-[1.95/1]" : "aspect-[1.33/1]"} rounded-[1.8rem] md:rounded-[2.4rem] overflow-hidden bg-[#e9ecef] dark:bg-[#0a192f] border border-neutral-200/40 dark:border-neutral-800/40 shadow-sm transition-shadow duration-500 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]`}
      >
        {/* Visual / Interactive Preview */}
        <div className="absolute inset-0 z-0 bg-neutral-900">
          <AnimatePresence mode="wait">
             <motion.div
                key={currentMediaIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
             >
              {currentMedia.type === 'video' ? (
                youtubeId ? (
                  shouldPlay ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&rel=0&loop=1&playlist=${youtubeId}&origin=${encodeURIComponent(window.location.origin)}`}
                      className="w-full h-full object-cover scale-105 pointer-events-none"
                      allow="autoplay; encrypted-media"
                      title={project.title}
                      frameBorder="0"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <img
                      src={`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`}
                      alt={`${project.title} preview`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  )
                ) : videoError || !currentMedia.url ? (
                  <ImageWithFallback
                    url={heroImageUrl}
                    projectId={project.id}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    onError={() => setVideoError(true)}
                  >
                    <source src={currentMedia.url} type="video/mp4" />
                  </video>
                )
              ) : (
                <ImageWithFallback
                  url={currentMedia.url}
                  projectId={project.id}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
             </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

        <div className="absolute top-4 left-6 md:top-6 md:left-8 z-20 flex items-center gap-2 pointer-events-none">
          <span
            className={`w-2 h-2 rounded-full ${project.status === "Completed" ? "bg-[#1b9ca6] dark:bg-[#64ffda]" : "bg-amber-400"} animate-pulse`}
          />
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#1b9ca6] dark:text-[#64ffda] mix-blend-difference">
            {project.status}
          </span>
        </div>

        {/* Carousel Controls */}
        {mediaList.length > 1 && isHovered && (
          <>
            <button
              onClick={handlePrevMedia}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 z-30"
              aria-label="Previous Media"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMedia}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 z-30"
              aria-label="Next Media"
            >
              <ChevronRight size={16} />
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 z-30 pointer-events-none">
              {mediaList.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentMediaIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Typography / details */}
      <div className="mt-5 md:mt-6 px-2 flex flex-col gap-2 pointer-events-none">
        <div className="flex justify-between items-baseline gap-4">
          <h3 className="font-sans font-black tracking-tight text-neutral-800 dark:text-neutral-100 text-lg md:text-xl uppercase transition-colors duration-300 group-hover:text-[#1b9ca6] dark:group-hover:text-[#64ffda]">
            {project.title}
          </h3>
          <span className="font-mono text-sm font-semibold text-neutral-400 dark:text-neutral-500 tracking-widest leading-none">
            {year}
          </span>
        </div>

        <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400/80 leading-relaxed font-sans line-clamp-1 max-w-[95%] font-medium">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-1">
          {displayTags.map((tag) => (
            <span
              key={tag}
              style={{ fontVariant: "all-small-caps" }}
              className="font-sans text-[10px] font-bold tracking-wider px-3 py-1 rounded-full bg-[#1b9ca6]/5 text-[#1b9ca6] dark:bg-[#64ffda]/5 dark:text-[#64ffda] border border-[#1b9ca6]/10 dark:border-[#64ffda]/10 transition-colors duration-300 group-hover:bg-[#1b9ca6]/10 dark:group-hover:bg-[#64ffda]/10"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="font-sans text-[9px] font-bold text-neutral-400 dark:text-neutral-500 self-center px-1">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Stats & Technology Tile Helper Mappings ---
interface ProjectStat {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

const getProjectStats = (_projectId: string, tagsCount: number, featuresCount: number): ProjectStat[] => [
  { value: String(featuresCount), label: "Key Features", icon: Layers, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/[0.10]" },
  { value: String(tagsCount), label: "Technologies", icon: Box, color: "text-violet-500 bg-violet-50 dark:bg-violet-500/10" },
  { value: featuresCount > 0 ? "Listed" : "None", label: "Highlights", icon: FileText, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
  { value: tagsCount > 0 ? "Available" : "Pending", label: "Stack", icon: CheckCircle, color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10" },
];

const getTagIconAndColor = (tag: string, index: number) => {
  const norm = tag.toLowerCase();

  // 1. Wazuh
  if (norm.includes("wazuh")) {
    return {
      logo: (
         <img
           src="/assets/projects/project-home-soc-lab/HomeSocLab-wazuh.png"
           alt="Wazuh"
           className="w-8 h-8 sm:w-9 sm:h-9 object-contain p-0.5"
           referrerPolicy="no-referrer"
         />
      ),
      colorClass: "bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-500/20",
    };
  }

  // 2. Suricata
  if (norm.includes("suricata")) {
    return {
      logo: (
         <img
           src="/assets/projects/project-home-soc-lab/HomeSocLab-surricata.png"
           alt="Suricata"
           className="w-8 h-8 sm:w-9 sm:h-9 object-contain p-0.5"
           referrerPolicy="no-referrer"
         />
      ),
      colorClass: "bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-500/20",
    };
  }

  // 3. Zeek
  if (norm.includes("zeek")) {
    return {
      logo: (
         <img
           src="/assets/projects/project-home-soc-lab/HomeSocLab-zeek.png"
           alt="Zeek"
           className="w-8 h-8 sm:w-9 sm:h-9 object-contain p-0.5"
           referrerPolicy="no-referrer"
         />
      ),
      colorClass: "bg-cyan-50/50 dark:bg-cyan-950/10 border-cyan-100 dark:border-cyan-500/20",
    };
  }

  // 4. Sysmon
  if (norm.includes("sysmon")) {
    return {
      logo: (
         <img
           src="/assets/projects/project-home-soc-lab/HomeSocLab-sysmon.png"
           alt="Sysmon"
           className="w-8 h-8 sm:w-9 sm:h-9 object-contain p-0.5"
           referrerPolicy="no-referrer"
         />
      ),
      colorClass: "bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-500/20",
    };
  }

  // 5. VMware
  if (norm.includes("vmware")) {
    return {
      logo: (
         <img
           src="/assets/projects/project-home-soc-lab/HomeSocLab-vmware.png"
           alt="VMware"
           className="w-8 h-8 sm:w-9 sm:h-9 object-contain p-0.5"
           referrerPolicy="no-referrer"
         />
      ),
      colorClass: "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-500/20",
    };
  }

  const officialLogo = getOfficialBrandLogo(tag);

  if (officialLogo) {
    return {
      logo: (
        <BrandLogo
          src={officialLogo.src}
          alt={officialLogo.alt}
          fallback={<Box size={20} strokeWidth={1.8} className="text-neutral-700 dark:text-neutral-300" />}
        />
      ),
      colorClass: "border-black/5 bg-white/65 dark:border-white/10 dark:bg-white/[0.04]",
    };
  }

  // 6. Cisco / Cisco ISE
  if (norm.includes("cisco")) {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g fill="#125492">
            <rect x="14" y="44" width="6" height="40" rx="3" />
            <rect x="27" y="30" width="6" height="68" rx="3" />
            <rect x="40" y="44" width="6" height="40" rx="3" />
            <rect x="53" y="16" width="6" height="96" rx="3" />
            <rect x="66" y="16" width="6" height="96" rx="3" />
            <rect x="79" y="44" width="6" height="40" rx="3" />
            <rect x="92" y="30" width="6" height="68" rx="3" />
            <rect x="105" y="44" width="6" height="40" rx="3" />
          </g>
        </svg>
      ),
      colorClass: "bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-500/20",
    };
  }

  // 7. Active Directory
  if (norm.includes("active directory") || norm.includes("directory")) {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="44" y="15" width="40" height="24" rx="4" fill="#0078D4" />
          <rect x="20" y="65" width="40" height="24" rx="4" fill="#0078D4" />
          <rect x="68" y="65" width="40" height="24" rx="4" fill="#0078D4" />
          <path d="M64 39 V52 H40 V65 M64 52 H88 V65" stroke="#E8B000" strokeWidth="4" strokeLinecap="round" />
          <circle cx="64" cy="15" r="4" fill="#FFFFFF" />
          <circle cx="40" cy="65" r="4" fill="#FFFFFF" />
          <circle cx="88" cy="65" r="4" fill="#FFFFFF" />
        </svg>
      ),
      colorClass: "bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-500/20",
    };
  }

  // 8. React
  if (norm.includes("react")) {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="64" cy="64" r="6" fill="#61dafb"/>
          <ellipse cx="64" cy="64" rx="48" ry="18" stroke="#61dafb" strokeWidth="4" fill="none" />
          <ellipse cx="64" cy="64" rx="48" ry="18" stroke="#61dafb" strokeWidth="4" fill="none" transform="rotate(60 64 64)" />
          <ellipse cx="64" cy="64" rx="48" ry="18" stroke="#61dafb" strokeWidth="4" fill="none" transform="rotate(120 64 64)" />
        </svg>
      ),
      colorClass: "bg-purple-100/30 dark:bg-purple-950/10 border-purple-200 dark:border-purple-500/25",
    };
  }

  // 9. Python
  if (norm.includes("python")) {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M64 10 C42 10, 44 26, 44 26 L44 38 L65 38 L65 42 L36 42 C18 42, 10 52, 10 74 C10 96, 26 94, 26 94 L38 94 L38 83 C38 83, 36 65, 54 65 L83 65 C101 65, 108 55, 108 34 C108 13, 92 10, 64 10 Z" fill="#3776AB"/>
          <path d="M64 118 C86 118, 84 102, 84 102 L84 90 L63 90 L63 86 L92 86 C110 86, 118 76, 118 54 C118 32, 102 34, 102 34 L90 34 L90 45 C90 45, 92 63, 74 63 L45 63 C27 63, 20 73, 20 94 C20 115, 36 118, 64 118 Z" fill="#FFD343"/>
          <circle cx="53" cy="24" r="5" fill="#FFFFFF"/>
          <circle cx="75" cy="104" r="5" fill="#111111"/>
        </svg>
      ),
      colorClass: "bg-purple-100/30 dark:bg-purple-950/10 border-purple-200 dark:border-purple-500/25",
    };
  }

  // 10. Java
  if (norm.includes("java")) {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 Q60 5, 50 -5" stroke="#E61F25" strokeWidth="5" strokeLinecap="round" transform="translate(10, 25) scale(1.5)" />
          <path d="M60 15 Q70 5, 60 -5" stroke="#E61F25" strokeWidth="5" strokeLinecap="round" transform="translate(10, 25) scale(1.5)" />
          <path d="M30 65 H82 C82 65, 84 85, 56 85 C28 85, 30 65, 30 65 Z" fill="#3A75B0" />
          <path d="M82 70 C88 70, 92 73, 92 77 C92 81, 88 84, 82 84" stroke="#3A75B0" strokeWidth="5" />
          <path d="M25 90 H87" stroke="#3A75B0" strokeWidth="6" strokeLinecap="round" />
        </svg>
      ),
      colorClass: "bg-purple-100/30 dark:bg-purple-950/10 border-purple-200 dark:border-purple-500/25",
    };
  }

  // 11. PHP
  if (norm.includes("php")) {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="64" cy="64" rx="54" ry="34" fill="#777BB4" />
          <text x="64" y="74" fill="#FFFFFF" fontSize="30" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" fontStyle="italic">PHP</text>
        </svg>
      ),
      colorClass: "bg-purple-100/30 dark:bg-purple-950/10 border-purple-200 dark:border-purple-500/25",
    };
  }

  // 12. MySQL
  if (norm.includes("mysql")) {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M110 50 C110 30, 85 20, 60 25 C45 28, 30 38, 20 54 C15 62, 12 74, 18 84 C22 90, 30 92, 40 88 C45 86, 52 82, 58 84 C62 85, 66 89, 74 88 C86 86, 98 74, 105 64 C109 58, 110 54, 110 50 Z" fill="#00758F" />
          <path d="M90 35 C90 35, 96 38, 100 45 C94 44, 91 40, 90 35 Z" fill="#F29111" />
          <path d="M40 88 C40 88, 50 98, 70 94" stroke="#00758F" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ),
      colorClass: "bg-cyan-100/30 dark:bg-cyan-950/10 border-cyan-200 dark:border-cyan-500/25",
    };
  }

  // 13. JS
  if (norm === "javascript" || norm === "js") {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="128" height="128" rx="8" fill="#F7DF1E" />
          <text x="108" y="108" fill="#000000" fontSize="48" fontWeight="bold" fontFamily="sans-serif" textAnchor="end">JS</text>
        </svg>
      ),
      colorClass: "bg-purple-100/30 dark:bg-purple-950/10 border-purple-200 dark:border-purple-500/25",
    };
  }

  // 14. EVE-NG
  if (norm.includes("eve-ng")) {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 90 C25 90, 15 80, 15 65 C15 50, 28 42, 40 45 C45 30, 65 25, 80 32 C95 38, 103 52, 100 65 C113 65, 118 75, 112 85 C108 90, 95 90, 80 90 Z" fill="#EF7E24" fillOpacity="0.15" stroke="#EF7E24" strokeWidth="4" />
          <circle cx="45" cy="55" r="6" fill="#EF7E24" />
          <circle cx="80" cy="55" r="6" fill="#EF7E24" />
          <circle cx="62" cy="75" r="6" fill="#EF7E24" />
          <path d="M45 55 L80 55 L62 75 Z" stroke="#EF7E24" strokeWidth="2.5" />
        </svg>
      ),
      colorClass: "bg-emerald-100/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-500/25",
    };
  }

  // 15. Zero Trust
  if (norm.includes("zero trust")) {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M64 15 L104 30 V65 C104 90, 88 108, 64 113 C40 108, 24 90, 24 65 V30 Z" fill="#00A4EF" fillOpacity="0.1" stroke="#00A4EF" strokeWidth="4" />
          <circle cx="64" cy="55" r="14" stroke="#00A4EF" strokeWidth="4" />
          <path d="M64 69 V85" stroke="#00A4EF" strokeWidth="4" strokeLinecap="round" />
          <circle cx="64" cy="55" r="4" fill="#00A4EF" />
        </svg>
      ),
      colorClass: "bg-teal-100/30 dark:bg-teal-950/10 border-teal-200 dark:border-teal-500/25",
    };
  }

  // 16. OWASP
  if (norm.includes("owasp")) {
    return {
      logo: (
        <svg viewBox="0 0 128 128" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="64,12 110,38 110,90 64,116 18,90 18,38" fill="#F44336" fillOpacity="0.1" stroke="#F44336" strokeWidth="4" />
          <text x="64" y="64" fill="#F44336" fontSize="30" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">10</text>
          <text x="64" y="90" fill="#F44336" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">OWASP</text>
        </svg>
      ),
      colorClass: "bg-blue-100/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-500/25",
    };
  }

  // 17. MITRE ATT&CK & Defense/Blue Team/Hunting
  if (norm.includes("mitre") || norm.includes("att&ck") || norm.includes("hunting") || norm.includes("blue team") || norm.includes("detection")) {
    return {
      logo: (
        <img
          src="/assets/projects/project-home-soc-lab/HomeSocLab-Mitre.png"
          alt="MITRE ATT&CK"
          className="w-8 h-8 sm:w-9 sm:h-9 object-contain p-0.5"
          referrerPolicy="no-referrer"
        />
      ),
      colorClass: "bg-rose-100/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-500/25",
    };
  }

  // Fallback categorization logic matching our old layout but returning Icon
  if (norm.includes("siem") || norm.includes("log") || norm.includes("audit") || norm.includes("incident") || norm.includes("sast") || norm.includes("dast")) {
    return {
      Icon: Shield,
      colorClass: "text-blue-500 bg-blue-50 dark:bg-blue-500/[0.10] border-blue-100 dark:border-blue-500/20",
    };
  }
  if (norm.includes("ids") || norm.includes("ips") || norm.includes("network") || norm.includes("vlan") || norm.includes("ospf") || norm.includes("acl")) {
    return {
      Icon: Locate,
      colorClass: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20",
    };
  }
  if (norm.includes("edr") || norm.includes("security") || norm.includes("lock") || norm.includes("bcrypt") || norm.includes("auth")) {
    return {
      Icon: Lock,
      colorClass: "text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20",
    };
  }
  if (norm.includes("hunt") || norm.includes("simulation") || norm.includes("attack") || norm.includes("metasploit") || norm.includes("target")) {
    return {
      Icon: Target,
      colorClass: "text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20",
    };
  }
  if (norm.includes("program") || norm.includes("code") || norm.includes("html") || norm.includes("css")) {
    return {
      Icon: Hexagon,
      colorClass: "text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20",
    };
  }
  if (norm.includes("docker") || norm.includes("vagrant") || norm.includes("ansible") || norm.includes("box") || norm.includes("infrastructure")) {
    return {
      Icon: Box,
      colorClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
    };
  }

  const fallbacks = [
    { Icon: Hexagon, colorClass: "text-blue-500 bg-blue-50 dark:bg-blue-500/[0.10] border-blue-100 dark:border-blue-500/20" },
    { Icon: Target, colorClass: "text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20" },
    { Icon: Share2, colorClass: "text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20" },
    { Icon: Box, colorClass: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20" },
    { Icon: GitBranch, colorClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" },
    { Icon: Locate, colorClass: "text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20" }
  ];
  return fallbacks[index % fallbacks.length];
};

type DossierMediaItem = {
  kind: "video" | "architecture" | "image";
  url: string;
  label: string;
  galleryIndex?: number;
};


type ProblemSolutionCopy = {
  problem: string;
  solution: string;
};

const getProjectProblemSolution = (project: Project): ProblemSolutionCopy => {
  const fallbackProblem = project.keyFeatures?.[0]
    ? `The project addresses a practical implementation challenge: ${project.keyFeatures[0]}`
    : `The project solves a real technical challenge by turning ${project.title} into a practical, portfolio-ready implementation.`;

  const fallbackSolution = project.keyFeatures?.[1]
    ? `The solution delivers a structured implementation that demonstrates ${project.keyFeatures[1]}`
    : `The solution combines ${project.tags?.slice(0, 3).join(", ") || "the selected technology stack"} into a clean, working system that is easy to explain, test, and extend.`;

  const statements: Record<string, ProblemSolutionCopy> = {
    "project-home-soc-lab": {
      problem:
        "Security teams need a safe way to practice detection engineering, validate alerts, and understand attacker behavior without touching production systems.",
      solution:
        "Built an isolated SOC lab that simulates realistic attacks, collects endpoint and network telemetry, and turns Wazuh-driven detections into clear investigation workflows.",
    },
    "project-aura-ttt": {
      problem:
        "Traditional web games lack robust state synchronization, secure player authentication, and scalable real-time communication architectures, leaving them susceptible to cheating and limited in progression mechanics.",
      solution:
        "Developed a modern, server-authoritative full-stack game with Socket.IO for low-latency synchronization, JWT token security, and a rich progression database storing coins, quests, and cosmetic item shop histories.",
    },
    "project-enterprise-nac": {
      problem:
        "Enterprise networks need to control device access, reduce unauthorized connectivity, and maintain segmentation without slowing down legitimate users.",
      solution:
        "Designed a Cisco ISE-based NAC architecture with policy enforcement, identity-aware access, and structured network controls for secure enterprise onboarding.",
    },
    "project-admin-dashboard": {
      problem:
        "Administrators need fast visibility into system activity, user actions, and operational data without navigating disconnected tools or manual reports.",
      solution:
        "Created a centralized admin dashboard that organizes key metrics, management actions, and system insights into a clean interface built for efficient decision-making.",
    },
    "project-hse-vax": {
      problem:
        "Healthcare vaccination workflows require accurate records, simple user flows, and secure handling of sensitive operational information.",
      solution:
        "Developed a structured vaccination management system that supports registration, record tracking, and role-based workflows with a focus on reliability and usability.",
    },
    "project-network-lab": {
      problem:
        "Network concepts are difficult to validate without a controlled environment where routing, segmentation, and security rules can be tested safely.",
      solution:
        "Built a hands-on network lab that models real infrastructure behavior, validates connectivity decisions, and demonstrates secure design through practical scenarios.",
    },
  };

  return statements[project.id] ?? {
    problem: fallbackProblem,
    solution: fallbackSolution,
  };
};



type TechnologyMeta = {
  name: string;
  subtitle: string;
};

const getTechnologyMeta = (tag: string): TechnologyMeta => {
  const norm = tag.toLowerCase().trim();

  if (norm.includes("wazuh")) return { name: "Wazuh", subtitle: "SIEM / XDR" };
  if (norm.includes("suricata")) return { name: "Suricata", subtitle: "IDS / IPS" };
  if (norm.includes("zeek")) return { name: "Zeek", subtitle: "Network Security" };
  if (norm.includes("sysmon")) return { name: "Sysmon", subtitle: "EDR" };
  if (norm.includes("windows")) return { name: "Windows", subtitle: "Telemetry" };
  if (norm.includes("mitre") || norm.includes("att&ck")) return { name: "MITRE ATT&CK", subtitle: "Framework" };
  if (norm.includes("vmware")) return { name: "VMware", subtitle: "Virtualization" };
  if (norm.includes("python")) return { name: "Python", subtitle: "Automation" };
  if (norm.includes("cisco ise")) return { name: "Cisco ISE", subtitle: "NAC / Identity" };
  if (norm.includes("cisco")) return { name: "Cisco", subtitle: "Networking" };
  if (norm.includes("active directory") || norm === "ad") return { name: "Active Directory", subtitle: "Identity Services" };
  if (norm.includes("zero trust")) return { name: "Zero Trust", subtitle: "Access Model" };
  if (norm.includes("react")) return { name: "React", subtitle: "Frontend UI" };
  if (norm.includes("socket.io")) return { name: "Socket.IO", subtitle: "Real-Time WebSockets" };
  if (norm.includes("postgresql")) return { name: "PostgreSQL", subtitle: "Relational DB" };
  if (norm.includes("framer motion")) return { name: "Framer Motion", subtitle: "Fluid Animations" };
  if (norm.includes("express")) return { name: "Express", subtitle: "Server API Layer" };
  if (norm.includes("node.js") || norm === "node") return { name: "Node.js", subtitle: "Backend Runtime" };
  if (norm.includes("typescript")) return { name: "TypeScript", subtitle: "Typed Frontend" };
  if (norm.includes("javascript") || norm === "js") return { name: "JavaScript", subtitle: "Web Logic" };
  if (norm.includes("java")) return { name: "Java", subtitle: "Application Logic" };
  if (norm.includes("php")) return { name: "PHP", subtitle: "Backend Logic" };
  if (norm.includes("mysql")) return { name: "MySQL", subtitle: "Database" };
  if (norm.includes("docker")) return { name: "Docker", subtitle: "Containerization" };
  if (norm.includes("eve-ng")) return { name: "EVE-NG", subtitle: "Network Emulation" };
  if (norm.includes("owasp")) return { name: "OWASP", subtitle: "App Security" };
  if (norm.includes("bcrypt")) return { name: "bcrypt", subtitle: "Password Hashing" };
  if (norm.includes("auth")) return { name: tag, subtitle: "Authentication" };
  if (norm.includes("api")) return { name: tag, subtitle: "API Layer" };
  if (norm.includes("sql")) return { name: tag, subtitle: "Database" };
  if (norm.includes("html")) return { name: "HTML", subtitle: "Structure" };
  if (norm.includes("tailwind")) return { name: "Tailwind CSS", subtitle: "Styling System" };
  if (norm.includes("css")) return { name: "CSS", subtitle: "Styling" };
  if (norm.includes("vite")) return { name: "Vite", subtitle: "Build Tooling" };
  if (norm.includes("siem")) return { name: tag, subtitle: "Security Monitoring" };
  if (norm.includes("ids") || norm.includes("ips")) return { name: tag, subtitle: "Network Detection" };
  if (norm.includes("edr")) return { name: tag, subtitle: "Endpoint Detection" };
  if (norm.includes("detection")) return { name: tag, subtitle: "Workflows" };
  if (norm.includes("simulation")) return { name: tag, subtitle: "Attack Testing" };
  if (norm.includes("network")) return { name: tag, subtitle: "Infrastructure" };

  return { name: tag, subtitle: "Project Technology" };
};

const getProjectTechFooter = (projectId: string): { left: string; right: string } => {
  const footers: Record<string, { left: string; right: string }> = {
    "project-home-soc-lab": {
      left: "Isolated Lab Environment",
      right: "For Educational & Research Purposes Only",
    },
    "project-aura-ttt": {
      left: "Server-Authoritative Game State",
      right: "Real-Time WebSocket Engineering",
    },
    "project-enterprise-nac": {
      left: "Identity-Aware Access Control",
      right: "Enterprise Network Security Design",
    },
    "project-admin-dashboard": {
      left: "Administrative Visibility",
      right: "Secure Operational Management",
    },
    "project-hse-vax": {
      left: "Healthcare Workflow Management",
      right: "Role-Based Data Handling",
    },
    "project-network-lab": {
      left: "Controlled Network Lab",
      right: "Routing & Security Practice",
    },
  };

  return footers[projectId] ?? {
    left: "Project Technology Stack",
    right: "Portfolio Implementation",
  };
};

const ProjectDossier: React.FC<{
  project: Project;
  projectNumber: string;
  onClose: (triggerElement: HTMLElement | null) => void;
}> = ({ project, projectNumber, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const mediaList = useMemo<DossierMediaItem[]>(() => {
    const list: DossierMediaItem[] = [];
    if (project.videoPreviewUrl && project.videoPreviewUrl !== "#") list.push({ kind: "video", url: project.videoPreviewUrl, label: "Watch Walkthrough" });
    if (project.architectureUrl && project.architectureUrl !== "#") list.push({ kind: "architecture", url: project.architectureUrl, label: "Architecture" });
    project.galleryUrls?.forEach((url, index) => {
      if (url && url !== "#") list.push({ kind: "image", url, label: `Project Image ${index + 1}`, galleryIndex: index });
    });
    return list;
  }, [project]);

  const initialMediaIndex = useMemo(() => {
    const imageIndex = mediaList.findIndex((item) => item.kind === "image");
    if (imageIndex >= 0) return imageIndex;
    const architectureIndex = mediaList.findIndex((item) => item.kind === "architecture");
    return architectureIndex >= 0 ? architectureIndex : 0;
  }, [mediaList]);

  const [activeMediaIndex, setActiveMediaIndex] = useState(initialMediaIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSandboxActive, setIsSandboxActive] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [sandboxViewport, setSandboxViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isCopied, setIsCopied] = useState(false);
  const activeMedia = mediaList[activeMediaIndex];
  const hasLiveDemo = Boolean(project.liveDemoUrl && project.liveDemoUrl !== "#") || project.id === "project-enterprise-nac";
  const isWazuh = project.id === "project-home-soc-lab";
  const isCiscoIse = project.id === "project-enterprise-nac";
  const isCustomSandbox = isWazuh || isCiscoIse;
  const hasGithub = Boolean(project.githubUrl && project.githubUrl !== "#");
  const hasArchitecture = Boolean(project.architectureUrl && project.architectureUrl !== "#");
  const primaryTag = project.tags?.[0];
  const introText = project.longDescription || project.description;
  const problemSolution = useMemo(() => getProjectProblemSolution(project), [project]);
  const techFooter = useMemo(() => getProjectTechFooter(project.id), [project.id]);

  const challengeCopyClass =
    problemSolution.problem.length > 220
      ? "text-[10.75px] font-medium leading-[1.38] text-slate-600 dark:text-slate-400 sm:text-[11.25px]"
      : "text-[11.5px] font-medium leading-[1.48] text-slate-600 dark:text-slate-400 sm:text-[12px]";
  const solutionCopyClass =
    problemSolution.solution.length > 220
      ? "text-[10.75px] font-medium leading-[1.38] text-slate-600 dark:text-slate-400 sm:text-[11.25px]"
      : "text-[11.5px] font-medium leading-[1.48] text-slate-600 dark:text-slate-400 sm:text-[12px]";
  useEffect(() => {
    setActiveMediaIndex(initialMediaIndex);
    setIsSandboxActive(false);
    setIframeKey(0);
    setSandboxViewport('desktop');
    setIsCopied(false);
  }, [project.id, initialMediaIndex]);

  useEffect(() => {
    if (isSandboxActive && (project.id === "project-home-soc-lab" || project.id === "project-enterprise-nac")) {
      setIsIframeLoading(false);
    }
  }, [isSandboxActive, project.id]);

  const handleCopyUrl = useCallback(() => {
    if (!project.liveDemoUrl) return;
    navigator.clipboard.writeText(project.liveDemoUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch((err) => {
      console.error("Failed to copy URL", err);
    });
  }, [project.liveDemoUrl]);

  const handleNextMedia = useCallback(() => {
    if (mediaList.length <= 1) return;
    setActiveMediaIndex((current) => (current + 1) % mediaList.length);
  }, [mediaList.length]);

  const handlePrevMedia = useCallback(() => {
    if (mediaList.length <= 1) return;
    setActiveMediaIndex((current) => (current - 1 + mediaList.length) % mediaList.length);
  }, [mediaList.length]);

  const handleArchitectureClick = useCallback(() => {
    const architectureIndex = mediaList.findIndex((item) => item.kind === "architecture");
    if (architectureIndex >= 0) setActiveMediaIndex(architectureIndex);
  }, [mediaList]);

  useEffect(() => {
    triggerElementRef.current = document.activeElement as HTMLElement;
    const modalNode = modalRef.current;
    if (!modalNode) return;
    const focusableElements = modalNode.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          onClose(triggerElementRef.current);
        }
        e.preventDefault();
      }
      if (e.key === "ArrowRight") handleNextMedia();
      if (e.key === "ArrowLeft") handlePrevMedia();
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
        if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleNextMedia, handlePrevMedia, isLightboxOpen]);

  const actualStats: ProjectStat[] = useMemo(() => [
    { value: String(project.keyFeatures?.length ?? 0), label: "Features", icon: Layers, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/[0.10]" },
    { value: String(project.tags?.length ?? 0), label: "Technologies", icon: Box, color: "text-violet-500 bg-violet-50 dark:bg-violet-500/10" },
    { value: String(mediaList.length), label: "Media", icon: ImageIcon, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
    { value: project.status || "Available", label: "Status", icon: CheckCircle, color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10" },
  ], [project.keyFeatures, project.tags, project.status, mediaList.length]);

  const renderMedia = () => {
    // Project screenshots/images use object-contain so that diagrams and interfaces fit the frame perfectly without cropping.
    if (!activeMedia) return <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-500"><VideoOff size={34} /></div>;
    if (activeMedia.kind === "video") return <CustomVideoPlayer videoUrl={activeMedia.url} title={project.title} autoPlay={false} />;
    if (activeMedia.kind === "architecture") {
      return (
        <div onClick={() => setIsLightboxOpen(true)} className="h-full w-full cursor-pointer">
          <ImageWithFallback key={`media-${activeMediaIndex}-architecture`} url={activeMedia.url} projectId={project.id} alt={`${project.title} architecture`} className="h-full w-full bg-slate-100 object-contain object-center p-0 dark:bg-[#05070d]" />
        </div>
      );
    }
    return (
      <div onClick={() => setIsLightboxOpen(true)} className="h-full w-full cursor-pointer">
        <ImageWithFallback key={`media-${activeMediaIndex}-image`} url={activeMedia.url} projectId={project.id} alt={`${project.title} project image ${(activeMedia.galleryIndex ?? 0) + 1}`} className="h-full w-full bg-slate-100 object-contain object-center p-0 dark:bg-[#05070d]" />
      </div>
    );
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 backdrop-blur-xl sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }} onClick={() => onClose(triggerElementRef.current)}>
      <motion.div ref={modalRef} layoutId={`project-card-${project.id}`} className="relative flex h-[min(920px,calc(100dvh-32px))] w-full max-w-[1500px] flex-col max-lg:overflow-y-auto lg:overflow-hidden rounded-[1.5rem] bg-[#f7f8fc] text-slate-950 shadow-[0_32px_110px_rgba(2,6,23,0.48)] ring-1 ring-white/80 dark:bg-[#080b12] dark:text-white dark:ring-white/10 sm:rounded-[1.8rem] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="dossier-title" tabIndex={-1} initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 10, opacity: 0 }} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
        <button onClick={() => onClose(triggerElementRef.current)} className="absolute left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white/[0.88] text-slate-900 shadow-[0_14px_36px_-20px_rgba(15,23,42,0.7)] backdrop-blur-2xl transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95 dark:border-white/10 dark:bg-white/[0.10] dark:text-white dark:hover:bg-white/[0.15]" aria-label="Close modal">
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/[0.12]" />
          <div className="absolute right-12 top-0 h-80 w-80 rounded-full bg-violet-400/[0.18] blur-3xl dark:bg-violet-500/[0.12]" />
          <div className="absolute bottom-12 right-28 h-60 w-60 rounded-full bg-cyan-300/[0.14] blur-3xl dark:bg-cyan-500/[0.08]" />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col gap-3 px-5 pb-4 pt-16 sm:px-8 sm:pb-5 sm:pt-[4.5rem] xl:px-12">
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[0.45fr_0.55fr] lg:gap-6 lg:overflow-hidden">
          <section className="flex flex-col gap-4">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="mb-2 font-sans text-base font-black text-blue-500 sm:text-lg">{projectNumber}.</div>
              <h2 id="dossier-title" className="mb-2 max-w-[540px] text-[28px] font-black leading-[1.02] tracking-[-0.05em] text-slate-950 line-clamp-3 dark:text-white sm:text-[36px] lg:text-[40px] xl:text-[44px]">{project.title}</h2>
              {primaryTag && <p className="mb-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-[19px] font-black tracking-[-0.035em] text-transparent sm:text-[23px]">{primaryTag}</p>}
              <p className="max-w-[540px] text-[13.5px] font-medium leading-relaxed text-slate-600 dark:text-slate-400 sm:text-[14.5px] line-clamp-6 sm:line-clamp-none">{project.description}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="flex flex-wrap gap-2.5">
              {hasLiveDemo && (
                <button
                  onClick={() => {
                    setIsSandboxActive(true);
                    setIsIframeLoading(true);
                    setIframeKey((prev) => prev + 1);
                    AnalyticsTracker.trackEngagementEvent("sandbox_click", project.id);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_12px_30px_-12px_rgba(59,130,246,0.5)] dark:from-[#3b82f6] dark:to-[#4f46e5] px-4 py-2.5 text-sm font-black transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                >
                  <Monitor size={15} />
                  <span>Interactive Sandbox</span>
                </button>
              )}
              {hasLiveDemo && <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer" onClick={() => AnalyticsTracker.trackEngagementEvent("project_click", project.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-black text-slate-950 shadow-sm backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/12"><Play size={15} fill="currentColor" />Watch Demo</a>}
              {hasGithub && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" onClick={() => AnalyticsTracker.trackEngagementEvent("github_click", project.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-black text-slate-950 shadow-sm backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/12"><Github size={16} />View on GitHub</a>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-0 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {actualStats.map((stat, index) => {
                const StatIcon = stat.icon;
                const textClass = stat.color.split(" ").find((item) => item.startsWith("text-")) || "text-blue-500";

                return (
                  <div
                    key={`${stat.label}-${index}`}
                    className="min-w-0 rounded-[1.05rem] border border-slate-200/70 bg-white/70 p-2 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.85)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]"
                  >
                    <div className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-xl ${stat.color}`}>
                      <StatIcon size={15} className={textClass} strokeWidth={2.2} />
                    </div>
                    <div className={`mb-0.5 truncate text-[15px] font-black tracking-[-0.04em] ${textClass}`}>
                      {stat.value}
                    </div>
                    <div className="truncate text-[10px] font-bold leading-tight text-slate-400 dark:text-slate-500">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }} className="grid min-h-0 gap-3 sm:grid-cols-2">
              <div className="flex h-auto min-w-0 flex-col rounded-[1.05rem] border border-slate-200/70 bg-white/68 p-4 shadow-[0_12px_36px_-24px_rgba(15,23,42,0.65)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]">
                <h3 className="mb-2 flex shrink-0 items-center gap-2 text-xs font-black text-slate-950 dark:text-white">
                  <Target size={17} className="text-blue-500" />
                  The Challenge
                </h3>
                <div className="min-h-0">
                  <p className={challengeCopyClass}>
                    {problemSolution.problem}
                  </p>
                </div>
              </div>

              <div className="flex h-auto min-w-0 flex-col rounded-[1.05rem] border border-slate-200/70 bg-white/68 p-4 shadow-[0_12px_36px_-24px_rgba(15,23,42,0.65)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]">
                <h3 className="mb-2 flex shrink-0 items-center gap-2 text-xs font-black text-slate-950 dark:text-white">
                  <ShieldCheck size={17} className="text-emerald-500" />
                  The Solution
                </h3>
                <div className="min-h-0">
                  <p className={solutionCopyClass}>
                    {problemSolution.solution}
                  </p>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="flex min-h-0 min-w-0 flex-col gap-4">
            <motion.div initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 }} className="group relative aspect-[16/9] h-[clamp(235px,40dvh,445px)] w-full overflow-hidden rounded-[1.15rem] border border-slate-200/70 bg-slate-100 shadow-[0_32px_85px_-46px_rgba(15,23,42,0.9)] dark:border-white/10 dark:bg-[#05070d] sm:rounded-[1.35rem]">
              <AnimatePresence mode="wait">{renderMedia()}</AnimatePresence>
              {activeMedia && activeMedia.kind !== "video" && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                  <button
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute right-5 bottom-5 z-20 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/95 px-3.5 py-1.5 text-[11px] font-black text-slate-950 shadow-lg backdrop-blur-2xl transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95 dark:border-white/10 dark:bg-slate-950/75 dark:text-white dark:hover:bg-slate-900 cursor-pointer"
                    aria-label="Enlarge image"
                  >
                    <Expand size={12} strokeWidth={2.5} />
                    <span className="font-sans tracking-wider uppercase text-[10px]">Enlarge</span>
                  </button>
                </>
              )}
              {mediaList.length > 1 && <><div className="absolute left-5 top-5 rounded-full border border-white/10 bg-slate-950/50 px-3 py-1.5 font-mono text-xs font-black text-white shadow-sm backdrop-blur-2xl">{activeMediaIndex + 1} / {mediaList.length}</div><button onClick={handlePrevMedia} className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/90 text-slate-950 shadow-lg backdrop-blur-2xl transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95 dark:border-white/15 dark:bg-white/[0.14] dark:text-white dark:hover:bg-white/[0.22] sm:h-12 sm:w-12" aria-label="Previous media"><ChevronLeft size={22} strokeWidth={2.5} /></button><button onClick={handleNextMedia} className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/90 text-slate-950 shadow-lg backdrop-blur-2xl transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95 dark:border-white/15 dark:bg-white/[0.14] dark:text-white dark:hover:bg-white/[0.22] sm:h-12 sm:w-12" aria-label="Next media"><ChevronRight size={22} strokeWidth={2.5} /></button><div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-slate-950/45 px-4 py-2 shadow-sm backdrop-blur-2xl">{mediaList.map((item, index) => <button key={`${item.kind}-${item.url}-${index}`} onClick={() => setActiveMediaIndex(index)} className={`h-1.5 rounded-full transition-all duration-300 ${index === activeMediaIndex ? "w-7 bg-blue-500" : "w-4 bg-white/[0.55] hover:bg-white/[0.80]"}`} aria-label={`Open ${item.label}`} />)}</div></>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="group relative min-h-0 flex-1 overflow-hidden rounded-[1.15rem] border border-slate-100 bg-white p-4.5 shadow-[0_12px_40px_-25px_rgba(15,23,42,0.4)] dark:border-white/[0.04] dark:bg-[#0c0f17] sm:p-5">
              <div className="relative z-20 flex h-full flex-col w-full max-w-full md:max-w-[85%] lg:max-w-[80%]">
                <h3 className="mb-3 flex shrink-0 items-center gap-2.5 text-sm font-black text-slate-950 dark:text-white">
                  <FileText size={18} className="text-[#5850ec] dark:text-[#64ffda]" />
                  Project Overview
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[180px] sm:max-h-[220px] lg:max-h-none pr-1.5 hide-scrollbar">
                  <p className="text-[13.5px] font-semibold leading-[1.7] text-slate-800 dark:text-gray-100 sm:text-[14px] md:text-[14.5px]">
                    {introText}
                  </p>
                </div>
              </div>
              {project.architectureUrl && (
                <div className="pointer-events-none absolute inset-0 opacity-15 dark:opacity-10 group-hover:opacity-30 group-hover:dark:opacity-22 transition-all duration-700 overflow-hidden select-none z-10">
                  <ImageWithFallback
                    url={
                      project.id === "project-home-soc-lab"
                        ? "/assets/projects/project-home-soc-lab/HomeSocLab-Background.png"
                        : project.architectureUrl
                    }
                    projectId={project.id}
                    alt={`${project.title} Background`}
                    className="absolute right-0 bottom-0 top-0 h-full w-[50%] sm:w-[45%] md:w-[40%] lg:w-[35%] object-contain object-right-bottom select-none mix-blend-multiply dark:mix-blend-screen dark:invert"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/[0.88] via-white/[0.60] to-transparent dark:from-[#0c0f17] dark:via-[#0c0f17]/[0.88] dark:via-[#0c0f17]/[0.60] to-transparent" />
                </div>
              )}
            </motion.div>
          </section>
          </div>

          {project.tags?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="relative z-20 shrink-0"
            >
              <div className="mb-2 flex items-end justify-between gap-3">
                <h3 className="text-[13px] font-black text-slate-600 dark:text-slate-300">
                  Technology Stack
                </h3>
                <p className="hidden text-[11px] font-bold text-slate-400 dark:text-slate-500 sm:block">
                  {project.tags.length} {project.tags.length === 1 ? "technology" : "technologies"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {project.tags.map((tag, index) => {
                  const visual = getTagIconAndColor(tag, index) as {
                    logo?: React.ReactNode;
                    Icon?: React.ComponentType<any>;
                    colorClass: string;
                  };
                  const TagIcon = visual.Icon;
                  const tech = getTechnologyMeta(tag);
                  const iconTextClass =
                    visual.colorClass.split(" ").find((item) => item.startsWith("text-")) ||
                    "text-blue-500";

                  return (
                    <div
                      key={`${project.id}-tag-${tag}-${index}`}
                      title={`${tech.name} — ${tech.subtitle}`}
                      className="flex shrink-0 items-center gap-3 rounded-[1.05rem] border border-slate-200/65 bg-white/55 px-3.5 py-2.5 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.9)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/75 dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.07]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50/90 shadow-sm border border-slate-200/60 dark:bg-white/[0.04] dark:border-white/10">
                        {visual.logo ??
                          (TagIcon ? (
                            <TagIcon size={24} strokeWidth={2} className={iconTextClass} />
                          ) : (
                            <Box size={24} className="text-blue-500" />
                          ))}
                      </div>

                      <div className="min-w-0 pr-1">
                        <p className="whitespace-nowrap text-[13px] font-black leading-tight tracking-[-0.015em] text-slate-950 dark:text-white">
                          {tech.name}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                          {tech.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={13} strokeWidth={2.2} />
                  {techFooter.left}
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 sm:inline-block" />
                <span className="inline-flex items-center gap-2">
                  <GraduationCap size={13} strokeWidth={2.2} />
                  {techFooter.right}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Lightbox / Enlarged View */}
      <AnimatePresence>
        {isLightboxOpen && activeMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 p-4 backdrop-blur-md"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute right-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white/20 active:scale-95 cursor-pointer"
              aria-label="Close enlarged view"
            >
              <X size={24} strokeWidth={2.5} />
            </button>

            {/* Title / Info banner at the top */}
            <div className="absolute top-6 left-6 z-50 flex flex-col gap-1 text-white select-none">
              <span className="font-sans text-xs font-black uppercase tracking-wider text-blue-400">
                {project.title}
              </span>
              <h3 className="font-sans text-lg font-bold tracking-tight text-white/90">
                {activeMedia.label}
              </h3>
            </div>

            {/* Centered Large Media Container */}
            <div 
              className="relative flex h-[75vh] w-[90vw] items-center justify-center select-none max-w-7xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`lightbox-media-${activeMediaIndex}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="flex h-full w-full items-center justify-center"
                >
                  <ImageWithFallback 
                    url={activeMedia.url} 
                    projectId={project.id} 
                    alt={activeMedia.label || project.title} 
                    className="max-h-full max-w-full rounded-lg object-contain shadow-2xl bg-transparent" 
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation and counter at bottom */}
            <div 
              className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Counter */}
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-sm font-bold text-white/90 backdrop-blur-xl">
                {activeMediaIndex + 1} / {mediaList.length}
              </div>

              {/* Navigation controls */}
              {mediaList.length > 1 && (
                <div className="flex items-center gap-8">
                  <button 
                    onClick={handlePrevMedia} 
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white/20 active:scale-95 cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={handleNextMedia} 
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white/20 active:scale-95 cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Sandbox Popup Modal Overlay */}
      <AnimatePresence>
        {isSandboxActive && project.liveDemoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 backdrop-blur-2xl"
            onClick={(e) => {
              e.stopPropagation();
              setIsSandboxActive(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200/20 bg-[#070913] text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mock Browser Header Bar */}
              <div className="flex items-center justify-between bg-[#0e1321] px-4 py-3 border-b border-white/5 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 transition-transform hover:scale-110 cursor-pointer" onClick={() => setIsSandboxActive(false)} title="Close Sandbox" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>

                {/* Browser URL Address Bar with refresh / copy indicators */}
                <div className="flex-1 max-w-lg mx-4 bg-slate-950/80 border border-white/5 rounded-lg px-3.5 py-1.5 flex items-center justify-between gap-2 text-xs text-slate-400 font-mono truncate">
                  <div className="flex items-center gap-2 truncate">
                    <Globe size={13} className="text-blue-400 shrink-0" />
                    <span className="truncate select-all">{project.liveDemoUrl}</span>
                  </div>
                  {/* Small reload action */}
                  <button 
                    onClick={() => {
                      setIsIframeLoading(true);
                      setIframeKey((prev) => prev + 1);
                    }}
                    className="p-1 text-slate-500 hover:text-[#26F0C4] transition-colors rounded hover:bg-white/5 cursor-pointer"
                    title="Refresh Sandbox Frame"
                  >
                    <RefreshCw size={12} className={isIframeLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                {/* Quick actions container */}
                <div className="flex items-center gap-2">
                  {!isCustomSandbox && (
                    <a 
                      href={project.liveDemoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-black text-slate-300 hover:text-[#26F0C4] border border-white/10 transition-all active:scale-[0.97] cursor-pointer"
                      title="Open app in a new window/tab"
                    >
                      <ExternalLink size={12} />
                      <span className="hidden sm:inline">Open New Tab</span>
                    </a>
                  )}
                  <button
                    onClick={() => setIsSandboxActive(false)}
                    className="h-8 px-3.5 rounded-lg font-black text-xs bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <X size={12} strokeWidth={2.5} />
                    <span>Exit</span>
                  </button>
                </div>
              </div>

              {/* Secondary Utility & Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a0d18] px-4 py-2.5 border-b border-white/5 select-none shrink-0">
                {/* 1. Viewport Presets Toggle */}
                <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setSandboxViewport('desktop')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      sandboxViewport === 'desktop'
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                        : "text-slate-400 hover:text-white border border-transparent"
                    }`}
                  >
                    <Monitor size={12} />
                    <span>Desktop</span>
                  </button>
                  <button
                    onClick={() => setSandboxViewport('tablet')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      sandboxViewport === 'tablet'
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                        : "text-slate-400 hover:text-white border border-transparent"
                    }`}
                  >
                    <Tablet size={12} />
                    <span>Tablet</span>
                  </button>
                  <button
                    onClick={() => setSandboxViewport('mobile')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      sandboxViewport === 'mobile'
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                        : "text-slate-400 hover:text-white border border-transparent"
                    }`}
                  >
                    <Smartphone size={12} />
                    <span>Mobile</span>
                  </button>
                </div>

                {/* 2. Enhanced Status & Domain Badging */}
                <div className="flex items-center flex-wrap gap-2.5 text-[10px] md:text-[11px]">
                  <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-2.5 py-1 font-medium">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span>SECURE TUNNEL ACTIVE</span>
                  </span>

                  <span className="hidden sm:inline-flex items-center gap-1 bg-white/5 border border-white/10 text-slate-300 rounded-lg px-2.5 py-1">
                    <Lock size={10} className="text-emerald-400" />
                    <span>TLS 1.3 Certified</span>
                  </span>

                  <span className="hidden lg:inline-flex items-center gap-1 bg-white/5 border border-white/10 text-slate-300 rounded-lg px-2.5 py-1">
                    <Globe size={10} className="text-indigo-400" />
                    <span>Render Edge Network</span>
                  </span>
                </div>

                {/* 3. Control Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-black text-slate-300 transition-all border border-white/10 cursor-pointer active:scale-[0.97]"
                    title="Copy full Live Demo URL to clipboard"
                  >
                    {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{isCopied ? "Copied URL!" : "Copy Link"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsIframeLoading(true);
                      setIframeKey((prev) => prev + 1);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-black text-slate-300 transition-all border border-white/10 cursor-pointer active:scale-[0.97]"
                    title="Force refresh sandbox connection"
                  >
                    <RefreshCw size={12} className={isIframeLoading ? "animate-spin" : ""} />
                    <span>Reload App</span>
                  </button>
                </div>
              </div>

              {/* Sandbox Frame Container */}
              <div className="flex-1 min-h-0 relative bg-slate-900/40 p-4 md:p-6 flex items-center justify-center">
                <div 
                  className={`relative h-full transition-all duration-300 ${isCustomSandbox ? "bg-[#05070e]" : "bg-white"} ${
                    sandboxViewport === "desktop"
                      ? "w-full rounded-none"
                      : sandboxViewport === "tablet"
                      ? "w-[768px] max-w-full rounded-xl border-4 border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
                      : "w-[375px] max-w-full rounded-[2.5rem] border-[12px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
                  }`}
                >
                  {isIframeLoading && !isCustomSandbox && (
                    <div className="absolute inset-0 bg-[#080b12] flex flex-col items-center justify-center gap-3 z-30 rounded-none">
                      <div className="w-9 h-9 rounded-full border-2 border-[#26F0C4] border-t-transparent animate-spin" />
                      <p className="text-xs font-mono text-slate-400 tracking-widest uppercase animate-pulse">Initializing Sandbox Environment...</p>
                      <p className="text-[10px] font-sans text-slate-500 max-w-xs text-center">Loading full app console from secure Render host network.</p>
                    </div>
                  )}
                  {isWazuh ? (
                    <WazuhIncidentResponseDashboard key={iframeKey} />
                  ) : isCiscoIse ? (
                    <CiscoIseVisualizer key={iframeKey} />
                  ) : (
                    <iframe
                      key={iframeKey}
                      src={project.liveDemoUrl}
                      title={`${project.title} live interactive sandbox`}
                      className={`w-full h-full border-0 bg-white ${
                        sandboxViewport === "desktop"
                          ? "rounded-none"
                          : sandboxViewport === "tablet"
                          ? "rounded-lg"
                          : "rounded-[1.75rem]"
                      }`}
                      sandbox="allow-scripts allow-same-origin allow-forms"
                      onLoad={() => setIsIframeLoading(false)}
                      referrerPolicy="no-referrer"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SLUG_TO_ID: Record<string, string> = {
  'home-soc-lab': 'project-home-soc-lab',
  'aura-tic-tac-toe': 'project-aura-ttt',
  'admin-dashboard': 'project-admin-dashboard',
  'enterprise-nac-lab': 'project-enterprise-nac',
  'hse-vaccination-security': 'project-hse-vax',
  'enterprise-network-lab': 'project-network-lab'
};

const ID_TO_SLUG: Record<string, string> = {
  'project-home-soc-lab': 'home-soc-lab',
  'project-aura-ttt': 'aura-tic-tac-toe',
  'project-admin-dashboard': 'admin-dashboard',
  'project-enterprise-nac': 'enterprise-nac-lab',
  'project-hse-vax': 'hse-vaccination-security',
  'project-network-lab': 'enterprise-network-lab'
};

const ProjectsSection: React.FC = () => {
  const { t, language } = useI18n();
  const { addPoints } = useStreak();
  const projects = useMemo(
    () => getContent<Project[]>("projects", language) || [],
    [language],
  );

  const [selectedProject, setSelectedProject] = useState<Project | null>(() => {
    const match = window.location.pathname.match(/^\/projects\/([^/]+)/);
    if (match) {
      const slug = match[1];
      const projId = SLUG_TO_ID[slug] || slug;
      return projects.find(p => p.id === projId) || null;
    }
    return null;
  });

  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    const match = window.location.pathname.match(/^\/projects\/([^/]+)/);
    if (match) {
      const slug = match[1];
      const projId = SLUG_TO_ID[slug] || slug;
      const idx = projects.findIndex(p => p.id === projId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const [showAll, setShowAll] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const isFr = language === "fr";
  const sectionTitle = isFr ? "Sélection\nde projets" : "Selected\nwork";
  const seeAllLabel = showAll
    ? isFr
      ? "Moins de projets"
      : "Show Less"
    : isFr
      ? "Tout Voir"
      : "See All";

  const firstProject = useMemo(() => projects[0] || null, [projects]);

  const remainingProjects = useMemo(() => {
    if (projects.length <= 1) return [];
    const rest = projects.slice(1);
    return showAll ? rest : rest.slice(0, 2);
  }, [projects, showAll]);

  // Synchronize component state with browser navigation changes (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/^\/projects\/([^/]+)/);
      if (match) {
        const slug = match[1];
        const projId = SLUG_TO_ID[slug] || slug;
        const proj = projects.find(p => p.id === projId) || null;
        const idx = projects.findIndex(p => p.id === projId);
        setSelectedProject(proj);
        if (idx >= 0) setSelectedIndex(idx);
      } else {
        setSelectedProject(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [projects]);

  const handleOpenModal = (project: Project, index: number) => {
    setSelectedProject(project);
    setSelectedIndex(index);
    AnalyticsTracker.trackProjectClick(project.id);
    addPoints(10, 'view_project');

    // Update the URL to the SEO-friendly URL
    const slug = ID_TO_SLUG[project.id] || project.id;
    window.history.pushState(null, "", `/projects/${slug}`);
  };

  const handleClose = (triggerElement: HTMLElement | null) => {
    triggerElement?.focus();
    setSelectedProject(null);

    // Update URL back to sections
    window.history.pushState(null, "", "/#projects");
  };

  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [selectedProject]);

  return (
    <Section id="projects" title={t("projects_title")} overflowVisible={true}>
      <div ref={sectionRef} className="pt-6">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 xl:gap-20 items-start">
          {/* Sticky Sidebar Matches Mockup Perfectly */}
          <div className="w-full lg:w-[28%] lg:sticky lg:top-28 flex flex-col gap-6 lg:gap-8 items-start text-left">
            <motion.h3
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-light-text dark:text-dark-text leading-[1.08] text-left uppercase lg:max-w-xs whitespace-pre-line"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {sectionTitle}
            </motion.h3>

            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400/80 font-sans leading-relaxed">
              {language === "fr"
                ? "Une vitrine de mes architectures de sécurité clés, de mes moteurs d'automatisation et de mes intégrations de réseaux défensifs de haut niveau."
                : "A curated workspace showcasing my core security architectures, robust automation playbooks, and high-stakes network defense integrations."}
            </p>

            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 px-[1.5rem] py-[0.625rem] rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 w-auto select-none shadow-sm hover:shadow-md cursor-pointer border border-transparent active:scale-95"
            >
              {seeAllLabel}
            </button>
          </div>

          {/* Bento / Asymmetric Grid Column Matches Mockup Perfectly */}
          <div className="w-full lg:w-[72%] flex flex-col gap-12 lg:gap-16">
            {/* Featured Hero Card (1st Project) */}
            {firstProject && (
              <PremiumProjectCard
                project={firstProject}
                index={0}
                onClick={() => handleOpenModal(firstProject, 0)}
                isLarge={true}
              />
            )}

            {/* Staggered Remaining Cards (and Expanded Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-14">
              <AnimatePresence mode="popLayout">
                {remainingProjects.map((project, index) => (
                  <PremiumProjectCard
                    key={project.id}
                    project={project}
                    index={index + 1}
                    onClick={() => handleOpenModal(project, index + 1)}
                    isLarge={false}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedProject && (
          <ProjectDossier
            project={selectedProject}
            projectNumber={String(selectedIndex + 1).padStart(2, "0")}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </Section>
  );
};

export default ProjectsSection;
