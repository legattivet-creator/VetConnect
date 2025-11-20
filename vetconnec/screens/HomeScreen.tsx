

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { CogIcon } from '../components/Icons';

export const HomeScreen: React.FC = () => {
  const { login, translations, background, setBackground, openSettings } = useAppContext();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
        if (password !== confirmPassword) {
            setError(translations.passwordsMismatch);
            return;
        }
    }

    if (email && password) {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$&*]).{5,20}$/;
      if (!passwordRegex.test(password)) {
        setError('Password must be 5-20 characters, with one uppercase letter and one special character.');
        return;
      }
      setError('');
      login(email);
      navigate('/pets');
    }
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackground(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div 
        className="min-h-screen w-full flex items-center justify-center p-4 relative"
    >
      <div className="w-full max-w-md bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-primary dark:text-primary-light">{translations.appName}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark" htmlFor="email">{translations.email}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg bg-white/50 dark:bg-black/20 focus:ring-primary focus:border-primary transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark" htmlFor="password">{translations.password}</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg bg-white/50 dark:bg-black/20 focus:ring-primary focus:border-primary transition"
              required
            />
             <div className="flex items-center mt-2">
                <input
                  id="show-password"
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="show-password" className="ml-2 block text-sm text-text-light dark:text-text-dark">
                  {translations.showPassword}
                </label>
            </div>
          </div>

          {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark" htmlFor="confirmPassword">{translations.confirmPassword}</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 mt-1 border rounded-lg bg-white/50 dark:bg-black/20 focus:ring-primary focus:border-primary transition"
                  required
                />
              </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
            {isRegistering ? translations.register : translations.login}
          </button>
        </form>
        
        <div className="text-center">
             <button 
                type="button" 
                onClick={toggleMode}
                className="text-sm text-primary dark:text-primary-light hover:underline"
             >
                {isRegistering ? translations.haveAccount : translations.noAccount}
             </button>
        </div>

        {!isRegistering && (
            <div className="flex items-center justify-center space-x-4 border-t border-gray-300 dark:border-gray-600 pt-4">
                <button type="button" className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-light transition text-sm">
                    {translations.biometricLogin}
                </button>
            </div>
        )}

        <div className="pt-4 border-t border-gray-300 dark:border-gray-600 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                 <button onClick={() => bgInputRef.current?.click()} className="text-xs text-primary dark:text-primary-light hover:underline">{translations.setHomeBg}</button>
                 <input type="file" accept="image/*" ref={bgInputRef} onChange={handleBgChange} className="hidden" />
                 {background && <button onClick={() => setBackground(null)} className="text-xs text-red-500 hover:underline">{translations.clearBg}</button>}
            </div>
             <button onClick={openSettings} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={translations.settings}>
                <CogIcon className="w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark" />
            </button>
        </div>
      </div>
    </div>
  );
};