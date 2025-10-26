import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/* ============================================
   TEMPORARY LOGIN - FLUENT VERSION COMING
   Basic login for development
   ============================================ */

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@pos.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      // Will navigate to dashboard once it's built
      // navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="fluent-card p-8">
          <div className="text-center mb-8">
            <h1 className="fluent-title-large text-foreground mb-2">BarcodePOS</h1>
            <p className="fluent-body text-foreground-secondary">Fluent Design Rebuild in Progress</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="fluent-body-small text-foreground-secondary block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-input border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="fluent-body-small text-foreground-secondary block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-input border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded hover:bg-primary-hover active:bg-primary-pressed transition-colors fluent-motion-fast disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center text-foreground-secondary fluent-caption">
            <p>🚧 System rebuild in progress</p>
            <p className="mt-2">New pages will be added incrementally</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
