import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ArrowLeft, Plus, Search, User, Phone, Mail, Briefcase } from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

const MobileEmployees: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data.users || []);
    } catch (error) {
      toast.error('Personel yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.phone?.includes(searchQuery)
  );

  return (
    <div className="mobile-employees-ultra">
      {/* Header */}
      <div className="mobile-header-ultra">
        <button onClick={() => navigate(-1)} className="back-btn-ultra">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1>Personel</h1>
        <button onClick={() => { toast('Web panelinden ekleyebilirsiniz'); hapticFeedback(); }} className="add-btn-ultra">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Search */}
      <div className="search-bar-ultra">
        <Search className="w-5 h-5 search-icon-ultra" />
        <input
          type="text"
          placeholder="Personel ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-ultra"
        />
      </div>

      {/* Employee List */}
      <div className="employee-list-ultra">
        {isLoading ? (
          <div className="loading-ultra">Yükleniyor...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="empty-state-ultra">
            <User className="w-16 h-16 opacity-20" />
            <p>Personel bulunamadı</p>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <div key={employee.id} className="employee-item-ultra" onClick={() => { soundEffects.tap(); hapticFeedback(); }}>
              <div className="employee-avatar-ultra">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div className="employee-info-ultra">
                <h3>{employee.name}</h3>
                <div className="employee-meta-ultra">
                  {employee.role && (
                    <span className="meta-item">
                      <Briefcase className="w-3.5 h-3.5" />
                      {employee.role}
                    </span>
                  )}
                  {employee.phone && (
                    <span className="meta-item">
                      <Phone className="w-3.5 h-3.5" />
                      {employee.phone}
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

export default MobileEmployees;

