import React from 'react';
import { GameSettings, PlayMode, TimeMode, WeatherMode } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (key: keyof GameSettings, value: string) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-[85%] max-w-[400px] p-6 text-center bg-white border-4 border-yellow-400 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mt-0 text-2xl font-bold text-gray-800 mb-6">せってい</h2>
        
        <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-600">🎮 あそびかた</h3>
            <div className="flex flex-wrap justify-center gap-2">
                <SettingsButton 
                    active={settings.playMode === 'auto'} 
                    onClick={() => onUpdate('playMode', 'auto')}
                >かんしょう</SettingsButton>
                <SettingsButton 
                    active={settings.playMode === 'tap'} 
                    onClick={() => onUpdate('playMode', 'tap')}
                >れんだ！</SettingsButton>
            </div>
        </div>

        <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-600">🕐 じかん</h3>
            <div className="flex flex-wrap justify-center gap-2">
                <SettingsButton active={settings.timeMode === 'auto'} onClick={() => onUpdate('timeMode', 'auto')}>じどう</SettingsButton>
                <SettingsButton active={settings.timeMode === 'day'} onClick={() => onUpdate('timeMode', 'day')}>ひる</SettingsButton>
                <SettingsButton active={settings.timeMode === 'night'} onClick={() => onUpdate('timeMode', 'night')}>よる</SettingsButton>
            </div>
        </div>

        <div className="mb-8">
            <h3 className="mb-2 text-lg font-semibold text-gray-600">☔ てんき</h3>
            <div className="flex flex-wrap justify-center gap-2">
                <SettingsButton active={settings.weatherMode === 'auto'} onClick={() => onUpdate('weatherMode', 'auto')}>じどう</SettingsButton>
                <SettingsButton active={settings.weatherMode === 'clear'} onClick={() => onUpdate('weatherMode', 'clear')}>はれ</SettingsButton>
                <SettingsButton active={settings.weatherMode === 'rain'} onClick={() => onUpdate('weatherMode', 'rain')}>あめ</SettingsButton>
                <SettingsButton active={settings.weatherMode === 'snow'} onClick={() => onUpdate('weatherMode', 'snow')}>ゆき</SettingsButton>
            </div>
        </div>

        <button 
            className="px-8 py-3 text-lg font-bold text-white transition-transform bg-red-400 rounded-full shadow-lg hover:bg-red-500 active:scale-95"
            onClick={onClose}
        >
            とじる
        </button>
      </div>
    </div>
  );
};

const SettingsButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button 
        className={`flex-1 min-w-[60px] px-3 py-2 text-sm md:text-base font-bold border-2 rounded-xl transition-colors
            ${active 
                ? 'bg-blue-600 text-white border-blue-700' 
                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
            }`}
        onClick={onClick}
    >
        {children}
    </button>
);

export default SettingsModal;