import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ArrowLeft, Plus, Search, MapPin, Building, Phone } from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

const MobileBranches: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data.branches || []);
    } catch (error) {
      toast.error('Şubeler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mobile-branches-ultra">
      {/* Header */}
      <div className="mobile-header-ultra">
        <button onClick={() => navigate(-1)} className="back-btn-ultra">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1>Şubeler</h1>
        <button onClick={() => { toast('Web panelinden ekleyebilirsiniz'); hapticFeedback(); }} className="add-btn-ultra">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Search */}
      <div className="search-bar-ultra">
        <Search className="w-5 h-5 search-icon-ultra" />
        <input
          type="text"
          placeholder="Şube ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-ultra"
        />
      </div>

      {/* Branch List */}
      <div className="branch-list-ultra">
        {isLoading ? (
          <div className="loading-ultra">Yükleniyor...</div>
        ) : filteredBranches.length === 0 ? (
          <div className="empty-state-ultra">
            <Building className="w-16 h-16 opacity-20" />
            <p>Şube bulunamadı</p>
          </div>
        ) : (
          filteredBranches.map((branch) => (
            <div key={branch.id} className="branch-item-ultra" onClick={() => { soundEffects.tap(); hapticFeedback(); }}>
              <div className="branch-icon-ultra">
                <Building className="w-6 h-6" />
              </div>
              <div className="branch-info-ultra">
                <h3>{branch.name}</h3>
                <div className="branch-meta-ultra">
                  {branch.address && (
                    <span className="meta-item">
                      <MapPin className="w-3.5 h-3.5" />
                      {branch.address}
                    </span>
                  )}
                  {branch.phone && (
                    <span className="meta-item">
                      <Phone className="w-3.5 h-3.5" />
                      {branch.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileBranches;

