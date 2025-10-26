import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import FluentButton from '../components/fluent/FluentButton';
import FluentInput from '../components/fluent/FluentInput';
import FluentCard from '../components/fluent/FluentCard';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('admin@barcodepos.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <FluentCard elevation="depth16" className="w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1 className="fluent-title text-foreground mb-2">BarcodePOS</h1>
            <p className="fluent-body text-foreground-secondary">
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FluentInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <div className="relative">
              <FluentInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-foreground-secondary hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <FluentButton
              type="submit"
              appearance="primary"
              size="large"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </FluentButton>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="fluent-caption text-foreground-secondary">
              Demo: admin@barcodepos.com / admin123
            </p>
          </div>
        </div>
      </FluentCard>
    </div>
  );
};

export default Login;
