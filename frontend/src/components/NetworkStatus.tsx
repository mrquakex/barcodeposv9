import React from 'react';
import { Wifi } from 'lucide-react';

const NetworkStatus: React.FC = () => {
  // Network status temporarily disabled for web build
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 text-success rounded-md text-xs">
      <Wifi className="w-3.5 h-3.5" />
      <span className="font-medium">Çevrimiçi</span>
    </div>
  );
};

export default NetworkStatus;

