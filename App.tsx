import React, { useEffect, useRef, useState } from 'react';
import { FumikiriGame } from './game/engine';
import { GameSettings, PlayMode, TimeMode, WeatherMode } from './types';
import SettingsModal from './components/SettingsModal';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<FumikiriGame | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState<GameSettings>({
    playMode: 'auto',
    timeMode: 'auto',
    weatherMode: 'auto',
  });

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new FumikiriGame(canvasRef.current, settings);
      gameRef.current.start();
    }
    
    // Cleanup
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.updateSettings(settings);
    }
  }, [settings]);

  const handleStart = () => {
    audioService.init();
    setIsPlaying(true);
  };

  const handleSettingsUpdate = (key: keyof GameSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCanvasInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying) return;
    if (showSettings) return;

    // Initialize audio on first tap if not already done (backup for mobile)
    audioService.init();

    if (!gameRef.current) return;
    
    let clientX, clientY;
    if ('touches' in e) {
        e.preventDefault(); // Prevent scrolling
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    
    gameRef.current.handleTap(clientX, clientY);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 select-none">
      
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        onMouseDown={handleCanvasInteraction}
        onTouchStart={handleCanvasInteraction}
      />

      {/* Start Overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
          onClick={handleStart}
          onTouchStart={handleStart}
        >
          <div className="text-3xl font-bold text-white md:text-5xl drop-shadow-lg animate-pulse">
            ▶ タッチしてあそぶ！
          </div>
        </div>
      )}

      {/* Gear Button */}
      {isPlaying && (
        <button
          className="absolute z-40 flex items-center justify-center w-12 h-12 text-2xl bg-white border-2 border-gray-500 rounded-full shadow-lg top-4 right-4 active:scale-95"
          onClick={() => setShowSettings(true)}
        >
          ⚙️
        </button>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onUpdate={handleSettingsUpdate} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default App;