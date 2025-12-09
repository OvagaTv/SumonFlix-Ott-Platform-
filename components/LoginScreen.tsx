import React, { useState } from 'react';
import { Play, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Globe, KeyRound, ArrowLeft, CheckCircle, Smile, Image as ImageIcon } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  language: 'en' | 'bn';
  onToggleLanguage: () => void;
  translations: any;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, language, onToggleLanguage, translations: t }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [coverName, setCoverName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (mode === 'signin') {
      // Mock Login Validation
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
      
      // Allow any valid-looking email for demo
      if (!email.includes('@')) {
         setError('Please enter a valid email address');
         setIsLoading(false);
         return;
      }
      
      const isAdmin = email.toLowerCase() === 'admin@sumonflix.net';

      onLogin({
        id: isAdmin ? 'admin-1' : 'user-1',
        name: isAdmin ? 'Admin' : email.split('@')[0],
        coverName: isAdmin ? 'SumonFlix Admin' : undefined,
        email: email,
        isPremium: isAdmin,
        isAdmin: isAdmin,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      });
    } else if (mode === 'signup') {
      // Mock Registration
      if (!name || !email || !password) {
        setError('All fields are required');
        setIsLoading(false);
        return;
      }
      
      onLogin({
        id: `user-${Date.now()}`,
        name: name,
        coverName: coverName || undefined,
        email: email,
        isPremium: true, // Bonus for new signups
        avatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
      });
    } else if (mode === 'forgot') {
        // Mock Password Reset Logic
        if (!email || !newPassword) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        // Show success
        setSuccess(t.passwordResetSuccess);
        setIsLoading(false);
        
        // Auto-switch to login after 2 seconds
        setTimeout(() => {
            setMode('signin');
            setPassword(''); // Clear password field for safety
            setSuccess('');
        }, 2000);
        return;
    }
  };

  const switchMode = (newMode: AuthMode) => {
      setMode(newMode);
      setError('');
      setSuccess('');
      // Keep email populated if switching modes, clear others
      setPassword('');
      setNewPassword('');
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] flex items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-50">
         <button 
           onClick={onToggleLanguage}
           className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-xs font-medium backdrop-blur-md"
         >
           <Globe size={14} />
           {language === 'en' ? 'বাংলা' : 'English'}
         </button>
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 overflow-hidden transition-all duration-300">
           {/* Decorative sheen */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

           <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                {mode === 'forgot' ? (
                   <KeyRound size={32} fill="white" className="ml-1 text-white/90" />
                ) : (
                   <Play size={32} fill="white" className="ml-1" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">sumonflix.net</h1>
              <p className="text-slate-400 text-sm">
                  {mode === 'forgot' ? t.resetPassword : t.gateway}
              </p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="group animate-fade-in-up">
                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase tracking-wider">{t.fullName}</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 pl-11 text-white outline-none transition-all focus:bg-slate-800"
                        placeholder="John Doe"
                      />
                      <ShieldCheck className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                    </div>
                  </div>
                  
                  <div className="group animate-fade-in-up" style={{ animationDelay: '25ms' }}>
                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase tracking-wider">{t.coverName}</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={coverName}
                        onChange={(e) => setCoverName(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 pl-11 text-white outline-none transition-all focus:bg-slate-800"
                        placeholder="JohnyPro"
                      />
                      <Smile className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                    </div>
                  </div>

                  <div className="group animate-fade-in-up" style={{ animationDelay: '35ms' }}>
                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase tracking-wider">{t.profilePhoto}</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 pl-11 text-white outline-none transition-all focus:bg-slate-800"
                        placeholder="https://example.com/photo.jpg"
                      />
                      <ImageIcon className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                    </div>
                  </div>
                </>
              )}

              <div className="group animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase tracking-wider">{t.emailAddress}</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 pl-11 text-white outline-none transition-all focus:bg-slate-800"
                    placeholder="name@example.com"
                  />
                  <Mail className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase tracking-wider">{t.password}</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 pl-11 text-white outline-none transition-all focus:bg-slate-800"
                      placeholder="••••••••"
                    />
                    <Lock className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  </div>
                </div>
              )}

              {mode === 'forgot' && (
                <div className="group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase tracking-wider">{t.enterNewPassword}</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 pl-11 text-white outline-none transition-all focus:bg-slate-800"
                      placeholder="••••••••"
                    />
                    <KeyRound className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  </div>
                </div>
              )}

              {/* Forgot Password Link */}
              {mode === 'signin' && (
                  <div className="flex justify-end animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                      <button 
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                          {t.forgotPassword}
                      </button>
                  </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20 animate-fade-in">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20 animate-fade-in">
                  <CheckCircle size={16} />
                  <span>{success}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-4 animate-fade-in-up"
                style={{ animationDelay: '200ms' }}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {mode === 'signin' ? t.signIn : (mode === 'signup' ? t.createAccount : t.updatePassword)}
                    {mode !== 'forgot' && <ArrowRight size={20} />}
                  </>
                )}
              </button>
           </form>

           <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
             {mode === 'forgot' ? (
                <button 
                   onClick={() => switchMode('signin')}
                   className="flex items-center justify-center gap-2 text-slate-400 hover:text-white mx-auto transition-colors"
                >
                   <ArrowLeft size={16} />
                   {t.backToLogin}
                </button>
             ) : (
                <p className="text-slate-400 text-sm">
                    {mode === 'signin' ? t.dontHaveAccount : t.alreadyHaveAccount}
                    <button 
                        onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                        className="ml-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                        {mode === 'signin' ? t.signUp : t.signIn}
                    </button>
                </p>
             )}
           </div>
        </div>
        
        <div className="text-center mt-6 text-slate-500 text-xs">
           &copy; {new Date().getFullYear()} sumonflix.net. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;