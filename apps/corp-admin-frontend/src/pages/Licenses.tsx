import React, { useState, useEffect } from 'react';
import { Key, Search, Plus, Edit } from 'lucide-react';
import api from '../lib/api';

interface License {
  id: string;
  tenantId: string;
  status: string;
  plan: string;
  includesMobile: boolean;
  trial: boolean;
  startsAt: string;
  expiresAt?: string;
  tenant?: {
    id: string;
    name: string;
  };
}

const Licenses: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const res = await api.get('/licenses', { params: { limit: 100 } });
      setLicenses(res.data.licenses);
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Lisanslar</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Tüm lisansları görüntüle ve yönet
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Yeni Lisans
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Lisans ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Başlangıç
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Bitiş
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Mobil
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {licenses.map((license) => (
                <tr key={license.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {license.tenant?.name || license.tenantId}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs">
                      {license.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {license.status === 'ACTIVE' ? (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs">
                        {license.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(license.startsAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {license.includesMobile ? (
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    ) : (
                      <span className="text-slate-400">✗</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Licenses;

