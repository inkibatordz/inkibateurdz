import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { GraduationCap, AlertCircle, CheckCircle2, Mail, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

const SERVER_URL = '';

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    level: 'L3' as 'L3' | 'M2',
    studentId: ''
  });
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Validate form and send OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('verify');
        setSuccess(`Un code de vérification a été envoyé à ${formData.email}`);
      } else {
        setError(data.message || "Erreur lors de l'envoi du code");
      }
    } catch {
      setError('Impossible de contacter le serveur. Assurez-vous que le serveur est démarré sur le port 3001.');
    }
    setLoading(false);
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        const userData = {
          role: 'student',
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          department: formData.department,
          level: formData.level,
          studentId: formData.studentId
        };
        const result = await register(userData);
        if (result.success) {
          setSuccess("Email vérifié ! Inscription réussie. Redirection vers la connexion...");
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setError(result.message || "Une erreur est survenue lors de l'inscription");
        }
      } else {
        setError(data.message || 'Code incorrect ou expiré');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Nouveau code envoyé !');
      } else {
        setError(data.message);
      }
    } catch {
      setError('Erreur lors du renvoi');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-premium-gradient flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 10 }}
            className="inline-flex items-center justify-center mb-4 p-4 bg-white rounded-3xl shadow-xl shadow-blue-100"
          >
            <Logo className="w-16 h-16" />
          </motion.div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Créer un compte</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Rejoignez l'élite du Tlemcen Tech Incubator</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-10 space-x-6">
          <div className={`flex items-center space-x-3 ${step === 'form' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg transition-all ${step === 'form' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-green-500 text-white shadow-green-100'}`}>
              {step === 'verify' ? '✓' : '1'}
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Informations</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200 rounded-full"></div>
          <div className={`flex items-center space-x-3 ${step === 'verify' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg transition-all ${step === 'verify' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}>
              2
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Vérification</span>
          </div>
        </div>

        <Card className="glass border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          {step === 'form' ? (
            <>
              <CardHeader className="space-y-1 pb-4 pt-10 px-10">
                <CardTitle className="text-3xl font-black tracking-tighter">Inscription</CardTitle>
                <CardDescription className="font-medium">Remplissez vos informations personnelles</CardDescription>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="font-bold text-xs">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Prénom</Label>
                      <Input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} required className="h-12 rounded-2xl bg-white/50 border-gray-100 focus:bg-white transition-all shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nom</Label>
                      <Input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} required className="h-12 rounded-2xl bg-white/50 border-gray-100 focus:bg-white transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Spécialité</Label>
                    <Input id="department" name="department" type="text" value={formData.department} onChange={handleChange} placeholder="Ex: Informatique, Gestion..." required className="h-12 rounded-2xl bg-white/50 border-gray-100 focus:bg-white transition-all shadow-sm" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Niveau</Label>
                      <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value as 'L3' | 'M2' })}>
                        <SelectTrigger id="level" className="h-12 rounded-2xl bg-white/50 border-gray-100 focus:bg-white transition-all shadow-sm">
                          <SelectValue placeholder="Niveau" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="L3">Licence 3 (L3)</SelectItem>
                          <SelectItem value="M2">Master 2 (M2)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">ID Étudiant</Label>
                      <Input id="studentId" name="studentId" type="text" value={formData.studentId} onChange={handleChange} required className="h-12 rounded-2xl bg-white/50 border-gray-100 focus:bg-white transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Personnel</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="h-12 rounded-2xl bg-white/50 border-gray-100 focus:bg-white transition-all shadow-sm" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Mot de passe</Label>
                      <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required className="h-12 rounded-2xl bg-white/50 border-gray-100 focus:bg-white transition-all shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Confirmer</Label>
                      <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required className="h-12 rounded-2xl bg-white/50 border-gray-100 focus:bg-white transition-all shadow-sm" />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95" disabled={loading}>
                    {loading ? 'Envoi du code...' : 'Vérifier mon email →'}
                  </Button>

                  <div className="text-center pt-4">
                    <Link to="/login" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      Déjà membre ? Se connecter
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-4 pt-10 text-center">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-3xl mx-auto mb-4"
                >
                  <Mail className="w-10 h-10 text-blue-600" />
                </motion.div>
                <CardTitle className="text-3xl font-black tracking-tighter">Vérifiez votre email</CardTitle>
                <CardDescription className="font-bold text-gray-500">
                  Un code secret a été envoyé à <br />
                  <span className="text-blue-600">{formData.email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  {error && (
                    <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="font-bold text-xs">{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-green-100 bg-green-50/50 text-green-800 rounded-2xl">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="font-bold text-xs">{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <Label htmlFor="otp" className="text-center block text-xs font-black uppercase tracking-[0.2em] text-gray-400">Code de sécurité</Label>
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="text-center text-5xl font-black tracking-[0.5em] h-20 rounded-3xl border-2 border-gray-100 focus:border-blue-600 focus:ring-0 bg-white/50 transition-all"
                      required
                    />
                    <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">Pensez à vérifier vos spams</p>
                  </div>

                  <Button type="submit" className="w-full h-16 bg-gray-900 hover:bg-black text-white rounded-3xl font-black text-lg shadow-2xl transition-all hover:scale-[1.02]" disabled={loading || otpCode.length !== 6}>
                    <Shield className="w-5 h-5 mr-3" />
                    {loading ? 'Vérification...' : "Confirmer l'accès"}
                  </Button>

                  <div className="flex items-center justify-between px-2">
                    <button type="button" onClick={() => { setStep('form'); setError(''); setSuccess(''); }} className="text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
                      ← Retour
                    </button>
                    <button type="button" onClick={handleResendOtp} disabled={loading} className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">
                      Renvoyer le code
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
