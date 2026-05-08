import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        navigate(`/${currentUser.role}`);
      } else {
        setError(result.message || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-premium-gradient flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Logo Section */}
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="inline-flex items-center justify-center mb-6 p-5 bg-white rounded-[2rem] shadow-2xl shadow-blue-100 border border-white/50"
          >
            <Logo className="w-16 h-16" />
          </motion.div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Portail d'Accès</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Tlemcen Tech Incubator Management System</p>
        </div>

        {/* Login Card */}
        <Card className="glass border-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>
          
          <CardHeader className="space-y-1 pb-4 pt-10 px-10">
            <div className="flex items-center justify-between mb-2">
               <CardTitle className="text-3xl font-black tracking-tighter text-gray-900">Connexion</CardTitle>
               <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                 <Lock className="w-5 h-5 text-blue-600" />
               </div>
            </div>
            <CardDescription className="font-medium text-gray-500">
              Accédez à votre espace incubateur sécurisé
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50/50 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-bold text-xs">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email ou Identifiant
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-2xl bg-white/50 border-gray-100 focus:bg-white transition-all shadow-sm focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Mot de passe
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-2xl bg-white/50 border-gray-100 focus:bg-white transition-all shadow-sm focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Authentification...' : (
                  <>
                    Se Connecter
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
                  <span className="px-4 bg-white/50 backdrop-blur-sm text-gray-400">
                    Nouveau membre ?
                  </span>
                </div>
              </div>

              <Link to="/register" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200 rounded-2xl font-bold transition-all"
                >
                  Créer un compte étudiant
                </Button>
              </Link>
            </form>

            {/* Test Credentials - Styled Elegantly */}
            <div className="mt-8 p-5 bg-blue-50/50 rounded-3xl border border-blue-100/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
                  Accès Démo :
                </p>
              </div>
              <div className="flex justify-between items-center text-xs">
                <p className="text-gray-600 font-medium">Administrateur : <span className="font-black text-blue-700">admin / admin</span></p>
              </div>
              <p className="text-[9px] text-gray-400 mt-2 font-bold leading-tight">
                * Les comptes étudiants/mentors requièrent une validation administrative manuelle après inscription.
              </p>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center mt-10">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
             © 2026 Tlemcen Tech Incubator • Sécurisé par 2TI-Protocol
           </p>
        </footer>
      </motion.div>
    </div>
  );
};

export default LoginPage;

