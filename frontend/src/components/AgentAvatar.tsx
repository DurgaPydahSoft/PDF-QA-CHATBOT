import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AgentAvatarProps {
    mode?: 'idle' | 'processing' | 'interacting' | 'speaking';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({
    mode = 'idle',
    size = 'md',
    className = ''
}) => {
    const [eyeScale, setEyeScale] = useState(1);

    // Random blinking effect
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setEyeScale(0.1);
            setTimeout(() => setEyeScale(1), 150);
        }, 4000 + Math.random() * 2000);

        return () => clearInterval(blinkInterval);
    }, []);

    // Scale mapping for different sizes
    const scaleMap = {
        sm: 0.5,
        md: 1,
        lg: 1.5
    };

    const scale = scaleMap[size];

    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{
                width: 128 * scale,
                height: 128 * scale
            }}
        >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }} className="flex items-center justify-center">
                {/* Outer Glow / Aura */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20 blur-xl w-32 h-32"
                    animate={{
                        scale: mode === 'processing' ? [1, 1.2, 1] : [1, 1.1, 1],
                        opacity: mode === 'processing' ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Main Body */}
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-slate-100 to-slate-300 dark:from-slate-700 dark:to-slate-900 shadow-2xl flex items-center justify-center border border-white/20 overflow-hidden animate-float z-10">

                    {/* Face Screen */}
                    <div className="absolute inset-2 bg-black rounded-full overflow-hidden flex items-center justify-center border-4 border-slate-300 dark:border-slate-600 shadow-inner">

                        {/* Screen Reflection/Gloss */}
                        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-gradient-to-bl from-white/10 to-transparent rounded-tr-full z-20 pointer-events-none" />

                        {/* Eyes Container */}
                        <motion.div
                            className="flex gap-4 z-10"
                            animate={mode === 'processing' ? { rotate: 360 } : { x: 0, y: 0 }}
                            transition={mode === 'processing' ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
                        >
                            {mode === 'processing' ? (
                                // Loading state (Spinner)
                                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" />
                            ) : (
                                // Eyes
                                <>
                                    <motion.div
                                        className="w-5 h-8 bg-sky-400 rounded-full shadow-[0_0_10px_#38bdf8]"
                                        animate={{ scaleY: eyeScale }}
                                    />
                                    <motion.div
                                        className="w-5 h-8 bg-sky-400 rounded-full shadow-[0_0_10px_#38bdf8]"
                                        animate={{ scaleY: eyeScale }}
                                    />
                                </>
                            )}
                        </motion.div>

                        {/* Mouth / Status Line */}
                        {mode === 'speaking' && (
                            <motion.div
                                className="absolute bottom-6 w-12 h-1 bg-sky-400 rounded-full opacity-60"
                                animate={{ scaleX: [0.8, 1.5, 0.8], opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            />
                        )}
                    </div>
                </div>

                {/* Orbiting Ring (optional futuristic detail) */}
                <div className="absolute inset-[-10px] w-[148px] h-[148px] border border-primary/30 rounded-full opacity-40 animate-[spin_10s_linear_infinite]" />
            </div>
        </div>
    );
};

export default AgentAvatar;
