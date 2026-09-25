/**
 * AIOrb.ts
 *
 * State-of-the-Art Autonomous Holographic AI Chatbot Avatar
 *
 * Full Capability Matrix:
 * 1. Interactive 3D Parallax & Gaze Tracking:
 *    - Continuous pointer & touch tracking relative to avatar origin.
 *    - Spring-damped 2.5D multi-plane depth refraction.
 *    - Organic Idle Micro-Saccades (lifelike glance-darting when idle).
 *
 * 2. Context-Aware Dynamic Weather & Environment Reflections:
 *    - Dynamic Glass Condensation / Fog Effect: In deep rest/sleep or prolonged idle,
 *      a translucent condensation vapor forms over the outer glass surface with micro-droplets.
 *      Petting / scrubbing with the cursor wipes away the condensation in real time!
 *    - Ambient Day / Night & Threat Weather Lighting:
 *      * Dawn (05:00 - 08:59): Crisp sunrise sky & rose gold
 *      * Day (09:00 - 17:59): Crystalline azure-cyan & ultraviolet
 *      * Sunset / Dusk (18:00 - 21:59): Violet-magenta & ember amber
 *      * Night (22:00 - 04:59): Deep midnight electric indigo & sapphire
 *      * Tactical Threat Storm: In "alert" mode or night security events, subtle specular
 *        cyber-lightning ion streaks shimmer across the glass sphere.
 *    - Battery / Eco Power Integration: Checks Battery API (if supported) for low-power amber pulse.
 *
 * 3. Kinematic & Physics Refinements:
 *    - Elastic Pupil / Eye Capsule Dilation: Startle response dilates eyes when sudden pointer
 *      movement is detected, smoothly relaxing back to biological baseline.
 *    - Gravitational Liquid Visor Core: A subtle fluid meniscus layer shifts against gravity
 *      reacting to device orientation / gyroscope tilt and inertia.
 *    - Interactive Drag & Toss (Spring Inertial Rebound): Users can click and drag the orb
 *      off-center; releasing causes realistic damped harmonic oscillation (squash, stretch, overshoot).
 *    - Spring-Damped Hooke's Law body squish on hover/tap.
 *
 * 4. Emotion State Crown Particle Systems & Visor Micro-Expressions:
 *    - Crown particles are strictly EMOTION/STATE EFFECTS (hidden during clean idle/neutral):
 *      * "curious": Questioning cyan/amber halo sparks rising with quizzical raised brow.
 *      * "analytical": Data stream matrix particles & laser scanline sweep beam.
 *      * "alert": Tactical crimson & amber threat flares with perimeter warning pulses.
 *      * "playful": Prismatic neon confetti sparkles floating playfully with cheeky wink.
 *      * "success": Radiant emerald/mint aurora crown floating upward with joyful crescent eyes.
 *      * "thinking": Orbital vortex particles swirling inward as the AI processes logic.
 *      * "speaking": Harmonic voice-wave resonance particles pulsating with speech cadence.
 *      * "happy": Euphoric golden-green celebratory crown blooming outward.
 *      * "error": Fiery magenta/ruby embers crackling outward with tilted glitch eyes.
 *
 * 5. Spatial Gyroscope & Mobile Physics (Haptic Tilt):
 *    - DeviceOrientationEvent (gamma: roll, beta: pitch) listening on mobile/tablet.
 *    - Multi-plane liquid-damping inertia: visor display, eyes, and particle crown float and
 *      counteract device physical orientation like liquid in a snowglobe.
 *    - Haptic feedback integration (navigator.vibrate) on tap, drag release, and state shifts.
 *
 * 6. Tactile Display & Glass Physics + Petting / Scratching Reaction:
 *    - CRT Phosphor Persistence (Ghosting Trail) with exponential decay.
 *    - CRT Refresh Wave scanline luminescence.
 *    - Petting / Scratching Easter Egg: Rapid scrubbing cleans glass fog, purrs with squishy bounce,
 *      smiling crescent eyes (`^ ^`), and celebratory burst sparkles.
 *
 * 7. Idle Sleep / Rest Mode:
 *    - 45s inactivity countdown to tranquil slumber (`‿ ‿`).
 *    - Instant wake surprise with alert double-blink.
 *
 * 8. Shake-to-Dizzy Reaction:
 *    - Rapid pointer shake / erratic agitation or mobile device shake (`DeviceMotionEvent`) triggers
 *      a comical, dizzy state (`dizzy`): spinning hypnotic spiral eyes (`@ @`), tilted head wobble,
 *      orbiting golden constellation cartoon stars crown, and haptic buzz.
 *
 * 9. Retro Cyberpunk Wireframe Hologram Mode:
 *    - Vector-drawn holographic wireframe aesthetic: renders latitude & longitude geodesic sphere rings,
 *      phosphor radar crosshair reticles, vector-stroked neon visor contour, and cybernetic digital gaze.
 *    - Toggleable dynamically or through options.
 *
 * 10. Conversational Cognition & Sentiment Micro-Expressions:
 *    - Sentiment & intent analyzer maps user inquiries and bot responses into nuanced facial micro-expressions:
 *      * "curious": raised brow, tilted quizzical gaze, cyan questioning sparks.
 *      * "analytical": focused visor laser sweep beam, data stream particle rain.
 *      * "alert": crimson threat detection eye flare, flashing perimeter warnings.
 *      * "playful": cheerful single-eye wink, prismatic confetti sparkle burst.
 *      * "success": smiling crescent eyes (`^ ^`), emerald aurora crown.
 *      * "dizzy": spiraling vector vortex eyes, spinning star halo.
 */

export type AIOrbState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "happy"
  | "error"
  | "sleep"
  | "dizzy";

export type AIOrbEmotion =
  | "neutral"
  | "curious"     // Quizzical one-eye raised & questioning sparks
  | "analytical"  // Laser horizontal scanning sweep & data glyphs
  | "alert"       // Security warning / crimson-amber perimeter flares
  | "playful"     // Cheeky single-eye wink & neon confetti
  | "success"     // Emerald mint check & aurora crown
  | "dizzy";      // Spiral swirly eyes & stars after shaking

export interface AIOrbOptions {
  size?: number;
  particleCount?: number;
  background?: string;
  reducedMotion?: boolean;
  wireframeMode?: boolean; // Retro Cyberpunk Wireframe Mode
  noCircleBorder?: boolean; // When true, removes the circular boundary/rim so avatar flows in container
}

interface EmotionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  phase: number;
  speed: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
}

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface PhosphorGhost {
  leftX: number;
  rightX: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  color: string;
}

interface LightningStreak {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class AIOrb {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private state: AIOrbState = "idle";
  private prevState: AIOrbState = "idle";

  // Micro-Expression Emotion
  private emotion: AIOrbEmotion = "neutral";
  private emotionTimer = 0;
  private emotionDuration = 0;

  // Crown emotion intensity transition (0 = completely invisible, 1 = full radiance)
  private crownIntensity = 0;
  private currentCrownType: string = "none";

  // Retro Cyberpunk Wireframe Mode
  private wireframeMode = false;
  private wireframeScanlineY = 0;

  // Seamless / Frameless Mode: removes circular clipping and outer rim stroke so avatar flows in container
  private noCircleBorder = false;

  // Shake-to-Dizzy Reaction
  private isDizzy = false;
  private dizzyTimer = 0;
  private readonly DIZZY_DURATION = 3.8;
  private dizzyShakeAccumulator = 0;
  private dizzySpinAngle = 0;
  private lastMotionAccel = { x: 0, y: 0, z: 0 };
  private onDeviceMotionBound: (e: DeviceMotionEvent) => void;

  private size: number;
  private background: string;

  private emotionParticles: EmotionParticle[] = [];
  private burstSparkles: SparkleParticle[] = [];
  private lightningStreaks: LightningStreak[] = [];

  private time = 0;
  private lastTime = 0;

  // =====================================================
  // 1. INTERACTIVE 3D PARALLAX & GAZE TRACKING
  // =====================================================
  private targetLookX = 0; // Normalized: -1 to 1
  private targetLookY = 0; // Normalized: -1 to 1
  private currentLookX = 0;
  private currentLookY = 0;
  private lookVelocityX = 0; // 2nd-order critically damped gaze pursuit velocity
  private lookVelocityY = 0;
  private touchLingerTimer = 0; // Soft linger after touch release before resting

  private lastInteractionTime = 0;
  private isPointerActive = false;
  private prevPointerX = 0;
  private prevPointerY = 0;

  // Idle micro-saccades (organic wandering glances)
  private saccadeTimer = 0;
  private nextSaccadeInterval = 3.5;
  private saccadeDuration = 0.9;
  private saccadeProgress = 1;
  private saccadeOffsetX = 0;
  private saccadeOffsetY = 0;

  // Bound pointer & sensor listeners for clean teardown
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerLeaveBound: () => void;
  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;
  private onMouseEnterBound: () => void;
  private onMouseLeaveBound: () => void;
  private onOrientationBound: (e: DeviceOrientationEvent) => void;

  // =====================================================
  // 2. CONTEXT-AWARE WEATHER & ENVIRONMENT REFLECTIONS
  // =====================================================
  // Dynamic Glass Condensation / Fog (Increases in deep rest or cold, wiped by scrubbing)
  private fogDensity = 0; // 0 to 1
  private fogWipedAlpha = 1; // 1 = fully fogged, 0 = wiped clean
  private fogCleanTimer = 0;
  // Battery / Eco-Power state
  private isLowBattery = false;
  // Threat / Night Storm Lightning timer
  private lightningTimer = 0;

  // =====================================================
  // 3. KINEMATIC & PHYSICS REFINEMENTS
  // =====================================================
  // Startle & Pupil Dilation
  private pupilDilation = 1; // 1 = baseline, up to 1.35 on startle
  private startleTimer = 0;

  // Gravitational Liquid Visor Core
  private liquidLevelY = 0;
  private liquidWavePhase = 0;

  // Interactive Drag & Toss (Inertial Spring Rebound)
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private orbOffsetX = 0;
  private orbOffsetY = 0;
  private orbVelocityX = 0;
  private orbVelocityY = 0;

  // Conversational Body Language
  private isTyping = false;
  private typingTilt = 0;

  // Nod animation ("Aha!" comprehension spark / Wake nod)
  private nodActive = false;
  private nodTimer = 0;
  private readonly NOD_DURATION = 0.32;
  private nodOffset = 0;
  private nodEyeBloom = 0;

  // Biological Kinematics & Blinks
  private eyeBlinkProgress = 1;
  private isBlinking = false;
  private blinkTimer = 0;
  private nextBlinkInterval = 3.2;
  private isDoubleBlinkPending = false;
  private animatedEyeHeight = 46; // Smooth interpolated eye height across states

  // Spring squish on hover/tap
  private scaleX = 1;
  private scaleY = 1;
  private scaleVelocityX = 0;
  private scaleVelocityY = 0;

  // =====================================================
  // ADVANCED CYBERSECURITY & BEHAVIORAL STATES
  // =====================================================
  // 1. Shield Lock / Security Verification Confirmation
  private shieldLockTimer = 0;
  private readonly SHIELD_LOCK_DURATION = 1.4;

  // 2. Threat Alert / Tactical Recon HUD
  private threatAlertTimer = 0;
  private readonly THREAT_ALERT_DURATION = 2.4;

  // 3. Decryption / Code Stream Visor Shimmer
  private isStreaming = false;

  // 4. Curious Head-Tilt Kinematics (tiltZ)
  private curiousTilt = 0;
  private curiousTiltTarget = 0;

  // 5. Proximity Pupil Dilation & Luminescence Bloom
  private proximityDilation = 0;
  private proximityBloom = 0;

  // 6. Fast Mouse Sweep Double-Take
  private doubleTakeTimer = 0;
  private doubleTakeCooldown = 0;

  // 7. Voice / Audio Syllable-Reactive Energy
  private speechEnergy = 0;
  private targetSpeechEnergy = 0;

  // 8. Listening Radar Ripples Phase
  private radarRipplePhase = 0;

  // =====================================================
  // 4. SPATIAL GYROSCOPE & MOBILE TILT PHYSICS
  // =====================================================
  private gyroTiltX = 0; // Filtered roll (-1 to 1)
  private gyroTiltY = 0; // Filtered pitch (-1 to 1)
  private targetGyroX = 0;
  private targetGyroY = 0;
  private hasGyro = false;

  // =====================================================
  // 5. TACTILE DISPLAY, GLASS PHYSICS & PETTING REACTION
  // =====================================================
  private isHovered = false;
  private hoverGlintAlpha = 0;

  // CRT scanline sweep progress
  private scanlineProgress = 0;

