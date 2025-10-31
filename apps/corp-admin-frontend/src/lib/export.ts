import api from './api';

export async function exportData(
  endpoint: string,
  filename: string,
  params?: Record<string, string>
) {
  try {
    const response = await api.get(`/export/${endpoint}`, {
      params,
      responseType: 'blob',
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Export failed');
  }
}

export const exportTenants = (params?: Record<string, string>) =>
  exportData('tenants', `tenants-${new Date().toISOString().split('T')[0]}.csv`, params);

export const exportLicenses = (params?: Record<string, string>) =>
  exportData('licenses', `licenses-${new Date().toISOString().split('T')[0]}.csv`, params);

export const exportUsers = (params?: Record<string, string>) =>
  exportData('users', `users-${new Date().toISOString().split('T')[0]}.csv`, params);

export const exportAuditLogs = (params?: Record<string, string>) =>
  exportData('audit-logs', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`, params);

