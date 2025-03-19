'use client';

import { useEffect, useState, useRef } from 'react';

export default function CircleBot({ isListening, onStartListening, onStopListening }) {
  const [waves, setWaves] = useState([]);
  const waveTimerRef = useRef(null);

  // Manage wave animation when listening state changes
  useEffect(() => {
    if (isListening) {
      // Start generating waves
      waveTimerRef.current = setInterval(() => {
        const newWave = {
          id: Date.now(),
          opacity: 0.8,
        };

        setWaves(prevWaves => [...prevWaves, newWave]);
      }, 500); // Create a new wave every 500ms
    } else {
      // Stop the wave generation
      if (waveTimerRef.current) {
        clearInterval(waveTimerRef.current);
        waveTimerRef.current = null;
      }
      // Clear all waves
      setWaves([]);
    }

    // Cleanup on unmount
    return () => {
      if (waveTimerRef.current) {
        clearInterval(waveTimerRef.current);
      }
    };
  }, [isListening]);

  // Cleanup waves that have completed animation
  useEffect(() => {
    if (waves.length > 0) {
      const timer = setTimeout(() => {
        // Remove oldest wave
        setWaves(prevWaves => prevWaves.slice(1));
      }, 1500); // Match animation duration

      return () => clearTimeout(timer);
    }
  }, [waves]);

  return (
    <div
      className={`circle-bot ${isListening ? 'circle-bot-active' : 'circle-bot-idle'}`}
      onClick={isListening ? onStopListening : onStartListening}
    >
      {/* Waves for animation */}
      {waves.map((wave) => (
        <div
          key={wave.id}
          className="wave wave-active"
          style={{ opacity: wave.opacity }}
        />
      ))}

      {/* Bot face/icon */}
      <div className="text-white text-4xl">
        {isListening ? '🎤' : '🤖'}
      </div>

      <p className="absolute bottom-2 text-xs text-white">
        {isListening ? 'Listening...' : 'Tap to speak'}
      </p>
    </div>
  );
}
