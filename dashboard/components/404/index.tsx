"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotFoundSVG() {
    // Use shared theme (adapter over next-themes)
    const { theme: currentTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [robotMood, setRobotMood] = useState('normal');

    useEffect(() => {
        // Mark mounted so we avoid hydration mismatch when reading theme
        setMounted(true);
    }, []);

    // derive boolean used through the file for styling
    const isDarkMode = mounted ? (currentTheme === 'dark') : true;

    useEffect(() => {
        // Random mood changes
        const moodInterval = setInterval(() => {
            const moods = ['normal', 'happy', 'sad', 'confused'];
            const randomMood = moods[Math.floor(Math.random() * moods.length)];
            setRobotMood(randomMood);
        }, 8000);

        return () => clearInterval(moodInterval);
    }, []);

    const toggleTheme = () => {
        // Toggle between 'dark' and 'light' using next-themes adapter
        if (currentTheme === 'dark') setTheme('light');
        else setTheme('dark');
    };

    const handleRobotClick = () => {
        setRobotMood(robotMood === 'happy' ? 'normal' : 'happy');
    };

    const theme = isDarkMode ? {
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 30%, #16213e 70%, #0f3460 100%)',
        containerBg: '#0f1419',
        robotBody: '#4a5568',
        robotBodyStroke: '#2d3748',
        robotAccent: '#63b3ed',
        robotAccentStroke: '#3182ce',
        robotVisor: '#1a202c',
        robotVisorStroke: '#2d3748',
        robotGlow: '#00ff88',
        textMain: '#ffffff',
        textSubtitle: '#e2e8f0',
        floatingDots: 'rgba(255, 255, 255, 0.15)',
        decorativeLine: 'rgba(255, 255, 255, 0.3)',
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        buttonBg: 'rgba(255, 255, 255, 0.1)',
        buttonBorder: 'rgba(255, 255, 255, 0.2)',
        buttonText: '#ffffff',
        glowEffect: 'rgba(99, 179, 237, 0.4)',
        robotBodyGradient: 'linear-gradient(145deg, #5a6578 0%, #3a4555 100%)',
        metallic: '#718096'
    } : {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 30%, #cbd5e0 70%, #a0aec0 100%)',
        containerBg: '#ffffff',
        robotBody: '#4a5568',
        robotBodyStroke: '#2d3748',
        robotAccent: '#3182ce',
        robotAccentStroke: '#2c5aa0',
        robotVisor: '#2d3748',
        robotVisorStroke: '#1a202c',
        robotGlow: '#00cc6a',
        textMain: '#2d3748',
        textSubtitle: '#4a5568',
        floatingDots: 'rgba(74, 85, 104, 0.2)',
        decorativeLine: 'rgba(45, 55, 72, 0.4)',
        shadowColor: 'rgba(0, 0, 0, 0.25)',
        buttonBg: 'rgba(45, 55, 72, 0.1)',
        buttonBorder: 'rgba(45, 55, 72, 0.2)',
        buttonText: '#2d3748',
        glowEffect: 'rgba(49, 130, 206, 0.3)',
        robotBodyGradient: 'linear-gradient(145deg, #5a6578 0%, #4a5568 100%)',
        metallic: '#718096'
    };

    const getMoodEyes = () => {
        switch (robotMood) {
            case 'happy':
                return { leftEye: 'M 30 25 Q 35 35 40 25', rightEye: 'M 80 25 Q 85 35 90 25', pupils: false };
            case 'sad':
                return { leftEye: 'M 30 35 Q 35 25 40 35', rightEye: 'M 80 35 Q 85 25 90 35', pupils: true };
            case 'confused':
                return { leftEye: { cx: 35, cy: 30, r: 5 }, rightEye: { cx: 83, cy: 28, r: 3 }, pupils: true };
            default:
                return { leftEye: { cx: 35, cy: 30, r: 5 }, rightEye: { cx: 85, cy: 30, r: 5 }, pupils: true };
        }
    };

    const eyeData = getMoodEyes();

    return (
        <div className="container-svg" style={{ background: theme.background }}>
            <style jsx>{`
                .container-svg {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                    transition: background 0.5s ease;
                }

                .theme-toggle {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: ${theme.buttonBg};
                    border: 2px solid ${theme.buttonBorder};
                    border-radius: 50px;
                    padding: 10px 18px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(15px);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: ${theme.buttonText};
                    font-family: 'Arial', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                .theme-toggle:hover {
                    background: ${theme.buttonBorder};
                    transform: translateY(-2px);
                    box-shadow: 0 6px 25px rgba(0,0,0,0.15);
                }

                .theme-icon {
                    font-size: 18px;
                    transition: transform 0.5s ease;
                }

                .theme-toggle:hover .theme-icon {
                    transform: rotate(360deg);
                }

                .error-svg {
                    width: 650px;
                    height: 450px;
                    max-width: 90vw;
                    max-height: 90vh;
                }

                /* Enhanced Robot Styles */
                .robot-shadow {
                    fill: ${theme.shadowColor};
                    animation: shadowFloat 4s ease-in-out infinite;
                    filter: blur(2px);
                }

                .robot-body {
                    fill: ${theme.robotBody};
                    stroke: ${theme.robotBodyStroke};
                    stroke-width: 2;
                    transition: all 0.3s ease;
                    filter: drop-shadow(2px 4px 8px rgba(0,0,0,0.2));
                }

                .robot-body-main {
                    fill: url(#robotBodyGradient);
                    stroke: ${theme.robotBodyStroke};
                    stroke-width: 2;
                    transition: all 0.3s ease;
                    filter: drop-shadow(3px 6px 12px rgba(0,0,0,0.3));
                }

                .robot-accent {
                    fill: ${theme.robotAccent};
                    stroke: ${theme.robotAccentStroke};
                    stroke-width: 1.5;
                    transition: all 0.3s ease;
                    filter: drop-shadow(1px 2px 4px rgba(0,0,0,0.2));
                }

                .robot-metallic {
                    fill: ${theme.metallic};
                    stroke: ${theme.robotBodyStroke};
                    stroke-width: 1;
                    transition: all 0.3s ease;
                }

                .robot-visor {
                    fill: ${theme.robotVisor};
                    stroke: ${theme.robotVisorStroke};
                    stroke-width: 2;
                    transition: all 0.3s ease;
                    filter: drop-shadow(inset 0 2px 4px rgba(0,0,0,0.3));
                }

                .robot-visor-glow {
                    fill: ${theme.robotGlow};
                    animation: eyeGlow 2.5s ease-in-out infinite alternate;
                    filter: drop-shadow(0 0 10px ${theme.robotGlow});
                    transition: all 0.3s ease;
                }

                .robot-clickable {
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }

                .robot-clickable:hover {
                    transform: scale(1.02);
                }

                /* Advanced Robot Animations */
                #robot-utuh {
                    animation: robotFloat 5s ease-in-out infinite;
                    transform-origin: 80px 120px;
                }

                #bagian-berputar {
                    animation: headMovement 8s ease-in-out infinite;
                    transform-origin: 60px 30px;
                }

                #lengan-kiri {
                    animation: leftArmAdvanced 4s ease-in-out infinite;
                    transform-origin: 15px 85px;
                }

                #lengan-kanan {
                    animation: rightArmAdvanced 4s ease-in-out infinite 1s;
                    transform-origin: 105px 85px;
                }

                .robot-joint {
                    animation: jointRotate 3s ease-in-out infinite;
                }

                #mata-robot-kiri, #mata-robot-kanan {
                    animation: ${robotMood === 'confused' ? 'eyeConfused' : 'eyeBlink'} 5s ease-in-out infinite;
                    transition: all 0.5s ease;
                }

                #lampu-antena {
                    animation: antennaAdvanced 2s ease-in-out infinite;
                    filter: drop-shadow(0 0 15px ${theme.robotGlow});
                }

                .chest-panel {
                    animation: chestGlow 3s ease-in-out infinite;
                }

                .robot-speaker {
                    animation: speakerPulse 1.5s ease-in-out infinite;
                }

                /* Enhanced Text Styles */
                .text-404 {
                    font-family: 'Arial Black', sans-serif;
                    font-size: 78px;
                    font-weight: 900;
                    fill: url(#gradient404);
                    animation: textPulse 2.5s ease-in-out infinite;
                    filter: drop-shadow(4px 4px 8px ${theme.shadowColor});
                }

                .text-main {
                    font-family: 'Arial', sans-serif;
                    font-size: 26px;
                    font-weight: bold;
                    fill: ${theme.textMain};
                    animation: textFade 4s ease-in-out infinite;
                    transition: fill 0.3s ease;
                }

                .text-subtitle {
                    font-family: 'Arial', sans-serif;
                    font-size: 18px;
                    fill: ${theme.textSubtitle};
                    opacity: 0.9;
                    animation: textFade 4s ease-in-out infinite 0.7s;
                    transition: fill 0.3s ease;
                }

                /* Enhanced Floating Elements */
                .floating-dot {
                    fill: ${theme.floatingDots};
                    animation: floatingDots 10s linear infinite;
                    transition: fill 0.3s ease;
                }

                .floating-dot:nth-child(2n) {
                    animation-duration: 15s;
                    animation-direction: reverse;
                }

                .floating-dot:nth-child(3n) {
                    animation-duration: 12s;
                    animation-delay: -3s;
                }

                .floating-star {
                    fill: ${theme.floatingDots};
                    animation: starTwinkle 6s ease-in-out infinite;
                    transition: fill 0.3s ease;
                }

                /* Advanced Hover Effects */
                .error-svg:hover #robot-utuh {
                    animation-duration: 2.5s;
                    transform: scale(1.02);
                }

                .error-svg:hover #mata-robot-kiri,
                .error-svg:hover #mata-robot-kanan {
                    animation: eyeWink 0.6s ease-in-out;
                }

                .error-svg:hover .text-404 {
                    animation: textBounce 1.2s ease-in-out;
                }

                .error-svg:hover .chest-panel {
                    animation-duration: 1s;
                }

                /* Keyframe Animations */
                @keyframes robotFloat {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-10px) rotate(1deg); }
                    50% { transform: translateY(-15px) rotate(0deg); }
                    75% { transform: translateY(-10px) rotate(-1deg); }
                }

                @keyframes headMovement {
                    0%, 100% { transform: rotate(0deg); }
                    20% { transform: rotate(8deg); }
                    40% { transform: rotate(-3deg); }
                    60% { transform: rotate(5deg); }
                    80% { transform: rotate(-8deg); }
                }

                @keyframes leftArmAdvanced {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-15deg); }
                    50% { transform: rotate(-25deg); }
                    75% { transform: rotate(-10deg); }
                }

                @keyframes rightArmAdvanced {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(15deg); }
                    50% { transform: rotate(25deg); }
                    75% { transform: rotate(10deg); }
                }

                @keyframes jointRotate {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(180deg); }
                }

                @keyframes eyeGlow {
                    0% { 
                        fill: ${theme.robotGlow}; 
                        filter: drop-shadow(0 0 10px ${theme.robotGlow}); 
                    }
                    100% { 
                        fill: ${isDarkMode ? '#00ffff' : '#0080ff'}; 
                        filter: drop-shadow(0 0 20px ${isDarkMode ? '#00ffff' : '#0080ff'}); 
                    }
                }

                @keyframes eyeBlink {
                    0%, 85%, 100% { opacity: 1; }
                    90%, 95% { opacity: 0.1; }
                }

                @keyframes eyeConfused {
                    0%, 100% { transform: translateX(0) scale(1); }
                    25% { transform: translateX(-2px) scale(1.1); }
                    50% { transform: translateX(2px) scale(0.9); }
                    75% { transform: translateX(-1px) scale(1.05); }
                }

                @keyframes eyeWink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.1; }
                }

                @keyframes antennaAdvanced {
                    0%, 40% { opacity: 1; fill: ${theme.robotGlow}; transform: scale(1); }
                    20% { opacity: 0.4; fill: ${isDarkMode ? '#ff6b6b' : '#e53e3e'}; transform: scale(1.2); }
                    60% { opacity: 0.8; fill: ${isDarkMode ? '#4ecdc4' : '#38b2ac'}; transform: scale(0.9); }
                    80% { opacity: 0.6; fill: ${isDarkMode ? '#ffd93d' : '#ecc94b'}; transform: scale(1.1); }
                }

                @keyframes chestGlow {
                    0%, 100% { opacity: 0.7; fill: ${theme.robotAccent}; }
                    50% { opacity: 1; fill: ${isDarkMode ? '#63b3ed' : '#4299e1'}; }
                }

                @keyframes speakerPulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                }

                @keyframes shadowFloat {
                    0%, 100% { transform: scaleX(1) scaleY(1); opacity: ${isDarkMode ? '0.4' : '0.25'}; }
                    50% { transform: scaleX(1.15) scaleY(0.7); opacity: ${isDarkMode ? '0.5' : '0.35'}; }
                }

                @keyframes textPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.08); opacity: 0.9; }
                }

                @keyframes textBounce {
                    0%, 100% { transform: scale(1) translateY(0); }
                    50% { transform: scale(1.15) translateY(-12px); }
                }

                @keyframes textFade {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }

                @keyframes floatingDots {
                    0% { transform: translateY(450px) translateX(-30px) rotate(0deg) scale(0); opacity: 0; }
                    15% { opacity: 1; transform: scale(1); }
                    85% { opacity: 1; }
                    100% { transform: translateY(-30px) translateX(30px) rotate(360deg) scale(0); opacity: 0; }
                }

                @keyframes starTwinkle {
                    0%, 100% { opacity: 0.4; transform: scale(1) rotate(0deg); }
                    50% { opacity: 1; transform: scale(1.3) rotate(180deg); }
                }

                .decorative-line {
                    stroke: ${theme.decorativeLine};
                    transition: stroke 0.3s ease;
                }

                /* Mood-specific styles */
                .mood-${robotMood} #mata-robot-kiri,
                .mood-${robotMood} #mata-robot-kanan {
                    transition: all 0.5s ease;
                }
            `}</style>

            {/* Theme Toggle Button */}
            {/* Theme Toggle Button - guarded to avoid SSR mismatch */}
            <button className="theme-toggle" onClick={toggleTheme}>
                <span className="theme-icon">
                    {mounted && currentTheme === 'dark' ? '🌙' : '☀️'}
                </span>
                <span>{mounted && currentTheme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>

            <svg viewBox="0 0 650 450" className={`error-svg mood-${robotMood}`} xmlns="http://www.w3.org/2000/svg">
                {/* Enhanced Gradient Definitions */}
                <defs>
                    <linearGradient id="gradient404" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{
                            stopColor: isDarkMode ? '#ff6b6b' : '#e53e3e',
                            stopOpacity: 1
                        }}>
                            <animate attributeName="stop-color"
                                values={isDarkMode ? '#ff6b6b;#4ecdc4;#45b7d1;#ff6b6b' : '#e53e3e;#38b2ac;#3182ce;#e53e3e'}
                                dur="6s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="50%" style={{
                            stopColor: isDarkMode ? '#4ecdc4' : '#38b2ac',
                            stopOpacity: 1
                        }}>
                            <animate attributeName="stop-color"
                                values={isDarkMode ? '#4ecdc4;#45b7d1;#ff6b6b;#4ecdc4' : '#38b2ac;#3182ce;#e53e3e;#38b2ac'}
                                dur="6s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" style={{
                            stopColor: isDarkMode ? '#45b7d1' : '#3182ce',
                            stopOpacity: 1
                        }}>
                            <animate attributeName="stop-color"
                                values={isDarkMode ? '#45b7d1;#ff6b6b;#4ecdc4;#45b7d1' : '#3182ce;#e53e3e;#38b2ac;#3182ce'}
                                dur="6s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>

                    <linearGradient id="robotBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#5a6578', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#4a5568', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#3a4555', stopOpacity: 1 }} />
                    </linearGradient>

                    <radialGradient id="robotGlow" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" style={{
                            stopColor: theme.glowEffect,
                            stopOpacity: 1
                        }} />
                        <stop offset="100%" style={{
                            stopColor: theme.glowEffect,
                            stopOpacity: 0
                        }} />
                    </radialGradient>

                    <filter id="metallic-shine">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Enhanced Floating Background Elements */}
                <circle className="floating-dot" cx="50" cy="50" r="4" />
                <circle className="floating-dot" cx="150" cy="80" r="3" />
                <circle className="floating-dot" cx="480" cy="60" r="5" />
                <circle className="floating-dot" cx="550" cy="120" r="3" />
                <circle className="floating-dot" cx="100" cy="350" r="4" />
                <circle className="floating-dot" cx="450" cy="320" r="3" />
                <circle className="floating-dot" cx="600" cy="370" r="4" />

                {/* Star shapes */}
                <polygon className="floating-star" points="200,40 205,50 215,50 207,58 210,68 200,62 190,68 193,58 185,50 195,50" />
                <polygon className="floating-star" points="500,300 503,305 508,305 504,309 506,314 500,311 494,314 496,309 492,305 497,305" />

                {/* Enhanced Robot Glow Effect */}
                <ellipse fill="url(#robotGlow)" cx="105" cy="230" rx="100" ry="80" />

                {/* Advanced Robot Container */}
                <g transform="translate(30, 180)" className="robot-clickable" onClick={handleRobotClick}>
                    <ellipse id="bayangan-robot" className="robot-shadow" cx="75" cy="200" rx="75" ry="12" />

                    <g id="robot-utuh">
                        {/* Enhanced Arms with joints */}
                        <g id="lengan-kiri">
                            <rect className="robot-accent" x="0" y="80" width="25" height="70" rx="12" />
                            <circle className="robot-metallic robot-joint" cx="12" cy="85" r="8" />
                            <circle className="robot-visor-glow" cx="12" cy="85" r="3" />
                            <rect className="robot-accent" x="8" y="140" width="12" height="25" rx="6" />
                        </g>

                        <g id="lengan-kanan">
                            <rect className="robot-accent" x="125" y="80" width="25" height="70" rx="12" />
                            <circle className="robot-metallic robot-joint" cx="137" cy="85" r="8" />
                            <circle className="robot-visor-glow" cx="137" cy="85" r="3" />
                            <rect className="robot-accent" x="131" y="140" width="12" height="25" rx="6" />
                        </g>

                        {/* Enhanced Main Body */}
                        <rect className="robot-body-main" x="15" y="75" width="120" height="110" rx="20" />

                        {/* Chest Panel with details */}
                        <rect className="robot-accent chest-panel" x="45" y="100" width="60" height="60" rx="8" />
                        <circle className="robot-visor-glow" cx="55" cy="115" r="4" />
                        <circle className="robot-visor-glow" cx="75" cy="115" r="4" />
                        <circle className="robot-visor-glow" cx="95" cy="115" r="4" />

                        {/* Status bars */}
                        <rect className="robot-accent" x="50" y="135" width="50" height="6" rx="3" />
                        <rect className="robot-accent" x="50" y="145" width="35" height="4" rx="2" />
                        <rect className="robot-accent" x="50" y="152" width="40" height="4" rx="2" />

                        {/* Speaker grilles */}
                        <g className="robot-speaker">
                            <line x1="25" y1="90" x2="35" y2="90" stroke={theme.robotAccent} strokeWidth="2" />
                            <line x1="25" y1="95" x2="35" y2="95" stroke={theme.robotAccent} strokeWidth="2" />
                            <line x1="25" y1="100" x2="35" y2="100" stroke={theme.robotAccent} strokeWidth="2" />

                            <line x1="115" y1="90" x2="125" y2="90" stroke={theme.robotAccent} strokeWidth="2" />
                            <line x1="115" y1="95" x2="125" y2="95" stroke={theme.robotAccent} strokeWidth="2" />
                            <line x1="115" y1="100" x2="125" y2="100" stroke={theme.robotAccent} strokeWidth="2" />
                        </g>

                        {/* Enhanced Head Section */}
                        <g id="bagian-berputar">
                            <rect className="robot-accent" x="55" y="50" width="40" height="25" rx="8" />
                            <circle className="robot-visor-glow" cx="75" cy="62" r="3" />

                            <g>
                                <rect className="robot-body-main" x="5" y="5" width="140" height="70" rx="30" filter="url(#metallic-shine)" />
                                <rect className="robot-visor" x="20" y="20" width="110" height="40" rx="15" />

                                {/* Dynamic Eyes based on mood */}
                                {robotMood === 'happy' && (
                                    <>
                                        <path id="mata-robot-kiri" className="robot-visor-glow" d={eyeData.leftEye as any} strokeWidth="3" fill="none" />
                                        <path id="mata-robot-kanan" className="robot-visor-glow" d={eyeData.rightEye as any} strokeWidth="3" fill="none" />
                                    </>
                                )}

                                {(robotMood === 'sad') && (
                                    <>
                                        <path id="mata-robot-kiri" className="robot-visor-glow" d={eyeData.leftEye as any} strokeWidth="3" fill="none" />
                                        <path id="mata-robot-kanan" className="robot-visor-glow" d={eyeData.rightEye as any} strokeWidth="3" fill="none" />
                                        {eyeData.pupils && (
                                            <>
                                                <circle className="robot-body" cx="35" cy="32" r="1.5" />
                                                <circle className="robot-body" cx="85" cy="32" r="1.5" />
                                            </>
                                        )}
                                    </>
                                )}

                                {(robotMood === 'normal' || robotMood === 'confused') && (
                                    <>
                                        <circle id="mata-robot-kiri" className="robot-visor-glow"
                                            cx={(eyeData.leftEye as any).cx} cy={(eyeData.leftEye as any).cy} r={(eyeData.leftEye as any).r} />
                                        <circle id="mata-robot-kanan" className="robot-visor-glow"
                                            cx={(eyeData.rightEye as any).cx} cy={(eyeData.rightEye as any).cy} r={(eyeData.rightEye as any).r} />
                                        {eyeData.pupils && (
                                            <>
                                                <circle className="robot-body" cx="33" cy="28" r="2" />
                                                <circle className="robot-body" cx="87" cy="28" r="2" />
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Enhanced antenna */}
                                <line x1="110" y1="5" x2="125" y2="-15" strokeWidth="5" className="robot-body" />
                                <circle className="robot-metallic" cx="125" cy="-15" r="8" />
                                <circle id="lampu-antena" className="robot-visor-glow" cx="125" cy="-15" r="6" />

                                {/* Additional head details */}
                                <rect className="robot-metallic" x="25" y="25" width="4" height="20" rx="2" />
                                <rect className="robot-metallic" x="121" y="25" width="4" height="20" rx="2" />
                            </g>
                        </g>

                        {/* Legs/Base */}
                        <rect className="robot-body" x="45" y="185" width="60" height="20" rx="10" />
                        <circle className="robot-metallic" cx="55" cy="195" r="6" />
                        <circle className="robot-metallic" cx="95" cy="195" r="6" />
                    </g>
                </g>

                {/* Enhanced Text */}
                <text x="52%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-404">404</text>

                <text x="52%" y="70%" textAnchor="middle" className="text-main">
                    Sepertinya Anda Tersesat
                </text>
                <text x="52%" y="78%" textAnchor="middle" className="text-subtitle">
                    Halaman yang Anda cari tidak ada atau sudah dipindahkan.
                </text>

                {/* Enhanced Decorative Elements */}
                <g opacity="0.5">
                    <path className="decorative-line" d="M 520 120 Q 540 100 560 120 T 600 120" strokeWidth="3" fill="none">
                        <animate attributeName="d"
                            values="M 520 120 Q 540 100 560 120 T 600 120;M 520 120 Q 540 140 560 120 T 600 120;M 520 120 Q 540 100 560 120 T 600 120"
                            dur="5s" repeatCount="indefinite" />
                    </path>
                    <circle className="floating-star" cx="580" cy="100" r="2">
                        <animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite" />
                    </circle>
                </g>

                {/* Mood indicator text */}
                <text x="52%" y="88%" textAnchor="middle" className="text-subtitle" style={{ fontSize: '14px', opacity: 0.6 }}>
                    Robot mood: {robotMood} • Klik robot untuk berinteraksi!
                </text>
            </svg>
        </div>
    );
}