  // CRT phosphor persistence (ghosting decay trail)
  private phosphorGhosts: PhosphorGhost[] = [];
  private readonly MAX_PHOSPHOR_FRAMES = 5;

  // Petting / Scratching Detection
  private petVelocityAccumulator = 0;
  private petLastX = 0;
  private petLastY = 0;
  private petLastTime = 0;
  private isBeingPetted = false;
  private petPurrTimer = 0;

  // =====================================================
  // 6. IDLE SLEEP / REST MODE
  // =====================================================
  private isSleeping = false;
  private sleepProgress = 0;
  private readonly SLEEP_THRESHOLD = 45;
  private wakeSurpriseTimer = 0;

  // Pre-rendered offscreen dot-matrix texture for 60fps performance
  private dotMatrixCanvas: HTMLCanvasElement | null = null;
  private dotMatrixCtx: CanvasRenderingContext2D | null = null;
  private readonly VISOR_W = 264;
  private readonly VISOR_H = 134;
  private readonly VISOR_R = 48;

  private frame: number | null = null;
  private destroyed = false;
  private reducedMotion: boolean;

  private readonly BASE_SIZE = 500;
  private maxParticleCapacity: number;

  constructor(selector: string | HTMLElement, options: AIOrbOptions = {}) {
    const element =
      typeof selector === "string"
        ? document.querySelector<HTMLElement>(selector)
        : selector;

    if (!element) {
      throw new Error("AIOrb: Container not found.");
    }

    this.container = element;
    this.size = options.size ?? 320;
    this.background = options.background ?? "transparent";
    this.maxParticleCapacity = options.particleCount ?? 80;
    this.wireframeMode = options.wireframeMode ?? false;
    this.noCircleBorder = options.noCircleBorder ?? false;

    this.reducedMotion =
      options.reducedMotion ??
      (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    this.canvas = document.createElement("canvas");
    const context = this.canvas.getContext("2d");

    if (!context) {
      throw new Error("AIOrb: Canvas 2D unavailable.");
    }

    this.ctx = context;

    this.setupCanvas();
    this.initDotMatrixTexture();

    // Bind event listeners
    this.onPointerMoveBound = this.handlePointerMove.bind(this);
    this.onPointerLeaveBound = this.handlePointerLeave.bind(this);
    this.onPointerDownBound = this.handlePointerDown.bind(this);
    this.onPointerUpBound = this.handlePointerUp.bind(this);
    this.onMouseEnterBound = this.handleMouseEnter.bind(this);
    this.onMouseLeaveBound = this.handleMouseLeave.bind(this);
    this.onOrientationBound = this.handleDeviceOrientation.bind(this);
    this.onDeviceMotionBound = this.handleDeviceMotion.bind(this);

    this.lastInteractionTime = performance.now();
    this.setupInteractivity();
    this.initBatteryCheck();

    this.animate = this.animate.bind(this);

    if (this.reducedMotion) {
      this.draw();
    } else {
      this.frame = requestAnimationFrame(this.animate);
    }
  }

  // =====================================================
  // CANVAS INITIALIZATION & SENSORS / INTERACTIVITY SETUP
  // =====================================================

  private setupCanvas(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    this.canvas.width = this.BASE_SIZE * dpr;
    this.canvas.height = this.BASE_SIZE * dpr;

    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    this.canvas.style.touchAction = "none";

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.container.style.width = `${this.size}px`;
    this.container.style.height = `${this.size}px`;
    this.container.style.background = this.background;
    this.container.style.userSelect = "none";

    this.container.appendChild(this.canvas);
  }

  private setupInteractivity(): void {
    if (typeof window === "undefined" || this.reducedMotion) return;

    window.addEventListener("pointermove", this.onPointerMoveBound, { passive: true });
    window.addEventListener("pointerleave", this.onPointerLeaveBound, { passive: true });
    window.addEventListener("blur", this.onPointerLeaveBound, { passive: true });
    this.container.addEventListener("pointerdown", this.onPointerDownBound, { passive: false });
    window.addEventListener("pointerup", this.onPointerUpBound, { passive: true });
    this.container.addEventListener("mouseenter", this.onMouseEnterBound, { passive: true });
    this.container.addEventListener("mouseleave", this.onMouseLeaveBound, { passive: true });

    // Gyroscope / Device Orientation on mobile & tablets
    if ("DeviceOrientationEvent" in window) {
      try {
        window.addEventListener("deviceorientation", this.onOrientationBound, { passive: true });
      } catch (e) {
        // Non-fatal if unsupported
      }
    }

    // Accelerometer / Device Motion (Shake-to-Dizzy detection)
    if ("DeviceMotionEvent" in window) {
      try {
        window.addEventListener("devicemotion", this.onDeviceMotionBound, { passive: true });
      } catch (e) {
        // Non-fatal if unsupported
      }
    }
  }

  private handleDeviceMotion(e: DeviceMotionEvent): void {
    if (this.destroyed || this.reducedMotion) return;
    const accel = e.accelerationIncludingGravity || e.acceleration;
    if (!accel || accel.x === null || accel.y === null || accel.z === null) return;

    const dx = Math.abs(accel.x - this.lastMotionAccel.x);
    const dy = Math.abs(accel.y - this.lastMotionAccel.y);
    const dz = Math.abs(accel.z - this.lastMotionAccel.z);

    this.lastMotionAccel = { x: accel.x, y: accel.y, z: accel.z };

    // Detect sudden acceleration jerks indicative of physical shaking
    const totalDelta = dx + dy + dz;
    if (totalDelta > 18) {
      this.dizzyShakeAccumulator += totalDelta * 0.15;
      if (this.dizzyShakeAccumulator > 12 && !this.isDizzy) {
        this.triggerDizzy();
        this.dizzyShakeAccumulator = 0;
      }
    }
  }

  public triggerDizzy(): void {
    if (this.reducedMotion) return;
    this.isDizzy = true;
    this.dizzyTimer = this.DIZZY_DURATION;
    this.setState("dizzy");
    this.setEmotion("dizzy", this.DIZZY_DURATION);
    this.triggerHaptic(60);

    // Spring wobble shockwave
    this.scaleVelocityX += 0.12;
    this.scaleVelocityY -= 0.12;

    // Spawn constellation star particles around head
    this.spawnEmotionParticles("dizzy");
  }

  private initBatteryCheck(): void {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      try {
        (navigator as any).getBattery().then((battery: any) => {
          if (battery) {
            this.isLowBattery = battery.level <= 0.2 && !battery.charging;
            battery.addEventListener("levelchange", () => {
              this.isLowBattery = battery.level <= 0.2 && !battery.charging;
            });
            battery.addEventListener("chargingchange", () => {
              this.isLowBattery = battery.level <= 0.2 && !battery.charging;
            });
          }
        });
      } catch (e) {
        // Battery status API optional
      }
    }
  }

  private triggerHaptic(duration = 15): void {
    if (typeof navigator !== "undefined" && "vibrate" in navigator && !this.reducedMotion) {
      try {
        navigator.vibrate(duration);
      } catch (e) {
        // Ignored if user has not interacted
      }
    }
  }

  private handleDeviceOrientation(e: DeviceOrientationEvent): void {
    if (this.destroyed || this.reducedMotion || e.gamma === null || e.beta === null) return;
    this.hasGyro = true;

    const roll = Math.max(-1, Math.min(1, e.gamma / 45));
    const pitch = Math.max(-1, Math.min(1, (e.beta - 40) / 45));

    this.targetGyroX = roll;
    this.targetGyroY = pitch;
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.destroyed || this.reducedMotion) return;

    const now = performance.now();
    this.lastInteractionTime = now;
    if (this.isSleeping) {
      this.wake();
    }

    const rect = this.container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    // KINEMATICS: INTERACTIVE DRAG & TOSS
    if (this.isDragging) {
      const scale = this.BASE_SIZE / Math.max(1, this.size);
      const curDragX = (e.clientX - this.dragStartX) * scale;
      const curDragY = (e.clientY - this.dragStartY) * scale;

      // Limit drag displacement with soft clamping
      const dragDist = Math.hypot(curDragX, curDragY);
      const maxDrag = 140;
      const dragFactor = dragDist > maxDrag ? maxDrag / dragDist : 1;

      this.orbOffsetX = curDragX * dragFactor;
      this.orbOffsetY = curDragY * dragFactor;

      // Calculate instantaneous drag velocity for release fling
      const dt = Math.max(1, now - (this.petLastTime || now));
      this.orbVelocityX = (e.clientX - this.prevPointerX) * scale * (16 / dt) * 1.8;
      this.orbVelocityY = (e.clientY - this.prevPointerY) * scale * (16 / dt) * 1.8;

      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      return;
    }

    // KINEMATICS: PUPIL DILATION STARTLE & SHAKE-TO-DIZZY DETECTION
    if (this.prevPointerX > 0) {
      const pointerSpeed = Math.hypot(e.clientX - this.prevPointerX, e.clientY - this.prevPointerY);
      if (pointerSpeed > 55 && dist < rect.width * 0.9) {
        // Sudden close dart startles pupil dilation
        this.pupilDilation = Math.min(1.35, this.pupilDilation + 0.12);
        this.startleTimer = 1.2;
      }

      // Fast Mouse Sweep Double-Take Reaction
      if (pointerSpeed > 85 && this.doubleTakeCooldown <= 0 && !this.reducedMotion && dist < rect.width * 2.2) {
        this.triggerDoubleTake();
      }

      // Erratic rapid shaking detection with pointer/mouse
      if (pointerSpeed > 75 && dist < rect.width * 0.85) {
        this.dizzyShakeAccumulator += pointerSpeed * 0.018;
        if (this.dizzyShakeAccumulator > 15 && !this.isDizzy) {
          this.triggerDizzy();
          this.dizzyShakeAccumulator = 0;
        }
      } else {
        this.dizzyShakeAccumulator = Math.max(0, this.dizzyShakeAccumulator - 0.25);
      }
    }
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;

    // Proximity Pupil Dilation & Luminescent Bloom:
    // When cursor approaches near the orb, eyes dilate with living awareness
    const proximityThreshold = Math.max(70, rect.width * 0.65);
    if (dist < proximityThreshold) {
      const prox = Math.max(0, 1 - dist / proximityThreshold);
      this.proximityDilation = prox * 0.26;
      this.proximityBloom = prox * 10;
    } else {
      this.proximityDilation = 0;
      this.proximityBloom = 0;
    }

    // PETTING / SCRATCHING & FOG CLEANING DETECTION (ROUND SQUARE BOX):
    const isOverOrb = Math.abs(dx) < rect.width * 0.48 && Math.abs(dy) < rect.height * 0.48;
    if (isOverOrb) {
      // Clean glass fog on hover/scrub
      if (this.fogDensity > 0.05) {
        this.fogWipedAlpha = Math.max(0, this.fogWipedAlpha - 0.08);
        this.fogCleanTimer = 8.0; // Keeps fog clean for 8 seconds after wiping
      }

      if (this.petLastTime > 0) {
        const dt = Math.max(1, now - this.petLastTime);
        const moveDist = Math.hypot(e.clientX - this.petLastX, e.clientY - this.petLastY);
        const speed = (moveDist / dt) * 1000;

        if (speed > 450) {
          this.petVelocityAccumulator += speed * 0.002;
          if (this.petVelocityAccumulator > 7) {
            this.triggerPetReaction(e.clientX - rect.left, e.clientY - rect.top);
            this.petVelocityAccumulator = 0;
          }
        } else {
          this.petVelocityAccumulator = Math.max(0, this.petVelocityAccumulator - 0.2);
        }
      }
      this.petLastX = e.clientX;
      this.petLastY = e.clientY;
      this.petLastTime = now;
    } else {
      this.petVelocityAccumulator = 0;
    }

    // ACCURATE & RESPONSIVE GAZE TRACKING
    if (dist < 1) {
      this.targetLookX = 0;
      this.targetLookY = 0;
    } else {
      // Scale tracking radius dynamically with avatar dimensions so both compact
      // launcher avatars and prominent hero/modal avatars respond naturally to pointer movements
      const trackRadius = Math.max(90, Math.min(240, rect.width * 1.5));
      const norm = dist / trackRadius;
      // Exponential saturation curve gives instantaneous, organic response with smooth ceiling at 1.0
      const gazeMagnitude = Math.min(1.0, 1.0 - Math.exp(-norm * 1.6));

      // Unit direction vector pointing directly at cursor position (dx, dy)
      this.targetLookX = (dx / dist) * gazeMagnitude;
      this.targetLookY = (dy / dist) * gazeMagnitude;
    }
    this.isPointerActive = true;
    this.touchLingerTimer = 0;
  }

