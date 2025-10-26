import React, { useState } from 'react';
import { User, Mail, Lock, Save } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await api.put('/users/profile', { name: formData.name, email: formData.email });
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSaving(true);
    try {
      await api.put('/users/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success('Password changed');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="fluent-title text-foreground">Profile</h1>
        <p className="fluent-body text-foreground-secondary mt-1">Manage your account settings</p>
      </div>

      <FluentCard elevation="depth4" className="p-6">
        <h3 className="fluent-heading text-foreground mb-4">Personal Information</h3>
        <div className="space-y-4">
          <FluentInput
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={<User className="w-4 h-4" />}
          />
          <FluentInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            icon={<Mail className="w-4 h-4" />}
          />
          <FluentButton
            appearance="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleUpdateProfile}
            isLoading={isSaving}
          >
            Save Changes
          </FluentButton>
        </div>
      </FluentCard>

      <FluentCard elevation="depth4" className="p-6">
        <h3 className="fluent-heading text-foreground mb-4">Change Password</h3>
        <div className="space-y-4">
          <FluentInput
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            icon={<Lock className="w-4 h-4" />}
          />
          <FluentInput
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            icon={<Lock className="w-4 h-4" />}
          />
          <FluentInput
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            icon={<Lock className="w-4 h-4" />}
          />
          <FluentButton
            appearance="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleChangePassword}
            isLoading={isSaving}
          >
            Change Password
          </FluentButton>
        </div>
      </FluentCard>

      <FluentCard elevation="depth4" className="p-6">
        <h3 className="fluent-heading text-foreground mb-4">Account Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-foreground-secondary">Role</span>
            <span className="text-foreground font-medium">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-secondary">Account Status</span>
            <span className="text-success font-medium">Active</span>
          </div>
        </div>
      </FluentCard>
    </div>
  );
};

export default Profile;

