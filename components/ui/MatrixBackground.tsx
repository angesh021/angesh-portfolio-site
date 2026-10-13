import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSettings } from '../../hooks/useSettings';

// --- Background Engine Configuration ---
export interface BackgroundMode {
    id: string;
    name: string;
    desc: string;
}

export const BACKGROUND_MODES: BackgroundMode[] = [
    { id: 'premium_matte', name: 'Executive Matte (Byte)', desc: 'Deep premium textured matte with subtle digital grain' },
    { id: 'stealth', name: 'Pure Slate (Stealth)', desc: 'Quiet minimalist backdrop' },
    { id: 'nexus', name: 'Astral Constellation', desc: 'Nebula clusters & stellar constellation maps' },
    { id: 'grid', name: 'Vector Horizon', desc: 'Neon wireframe grid & telemetry perspective scan' },
    { id: 'flow', name: 'Liquid Quartz', desc: 'Tactile fluid stardust simulation & vector fields' },
    { id: 'mosaic', name: 'Prism Glass Mosaic', desc: 'Stained structural glass & dynamic light refraction' },
    { id: 'fiber_paper', name: 'Craft Washi Paper', desc: 'Tactile craft paper fibers & drifting gold leaf flakes' },
    { id: 'aurora', name: 'Nordic Velvet Aurora', desc: 'Luminous shifting atmospheric silk aurora bands' },
    { id: 'art_deco', name: 'Gilded Art Deco', desc: 'Symmetrical fine gold arches & luxury geometry' },
    { id: 'waterfall', name: 'Matrix Cyber Stream', desc: 'Cascading decrypting hexadecimal code streams' }
];

// --- Physics & Interaction Configuration ---
const PARTICLE_COUNT = 250;
const MOUSE_INFLUENCE_RADIUS = 150;
const MOUSE_REPEL_STRENGTH = 2;
const FRICTION = 0.96;
const GATEWAY_PULL_STRENGTH = 0.02;

// --- Color Conversion Helpers ---
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    if (!hex) return null;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s: number, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
};

const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        h /= 360;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// --- Interfaces ---
interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    opacity: number;
    size: number;
    targetX?: number; targetY?: number;
    isStar?: boolean;
    constellationId?: number;
    connections?: number[];
    char?: string;
    paletteIndex: number;
    depth?: number;
    history?: { x: number; y: number }[];
    tiltAngle?: number;
    tiltSpeed?: number;
}

// --- Constellation Geometry for Mode 0 ---
const constellations: {x: number, y: number}[][] = [
    [{x: -0.35, y: -0.25}, {x: -0.25, y: -0.15}, {x: -0.4, y: 0.0}],
    [{x: 0.3, y: -0.2}, {x: 0.2, y: -0.1}, {x: 0.4, y: 0.0}, {x: 0.25, y: 0.1}],
    [{x: -0.1, y: 0.35}, {x: 0.0, y: 0.25}, {x: 0.1, y: 0.35}],
    [{x: 0.0, y: -0.35}, {x: -0.1, y: -0.25}, {x: 0.1, y: -0.25}],
];

const ScrollingStoryBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollPercent = useRef(0);
    const smoothedScroll = useRef(0);
    const mousePos = useRef({ x: -9999, y: -9999 });
    const particles = useRef<Particle[]>([]);
    const animationFrameId = useRef<number | null>(null);
    const footerRef = useRef<HTMLElement | null>(null);
    const isContactSectionVisible = useRef(false);
    
    // For Hex Waterfall (Mode 3) list state
    const columnStates = useRef<{y: number, speed: number, chars: string[]}[]>([]);
    const offscreenPaperRef = useRef<HTMLCanvasElement | null>(null);
    const offscreenMatteRef = useRef<HTMLCanvasElement | null>(null);

    const { activeBgId, setSetting } = useSettings();
    const activeBgIndex = Math.max(0, BACKGROUND_MODES.findIndex(m => m.id === activeBgId));

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, width: number, height: number, activeMode: number) => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        const primaryColorHex = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
        const primaryRgb = hexToRgb(primaryColorHex);
        if (!primaryRgb) return;

        const [h, s, l] = rgbToHsl(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        const PALETTE_RGB = [
            primaryRgb,
            hslToRgb((h + 120) % 360, s, l), // Triadic color 1
            hslToRgb((h + 240) % 360, s, l), // Triadic color 2
        ];

        const BASE_COLOR_PRIMARY = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b},`;

        ctx.clearRect(0, 0, width, height);
        const bgColor = isDarkMode ? '#0c1626' : '#f8f9fa';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        smoothedScroll.current = lerp(smoothedScroll.current, scrollPercent.current, 0.05);
        const sp = smoothedScroll.current;

        const centerX = width / 2;
        const centerY = height / 2;
        const scale = Math.min(width, height) * 0.9;

        const core_end = 0.20;
        const constellation_start = 0.10, constellation_end = 0.40;
        const network_start = 0.35, network_end = 0.60;
        const stream_start = 0.55, stream_end = 0.80;
        const gateway_start = 0.75;

        // Progress metrics for transitions
        const coreProgress = 1 - clamp(sp / core_end, 0, 1);
        const constellationProgress = easeInOutCubic(clamp((sp - constellation_start) / (constellation_end - constellation_start), 0, 1));
        const networkProgress = easeInOutCubic(clamp((sp - network_start) / (network_end - network_start), 0, 1));
        const streamProgress = easeInOutCubic(clamp((sp - stream_start) / (stream_end - stream_start), 0, 1));
        const gatewayProgress = isContactSectionVisible.current
            ? easeInOutCubic(clamp((sp - gateway_start) / (1 - gateway_start), 0, 1))
            : 0;

        let gatewayY = height * 0.95;
        if (gatewayProgress > 0.01 && footerRef.current) {
            const footerHeight = footerRef.current.offsetHeight;
            const dividerOffsetFromFooterTop = 25;
            const finalDividerY = height - footerHeight + dividerOffsetFromFooterTop;
            const startY = height * 0.95; 
            gatewayY = lerp(startY, finalDividerY, gatewayProgress);
        }

        // --- BACKGROUND MODE RENDERING IMPLEMENTATIONS ---
        const mode = BACKGROUND_MODES[activeMode]?.id || 'premium_matte';

        if (mode === 'premium_matte') {
            // --- MODE: EXECUTIVE MATTE (BYTE) ---
            // A flat, premium matte background augmented with interactive physical lighting effects
            ctx.save();
            
            // 1. Solid Base Color
            if (isDarkMode) {
                // A very deep, darker rich indigo/navy base closely mimicking the reference byte image
                ctx.fillStyle = `rgba(${Math.min(primaryRgb.r * 0.1 + 4, 12)}, ${Math.min(primaryRgb.g * 0.1 + 8, 22)}, ${Math.min(primaryRgb.b * 0.1 + 16, 42)}, 1)`;
            } else {
                ctx.fillStyle = '#f4f5f7'; // Premium light gray slate
            }
            ctx.fillRect(0, 0, width, height);

            // Calculate parallax offset based on smooth mouse target position
            const parallaxX = mousePos.current.x > 0 ? (mousePos.current.x - width / 2) * 0.03 : 0;
            const parallaxY = mousePos.current.y > 0 ? (mousePos.current.y - height / 2) * 0.03 : 0;

            // 2. Uniform Fine Grain + Anodized Micro-Shimmer + Parallax Depth Scaling
            if (offscreenMatteRef.current) {
                // Multiply/screen mode brings the noise tightly into the underlying color
                ctx.globalCompositeOperation = isDarkMode ? 'screen' : 'multiply';
                
                // Extremely subtle transparency to look like material grain
                // Anodized Micro-Shimmer: add a tiny pulsing time variation
                const shimmer = Math.sin(Date.now() / 1500) * 0.005;
                ctx.globalAlpha = (isDarkMode ? 0.04 : 0.03) + shimmer; 
                
                // Draw with parallax offset (-50 centers the oversized texture)
                ctx.drawImage(offscreenMatteRef.current, -50 + parallaxX, -50 + parallaxY);
            }

            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;

            // 3. Interactive Mouse Spotlight (Specular physical lighting)
            if (mousePos.current.x > 0 && mousePos.current.y > 0) {
                const spotX = mousePos.current.x;
                const spotY = mousePos.current.y;
                const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, Math.min(width, height) * 0.6);
                
                if (isDarkMode) {
                    spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.025)');
                    spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                } else {
                    spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                    spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                }
                
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = spotGrad;
                ctx.fillRect(0, 0, width, height);
                ctx.globalCompositeOperation = 'source-over';
            }

            // 4. Ambient Edge Vignette (Camera framing and focus)
            const vignetteGrad = ctx.createRadialGradient(
                centerX, centerY, height * 0.4, 
                centerX, centerY, height * 1.1
            );
            vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vignetteGrad.addColorStop(1, isDarkMode ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.08)');
            ctx.fillStyle = vignetteGrad;
            ctx.fillRect(0, 0, width, height);

            ctx.restore();
        } else if (mode === 'stealth') {
            // --- MODE: STEALTH (Ultra-premium, gorgeous minimalist quiet background with subtle grid lines) ---
            ctx.save();
            ctx.fillStyle = isDarkMode ? '#030712' : '#f8fafc';
            ctx.fillRect(0, 0, width, height);

            // Draw extremely subtle, elegant static sci-fi cybersec grid
            ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.02)';
            ctx.lineWidth = 1;
            const gridSize = 40;
            
            // Draw horizontal lines
            for (let y = 0; y < height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
            
            // Draw vertical lines
            for (let x = 0; x < width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            // Draw soft radial glowing spots with low opacity to simulate premium studio lighting behind content
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 10,
                centerX, centerY, Math.max(width, height) * 0.5
            );
            gradient.addColorStop(0, isDarkMode ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.05)` : `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.03)`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, Math.max(width, height) * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        } else if (mode === 'nexus') {
            // --- MODE 0: ASTRAL CONSTELLATION (Deep space gaseous nebulae & stars with twinkling lens flare crosses) ---
            ctx.save();
            // Deep space velvet backdrop
            ctx.fillStyle = isDarkMode ? '#050c18' : '#eef2f7';
            ctx.fillRect(0, 0, width, height);

            // Multi-colored glowing gaseous nebulae centers
            const nebulae = [
                { cx: width * 0.25, cy: height * 0.35, r: Math.max(width, height) * 0.35, hOffset: 0 },
                { cx: width * 0.75, cy: height * 0.4, r: Math.max(width, height) * 0.4, hOffset: 120 },
                { cx: width * 0.5, cy: height * 0.7, r: Math.max(width, height) * 0.38, hOffset: 240 }
            ];

            nebulae.forEach((neb, index) => {
                const driftPhase = frame * 0.0003 + index * (Math.PI / 3);
                const dX = neb.cx + Math.sin(driftPhase) * 60;
                const dY = neb.cy + Math.cos(driftPhase) * 60;

                const nebulaGrad = ctx.createRadialGradient(dX, dY, 0, dX, dY, neb.r);
                const cloudHue = (h + neb.hOffset) % 360;
                const cloudRgb = hslToRgb(cloudHue, s * 0.9, l * 0.45);
                const cloudRgbAlt = hslToRgb((cloudHue + 60) % 360, s * 0.8, l * 0.4);

                nebulaGrad.addColorStop(0, `rgba(${cloudRgb.r}, ${cloudRgb.g}, ${cloudRgb.b}, ${isDarkMode ? 0.065 : 0.05})`);
                nebulaGrad.addColorStop(0.5, `rgba(${cloudRgbAlt.r}, ${cloudRgbAlt.g}, ${cloudRgbAlt.b}, ${isDarkMode ? 0.026 : 0.018})`);
                nebulaGrad.addColorStop(1, 'rgba(0,0,0,0)');

                ctx.fillStyle = nebulaGrad;
                ctx.beginPath();
                ctx.arc(dX, dY, neb.r, 0, Math.PI * 2);
                ctx.fill();
            });

            const starParticles = particles.current.filter(p => p.isStar);

            // Connect constellation vectors with glowing hairline routes
            if (networkProgress > 0.01) {
                ctx.lineWidth = 0.55;
                starParticles.forEach(p => {
                    const pColor = PALETTE_RGB[p.paletteIndex];
                    ctx.strokeStyle = `rgba(${pColor.r}, ${pColor.g}, ${pColor.b}, ${0.12 * networkProgress * (1 - streamProgress)})`;
                    p.connections?.forEach(connIndex => {
                        const target = starParticles[connIndex];
                        if (target) {
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(target.x, target.y);
                            ctx.stroke();
                        }
                    });
                });
            }

            if (constellationProgress > 0.7) {
                 ctx.lineWidth = 0.65;
                 constellations.forEach((constellation, cId) => {
                    const points = starParticles.filter(p => p.constellationId === cId);
                    const firstPointColor = PALETTE_RGB[points[0]?.paletteIndex || 0];
                    ctx.strokeStyle = `rgba(${firstPointColor.r}, ${firstPointColor.g}, ${firstPointColor.b}, ${0.22 * constellationProgress * (1 - networkProgress)})`;
                    for(let i = 0; i < points.length - 1; i++) {
                        ctx.beginPath();
                        ctx.moveTo(points[i].x, points[i].y);
                        ctx.lineTo(points[i+1].x, points[i+1].y);
                        ctx.stroke();
                    }
                 });
            }

            particles.current.forEach((p, idx) => {
                const mdx = p.x - mousePos.current.x;
                const mdy = p.y - mousePos.current.y;
                const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

                if (mDist > 0 && mDist < MOUSE_INFLUENCE_RADIUS) {
                    const force = (1 - mDist / MOUSE_INFLUENCE_RADIUS) * MOUSE_REPEL_STRENGTH;
                    p.vx += (mdx / mDist) * force;
                    p.vy += (mdy / mDist) * force;
                }

                if (p.isStar) {
                    if (constellationProgress > 0) {
                        const tdx = p.targetX! - p.x;
                        const tdy = p.targetY! - p.y;
                        p.vx += tdx * 0.0005 * constellationProgress;
                        p.vy += tdy * 0.0005 * constellationProgress;
                    }
                } else {
                    if (streamProgress > 0.01) {
                        p.vy += 0.005 * streamProgress * (1 - gatewayProgress);
                    }
                }
                
                p.vx *= FRICTION;
                p.vy *= FRICTION;
                p.x += p.vx;
                p.y += p.vy;

                if (!p.isStar && gatewayProgress < 0.01) {
                    if (p.y > height + 10) p.y = -10;
                    if (p.x < -10) p.x = width + 10;
                    if (p.x > width + 10) p.x = -10;
                }

                const particleColor = PALETTE_RGB[p.paletteIndex];
                const flareOpacity = p.opacity * (isDarkMode ? 1.0 : 1.4);

                if (p.isStar) {
                    const starOpacity = flareOpacity * constellationProgress * (1 - streamProgress);
                    const nodeSize = lerp(p.size, p.size * 1.6, networkProgress);
                    if (starOpacity > 0.01) {
                        const twinkle = 0.75 + 0.25 * Math.sin(frame * 0.035 + idx);
                        const finalStarOpacity = Math.min(starOpacity * twinkle, 1);

                        // Concentric corona glow
                        ctx.fillStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${finalStarOpacity})`;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, nodeSize * 1.25, 0, Math.PI * 2);
                        ctx.fill();

                        // Core element
                        ctx.fillStyle = `rgba(255, 255, 255, ${finalStarOpacity})`;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, nodeSize * 0.45, 0, Math.PI * 2);
                        ctx.fill();

                        // 4-Point crosshair lens flare
                        if (idx % 3 === 0) {
                            ctx.strokeStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${finalStarOpacity * 0.45})`;
                            ctx.lineWidth = 0.55;
                            const flareLen = nodeSize * 5.6 * twinkle;
                            ctx.beginPath();
                            ctx.moveTo(p.x - flareLen, p.y);
                            ctx.lineTo(p.x + flareLen, p.y);
                            ctx.moveTo(p.x, p.y - flareLen);
                            ctx.lineTo(p.x, p.y + flareLen);
                            ctx.stroke();
                        }
                    }
                } else {
                    const streamOpacity = flareOpacity * streamProgress;
                    if (streamOpacity > 0.01) {
                        ctx.fillStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${streamOpacity})`;
                        ctx.font = `${p.size * 4.2}px "Fira Code"`;
                        ctx.fillText(p.char!, p.x, p.y);
                    }
                }
            });
            ctx.restore();

        } else if (mode === 'grid') {
            // --- MODE 1: VECTOR HORIZON (Saturated retro sunset grid, slitted sun, and wave mountain ranges) ---
            ctx.save();
            const horizon = height * (0.33 + sp * 0.03);

            // Draw twilight sky backdrop
            const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
            skyGrad.addColorStop(0, isDarkMode ? '#0a0515' : '#eae7f3');
            skyGrad.addColorStop(0.6, isDarkMode ? '#1a0d33' : '#dbd4f0');
            skyGrad.addColorStop(1, isDarkMode ? '#3b1d5a' : '#c3b4e7');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, width, horizon);

            // Glowing retro sun disc centered on the horizon line
            const sunR = Math.min(width, height) * 0.16;
            const sunX = width / 2;
            const sunY = horizon - 15;

            const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
            sunGrad.addColorStop(0, '#ff1493'); // Hot Magenta
            sunGrad.addColorStop(0.5, '#ff4500'); // Neon Orange
            sunGrad.addColorStop(1, '#ffd700'); // Gold Sunset
            ctx.fillStyle = sunGrad;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunR, Math.PI, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            // Symmetrical horizontal slash slit overlays
            ctx.fillStyle = isDarkMode ? '#0d1017' : '#fcfbf8';
            for (let sy = sunY - sunR; sy < sunY; sy += 10) {
                const ratio = (sunY - sy) / sunR;
                const slashHeight = 1.8 + (1 - ratio) * 2.8;
                ctx.fillRect(sunX - sunR * 1.5, sy, sunR * 3, slashHeight);
            }

            // Draw majestic wireframe hills along the left and right background edges
            ctx.strokeStyle = isDarkMode ? `rgba(236, 72, 153, 0.16)` : `rgba(236, 72, 153, 0.28)`;
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            for (let x = 0; x <= width; x += 12) {
                const centerDist = x - width / 2;
                const distRatio = Math.abs(centerDist) / (width / 2);
                const sideClamp = distRatio > 0.4 ? (distRatio - 0.4) / 0.6 : 0;
                if (sideClamp > 0) {
                    const waveHeight = Math.sin(x * 0.015 - frame * 0.01) * 20 + Math.cos(x * 0.005 + frame * 0.005) * 35;
                    const hy = horizon - sideClamp * 135 + waveHeight * sideClamp;
                    if (x === 0) ctx.moveTo(x, hy); else ctx.lineTo(x, hy);
                }
            }
            ctx.stroke();

            // Set perspective grid floor parameters
            const gridColor = isDarkMode ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)` : `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.26)`;
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 0.65;

            // Exponential horizontal projection rows
            const gridYOffset = (frame * 0.28 + sp * 380) % 45;
            for (let ri = 0; ri < 14; ri++) {
                const ratio = ri / 14;
                const py = horizon + Math.pow(ratio, 2.3) * (height - horizon) + gridYOffset * ratio;
                ctx.beginPath();
                ctx.moveTo(0, py);
                ctx.lineTo(width, py);
                ctx.stroke();
            }

            // Symmetrical converging radial track lines
            const vanishingX = width / 2;
            const wireframesCount = 29;
            for (let i = 0; i < wireframesCount; i++) {
                const xRatio = (i - (wireframesCount - 1)/2) / ((wireframesCount - 1)/2);
                const startX = vanishingX + xRatio * (width * 0.06);
                const endX = vanishingX + xRatio * (width * 1.5);
                ctx.beginPath();
                ctx.moveTo(startX, horizon);
                ctx.lineTo(endX, height);
                ctx.stroke();
            }

            // Glowing scanline swept laser bar
            const scanPos = (frame * 1.2) % (height - horizon);
            const scanY = horizon + Math.pow(scanPos / (height - horizon), 1.9) * (height - horizon);
            ctx.strokeStyle = `rgba(236, 72, 153, ${Math.max(0, 1.0 - (scanPos / (height - horizon))) * 0.45})`;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(0, scanY);
            ctx.lineTo(width, scanY);
            ctx.stroke();

            // Coordinate HUD trackers
            particles.current.forEach((p, idx) => {
                if (idx < 20) {
                    const depth = ((idx * 8 + frame * 0.035) % 100) / 100;
                    const px = vanishingX + (p.x - centerX) * depth * 2.1;
                    const py = horizon + depth * depth * (height - horizon);
                    
                    ctx.fillStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${p.opacity * depth * 0.45 * (isDarkMode ? 1 : 1.4)})`;
                    ctx.font = '7px "JetBrains Mono"';
                    ctx.fillText('☼', px - 2, py + 2.5);
                    
                    if (idx % 5 === 0 && depth > 0.4) {
                        ctx.fillStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${depth * 0.35})`;
                        ctx.fillText(`C_VAL://[${Math.round(px)},${Math.round(py)}]`, px + 8, py - 3);
                    }
                }
            });
            ctx.restore();

        } else if (mode === 'flow') {
            // --- MODE 2: LIQUID QUARTZ (Tactile ribbon curves & ribbon flow paths) ---
            ctx.save();
            particles.current.forEach((p) => {
                const angle = Math.sin(p.x * 0.0028 + frame * 0.007) * Math.cos(p.y * 0.0028 + frame * 0.007) * Math.PI * 2.2;
                
                const mdx = p.x - mousePos.current.x;
                const mdy = p.y - mousePos.current.y;
                const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

                if (mDist > 0 && mDist < MOUSE_INFLUENCE_RADIUS) {
                    const force = (1 - mDist / MOUSE_INFLUENCE_RADIUS) * MOUSE_REPEL_STRENGTH * 0.45;
                    p.vx += (mdx / mDist) * force;
                    p.vy += (mdy / mDist) * force;
                }

                p.vx += Math.cos(angle) * 0.055;
                p.vy += Math.sin(angle) * 0.055 + 0.02;

                p.vx *= 0.96;
                p.vy *= 0.96;

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < -20) p.x = width + 20;
                if (p.x > width + 20) p.x = -20;
                if (p.y < -20) p.y = height + 20;
                if (p.y > height + 20) p.y = -20;

                if (!p.history) p.history = [];
                p.history.push({ x: p.x, y: p.y });
                if (p.history.length > 7) p.history.shift();

                const color = PALETTE_RGB[p.paletteIndex];
                const opacity = p.opacity * 0.42 * (isDarkMode ? 1.0 : 1.4);

                // Fluid silken ribbons linking trace coordinate vectors
                if (p.history.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(p.history[0].x, p.history[0].y);
                    for (let i = 1; i < p.history.length; i++) {
                        const midX = (p.history[i-1].x + p.history[i].x) / 2;
                        const midY = (p.history[i-1].y + p.history[i].y) / 2;
                        ctx.quadraticCurveTo(p.history[i-1].x, p.history[i-1].y, midX, midY);
                    }
                    
                    const ribbonColor = ctx.createLinearGradient(
                        p.history[0].x, p.history[0].y, 
                        p.x, p.y
                    );
                    ribbonColor.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
                    ribbonColor.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.35})`);
                    ribbonColor.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`);
                    
                    ctx.strokeStyle = ribbonColor;
                    ctx.lineWidth = p.size * 1.5;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }

                ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();

        } else if (mode === 'waterfall') {
            // --- MODE 7: MATRIX CYBER STREAM (3D Depth of Field decrypting code streams) ---
            ctx.save();
            const columns = Math.ceil(width / 24);
            
            if (columnStates.current.length === 0 || columnStates.current.length < columns) {
                columnStates.current = Array.from({ length: columns }, () => ({
                    y: Math.random() * -height - 250,
                    speed: Math.random() * 2 + 1.2,
                    chars: Array.from({ length: 22 }, () => 
                        Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')
                    )
                }));
            }

            const hexColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b},`;

            columnStates.current.forEach((col, colIdx) => {
                col.y += col.speed * (1.0 + sp * 0.45);
                
                if (col.y > height) {
                    col.y = -240;
                    col.speed = Math.random() * 1.8 + 1.2;
                }

                if (Math.random() < 0.045) {
                    const charIdx = Math.floor(Math.random() * col.chars.length);
                    col.chars[charIdx] = Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');
                }

                // 3D Depth of field variation coefficient
                const depth = 0.5 + ((colIdx % 7) / 6.0) * 0.7; // 0.5 to 1.2
                const fontSize = Math.round(11 * depth);
                ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

                const cx = colIdx * 25 + 8;
                for (let i = 0; i < col.chars.length; i++) {
                    const cy = col.y + i * (fontSize + 3);
                    if (cy < -15 || cy > height + 20) continue;

                    const baseOpacity = (i / col.chars.length) * 0.32 * depth * (isDarkMode ? 1.0 : 1.35);

                    if (i === col.chars.length - 1) {
                        ctx.fillStyle = isDarkMode ? '#ffffff' : `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 1)`;
                        ctx.shadowColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.85)`;
                        ctx.shadowBlur = 8;
                        ctx.fillText(col.chars[i], cx, cy);
                        ctx.shadowBlur = 0;
                    } else {
                        ctx.fillStyle = `${hexColor} ${baseOpacity})`;
                        ctx.fillText(col.chars[i], cx, cy);
                    }
                }
            });
            ctx.restore();        } else if (mode === 'aurora') {
            // --- MODE 5: NORDIC VELVET AURORA (Atmospheric silk ribbon curtains with multi-hued light blending) ---
            ctx.save();
            const numBands = 4;
            for (let i = 0; i < numBands; i++) {
                const phase = frame * 0.0014 + i * (Math.PI / numBands) * 1.2;
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                const alpha = 0.09 * (1.1 + sp * 0.5) * (isDarkMode ? 1.0 : 1.34);
                
                const colBand1 = hslToRgb((h - 40 + i*18) % 360, s * 0.85, l * 0.48);
                const colBand2 = hslToRgb((h + 40 - i*18) % 360, s * 0.9, l * 0.55);

                gradient.addColorStop(0, `rgba(${colBand1.r}, ${colBand1.g}, ${colBand1.b}, 0)`);
                gradient.addColorStop(0.48, `rgba(${colBand1.r}, ${colBand1.g}, ${colBand1.b}, ${alpha})`);
                gradient.addColorStop(0.62, `rgba(${colBand2.r}, ${colBand2.g}, ${colBand2.b}, ${alpha * 0.65})`);
                gradient.addColorStop(1, `rgba(${colBand2.r}, ${colBand2.g}, ${colBand2.b}, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(0, height);
                
                const steps = 30;
                for (let step = 0; step <= steps; step++) {
                    const x = (step / steps) * (width + 50);
                    const foldy = Math.sin(x * 0.0016 + phase * 2.2) * 120 + 
                                  Math.cos(x * 0.0006 - phase) * 65 + 
                                  Math.sin(x * 0.003 + phase * 0.7) * 35;
                    const y = height * (0.32 + i * 0.13) + foldy;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(width, height);
                ctx.closePath();
                ctx.fill();
            }

            particles.current.forEach((p, idx) => {
                if (idx < 50) {
                    p.y += (Math.sin(frame * 0.005 + p.opacity * 100) * 0.18 + p.vy * 0.08);
                    const opacity = p.opacity * 0.16 * (isDarkMode ? 1 : 1.45);
                    const size = p.size * 1.5;
                    ctx.fillStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g + 30}, ${primaryRgb.b + 55}, ${opacity})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.restore();

        } else if (mode === 'mosaic') {
            // --- MODE 3: PRISM GLASS MOSAIC (Interactive stained construct structural glass prism facets) ---
            ctx.save();
            const cols = 9;
            const rows = 7;
            const cellW = width / (cols - 1);
            const cellH = height / (rows - 1);
            
            const vertices: {x: number, y: number}[] = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const bx = c * cellW;
                    const by = r * cellH;
                    
                    const phase = (bx * 0.0012) + (by * 0.0012) + (frame * 0.0075);
                    const shiftX = Math.sin(phase) * (cellW * 0.18);
                    const shiftY = Math.cos(phase) * (cellH * 0.18);
                    
                    let rx = bx + shiftX;
                    let ry = by + shiftY;
                    
                    if (c > 0 && c < cols - 1 && r > 0 && r < rows - 1) {
                        const mdx = rx - mousePos.current.x;
                        const mdy = ry - mousePos.current.y;
                        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
                        if (mdist < 240) {
                            const force = (1 - mdist/240) * 28;
                            rx += (mdx / mdist) * force;
                            ry += (mdy / mdist) * force;
                        }
                    }
                    vertices.push({ x: rx, y: ry });
                }
            }
            
            for (let r = 0; r < rows - 1; r++) {
                for (let c = 0; c < cols - 1; c++) {
                    const i00 = r * cols + c;
                    const i10 = r * cols + (c + 1);
                    const i01 = (r + 1) * cols + c;
                    const i11 = (r + 1) * cols + (c + 1);

                    const faces = [
                        [vertices[i00], vertices[i10], vertices[i01]],
                        [vertices[i10], vertices[i11], vertices[i01]]
                    ];

                    faces.forEach((points) => {
                        const cx = (points[0].x + points[1].x + points[2].x) / 3;
                        const cy = (points[0].y + points[1].y + points[2].y) / 3;
                        
                        const mdx = cx - mousePos.current.x;
                        const mdy = cy - mousePos.current.y;
                        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
                        const lightFactor = mdist < 260 ? (1.5 - mdist/260) : 0.42;

                        const colIndex = (Math.round(cx + cy)) % 3;
                        const activeColor = PALETTE_RGB[colIndex];
                        
                        const baseAl = isDarkMode ? 0.024 : 0.045;
                        const lightAl = lightFactor * 0.095;
                        const fillCol = `rgba(${activeColor.r}, ${activeColor.g}, ${activeColor.b}, ${baseAl + lightAl})`;
                        
                        ctx.fillStyle = fillCol;
                        ctx.beginPath();
                        ctx.moveTo(points[0].x, points[0].y);
                        ctx.lineTo(points[1].x, points[1].y);
                        ctx.lineTo(points[2].x, points[2].y);
                        ctx.closePath();
                        ctx.fill();

                        // Highlights on edges facing light
                        ctx.strokeStyle = isDarkMode ? `rgba(255, 255, 255, ${0.07 + lightAl})` : `rgba(255, 255, 255, ${0.12 + lightAl})`;
                        ctx.lineWidth = 1.1;
                        ctx.beginPath();
                        ctx.moveTo(points[0].x, points[0].y);
                        ctx.lineTo(points[1].x, points[1].y);
                        ctx.stroke();

                        // Shaded edges
                        ctx.strokeStyle = isDarkMode ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.045)` : `rgba(0, 0, 0, 0.055)`;
                        ctx.lineWidth = 0.65;
                        ctx.beginPath();
                        ctx.moveTo(points[1].x, points[1].y);
                        ctx.lineTo(points[2].x, points[2].y);
                        ctx.lineTo(points[0].x, points[0].y);
                        ctx.stroke();
                    });
                }
            }
            ctx.restore();

        } else if (mode === 'fiber_paper') {
            // --- MODE 4: CRAFT WASHI PAPER (Tactile luxury texture with 3D spinning leaf shimmers) ---
            ctx.save();
            ctx.fillStyle = isDarkMode ? '#0d1017' : '#fcfbf8';
            ctx.fillRect(0, 0, width, height);
            
            if (offscreenPaperRef.current) {
                ctx.drawImage(offscreenPaperRef.current, 0, 0);
            }
            
            const mdx = mousePos.current.x;
            const mdy = mousePos.current.y;
            if (mdx !== -9999) {
                const paperGlow = ctx.createRadialGradient(mdx, mdy, 12, mdx, mdy, Math.max(width, height) * 0.44);
                const glowColor = isDarkMode 
                    ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.082)` 
                    : 'rgba(255, 254, 248, 0.72)';
                paperGlow.addColorStop(0, glowColor);
                paperGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = paperGlow;
                ctx.fillRect(0, 0, width, height);
            }
            
            // Flutter falling 24k gold shimmers rotating dynamically in 3D projection
            particles.current.forEach((p) => {
                if (!p.isStar) {
                    p.vy += 0.0035 * (1.0 + sp * 0.75);
                    p.vx += Math.sin(frame * 0.015 + p.opacity * 10) * 0.022;
                    p.vx *= 0.95;
                    p.vy *= 0.95;
                    p.x += p.vx;
                    p.y += p.vy;
                    
                    if (p.y > height + 25) {
                        p.y = -25;
                        p.x = Math.random() * width;
                        p.vx = (Math.random() - 0.5) * 0.45;
                        p.vy = Math.random() * 0.35 + 0.15;
                    }

                    if (!p.tiltAngle) p.tiltAngle = 0;
                    p.tiltAngle += p.tiltSpeed || 0.012;
                    
                    const size = p.size * 2.3;
                    const scaleX = Math.sin(p.tiltAngle);
                    const verticalTilt = Math.cos(p.tiltAngle * 0.55);

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.tiltAngle * 0.7);
                    ctx.scale(scaleX, verticalTilt);
                    
                    const reflectiveGlint = Math.max(0.12, Math.abs(scaleX));
                    const goldGrad = ctx.createLinearGradient(-size, -size, size, size);
                    goldGrad.addColorStop(0, `rgba(242, 211, 102, ${0.45 * reflectiveGlint})`);
                    goldGrad.addColorStop(0.55, `rgba(255, 230, 92, ${0.82 * reflectiveGlint})`);
                    goldGrad.addColorStop(1, `rgba(189, 142, 34, ${0.32 * reflectiveGlint})`);
                    
                    ctx.fillStyle = goldGrad;
                    ctx.shadowColor = `rgba(0, 0, 0, ${isDarkMode ? 0.14 : 0.07})`;
                    ctx.shadowBlur = 1.4;
                    ctx.shadowOffsetX = 0.5;
                    ctx.shadowOffsetY = 1.2;

                    ctx.beginPath();
                    ctx.moveTo(0, -size);
                    ctx.lineTo(size * 0.88, -size * 0.25);
                    ctx.lineTo(size * 0.55, size * 0.82);
                    ctx.lineTo(-size * 0.72, size * 0.42);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            });
            ctx.restore();

        } else if (mode === 'art_deco') {
            // --- MODE 6: GILDED ART DECO (Symmetrical 24k geometric brass arches & luxury gold filigree grids) ---
            ctx.save();
            const goldColor = isDarkMode ? `rgba(218, 165, 32, 0.09)` : `rgba(174, 131, 48, 0.13)`;
            ctx.strokeStyle = goldColor;
            ctx.lineWidth = 0.85;

            const scaleFactor = Math.min(width, height);
            const decoCenterX = width / 2;
            const decoCenterY = height * 0.44 + sp * 110;
            const step = scaleFactor * 0.048;
            const numArches = 10;

            // Symmetrical filigree background network
            ctx.strokeStyle = isDarkMode ? `rgba(218, 165, 32, 0.016)` : `rgba(174, 131, 48, 0.024)`;
            ctx.lineWidth = 0.5;
            const boxSpacing = scaleFactor * 0.08;
            for (let x = -width; x < width * 2; x += boxSpacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x + height, height);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + height, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            // Concentric gilded arches
            for (let i = 1; i <= numArches; i++) {
                const radius = i * step;
                
                ctx.strokeStyle = isDarkMode ? `rgba(218, 165, 32, ${0.08 - i*0.005})` : `rgba(174, 131, 48, ${0.12 - i*0.006})`;
                ctx.lineWidth = i === numArches ? 1.4 : i % 2 === 0 ? 0.95 : 0.55;
                ctx.beginPath();
                ctx.arc(decoCenterX, decoCenterY, radius, Math.PI, Math.PI * 2);
                ctx.stroke();

                ctx.strokeStyle = isDarkMode ? `rgba(218, 165, 32, 0.038)` : `rgba(174, 131, 48, 0.055)`;
                ctx.beginPath();
                ctx.arc(decoCenterX - radius, decoCenterY + radius * 0.5, radius, Math.PI * 1.35, Math.PI * 1.85);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(decoCenterX + radius, decoCenterY + radius * 0.5, radius, Math.PI * 1.15, Math.PI * 1.65);
                ctx.stroke();
            }

            // Sunburst crown rays
            ctx.strokeStyle = isDarkMode ? `rgba(218, 165, 32, 0.014)` : `rgba(174, 131, 48, 0.025)`;
            ctx.lineWidth = 0.45;
            for (let angle = Math.PI; angle <= Math.PI * 2; angle += Math.PI / 24) {
                ctx.beginPath();
                ctx.moveTo(decoCenterX, decoCenterY);
                ctx.lineTo(decoCenterX + Math.cos(angle) * (scaleFactor * 1.4), decoCenterY + Math.sin(angle) * (scaleFactor * 1.4));
                ctx.stroke();
            }
            
            // Gilded glints
            particles.current.forEach((p, idx) => {
                if (idx < 45) {
                    const shimmer = Math.abs(Math.sin(frame * 0.012 + p.opacity * 10));
                    ctx.fillStyle = `rgba(242, 211, 102, ${p.opacity * shimmer * 0.35})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 0.85, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.restore();
        }

        // Gateway rendering has been removed as per user request to clean up the scrolling line.

    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        footerRef.current = document.querySelector('footer');
        const contactSectionEl = document.getElementById('contact');

        let width = 0, height = 0, frame = 0;
        let lastWinWidth = window.innerWidth;
        let lastWinHeight = window.innerHeight;

        const setup = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            const centerX = width / 2;
            const centerY = height / 2;
            const scale = Math.min(width, height) * 0.9;
            
            // Build particles arrays
            particles.current = [];
            columnStates.current = []; // Refresh waterfall columns too
            let starCount = 0;
            const starParticles: Particle[] = [];
            const streamParticles: Particle[] = [];

            constellations.forEach((constellation, cId) => {
                constellation.forEach(point => {
                    starParticles.push({
                        x: centerX, y: centerY,
                        vx: (Math.random() - 0.5) * 1.5, 
                        vy: (Math.random() - 0.5) * 1.5,
                        opacity: Math.random() * 0.4 + 0.6,
                        size: Math.random() * 1.5 + 1,
                        targetX: centerX + point.x * scale,
                        targetY: centerY + point.y * scale,
                        isStar: true,
                        constellationId: cId,
                        connections: [],
                        paletteIndex: Math.floor(Math.random() * 3),
                    });
                    starCount++;
                });
            });

            starParticles.forEach((p) => {
                for(let j=0; j<2; j++) {
                    const connIndex = Math.floor(Math.random() * starParticles.length);
                    p.connections!.push(connIndex);
                }
            });

            for(let i = 0; i < PARTICLE_COUNT - starCount; i++) {
                 const rx = Math.random() * width;
                 const ry = Math.random() * height;
                 streamParticles.push({
                    x: rx,
                    y: ry,
                    vx: 0,
                    vy: (Math.random() * 0.4 + 0.15),
                    opacity: Math.random() * 0.45,
                    size: Math.random() * 2 + 1,
                    char: Math.random() > 0.5 ? '0' : '1',
                    paletteIndex: Math.floor(Math.random() * 3),
                    depth: Math.random() * 1.1 + 0.1,
                    history: [{ x: rx, y: ry }],
                    tiltAngle: Math.random() * Math.PI * 2,
                    tiltSpeed: Math.random() * 0.02 + 0.005
                });
            }
            particles.current = [...starParticles, ...streamParticles];

            // --- Pre-render luxury paper texture onto offscreen canvas ---
            const primaryColorHex = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
            const primaryRgb = hexToRgb(primaryColorHex) || { r: 13, g: 148, b: 136 };
            if (width > 0 && height > 0) {
                try {
                    const offscreen = document.createElement('canvas');
                    offscreen.width = width;
                    offscreen.height = height;
                    const octx = offscreen.getContext('2d');
                    if (octx) {
                        octx.clearRect(0, 0, width, height);

                        // Draw micro paper grain "tooth" noise
                        const imgData = octx.createImageData(width, height);
                        const data = imgData.data;
                        const len = data.length;
                        for (let i = 0; i < len; i += 4) {
                            const noise = (Math.random() - 0.5) * 5;
                            data[i] = 127 + noise;
                            data[i+1] = 127 + noise;
                            data[i+2] = 127 + noise;
                            data[i+3] = 8; // microscopic alpha
                        }
                        octx.putImageData(imgData, 0, 0);

                        // Draw delicate gold, fine copper, gray linen and primary color organic fibers
                        const colors = [
                            'rgba(218, 165, 32, 0.09)', // Metallic Gold
                            'rgba(184, 115, 51, 0.07)', // Warm Copper
                            'rgba(130, 130, 130, 0.05)', // Raw linen gray
                            `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.06)`, // Ambient primary accent
                        ];

                        octx.lineWidth = 0.5;
                        const fiberCount = Math.min(900, (width * height) / 1600);
                        for (let i = 0; i < fiberCount; i++) {
                            const sx = Math.random() * width;
                            const sy = Math.random() * height;
                            const length = Math.random() * 30 + 10;
                            const angle = Math.random() * Math.PI * 2;
                            const cx1 = sx + Math.cos(angle) * (length * 0.33) + (Math.random() - 0.5) * 6;
                            const cy1 = sy + Math.sin(angle) * (length * 0.33) + (Math.random() - 0.5) * 6;
                            const cx2 = sx + Math.cos(angle) * (length * 0.66) + (Math.random() - 0.5) * 6;
                            const cy2 = sy + Math.sin(angle) * (length * 0.66) + (Math.random() - 0.5) * 6;
                            const ex = sx + Math.cos(angle) * length;
                            const ey = sy + Math.sin(angle) * length;

                            octx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
                            octx.beginPath();
                            octx.moveTo(sx, sy);
                            octx.bezierCurveTo(cx1, cy1, cx2, cy2, ex, ey);
                            octx.stroke();
                        }
                        offscreenPaperRef.current = offscreen;
                    }
                    
                    const mx = width + 100;
                    const my = height + 100;
                    const offscreenMatte = document.createElement('canvas');
                    offscreenMatte.width = mx;
                    offscreenMatte.height = my;
                    const matteCtx = offscreenMatte.getContext('2d');
                    if (matteCtx) {
                        matteCtx.clearRect(0, 0, mx, my);

                        const imgData = matteCtx.createImageData(mx, my);
                        const data = imgData.data;
                        const len = data.length;
                        for (let i = 0; i < len; i += 4) {
                            const noiseVal = Math.random() > 0.5 ? 255 : 0;
                            data[i] = noiseVal;
                            data[i+1] = noiseVal;
                            data[i+2] = noiseVal;
                            data[i+3] = 255; 
                        }
                        matteCtx.putImageData(imgData, 0, 0);
                        offscreenMatteRef.current = offscreenMatte;
                    }

                } catch (e) {
                    console.warn("Failed to create offscreen paper texture canvas:", e);
                    offscreenPaperRef.current = null;
                    offscreenMatteRef.current = null;
                }
            } else {
                offscreenPaperRef.current = null;
                offscreenMatteRef.current = null;
            }
        };

        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );
            const clientHeight = window.innerHeight;
            const scrollableHeight = docHeight - clientHeight;
            scrollPercent.current = scrollableHeight > 0 ? clamp(scrollTop / scrollableHeight, 0, 1) : 0;
        };

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseLeave = () => {
            mousePos.current = { x: -9999, y: -9999 };
        };
        
        const animate = () => {
            frame++;
            draw(ctx, frame, width, height, activeBgIndex);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                isContactSectionVisible.current = entry.isIntersecting;
            },
            {
                rootMargin: '0px',
                threshold: 0.01,
            }
        );

        if (contactSectionEl) {
            observer.observe(contactSectionEl);
        }
        
        const handleResize = () => {
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;
            // Only re-setup if width changed significantly or height changed significantly (e.g., orientation change, not just UI bar hiding)
            const widthDelta = Math.abs(currentWidth - lastWinWidth);
            const heightDelta = Math.abs(currentHeight - lastWinHeight);
            
            if (widthDelta > 50 || heightDelta > 150) {
                lastWinWidth = currentWidth;
                lastWinHeight = currentHeight;
                setup();
            } else if (canvas) {
                // For small changes (like mobile URL bars) just quietly resize the canvas backing store slightly
                // without wiping out the particles
                width = canvas.width = currentWidth;
                height = canvas.height = currentHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        setup();
        handleScroll();
        animate();

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            observer.disconnect();
        };
    }, [draw, activeBgIndex]);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none bg-light-bg dark:bg-dark-bg"
                aria-hidden="true"
            />
        </>
    );
};

export default ScrollingStoryBackground;
