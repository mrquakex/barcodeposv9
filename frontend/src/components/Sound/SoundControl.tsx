import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../lib/sound';

export function SoundControl() {
  const [isEnabled, setIsEnabled] = useState(soundManager.isEnabled());
  const [volume, setVolume] = useState(soundManager.getVolume());

  const toggleSound = () => {
    const newState = soundManager.toggle();
    setIsEnabled(newState);
    if (newState) {
      soundManager.playClick();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
  };

  return (
    <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-lg">
      <motion.button
        onClick={toggleSound}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`p-2 rounded-lg transition-colors ${
          isEnabled ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
        }`}
      >
        {isEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </motion.button>

      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          className="flex items-center gap-2"
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 accent-blue-500"
          />
          <span className="text-sm text-slate-400 w-12">
            {Math.round(volume * 100)}%
          </span>
        </motion.div>
      )}
    </div>
  );
}


