import React, { useEffect, useState, useRef, useCallback } from 'react';

const EasterEgg = () => {
    const [active, setActive] = useState(false);
    const [contentVisible, setContentVisible] = useState(false); // Controls visibility: hidden
    const overlayRef = useRef(null);
    const canvasRef = useRef(null);
    const matrixInterval = useRef(null);

    // Define Matrix Logic
    const startMatrix = useCallback(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Removing R/W from chars to avoid confusion
        const chars = "XYZ010101";
        const drops = Array(Math.floor(canvas.width / 20)).fill(1);

        if (matrixInterval.current) clearInterval(matrixInterval.current);

        matrixInterval.current = setInterval(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0ea5e9'; // Blue theme
            ctx.font = '15px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);
                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        }, 50);
    }, []);

    // Watch for Active state
    useEffect(() => {
        if (active) {
            // Stage 1: Active = Black Screen. Content is hidden.

            // Stage 2: Wait 200ms. THEN turn on visibility.
            const timer = setTimeout(() => {
                setContentVisible(true);
                startMatrix();
            }, 200);

            // Cleanup sequence
            const cleanupTimer = setTimeout(() => {
                if (overlayRef.current) overlayRef.current.style.opacity = '0';
                setTimeout(() => {
                    setActive(false);
                    setContentVisible(false);
                }, 600);
            }, 4000);

            return () => {
                clearTimeout(timer);
                clearTimeout(cleanupTimer);
                if (matrixInterval.current) clearInterval(matrixInterval.current);
            };
        }
    }, [active, startMatrix]);

    // Key Listener
    useEffect(() => {
        let keySeq = [];
        let timer = null;

        const handleKeyUp = (e) => {
            if (e.key === 'Control') {
                keySeq.push('Control');
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => { keySeq = []; }, 1000);
                if (keySeq.length === 4) {
                    setActive(true);
                    keySeq = [];
                }
            } else {
                keySeq = [];
            }
        };

        window.addEventListener('keyup', handleKeyUp);
        return () => window.removeEventListener('keyup', handleKeyUp);
    }, []);

    if (!active) return null;

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: '#000', zIndex: 10000, opacity: 1, transition: 'opacity 0.5s',
                perspective: '1000px', overflow: 'hidden'
            }}
        >
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.3 }} />

            {/* Container for Letters - VISIBILITY HIDDEN IS KEY */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex', gap: '2rem', zIndex: 10001,
                visibility: contentVisible ? 'visible' : 'hidden', // Hard switch
                opacity: contentVisible ? 1 : 0, // Smooth transition
                transition: 'opacity 0.2s ease-in'
            }}>
                {['R', 'R', 'W', 'W'].map((char, i) => (
                    <div key={i} className="ee-letter" style={{
                        fontFamily: 'Arial Black, sans-serif', fontSize: '8rem',
                        color: 'transparent', WebkitTextStroke: '4px #0ea5e9',
                        position: 'relative', transformStyle: 'preserve-3d',
                        animation: `reveal3D 3s cubic-bezier(0.16, 1, 0.3, 1) both ${i * 0.2}s`
                    }} data-char={char}>
                        {char}
                    </div>
                ))}
            </div>

            {/* Shockwave */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: '10px', height: '10px', borderRadius: '50%',
                border: '20px solid #fff', transform: 'translate(-50%, -50%)',
                opacity: 0, zIndex: 9999,
                animation: 'shockwaveAnim 0.8s ease-out forwards 3.5s'
            }}></div>
        </div>
    );
};

export default EasterEgg;