  private triggerPetReaction(localX: number, localY: number): void {
    this.isBeingPetted = true;
    this.petPurrTimer = 1.6;
    this.triggerHaptic(25);

    // Wipe fog completely when petted
    this.fogWipedAlpha = 0;
    this.fogCleanTimer = 12.0;

    // Cheerful spring wobble
    this.scaleVelocityX += 0.06;
    this.scaleVelocityY -= 0.06;
    this.triggerNod();

    // Spawn vibrant burst sparkles at pet touchpoint
    const scale = this.BASE_SIZE / Math.max(1, this.size);
    const originX = localX * scale;
    const originY = localY * scale;

    const colors = ["#f472b6", "#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#ffffff"];
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.2;
      this.burstSparkles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() * 3.2 + 1.5,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 0.45 + 0.35,
      });
    }
  }

  private handlePointerLeave(): void {
    this.isPointerActive = false;
    this.petVelocityAccumulator = 0;
  }

  private handleMouseEnter(): void {
    this.isHovered = true;
    this.lastInteractionTime = performance.now();
    if (this.isSleeping) {
      this.wake();
    }
    this.scaleVelocityY -= 0.035;
    this.scaleVelocityX += 0.035;
  }

  private handleMouseLeave(): void {
    this.isHovered = false;
    this.scaleVelocityY += 0.02;
    this.scaleVelocityX -= 0.02;
  }

  private handlePointerDown(e: PointerEvent): void {
    this.lastInteractionTime = performance.now();
    if (this.isSleeping) {
      this.wake();
      return;
    }

    const rect = this.container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const isOverOrb = Math.abs(e.clientX - centerX) < rect.width * 0.48 && Math.abs(e.clientY - centerY) < rect.height * 0.48;

    // KINEMATICS: INITIATE INTERACTIVE DRAG & TOSS (ROUND SQUARE BOX)
    if (isOverOrb) {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      this.triggerHaptic(18);

      this.scaleVelocityX += 0.05;
      this.scaleVelocityY -= 0.05;
      this.triggerPetReaction(e.clientX - rect.left, e.clientY - rect.top);
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.triggerHaptic(22);

      // Squish upon fling release
      this.scaleVelocityX += 0.08;
      this.scaleVelocityY -= 0.08;
    } else {
      this.scaleVelocityX -= 0.04;
      this.scaleVelocityY += 0.04;
    }

    if (e.pointerType === "touch") {
      this.touchLingerTimer = 1.8;
    }
  }

  // =====================================================
  // DOT MATRIX VISOR TEXTURE GENERATOR
  // =====================================================

  private initDotMatrixTexture(): void {
    this.dotMatrixCanvas = document.createElement("canvas");
    this.dotMatrixCanvas.width = this.VISOR_W;
    this.dotMatrixCanvas.height = this.VISOR_H;
    this.dotMatrixCtx = this.dotMatrixCanvas.getContext("2d");

    if (!this.dotMatrixCtx) return;

    const ctx = this.dotMatrixCtx;
    ctx.clearRect(0, 0, this.VISOR_W, this.VISOR_H);

    const step = 3.6;
    const dotRadius = 1.35;
    const cx = this.VISOR_W / 2;
    const cy = this.VISOR_H / 2;

    const rx = this.VISOR_W / 2 - 4;
    const ry = this.VISOR_H / 2 - 4;

    for (let x = step / 2; x < this.VISOR_W; x += step) {
      for (let y = step / 2; y < this.VISOR_H; y += step) {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);

        const cornerX = Math.max(0, dx - (rx - this.VISOR_R));
        const cornerY = Math.max(0, dy - (ry - this.VISOR_R));
        const cornerDist = Math.sqrt(cornerX * cornerX + cornerY * cornerY);

        let alpha = 1;
        if (cornerDist > this.VISOR_R) {
          continue;
        } else if (cornerDist > this.VISOR_R - 10) {
          alpha = Math.max(0, (this.VISOR_R - cornerDist) / 10);
        } else {
          const normDistX = dx / rx;
          const normDistY = dy / ry;
          const edgeDist = Math.max(normDistX, normDistY);
          if (edgeDist > 0.75) {
            alpha = Math.max(0.15, 1 - (edgeDist - 0.75) / 0.25);
          }
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // =====================================================
  // EMOTION-SPECIFIC CROWN PARTICLE GENERATOR & CONTROLLER
  // (Only generated & displayed during active emotion/reaction states)
  // =====================================================

  private spawnEmotionParticles(type: string): void {
    this.currentCrownType = type;
    this.emotionParticles = [];

    let count = 45;
    let palette: string[] = [];

    switch (type) {
      case "thinking":
        // Orbital vortex particles swirling inward
        count = Math.min(this.maxParticleCapacity, 50);
        palette = ["#818cf8", "#6366f1", "#a855f7", "#38bdf8", "#c084fc"];
        break;

      case "speaking":
        // Harmonic voice-wave resonance particles
        count = Math.min(this.maxParticleCapacity, 40);
        palette = ["#38bdf8", "#00f0ff", "#a78bfa", "#f472b6", "#ffffff"];
        break;

      case "alert":
        // Tactical crimson & amber threat warning flares
        count = Math.min(this.maxParticleCapacity, 45);
        palette = ["#ef4444", "#f97316", "#fbbf24", "#dc2626", "#f87171"];
        break;

      case "curious":
        // Questioning cyan & amber halo sparks
        count = Math.min(this.maxParticleCapacity, 35);
        palette = ["#38bdf8", "#fbbf24", "#fcd34d", "#0284c7", "#ffffff"];
        break;

      case "analytical":
        // Data stream crystalline matrix particles
        count = Math.min(this.maxParticleCapacity, 50);
        palette = ["#00f0ff", "#06b6d4", "#67e8f9", "#38bdf8", "#a5f3fc"];
        break;

      case "playful":
        // Prismatic neon confetti sparkles
        count = Math.min(this.maxParticleCapacity, 45);
        palette = ["#f472b6", "#a855f7", "#38bdf8", "#34d399", "#fbbf24", "#ec4899"];
        break;

      case "success":
      case "happy":
        // Radiant emerald/mint celebratory aurora crown
        count = Math.min(this.maxParticleCapacity, 50);
        palette = ["#10b981", "#34d399", "#6ee7b7", "#059669", "#a7f3d0", "#ffffff"];
        break;

      case "error":
        // Fiery magenta / ruby glitch embers
        count = Math.min(this.maxParticleCapacity, 40);
        palette = ["#f43f5e", "#e11d48", "#be123c", "#fda4af", "#ff0055"];
        break;

      case "dizzy":
        // Cartoon orbiting golden spinning stars & dizzy constellations
        count = Math.min(this.maxParticleCapacity, 36);
        palette = ["#fde047", "#facc15", "#eab308", "#fef08a", "#ffffff"];
        break;

      default:
        // No crown for neutral / idle / sleep
        this.emotionParticles = [];
        return;
    }

    const sphereX = 250;
    const sphereY = 270;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 1.4 - Math.PI * 1.2;
      const radius = Math.random() * 110 + 40;

      this.emotionParticles.push({
        x: sphereX + Math.cos(angle) * radius,
        y: sphereY - 110 + Math.sin(angle) * 35,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(Math.random() * 0.8 + 0.4),
        size: Math.random() * 2.8 + 1.1,
        alpha: Math.random() * 0.75 + 0.25,
        color: palette[Math.floor(Math.random() * palette.length)],
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.9 + 0.6,
        orbitRadius: radius,
        orbitAngle: angle,
        orbitSpeed: (Math.random() * 0.8 + 0.4) * (Math.random() < 0.5 ? 1 : -1),
      });
    }
  }

  private updateAndDrawEmotionCrown(sphereX: number, sphereY: number, breathExpansion: number, delta: number): void {
    const ctx = this.ctx;
    const t = this.time;

    // Determine current active emotion effect type
    let activeType = "none";
    if (this.isBeingPetted) {
      activeType = "happy";
    } else if (this.state === "thinking" || this.emotion === "analytical") {
      activeType = "thinking";
    } else if (this.emotion !== "neutral") {
      activeType = this.emotion;
    } else if (this.state === "speaking") {
      activeType = "speaking";
    } else if (this.state === "happy") {
      activeType = "happy";
    } else if (this.state === "error") {
      activeType = "error";
    } else if (this.state === "dizzy" || this.isDizzy) {
      activeType = "dizzy";
    }

    // Smoothly transition crownIntensity: 0 = completely invisible, 1 = fully radiant
    const targetIntensity = activeType === "none" || this.sleepProgress > 0.1 ? 0 : 1;
    const lerpSpeed = targetIntensity > this.crownIntensity ? 4.5 : 2.5;
    this.crownIntensity += (targetIntensity - this.crownIntensity) * Math.min(1, delta * lerpSpeed);

    // If active type changed and intensity is needed, respawn themed particles
    if (activeType !== "none" && activeType !== this.currentCrownType) {
      this.spawnEmotionParticles(activeType);
    }

    // Render Crown Particles if intensity > 0
    if (this.crownIntensity > 0.02 && this.emotionParticles.length > 0) {
      const gyroShift = this.gyroTiltX * 14;

      this.emotionParticles.forEach((p) => {
        // Type-specific kinematics
        switch (this.currentCrownType) {
          case "thinking": {
            // Swirling orbital vortex inward
            p.orbitAngle += p.orbitSpeed * delta * 2.2;
            p.orbitRadius = Math.max(30, p.orbitRadius - delta * 12);
            if (p.orbitRadius <= 32) p.orbitRadius = 140;
            p.x = sphereX + Math.cos(p.orbitAngle) * p.orbitRadius + gyroShift * 0.15;
            p.y = sphereY - 110 + Math.sin(p.orbitAngle) * (p.orbitRadius * 0.4);
            break;
          }

          case "speaking": {
            // Harmonic upward wave pulsing
            p.y += p.vy * 1.5;
            p.x += Math.sin(t * 8 + p.phase) * 1.2 + gyroShift * 0.08;
            if (p.y < 40) {
              p.y = sphereY - 80;
              p.x = sphereX + (Math.random() - 0.5) * 160;
            }
            break;
          }

          case "alert": {
            // Rapid radiant warning flares
            p.y += p.vy * 2.2;
            p.x += p.vx * 1.8 + Math.sin(t * 14 + p.phase) * 0.8;
            if (p.y < 35 || p.x < 90 || p.x > 410) {
              const ang = Math.random() * Math.PI * 1.2 - Math.PI * 1.1;
              p.x = sphereX + Math.cos(ang) * (Math.random() * 120 + 40);
              p.y = sphereY - 90 + Math.sin(ang) * 30;
            }
            break;
          }

          case "analytical": {
            // Vertical data stream falling / rising strictly
            p.y += p.vy * 1.2;
            if (p.y < 35) {
              p.y = sphereY - 70;
              p.x = sphereX + (Math.floor(Math.random() * 8) - 4) * 22;
            }
            break;
          }

          case "dizzy": {
            // Constellation halo spinning rapidly around head
            p.orbitAngle += (p.orbitSpeed * 3.5) * delta;
            const orbitR = p.orbitRadius || 85;
            p.x = sphereX + Math.cos(p.orbitAngle) * orbitR + gyroShift * 0.1;
            p.y = sphereY - 105 + Math.sin(p.orbitAngle) * (orbitR * 0.35);
            break;
          }

          default: {
            // Floating aurora / gentle buoyant rising
            p.x += (p.vx + Math.sin(t * 1.8 + p.phase) * 0.25 + gyroShift * 0.05) * breathExpansion;
            p.y += p.vy * 1.1;

            if (p.y < 30 || p.x < 95 || p.x > 405) {
              const angle = Math.random() * Math.PI * 1.2 - Math.PI * 1.1;
              const dist = (Math.random() * 120 + 35) * breathExpansion;
              p.x = sphereX + Math.cos(angle) * dist;
              p.y = sphereY - 95 + Math.sin(angle) * 35;
              p.vy = -(Math.random() * 0.75 + 0.35);
            }
            break;
          }
        }

        const twinkle = Math.sin(t * 4 * p.speed + p.phase);
        const currentAlpha = Math.max(
          0.05,
          p.alpha * (0.6 + 0.4 * twinkle) * this.crownIntensity
        );

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10 * this.crownIntensity;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // Render & update burst sparkles from petting
    if (this.burstSparkles.length > 0) {
      for (let i = this.burstSparkles.length - 1; i >= 0; i--) {
        const s = this.burstSparkles[i];
        s.life += delta;
        if (s.life >= s.maxLife) {
          this.burstSparkles.splice(i, 1);
          continue;
        }

        s.x += s.vx;
        s.y += s.vy;
        s.vy += 2.8 * delta;
        const lifeProgress = s.life / s.maxLife;
        const alpha = (1 - lifeProgress) * 0.9;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        const r = s.size * (1 - lifeProgress * 0.5);
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // =====================================================
  // AMBIENT LIGHTING & DAY / NIGHT / WEATHER REFLECTIONS
  // =====================================================

  private getAmbientLightingTheme(): {
    dayNightShift: { left: string; mid: string; right: string; halo: string };
    period: "dawn" | "day" | "sunset" | "night";
  } {
    // If low battery, shift to energy-saving amber pulse
    if (this.isLowBattery) {
      return {
        period: "night",
        dayNightShift: {
          left: "#d97706",
          mid: "#b45309",
          right: "#f59e0b",
          halo: "rgba(245, 158, 11, 0.35)",
        },
      };
    }

    const hour = new Date().getHours();

    if (hour >= 5 && hour < 9) {
      // Dawn (05:00 - 08:59): Crisp sunrise sky & rose gold
      return {
        period: "dawn",
        dayNightShift: {
          left: "#38bdf8",
          mid: "#ec4899",
          right: "#fbbf24",
          halo: "rgba(236, 72, 153, 0.35)",
        },
      };
    } else if (hour >= 9 && hour < 18) {
      // Day (09:00 - 17:59): Crystalline azure-cyan & ultraviolet
      return {
        period: "day",
        dayNightShift: {
          left: "#00d2ff",
          mid: "#8b5cf6",
          right: "#38bdf8",
          halo: "rgba(139, 92, 246, 0.4)",
        },
      };
    } else if (hour >= 18 && hour < 22) {
      // Sunset / Dusk (18:00 - 21:59): Violet-magenta & ember amber
      return {
        period: "sunset",
        dayNightShift: {
          left: "#a855f7",
          mid: "#f43f5e",
          right: "#f59e0b",
          halo: "rgba(244, 63, 94, 0.38)",
        },
      };
    } else {
      // Night (22:00 - 04:59): Deep electric indigo & midnight sapphire (low eye strain)
      return {
        period: "night",
        dayNightShift: {
          left: "#4f46e5",
          mid: "#3b82f6",
          right: "#06b6d4",
          halo: "rgba(79, 70, 229, 0.3)",
        },
      };
    }
  }

  // =====================================================
  // KINEMATICS: HARMONIC INERTIAL REBOUND & PHYSICS
  // =====================================================

  private updateKinematics(delta: number): void {
    if (this.reducedMotion) {
      this.currentLookX = 0;
      this.currentLookY = 0;
      this.lookVelocityX = 0;
      this.lookVelocityY = 0;
      this.eyeBlinkProgress = 1;
      this.orbOffsetX = 0;
      this.orbOffsetY = 0;
      return;
    }

    const now = performance.now();
    const idleSeconds = (now - this.lastInteractionTime) / 1000;

    // 1. KINEMATICS: HARMONIC DRAG SPRING REBOUND (Hooke's Law Oscillations)
    if (!this.isDragging) {
      const springStiffness = 0.22;
      const springDamping = 0.76;

      const fX = -this.orbOffsetX * springStiffness;
      const fY = -this.orbOffsetY * springStiffness;

      this.orbVelocityX = (this.orbVelocityX + fX) * springDamping;
      this.orbVelocityY = (this.orbVelocityY + fY) * springDamping;

      this.orbOffsetX += this.orbVelocityX;
      this.orbOffsetY += this.orbVelocityY;

      // Inertial squash & stretch upon oscillation
      const speed = Math.hypot(this.orbVelocityX, this.orbVelocityY);
      if (speed > 1.2) {
        this.scaleVelocityY += (this.orbVelocityY * 0.003);
        this.scaleVelocityX -= (this.orbVelocityY * 0.003);
      }
    }

    // 2. KINEMATICS: STARTLE & PUPIL DILATION DECAY
    if (this.startleTimer > 0) {
      this.startleTimer = Math.max(0, this.startleTimer - delta);
    } else if (this.pupilDilation > 1) {
      this.pupilDilation += (1 - this.pupilDilation) * Math.min(1, delta * 3.0);
    }

    // 3. GRAVITATIONAL LIQUID CORE MENISCUS
    this.liquidWavePhase += delta * 2.4;
    const targetLiquidY = this.gyroTiltY * 12 + Math.sin(this.liquidWavePhase) * 1.5;
    this.liquidLevelY += (targetLiquidY - this.liquidLevelY) * 0.1;

    // 4. WEATHER: DYNAMIC CONDENSATION / FOG FORMATION
    // Fog builds up in deep sleep or after 60s idle, cleanTimer holds it off
    if (this.fogCleanTimer > 0) {
      this.fogCleanTimer = Math.max(0, this.fogCleanTimer - delta);
    } else {
      const targetFog = this.isSleeping || idleSeconds > 50 ? 0.85 : 0;
      this.fogDensity += (targetFog - this.fogDensity) * Math.min(1, delta * 0.15);
      // Gradually reset fog wipe layer when fog returns
      if (this.fogDensity > 0.2) {
        this.fogWipedAlpha += (1 - this.fogWipedAlpha) * Math.min(1, delta * 0.12);
      }
    }

    // 5. WEATHER: THREAT / NIGHT STORM LIGHTNING STREAKS
    if (this.emotion === "alert" || (this.state === "idle" && this.getAmbientLightingTheme().period === "night")) {
      this.lightningTimer += delta;
      if (this.lightningTimer > (this.emotion === "alert" ? 2.5 : 9.0)) {
        this.lightningTimer = 0;
        if (Math.random() < (this.emotion === "alert" ? 0.7 : 0.35)) {
          // Spawn swift electric shimmer across glass
          const cx = 250;
          const cy = 270;
          const ang = Math.random() * Math.PI * 2;
          const len = Math.random() * 80 + 40;
          this.lightningStreaks.push({
            x1: cx + Math.cos(ang) * (len * 0.4),
            y1: cy + Math.sin(ang) * (len * 0.4),
            x2: cx + Math.cos(ang + 0.3) * len,
            y2: cy + Math.sin(ang + 0.3) * len,
            alpha: 1,
            life: 0,
            maxLife: 0.18,
          });
        }
      }
    }

    // Update existing lightning streaks
    for (let i = this.lightningStreaks.length - 1; i >= 0; i--) {
      const st = this.lightningStreaks[i];
      st.life += delta;
      st.alpha = Math.max(0, 1 - st.life / st.maxLife);
      if (st.life >= st.maxLife) {
        this.lightningStreaks.splice(i, 1);
      }
    }

    // Smooth Gyroscope interpolation
    this.gyroTiltX += (this.targetGyroX - this.gyroTiltX) * Math.min(1, delta * 4.5);
    this.gyroTiltY += (this.targetGyroY - this.gyroTiltY) * Math.min(1, delta * 4.5);

    // Petting purr timer decay
    if (this.petPurrTimer > 0) {
      this.petPurrTimer = Math.max(0, this.petPurrTimer - delta);
      if (this.petPurrTimer === 0) {
        this.isBeingPetted = false;
      }
    }

    // Micro-expression emotion timer decay
    if (this.emotionTimer > 0) {
      this.emotionTimer = Math.max(0, this.emotionTimer - delta);
      if (this.emotionTimer === 0) {
        this.emotion = "neutral";
      }
    }

    // Cybersecurity timers decay
    if (this.shieldLockTimer > 0) {
      this.shieldLockTimer = Math.max(0, this.shieldLockTimer - delta);
    }
    if (this.threatAlertTimer > 0) {
      this.threatAlertTimer = Math.max(0, this.threatAlertTimer - delta);
    }
    if (this.doubleTakeCooldown > 0) {
      this.doubleTakeCooldown = Math.max(0, this.doubleTakeCooldown - delta);
    }
    if (this.doubleTakeTimer > 0) {
      this.doubleTakeTimer = Math.max(0, this.doubleTakeTimer - delta);
    }

    // Voice / Audio syllable stress decay
    this.speechEnergy += (this.targetSpeechEnergy - this.speechEnergy) * Math.min(1, delta * 12);
    if (this.targetSpeechEnergy > 0) {
      this.targetSpeechEnergy = Math.max(0, this.targetSpeechEnergy - delta * 3.2);
    }
    this.radarRipplePhase += delta * 1.5;

    // Shake-to-Dizzy timer decay & state restoration
    if (this.isDizzy) {
      this.dizzyTimer = Math.max(0, this.dizzyTimer - delta);
      this.dizzySpinAngle += delta * 6.5;
      if (this.dizzyTimer === 0) {
        this.isDizzy = false;
        if (this.state === "dizzy") {
          this.setState("idle");
        }
        if (this.emotion === "dizzy") {
          this.emotion = "neutral";
        }
      }
    }

    // Idle Sleep / Rest Mode Detection
    const shouldSleep =
      this.state === "sleep" ||
      (!this.isTyping && !this.isBeingPetted && !this.isDragging && this.state === "idle" && idleSeconds >= this.SLEEP_THRESHOLD);

    if (shouldSleep && !this.isSleeping) {
      this.isSleeping = true;
    } else if (!shouldSleep && this.state !== "sleep" && this.isSleeping) {
      this.isSleeping = false;
    }

    // Smooth sleep progress interpolation
    const targetSleep = this.isSleeping ? 1 : 0;
    this.sleepProgress += (targetSleep - this.sleepProgress) * Math.min(1, delta * 1.8);

    // Wake surprise eye expansion decay
    if (this.wakeSurpriseTimer > 0) {
      this.wakeSurpriseTimer = Math.max(0, this.wakeSurpriseTimer - delta);
    }

    // Specular glint alpha smoothing
    const targetGlint = this.isHovered ? 1 : 0;
    this.hoverGlintAlpha += (targetGlint - this.hoverGlintAlpha) * 0.12;

    // CRT refresh scanline progress cycle
    this.scanlineProgress = (this.time * 0.22) % 1;

    // Soft linger timer for touch release
    if (this.touchLingerTimer > 0) {
      this.touchLingerTimer = Math.max(0, this.touchLingerTimer - delta);
      if (this.touchLingerTimer === 0) {
        this.isPointerActive = false;
      }
    }

    // Cognitive Target Gaze Modulation (Fused with Gyro Tilt)
    let effectiveTargetX = 0;
    let effectiveTargetY = 0;

    if (this.sleepProgress > 0.5) {
      effectiveTargetX = 0;
      effectiveTargetY = 0.15;
    } else if (this.isBeingPetted) {
      effectiveTargetX = 0;
      effectiveTargetY = 0.05;
    } else if (this.state === "thinking") {
      // In thinking/analyzing state, smoothly preserve active cursor/touch tracking
      if (this.isPointerActive) {
        const fixationTremorX = Math.sin(this.time * 2.5) * 0.02;
        const fixationTremorY = Math.cos(this.time * 3.0) * 0.016;
        effectiveTargetX = this.targetLookX + fixationTremorX + (this.hasGyro ? this.gyroTiltX * 0.35 : 0);
        effectiveTargetY = this.targetLookY + fixationTremorY + (this.hasGyro ? this.gyroTiltY * 0.35 : 0);
      } else {
        // Natural subtle contemplative micro-drift when no pointer is active
        effectiveTargetX = Math.sin(this.time * 1.6) * 0.12 + (this.hasGyro ? this.gyroTiltX * 0.35 : 0);
        effectiveTargetY = -0.12 + Math.cos(this.time * 2.0) * 0.08 + (this.hasGyro ? this.gyroTiltY * 0.35 : 0);
      }
    } else if (this.isTyping) {
      effectiveTargetX = 0.12;
      effectiveTargetY = 0.42;
    } else if (this.isPointerActive) {
      // Actively tracking user's cursor / touch point
      // Add subtle physiological micro-tremor so gaze feels living and organic without snapping
      const fixationTremorX = Math.sin(this.time * 2.2) * 0.022;
      const fixationTremorY = Math.cos(this.time * 2.8) * 0.018;
      effectiveTargetX = this.targetLookX + fixationTremorX + (this.hasGyro ? this.gyroTiltX * 0.35 : 0);
      effectiveTargetY = this.targetLookY + fixationTremorY + (this.hasGyro ? this.gyroTiltY * 0.35 : 0);
    } else {
      // Idle Micro-Saccades (Organic wandering glances when no pointer is active)
      this.saccadeTimer += delta;
      if (this.saccadeTimer >= this.nextSaccadeInterval) {
        this.saccadeTimer = 0;
        this.saccadeProgress = 0;
        this.nextSaccadeInterval = 2.4 + Math.random() * 2.8;
        this.saccadeDuration = 0.6 + Math.random() * 0.5;

        const angle = Math.random() * Math.PI * 2;
        const mag = 0.28 + Math.random() * 0.28;
        this.saccadeOffsetX = Math.cos(angle) * mag;
        this.saccadeOffsetY = Math.sin(angle) * (mag * 0.65);
      }

      if (this.saccadeProgress < 1) {
        this.saccadeProgress += delta / this.saccadeDuration;
        const t = Math.min(1, this.saccadeProgress);
        const ease = Math.sin(t * Math.PI);
        effectiveTargetX = this.saccadeOffsetX * ease + (this.hasGyro ? this.gyroTiltX * 0.35 : 0);
        effectiveTargetY = this.saccadeOffsetY * ease + (this.hasGyro ? this.gyroTiltY * 0.35 : 0);
      } else {
        effectiveTargetX = this.hasGyro ? this.gyroTiltX * 0.35 : 0;
        effectiveTargetY = this.hasGyro ? this.gyroTiltY * 0.35 : 0;
      }
    }

    // 2nd-Order Critically-Damped Spring Physics for Ultra-Smooth, Organic Gaze Pursuit
    const clampedDelta = Math.min(0.05, Math.max(0.001, delta));
    const omega = 16.0;
    const zeta = 0.94; // Critically damped with micro-elastic softness

    const k1 = omega * omega;
    const k2 = 2 * zeta * omega;
    const accelX = (effectiveTargetX - this.currentLookX) * k1 - this.lookVelocityX * k2;
    const accelY = (effectiveTargetY - this.currentLookY) * k1 - this.lookVelocityY * k2;

    this.lookVelocityX += accelX * clampedDelta;
    this.lookVelocityY += accelY * clampedDelta;
    this.currentLookX += this.lookVelocityX * clampedDelta;
    this.currentLookY += this.lookVelocityY * clampedDelta;

    // Safety clamp
    this.currentLookX = Math.max(-1.1, Math.min(1.1, this.currentLookX));
    this.currentLookY = Math.max(-1.1, Math.min(1.1, this.currentLookY));

    // Curious / Dizzy Tilt Smoothing
    let targetTilt = this.isTyping ? 0.075 : 0;
    if (this.isDizzy || this.state === "dizzy") {
      targetTilt = Math.sin(this.dizzySpinAngle * 2.2) * 0.18;
    } else if (this.emotion === "curious") {
      targetTilt = 0.11;
    } else if (Math.abs(this.curiousTiltTarget) > 0.001) {
      targetTilt = this.curiousTiltTarget;
    } else if (this.hasGyro) {
      targetTilt += this.gyroTiltX * 0.08;
    }
    this.typingTilt += (targetTilt - this.typingTilt) * Math.min(1, delta * 8.5);

    // "Aha!" Nod / Wake Bounce Physics
    if (this.nodActive) {
      this.nodTimer += delta;
      const p = this.nodTimer / this.NOD_DURATION;
      if (p <= 1) {
        this.nodOffset = Math.sin(p * Math.PI) * 9;
        this.nodEyeBloom = Math.sin(p * Math.PI) * 16;
      } else {
        this.nodActive = false;
        this.nodTimer = 0;
        this.nodOffset = 0;
        this.nodEyeBloom = 0;
      }
    }

    // Biological Asymmetric Blinks & Double-Blinks
    if (this.sleepProgress < 0.8 && !this.isBeingPetted) {
      this.blinkTimer += delta;

      if (!this.isBlinking && this.blinkTimer >= this.nextBlinkInterval) {
        this.isBlinking = true;
        this.blinkTimer = 0;
      }

      if (this.isBlinking) {
        const closeTime = 0.065;
        const openTime = 0.125;
        const totalBlinkTime = closeTime + openTime;

        if (this.blinkTimer < closeTime) {
          this.eyeBlinkProgress = 1 - (this.blinkTimer / closeTime) * 0.95;
        } else if (this.blinkTimer < totalBlinkTime) {
          const openProg = (this.blinkTimer - closeTime) / openTime;
          this.eyeBlinkProgress = 0.05 + openProg * 0.95;
        } else {
          this.isBlinking = false;
          this.eyeBlinkProgress = 1;
          this.blinkTimer = 0;

          if (!this.isDoubleBlinkPending && Math.random() < 0.25) {
            this.isDoubleBlinkPending = true;
            this.nextBlinkInterval = 0.12;
          } else {
            this.isDoubleBlinkPending = false;
            this.nextBlinkInterval = 2.6 + Math.random() * 3.2;
          }
        }
      }
    } else {
      this.isBlinking = false;
      this.eyeBlinkProgress = 1;
    }

    // Interactive Spring Squish & Rebound (Hooke's Law Damping)
    const springK = 0.18;
    const damping = 0.78;

    const forceX = (1 - this.scaleX) * springK;
    const forceY = (1 - this.scaleY) * springK;

    this.scaleVelocityX = (this.scaleVelocityX + forceX) * damping;
    this.scaleVelocityY = (this.scaleVelocityY + forceY) * damping;

    this.scaleX += this.scaleVelocityX;
    this.scaleY += this.scaleVelocityY;
  }

  // =====================================================
  // LIGHTING & AMBIENT GLOWS
  // =====================================================

  private glow(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    color: string
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(radiusX, radiusY);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // =====================================================
  // VISOR & DOT MATRIX SCREEN WITH GRAVITATIONAL LIQUID CORE
  // =====================================================

  private drawVisor(baseX: number, baseY: number): void {
    const ctx = this.ctx;
    const t = this.time;

    // 2.5D Mid-Depth Visor Parallax Translation + Gyro Incline
    const parallaxVisorX = this.currentLookX * 22 + this.gyroTiltX * 10;
    const parallaxVisorY = this.currentLookY * 16 + this.gyroTiltY * 8;

    const x = baseX + parallaxVisorX;
    const y = baseY + parallaxVisorY;

    const vx = x - this.VISOR_W / 2;
    const vy = y - this.VISOR_H / 2;

    // Ambient Day/Night baseline palette
    const { dayNightShift } = this.getAmbientLightingTheme();
    let gradLeft = dayNightShift.left;
    let gradMid = dayNightShift.mid;
    let gradRight = dayNightShift.right;
    let haloColor = dayNightShift.halo;

    // Context & Emotion overrides
    if (this.state === "error" || this.emotion === "alert") {
      gradLeft = "#ff1744";
      gradMid = "#c2185b";
      gradRight = "#ff5252";
      haloColor = "rgba(255, 23, 68, 0.45)";
    } else if (this.state === "happy" || this.isBeingPetted || this.emotion === "success") {
      gradLeft = "#00f2fe";
      gradMid = "#34d399";
      gradRight = "#10b981";
      haloColor = "rgba(52, 211, 153, 0.45)";
    } else if (this.state === "listening") {
      gradLeft = "#00f0ff";
      gradMid = "#7000ff";
      gradRight = "#00f0ff";
      haloColor = "rgba(0, 240, 255, 0.5)";
    } else if (this.state === "thinking" || this.emotion === "analytical") {
      gradLeft = "#818cf8";
      gradMid = "#6366f1";
      gradRight = "#a855f7";
      haloColor = "rgba(129, 140, 248, 0.35)";
    } else if (this.sleepProgress > 0.4) {
      gradLeft = "#4338ca";
      gradMid = "#312e81";
      gradRight = "#4f46e5";
      haloColor = "rgba(67, 56, 202, 0.25)";
    }

    // 1. Soft Ambient Visor Bloom behind matrix
    const bloomScale = 1 - this.sleepProgress * 0.4;
    this.glow(x, y, 120 * bloomScale, 68 * bloomScale, haloColor);
    this.glow(x - 55, y, 75 * bloomScale, 55 * bloomScale, "rgba(0, 210, 255, 0.28)");
    this.glow(x + 55, y, 75 * bloomScale, 55 * bloomScale, "rgba(56, 189, 248, 0.28)");

    // 2. Visor Backdrop Base
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(vx, vy, this.VISOR_W, this.VISOR_H, this.VISOR_R);
    ctx.fillStyle = "#09091a";
    ctx.fill();

    // KINEMATICS: GRAVITATIONAL LIQUID CORE MENISCUS
    // Subtle translucent fluid level tilting against gravity
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(vx, vy, this.VISOR_W, this.VISOR_H, this.VISOR_R);
    ctx.clip();

    const liquidY = vy + this.VISOR_H * 0.55 + this.liquidLevelY;
    const liquidRoll = this.gyroTiltX * 0.18;

    ctx.save();
    ctx.translate(x, liquidY);
    ctx.rotate(-liquidRoll); // Tilts counter to gravity
    ctx.translate(-x, -liquidY);

    const liquidGrad = ctx.createLinearGradient(0, liquidY, 0, vy + this.VISOR_H + 20);
    liquidGrad.addColorStop(0, "rgba(99, 102, 241, 0.16)");
    liquidGrad.addColorStop(1, "rgba(30, 27, 75, 0.32)");
    ctx.fillStyle = liquidGrad;
    ctx.fillRect(vx - 20, liquidY, this.VISOR_W + 40, this.VISOR_H);

    // Liquid surface meniscus highlight line
    ctx.beginPath();
    ctx.moveTo(vx - 20, liquidY);
    ctx.quadraticCurveTo(x, liquidY + Math.sin(t * 3) * 2.2, vx + this.VISOR_W + 20, liquidY);
    ctx.strokeStyle = "rgba(165, 243, 252, 0.25)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // 3. Render Dot Matrix Screen with Horizontal Phosphor Gradient
    if (this.dotMatrixCanvas) {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = this.VISOR_W;
      offCanvas.height = this.VISOR_H;
      const offCtx = offCanvas.getContext("2d");

      if (offCtx) {
        offCtx.drawImage(this.dotMatrixCanvas, 0, 0);
        offCtx.globalCompositeOperation = "source-in";
        const hGrad = offCtx.createLinearGradient(0, 0, this.VISOR_W, 0);

        const shift = this.state === "speaking" ? Math.sin(t * 6) * 15 : 0;
        hGrad.addColorStop(0, gradLeft);
        hGrad.addColorStop(0.5, gradMid);
        hGrad.addColorStop(1, gradRight);

        offCtx.fillStyle = hGrad;
        offCtx.fillRect(0, 0, this.VISOR_W, this.VISOR_H);

        ctx.globalAlpha = 0.95 * (1 - this.sleepProgress * 0.25);
        ctx.drawImage(offCanvas, vx + shift * 0.1, vy);
      }
    }

    // 4. CRT Scanning Beam / Luminescence Refresh Sweep
    if (this.sleepProgress < 0.8) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(vx, vy, this.VISOR_W, this.VISOR_H, this.VISOR_R);
      ctx.clip();

      const scanY = vy + this.scanlineProgress * this.VISOR_H;
      const scanGrad = ctx.createLinearGradient(0, scanY - 14, 0, scanY + 14);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
      scanGrad.addColorStop(1, "transparent");

      ctx.fillStyle = scanGrad;
      ctx.fillRect(vx, scanY - 14, this.VISOR_W, 28);

      ctx.restore();
    }

    // CYBERSECURITY: Active Analysis Laser Sweep while in thinking state
    if (this.state === "thinking" || this.emotion === "analytical") {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(vx, vy, this.VISOR_W, this.VISOR_H, this.VISOR_R);
      ctx.clip();

      const sweepY = vy + ((t * 75) % this.VISOR_H);
      const sweepGrad = ctx.createLinearGradient(0, sweepY - 10, 0, sweepY + 10);
      sweepGrad.addColorStop(0, "transparent");
      sweepGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.4)");
      sweepGrad.addColorStop(1, "transparent");

      ctx.fillStyle = sweepGrad;
      ctx.fillRect(vx, sweepY - 10, this.VISOR_W, 20);

      // Vivid laser focus scanline
      ctx.beginPath();
      ctx.moveTo(vx, sweepY);
      ctx.lineTo(vx + this.VISOR_W, sweepY);
      ctx.strokeStyle = "rgba(192, 132, 252, 0.85)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.restore();
    }

    // CYBERSECURITY: Decryption / Code Stream Visor Shimmer
    if (this.isStreaming) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(vx, vy, this.VISOR_W, this.VISOR_H, this.VISOR_R);
      ctx.clip();

      const hexChars = "01AF9XC";
      ctx.font = "8px monospace";
      const columns = 5;
      for (let c = 0; c < columns; c++) {
        const colX = vx + 32 + c * 36;
        const speed = 35 + (c % 3) * 14;
        const colOffset = ((t * speed + c * 32) % (this.VISOR_H + 20)) - 10;

        for (let row = 0; row < 4; row++) {
          const charY = vy + ((colOffset + row * 12) % this.VISOR_H);
          const charIdx = (Math.floor(t * 8 + c * 3 + row)) % hexChars.length;
          const char = hexChars[charIdx];
          const fade = row === 0 ? 0.32 : (0.20 - row * 0.04);
          ctx.fillStyle = `rgba(168, 85, 247, ${fade.toFixed(2)})`;
          ctx.fillText(char, colX, charY);
        }
      }
      ctx.restore();
    }

    // CYBERSECURITY: "Shield Lock" / Verification Confirmation
    if (this.shieldLockTimer > 0) {
      const p = 1 - (this.shieldLockTimer / this.SHIELD_LOCK_DURATION);
      ctx.save();
      ctx.translate(x, y);

      const shieldScale = Math.min(1, p * 4) * (1 + Math.sin(p * Math.PI) * 0.12);
      ctx.scale(shieldScale, shieldScale);

      // Holographic Shield Contour
      ctx.beginPath();
      const sw = 36;
      const sh = 42;
      ctx.moveTo(0, -sh * 0.5);
      ctx.lineTo(sw * 0.5, -sh * 0.25);
      ctx.lineTo(sw * 0.42, sh * 0.2);
      ctx.lineTo(0, sh * 0.52);
      ctx.lineTo(-sw * 0.42, sh * 0.2);
      ctx.lineTo(-sw * 0.5, -sh * 0.25);
      ctx.closePath();

      const shieldAlpha = Math.sin(p * Math.PI) * 0.85;
      ctx.strokeStyle = `rgba(0, 240, 255, ${shieldAlpha.toFixed(2)})`;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 14;
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 240, 255, ${(shieldAlpha * 0.15).toFixed(2)})`;
      ctx.fill();

      // Inner 4-cell security verification matrix grid
      const gridAlpha = Math.sin(p * Math.PI) * 0.9;
      ctx.strokeStyle = `rgba(52, 211, 153, ${gridAlpha.toFixed(2)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(10, -2);
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 10);
      ctx.stroke();

      // Checkmark confirmation in center
      if (p > 0.25) {
        ctx.beginPath();
        ctx.moveTo(-6, -1);
        ctx.lineTo(-2, 3);
        ctx.lineTo(6, -5);
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 2.4;
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = 8;
        ctx.stroke();
      }

      ctx.restore();
    }

    // CYBERSECURITY: Threat Alert / Tactical Recon HUD Corner Reticles
    if (this.threatAlertTimer > 0 || this.emotion === "alert") {
      ctx.save();
      const alertAlpha = Math.min(1, (this.threatAlertTimer > 0 ? this.threatAlertTimer : 1.0) / 0.5);
      const pingPhase = (t * 2.8) % 1;

      // Expanding tactical radar ping ripple
      ctx.beginPath();
      ctx.arc(x, y, 16 + pingPhase * 60, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 51, 102, ${( (1 - pingPhase) * 0.45 * alertAlpha ).toFixed(2)})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Tactical HUD corner brackets around visor
      ctx.strokeStyle = `rgba(255, 75, 75, ${(0.85 * alertAlpha).toFixed(2)})`;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = "#ff3366";
      ctx.shadowBlur = 10;
      const bW = 14;
      const pad = 6;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(vx - pad, vy - pad + bW);
      ctx.lineTo(vx - pad, vy - pad);
      ctx.lineTo(vx - pad + bW, vy - pad);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(vx + this.VISOR_W + pad - bW, vy - pad);
      ctx.lineTo(vx + this.VISOR_W + pad, vy - pad);
      ctx.lineTo(vx + this.VISOR_W + pad, vy - pad + bW);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(vx - pad, vy + this.VISOR_H + pad - bW);
      ctx.lineTo(vx - pad, vy + this.VISOR_H + pad);
      ctx.lineTo(vx - pad + bW, vy + this.VISOR_H + pad);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(vx + this.VISOR_W + pad - bW, vy + this.VISOR_H + pad);
      ctx.lineTo(vx + this.VISOR_W + pad, vy + this.VISOR_H + pad);
      ctx.lineTo(vx + this.VISOR_W + pad, vy + this.VISOR_H + pad - bW);
      ctx.stroke();

      ctx.restore();
    }

    // VOICE & AUDIO: Listening Radar Ripples
    if (this.state === "listening") {
      ctx.save();
      for (let r = 0; r < 2; r++) {
        const rippleP = ((t * 0.9 + r * 0.5) % 1);
        const radius = 24 + rippleP * 55;
        const alpha = Math.sin(rippleP * Math.PI) * 0.32;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Visor Screen Glass Reflection Sheen
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(vx, vy, this.VISOR_W, this.VISOR_H, this.VISOR_R);
    ctx.clip();

    const visorSheen = ctx.createLinearGradient(vx, vy, vx, vy + this.VISOR_H);
    visorSheen.addColorStop(0, "rgba(255, 255, 255, 0.12)");
    visorSheen.addColorStop(0.35, "rgba(255, 255, 255, 0.02)");
    visorSheen.addColorStop(1, "transparent");

    ctx.fillStyle = visorSheen;
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // =====================================================
  // GLOWING CAPSULE EYES WITH ELASTIC PUPIL DILATION
  // =====================================================

  private drawEyes(baseX: number, baseY: number): void {
    const ctx = this.ctx;
    const t = this.time;

    // Deepest 3D Gaze Parallax (Eyes shift further than visor) + Gyroscope
    const eyeParallaxX = this.currentLookX * 58 + this.gyroTiltX * 16;
    const eyeParallaxY = this.currentLookY * 34 + this.gyroTiltY * 12;

    const x = baseX + eyeParallaxX;
    const y = baseY + eyeParallaxY;

    // KINEMATICS: ELASTIC PUPIL / EYE DILATION ON STARTLE & PROXIMITY
    const totalDilation = this.pupilDilation + this.proximityDilation;
    const eyeWidth = 18 * totalDilation;
    const eyeSpacing = 48;
    const cornerRadius = 9 * totalDilation;

    // Reactively modify eye size based on state & emotion
    let targetEyeHeight = 58 * (1 + (totalDilation - 1) * 0.4);
    if (this.wakeSurpriseTimer > 0) {
      targetEyeHeight = 68;
    } else if (this.isBeingPetted) {
      targetEyeHeight = 30;
    } else if (this.state === "listening") {
      // Harmonic organic sound wave listening pulse (smooth floating oscillation)
      targetEyeHeight = 54 + Math.sin(t * 5.5) * 5.5;
    } else if (this.state === "speaking") {
      // Dynamic Syllable-Reactive Eye Breathing in sync with speech rhythm
      const cadence = Math.abs(Math.sin(t * 11.5)) * 10;
      const syllableStress = this.speechEnergy * 18;
      targetEyeHeight = 44 + cadence + syllableStress;
    } else if (this.state === "thinking") {
      // Dynamic analytical cognitive pulse during active analysis
      targetEyeHeight = 46 + Math.abs(Math.sin(t * 5.5)) * 15;
    } else if (this.isTyping) {
      targetEyeHeight = 62;
    }

    // Standby Drowsiness: in deep rest or sleep, eyes relax to peaceful half-lidded capsules
    if (this.sleepProgress > 0.1) {
      targetEyeHeight = Math.max(12, targetEyeHeight * (1 - this.sleepProgress * 0.74));
    }

    // Smooth lerping to eliminate abrupt snaps between states
    const heightLerp = this.state === "speaking" ? 0.22 : this.state === "thinking" ? 0.20 : 0.14;
    this.animatedEyeHeight += (targetEyeHeight - this.animatedEyeHeight) * heightLerp;

    const currentHeight = Math.max(3, this.animatedEyeHeight * this.eyeBlinkProgress);

    let eyeGlowColor = "#a5f3fc";
    if (this.state === "thinking" || this.emotion === "analytical") {
      eyeGlowColor = "#c084fc";
    } else if (this.state === "error" || this.emotion === "alert") {
      eyeGlowColor = "#ff3366";
    } else if (this.state === "happy" || this.isBeingPetted || this.emotion === "success") {
      eyeGlowColor = "#26F0C4";
    } else if (this.sleepProgress > 0.4) {
      eyeGlowColor = "#818cf8";
    }

    // 1. Phosphor Persistence: record and render decay trail
    if (!this.reducedMotion && this.sleepProgress < 0.5) {
      this.phosphorGhosts.unshift({
        leftX: x - eyeSpacing,
        rightX: x + eyeSpacing,
        y,
        width: eyeWidth,
        height: currentHeight,
        alpha: 0.28,
        color: eyeGlowColor,
      });

      if (this.phosphorGhosts.length > this.MAX_PHOSPHOR_FRAMES) {
        this.phosphorGhosts.pop();
      }

      for (let i = 1; i < this.phosphorGhosts.length; i++) {
        const ghost = this.phosphorGhosts[i];
        const decayAlpha = ghost.alpha * Math.pow(0.55, i);
        if (decayAlpha < 0.02) continue;

        ctx.save();
        ctx.globalAlpha = decayAlpha;
        ctx.fillStyle = ghost.color;
        ctx.shadowColor = ghost.color;
        ctx.shadowBlur = 12;

        for (const gx of [ghost.leftX, ghost.rightX]) {
          ctx.beginPath();
          ctx.roundRect(
            gx - ghost.width / 2,
            ghost.y - ghost.height / 2,
            ghost.width,
            ghost.height,
            cornerRadius
          );
          ctx.fill();
        }
        ctx.restore();
      }
    }

    ctx.save();

    // 2. Render Eyes (State-dependent, Petting, Sleep or Micro-Expressions)
    for (const offset of [-eyeSpacing, eyeSpacing]) {
      const isLeftEye = offset < 0;
      let eyeX = x + offset;

      // Conversational Micro-Expression: Asymmetrical "Puzzled / Thinking" Brow Raise for curious state
      let eyeYAdjust = 0;
      if (this.emotion === "curious") {
        eyeYAdjust = isLeftEye ? -5.0 : 1.5;
      }
      let eyeY = y + eyeYAdjust;

      // 3D Perspective Volumetric Foreshortening:
      // The eye facing the gaze direction expands subtly, trailing eye compresses
      const perspectiveFactor = isLeftEye
        ? (1 - this.currentLookX * 0.1)
        : (1 + this.currentLookX * 0.1);
      const currentEyeWidth = Math.max(9, eyeWidth * perspectiveFactor);
      const currentCornerRadius = Math.min(currentEyeWidth / 2, cornerRadius);

      ctx.save();
      const hoverBonus = this.isHovered ? 8 : 0;
      ctx.shadowColor = eyeGlowColor;
      ctx.shadowBlur = (20 + this.nodEyeBloom + this.proximityBloom + hoverBonus) * (1 - this.sleepProgress * 0.4);

      if (this.sleepProgress > 0.05) {
        // Peaceful sleeping closed arcs (‿ ‿)
        const awakeH = currentHeight;
        const sleepH = 4;
        const h = awakeH * (1 - this.sleepProgress) + sleepH * this.sleepProgress;

        if (this.sleepProgress > 0.6) {
          ctx.beginPath();
          ctx.arc(eyeX, eyeY + 2, 14, Math.PI * 0.15, Math.PI * 0.85);
          ctx.strokeStyle = "#c7d2fe";
          ctx.lineWidth = 3.8;
          ctx.lineCap = "round";
          ctx.stroke();
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(
            eyeX - currentEyeWidth / 2,
            eyeY - h / 2,
            currentEyeWidth,
            h,
            Math.min(currentCornerRadius, h / 2)
          );
          ctx.fill();
        }
      } else if (this.isDizzy || this.state === "dizzy" || this.emotion === "dizzy") {
        // Comical Hypnotic Spinning Spiral Eyes (@ @)
        ctx.save();
        ctx.translate(eyeX, eyeY);
        const spinDir = isLeftEye ? 1 : -1;
        ctx.rotate(this.dizzySpinAngle * spinDir);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 3.8; a += 0.15) {
          const r = 2.2 + a * 3.4;
          const sx = Math.cos(a) * r;
          const sy = Math.sin(a) * r;
          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();
      } else if (this.isBeingPetted || this.state === "happy" || this.emotion === "success") {
        // Happy purring / tickle crescent smiling eyes (`^ ^`)
        ctx.beginPath();
        ctx.arc(eyeX, eyeY + 4, 18, Math.PI * 1.15, Math.PI * 1.85);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.stroke();
      } else if (this.emotion === "playful" && !isLeftEye) {
        // Cheeky single-eye wink on right eye
        ctx.beginPath();
        ctx.arc(eyeX, eyeY + 2, 14, Math.PI * 0.15, Math.PI * 0.85);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
      } else if (this.emotion === "curious" && isLeftEye) {
        // Puzzled quizzical eyebrow: left eye raises higher and expands
        const raisedH = currentHeight * 1.25;
        eyeY -= 6;
        if (this.wireframeMode) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.roundRect(
            eyeX - currentEyeWidth / 2,
            eyeY - raisedH / 2,
            currentEyeWidth,
            raisedH,
            currentCornerRadius
          );
          ctx.stroke();
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(
            eyeX - currentEyeWidth / 2,
            eyeY - raisedH / 2,
            currentEyeWidth,
            raisedH,
            currentCornerRadius
          );
          ctx.fill();
        }
      } else if (this.emotion === "alert") {
        // High-alert vigilant diamond / diamond-slit eyes
        ctx.save();
        ctx.translate(eyeX, eyeY);

        ctx.fillStyle = this.wireframeMode ? "transparent" : "#ffffff";
        ctx.strokeStyle = this.wireframeMode ? "#ff537b" : "#ffffff";
        ctx.lineWidth = 2.4;

        ctx.beginPath();
        ctx.moveTo(0, -currentHeight * 0.55);
        ctx.lineTo(currentEyeWidth * 0.55, 0);
        ctx.lineTo(0, currentHeight * 0.55);
        ctx.lineTo(-currentEyeWidth * 0.55, 0);
        ctx.closePath();
        if (this.wireframeMode) {
          ctx.stroke();
        } else {
          ctx.fill();
        }

        // Inner vertical focus slit
        ctx.fillStyle = this.wireframeMode ? "#ff537b" : "#ff3366";
        ctx.beginPath();
        ctx.roundRect(-2, -currentHeight * 0.35, 4, currentHeight * 0.7, 2);
        ctx.fill();

        ctx.restore();
      } else {
        switch (this.state) {
          case "error": {
            const angle = offset < 0 ? -0.35 : 0.35;
            ctx.translate(eyeX, eyeY);
            ctx.rotate(angle);

            if (this.wireframeMode) {
              ctx.strokeStyle = "#ff3366";
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.roundRect(
                -currentEyeWidth / 2,
                -currentHeight / 2,
                currentEyeWidth,
                currentHeight,
                currentCornerRadius
              );
              ctx.stroke();
            } else {
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.roundRect(
                -currentEyeWidth / 2,
                -currentHeight / 2,
                currentEyeWidth,
                currentHeight,
                currentCornerRadius
              );
              ctx.fill();
            }
            break;
          }

          default: {
            if (this.wireframeMode) {
              ctx.strokeStyle = "#00f0ff";
              ctx.lineWidth = 2.2;
              ctx.shadowColor = "#00f0ff";
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.roundRect(
                eyeX - currentEyeWidth / 2,
                eyeY - currentHeight / 2,
                currentEyeWidth,
                currentHeight,
                currentCornerRadius
              );
              ctx.stroke();

              // Cyber reticle crosshair inside wireframe eye
              ctx.beginPath();
              ctx.moveTo(eyeX - 4, eyeY);
              ctx.lineTo(eyeX + 4, eyeY);
              ctx.moveTo(eyeX, eyeY - 4);
              ctx.lineTo(eyeX, eyeY + 4);
              ctx.lineWidth = 1.2;
              ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
              ctx.stroke();
            } else {
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.roundRect(
                eyeX - currentEyeWidth / 2,
                eyeY - currentHeight / 2,
                currentEyeWidth,
                currentHeight,
                currentCornerRadius
              );
              ctx.fill();

              ctx.shadowBlur = 8 + this.nodEyeBloom * 0.5 + (this.isHovered ? 4 : 0);
              ctx.shadowColor = "#ffffff";
              ctx.fill();
            }
            break;
          }
        }
      }

      ctx.restore();
    }

    // Animated mouth wave & reactive lip-sync when speaking
    if (this.state === "speaking" || this.speechEnergy > 0.04) {
      const activeEnergy = Math.max(this.speechEnergy, this.state === "speaking" ? 0.35 : 0);
      const mouthWidth = 26 + activeEnergy * 24;
      const mouthH = Math.max(3, 4 + activeEnergy * 20 + Math.abs(Math.sin(t * 14)) * (activeEnergy * 8));

      ctx.save();
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10 + activeEnergy * 12;
      ctx.lineCap = "round";

      // 1. Multi-band speech visualizer bars inside the mouth
      const barCount = 5;
      const barSpacing = 8;
      const startX = x - ((barCount - 1) * barSpacing) / 2;

      for (let i = 0; i < barCount; i++) {
        const bx = startX + i * barSpacing;
        const centerDist = Math.abs(i - 2); // 2, 1, 0, 1, 2
        const barScale = 1 - centerDist * 0.22;
        const barHeight = Math.max(3, mouthH * barScale * (0.6 + Math.abs(Math.sin(t * 16 + i * 1.4)) * 0.5));

        ctx.fillStyle = i === 2 ? "#ffffff" : "#38bdf8";
        ctx.beginPath();
        ctx.roundRect(bx - 2, y + 44 - barHeight / 2, 4, barHeight, 2);
        ctx.fill();
      }

      // 2. Dynamic glowing cybernetic lip contour
      ctx.beginPath();
      ctx.moveTo(x - mouthWidth / 2, y + 44);
      ctx.quadraticCurveTo(x, y + 44 + (activeEnergy * 6), x + mouthWidth / 2, y + 44);
      ctx.strokeStyle = `rgba(165, 243, 252, ${(0.6 + activeEnergy * 0.4).toFixed(2)})`;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  // =====================================================
  // DYNAMIC WEATHER CONDENSATION & ENVIRONMENT REFLECTIONS
  // =====================================================

  private drawGlassCondensationAndWeather(x: number, y: number, radius: number): void {
    const ctx = this.ctx;
    const effectiveFog = this.fogDensity * this.fogWipedAlpha;

    // 1. Translucent Condensation / Fog Vapor
    if (effectiveFog > 0.02) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();

      const fogGrad = ctx.createRadialGradient(x - 20, y - 20, 20, x, y, radius);
      fogGrad.addColorStop(0, `rgba(200, 220, 255, ${(0.22 * effectiveFog).toFixed(3)})`);
      fogGrad.addColorStop(0.7, `rgba(180, 205, 245, ${(0.34 * effectiveFog).toFixed(3)})`);
      fogGrad.addColorStop(1, `rgba(150, 185, 235, ${(0.48 * effectiveFog).toFixed(3)})`);

      ctx.fillStyle = fogGrad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Micro condensation droplets on glass
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.28 * effectiveFog).toFixed(3)})`;
      for (let i = 0; i < 28; i++) {
        const dropX = x + Math.sin(i * 137.5) * (radius * 0.72);
        const dropY = y + Math.cos(i * 73.1) * (radius * 0.65);
        ctx.beginPath();
        ctx.arc(dropX, dropY, 1.4 + (i % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 2. Tactical Threat / Night Storm Lightning Streaks
    if (this.lightningStreaks.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();

      this.lightningStreaks.forEach((st) => {
        ctx.strokeStyle = `rgba(165, 243, 252, ${st.alpha.toFixed(3)})`;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 14;
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        ctx.moveTo(st.x1, st.y1);
        const midX = (st.x1 + st.x2) / 2 + (Math.random() - 0.5) * 14;
        const midY = (st.y1 + st.y2) / 2 + (Math.random() - 0.5) * 14;
        ctx.lineTo(midX, midY);
        ctx.lineTo(st.x2, st.y2);
        ctx.stroke();
      });

      ctx.restore();
    }
  }

  // =====================================================
  // TRANSLUCENT GLASS SPHERE, REFRACTION & SPECULAR GLINT
  // =====================================================

  private drawGlassSphere(x: number, y: number, radius: number): void {
    const ctx = this.ctx;

    ctx.save();

    // 1. Sphere Outer Clipping & Dark Radial Depth
    if (!this.noCircleBorder) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();

      // Dark glass body: deep black with subtle indigo tint
      const darkGlass = ctx.createRadialGradient(
        x - 30,
        y - 45,
        25,
        x,
        y,
        radius
      );
      darkGlass.addColorStop(0, "#100e24");
      darkGlass.addColorStop(0.55, "#070612");
      darkGlass.addColorStop(0.9, "#030208");
      darkGlass.addColorStop(1, "#010105");

      ctx.fillStyle = darkGlass;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Internal Ambient Sheen
    const sleepDarken = 1 - this.sleepProgress * 0.4;
    this.glow(x, y + 25, radius * 0.9, radius * 0.8, `rgba(80, 50, 160, ${0.16 * sleepDarken})`);
    this.glow(x, y - 55, radius * 0.75, radius * 0.65, `rgba(30, 90, 220, ${0.14 * sleepDarken})`);

    // 3. Render Visor Screen & Capsule Eyes with Depth Parallax
    this.drawVisor(x, y);
    this.drawEyes(x, y);

    // 4. Optical Refraction: Specular Glass Highlight inverts gaze motion
    const sheenShiftX = -this.currentLookX * 18 - this.gyroTiltX * 8;
    const sheenShiftY = -this.currentLookY * 13 - this.gyroTiltY * 6;

    if (!this.noCircleBorder) {
      const sheenGrad = ctx.createLinearGradient(
        x + sheenShiftX,
        y - radius + sheenShiftY,
        x + sheenShiftX,
        y + radius * 0.3
      );
      sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0.32)");
      sheenGrad.addColorStop(0.35, "rgba(180, 160, 255, 0.10)");
      sheenGrad.addColorStop(1, "transparent");

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        x + sheenShiftX,
        y - radius * 0.42 + sheenShiftY,
        radius * 0.76,
        radius * 0.38,
        0,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = sheenGrad;
      ctx.lineWidth = 3.0;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Tactile Specular Glint (Flares up when cursor hovers sphere)
    if (this.hoverGlintAlpha > 0.01) {
      const glintGrad = ctx.createRadialGradient(
        x - radius * 0.45 + sheenShiftX * 0.5,
        y - radius * 0.45 + sheenShiftY * 0.5,
        2,
        x - radius * 0.45 + sheenShiftX * 0.5,
        y - radius * 0.45 + sheenShiftY * 0.5,
        24
      );
      glintGrad.addColorStop(0, `rgba(255, 255, 255, ${(0.55 * this.hoverGlintAlpha).toFixed(3)})`);
      glintGrad.addColorStop(0.5, `rgba(186, 230, 253, ${(0.22 * this.hoverGlintAlpha).toFixed(3)})`);
      glintGrad.addColorStop(1, "transparent");

      ctx.fillStyle = glintGrad;
      ctx.beginPath();
      ctx.arc(
        x - radius * 0.45 + sheenShiftX * 0.5,
        y - radius * 0.45 + sheenShiftY * 0.5,
        14,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // 6. Dynamic Glass Condensation & Environment Reflections
    if (!this.noCircleBorder) {
      this.drawGlassCondensationAndWeather(x, y, radius);
    }

    ctx.restore();

    // 7. Outer Fresnel Glass Rim Glow & Stroke (Spherical)
    if (!this.noCircleBorder) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      const rimGradient = ctx.createLinearGradient(
        x - radius,
        y - radius,
        x + radius,
        y + radius
      );
      rimGradient.addColorStop(0, "rgba(168, 85, 247, 0.85)");
      rimGradient.addColorStop(0.35, "rgba(99, 102, 241, 0.65)");
      rimGradient.addColorStop(0.7, "rgba(56, 189, 248, 0.75)");
      rimGradient.addColorStop(1, "rgba(168, 85, 247, 0.85)");

      ctx.strokeStyle = rimGradient;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = "rgba(168, 85, 247, 0.6)";
      ctx.shadowBlur = 16;
      ctx.stroke();

      // Delicate inner refraction lip
      ctx.beginPath();
      ctx.arc(x, y, radius - 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1.0;
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();
    }
  }

  // =====================================================
  // RETRO CYBERPUNK WIREFRAME HOLOGRAM RENDERER
  // =====================================================

  private drawWireframeHologram(x: number, y: number, radius: number): void {
    const ctx = this.ctx;
    const t = this.time;

    ctx.save();

    // 1. Spherical Outer Clipping
    if (!this.noCircleBorder) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();

      // Semi-translucent deep cyber void backdrop
      ctx.fillStyle = "rgba(4, 9, 20, 0.94)";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dynamic rotation angle from gaze, gyro and time
    const rotY = t * 0.45 + this.currentLookX * 0.8 + this.gyroTiltX * 0.5;
    const rotX = Math.sin(t * 0.3) * 0.2 + this.currentLookY * 0.5 + this.gyroTiltY * 0.4;

    // 2. Geodesic Wireframe Latitudes & Longitudes
    ctx.strokeStyle = "rgba(0, 240, 255, 0.28)";
    ctx.lineWidth = 1.2;

    // Longitudinal rings (meridians)
    const meridianCount = 8;
    for (let i = 0; i < meridianCount; i++) {
      const angle = (i * Math.PI) / meridianCount + rotY;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      ctx.beginPath();
      const rx = Math.abs(cosA) * (radius * 0.96);
      ctx.ellipse(x, y, Math.max(1, rx), radius * 0.96, rotX * 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = sinA > 0 ? "rgba(0, 240, 255, 0.38)" : "rgba(99, 102, 241, 0.22)";
      ctx.stroke();
    }

    // Latitudinal rings (parallels)
    const latCount = 6;
    for (let j = 1; j < latCount; j++) {
      const latFraction = (j / latCount) * 2 - 1; // -1 to 1
      const latY = y + latFraction * (radius * 0.85);
      const latRadius = Math.sqrt(Math.max(0, 1 - latFraction * latFraction)) * (radius * 0.95);

      ctx.beginPath();
      ctx.ellipse(x, latY, latRadius, latRadius * 0.28, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.26)";
      ctx.stroke();
    }

    // 3. Cybernetic Target Crosshairs & Radar Scanner
    const radarAng = (t * 2.2) % (Math.PI * 2);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(radarAng) * radius, y + Math.sin(radarAng) * radius);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Radar blips
    for (let b = 0; b < 3; b++) {
      const bAng = radarAng - 0.4 - b * 0.25;
      const bDist = (radius * 0.35) + b * 28;
      ctx.fillStyle = `rgba(0, 240, 255, ${(0.6 - b * 0.18).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x + Math.cos(bAng) * bDist, y + Math.sin(bAng) * bDist, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Wireframe Visor Box Outline
    const vx = x - this.VISOR_W / 2 + this.currentLookX * 22 + this.gyroTiltX * 10;
    const vy = y - this.VISOR_H / 2 + this.currentLookY * 16 + this.gyroTiltY * 8;

    ctx.save();
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1.8;
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(vx, vy, this.VISOR_W, this.VISOR_H, this.VISOR_R);
    ctx.stroke();

    // Visor corner brackets
    const bracketSize = 12;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(vx, vy + bracketSize);
    ctx.lineTo(vx, vy);
    ctx.lineTo(vx + bracketSize, vy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vx + this.VISOR_W - bracketSize, vy);
    ctx.lineTo(vx + this.VISOR_W, vy);
    ctx.lineTo(vx + this.VISOR_W, vy + bracketSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vx, vy + this.VISOR_H - bracketSize);
    ctx.lineTo(vx, vy + this.VISOR_H);
    ctx.lineTo(vx + bracketSize, vy + this.VISOR_H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vx + this.VISOR_W - bracketSize, vy + this.VISOR_H);
    ctx.lineTo(vx + this.VISOR_W, vy + this.VISOR_H);
    ctx.lineTo(vx + this.VISOR_W, vy + this.VISOR_H - bracketSize);
    ctx.stroke();

    ctx.restore();

    // 5. Draw Cybernetic Eyes
    this.drawEyes(x, y);

    // 6. Holographic Horizontal Raster Scanline
    this.wireframeScanlineY = (t * 85) % (radius * 2);
    ctx.save();
    ctx.fillStyle = "rgba(0, 240, 255, 0.12)";
    ctx.fillRect(x - radius, y - radius + this.wireframeScanlineY, radius * 2, 2.5);
    ctx.restore();

    ctx.restore();

    // 7. Outer Wireframe Circular Rim
    ctx.save();
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // =====================================================
  // MAIN FRAME RENDERER (WITH TIDAL BREATHING & DRAG REBOUND)
  // =====================================================

  private draw(delta = 0.016): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.BASE_SIZE, this.BASE_SIZE);

    // Dynamic base center with interactive drag offset
    const cx = 250 + this.orbOffsetX;

    // Tidal breathing harmonic cycle (Slows from 1.35 down to 0.62 in deep sleep)
    const breathFrequency = 1.35 * (1 - this.sleepProgress * 0.54);
    const breathCycle = Math.sin(this.time * breathFrequency);
    const cy =
      250 +
      this.orbOffsetY +
      (this.reducedMotion ? 0 : breathCycle * (4.2 + this.sleepProgress * 2.2)) +
      this.nodOffset;
    const breathExpansion = 1 + breathCycle * (0.06 - this.sleepProgress * 0.02);

    const radius = 215;

    // 1. Ambient Void Bloom behind sphere
    const voidAlpha = 0.15 * (1 - this.sleepProgress * 0.5);
    this.glow(cx, cy, 235, 235, `rgba(65, 45, 140, ${voidAlpha.toFixed(3)})`);

    // 2. Apply Transform Matrix: Center, Tilt & Spring Squish
    ctx.save();
    ctx.translate(cx, cy);

    if (!this.reducedMotion) {
      ctx.rotate(this.typingTilt);
      ctx.scale(this.scaleX, this.scaleY);
    }

    ctx.translate(-cx, -cy);

    // Render Translucent Glass Sphere with 3D Depth
    if (this.wireframeMode) {
      this.drawWireframeHologram(cx, cy, radius);
    } else {
      this.drawGlassSphere(cx, cy, radius);
    }

    ctx.restore();

    // 3. Render Emotion-Specific Crown Particles (Only active when in an emotional / reactive state)
    this.updateAndDrawEmotionCrown(cx, cy, breathExpansion, delta);
  }

  // =====================================================
  // ANIMATION LOOP
  // =====================================================

  private animate(timestamp: number): void {
    if (this.destroyed) return;

    const delta = Math.min((timestamp - (this.lastTime || timestamp)) / 1000, 0.05);
    this.lastTime = timestamp;
    this.time += delta;

    this.updateKinematics(delta);
    this.draw(delta);

    this.frame = requestAnimationFrame(this.animate);
  }

  // =====================================================
  // PUBLIC CONTROLLER API
  // =====================================================

  public setState(state: AIOrbState): void {
    if (this.destroyed) return;

    if (state !== "sleep" && (this.isSleeping || this.state === "sleep")) {
      this.wake();
    }

    if (state === "thinking") {
      this.crownIntensity = 1.0;
      this.currentCrownType = "thinking";
      this.spawnEmotionParticles("thinking");
      this.triggerHaptic(15);
    } else if (this.state === "thinking" && state === "speaking") {
      this.triggerNod();
      this.triggerHaptic(20);
    }

    this.prevState = this.state;
    this.state = state;

    if (this.reducedMotion) {
      this.draw();
    }
  }

  public getState(): AIOrbState {
    return this.state;
  }

  /**
   * Triggers a conversational micro-expression & emotion crown effect
   */
  public setEmotion(emotion: AIOrbEmotion, duration = 3.0): void {
    this.emotion = emotion;
    this.emotionDuration = duration;
    this.emotionTimer = duration;
    if (emotion !== "neutral") {
      this.triggerHaptic(12);
    }
  }

  public getEmotion(): AIOrbEmotion {
    return this.emotion;
  }

  public idle(): void {
    this.setState("idle");
  }

  public listen(): void {
    this.setState("listening");
  }

  public think(): void {
    this.setState("thinking");
  }

  public speak(): void {
    this.setState("speaking");
  }

  public happy(): void {
    this.setState("happy");
  }

  public error(): void {
    this.setState("error");
  }

  public sleep(): void {
    this.state = "sleep";
    this.isSleeping = true;
  }

  public wake(): void {
    if (this.destroyed) return;
    this.lastInteractionTime = performance.now();
    this.isSleeping = false;
    if (this.state === "sleep") {
      this.state = "idle";
    }
    this.wakeSurpriseTimer = 0.28;
    this.triggerNod();
    this.triggerHaptic(30);
    this.isDoubleBlinkPending = true;
    this.nextBlinkInterval = 0.15;
  }

  public isAsleep(): boolean {
    return this.isSleeping || this.sleepProgress > 0.5;
  }

  public resetIdleTimer(): void {
    this.lastInteractionTime = performance.now();
    if (this.isSleeping) {
      this.wake();
    }
  }

  public setTyping(typing: boolean): void {
    this.isTyping = typing;
    if (typing) {
      this.resetIdleTimer();
    }
  }

  public triggerNod(): void {
    if (this.reducedMotion) return;
    this.nodActive = true;
    this.nodTimer = 0;
  }

  /**
   * Cybersecurity Micro-Expression: Shield Lock Verification Confirmation
   */
  public triggerShieldLock(): void {
    this.shieldLockTimer = this.SHIELD_LOCK_DURATION;
    this.isDoubleBlinkPending = true;
    this.triggerHaptic(25);
  }

  /**
   * Cybersecurity Micro-Expression: Threat Alert / Tactical Recon Mode
   */
  public triggerThreatAlert(): void {
    this.threatAlertTimer = this.THREAT_ALERT_DURATION;
    this.setEmotion("alert", 2.8);
    this.pupilDilation = 1.25;
    this.triggerHaptic(30);
  }

  /**
   * Sets Decryption Code Stream Shimmer during response streaming
   */
  public setStreaming(streaming: boolean): void {
    this.isStreaming = streaming;
  }

  /**
   * Kinematic Head-Tilt (tiltZ) towards interactive UI elements (e.g. chips)
   */
  public setCuriousTilt(angleRad: number): void {
    this.curiousTiltTarget = Math.max(-0.25, Math.min(0.25, angleRad));
  }

  /**
   * Conversational Celebratory Spark Burst (Target Acquired / Hired / Contact)
   */
  public triggerCelebrationSpark(): void {
    this.setEmotion("success", 3.2);
    this.triggerHaptic(30);
    this.triggerNod();
    this.scaleVelocityX = 0.08;
    this.scaleVelocityY = -0.08;

    const colors = ["#10b981", "#34d399", "#fbbf24", "#f59e0b", "#a7f3d0", "#ffffff"];
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.2 + 1.8;
      this.burstSparkles.push({
        x: 250,
        y: 270,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: Math.random() * 3.5 + 1.8,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 0.6 + 0.4,
      });
    }
  }

  /**
   * Fast Mouse Sweep Double-Take Reaction
   */
  public triggerDoubleTake(): void {
    this.doubleTakeCooldown = 4.0;
    this.doubleTakeTimer = 0.35;
    this.pupilDilation = 1.35;
    this.scaleVelocityX = 0.09;
    this.scaleVelocityY = -0.09;
    this.triggerHaptic(18);
  }

  /**
   * Voice & Audio Syllable-Reactive Energy Level
   */
  public setSpeechEnergy(energy: number): void {
    this.targetSpeechEnergy = Math.max(0, Math.min(1, energy));
  }

  public setLookAt(normX: number, normY: number): void {
    this.targetLookX = Math.max(-1, Math.min(1, normX));
    this.targetLookY = Math.max(-1, Math.min(1, normY));
    this.lastInteractionTime = performance.now();
    this.isPointerActive = true;
  }

  public resize(size: number): void {
    if (this.destroyed) return;
    this.size = size;
    this.container.style.width = `${size}px`;
    this.container.style.height = `${size}px`;
  }

  public setWireframeMode(enabled: boolean): void {
    this.wireframeMode = enabled;
    this.triggerHaptic(20);
  }

  public setNoCircleBorder(enabled: boolean): void {
    if (this.noCircleBorder !== enabled) {
      this.noCircleBorder = enabled;
      if (this.reducedMotion) {
        this.draw();
      }
    }
  }

  public getNoCircleBorder(): boolean {
    return this.noCircleBorder;
  }

  public toggleWireframeMode(): boolean {
    this.wireframeMode = !this.wireframeMode;
    this.triggerHaptic(25);
    return this.wireframeMode;
  }

  public getWireframeMode(): boolean {
    return this.wireframeMode;
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("pointermove", this.onPointerMoveBound);
      window.removeEventListener("pointerleave", this.onPointerLeaveBound);
      window.removeEventListener("blur", this.onPointerLeaveBound);
      this.container.removeEventListener("pointerdown", this.onPointerDownBound);
      window.removeEventListener("pointerup", this.onPointerUpBound);
      this.container.removeEventListener("mouseenter", this.onMouseEnterBound);
      this.container.removeEventListener("mouseleave", this.onMouseLeaveBound);
      window.removeEventListener("deviceorientation", this.onOrientationBound);
      window.removeEventListener("devicemotion", this.onDeviceMotionBound);
    }

    this.canvas.remove();
    this.emotionParticles = [];
    this.burstSparkles = [];
    this.phosphorGhosts = [];
    this.lightningStreaks = [];
    this.dotMatrixCanvas = null;
    this.dotMatrixCtx = null;
  }
}

export default AIOrb;
