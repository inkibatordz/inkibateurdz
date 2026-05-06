import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { GraduationCap, AlertCircle, CheckCircle2, Mail, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useGoogleLogin } from '@react-oauth/google';
import { getApiBase } from '@/lib/api';

const SERVER_URL = () => getApiBase();

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
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await response.json();
        const result = await loginWithGoogle({
          email: googleUser.email,
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
        });
        if (result.success && result.user) {
          navigate(`/${result.user.role}`);
        } else {
          if (result.message?.includes('créé')) {
            setSuccess(result.message);
          } else {
            setError(result.message || 'Une erreur est survenue');
          }
        }
      } catch {
        setError("Erreur lors de l'inscription Google");
      }
      setLoading(false);
    },
    onError: () => setError('Inscription Google échouée'),
  });

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
      const res = await fetch(`${SERVER_URL()}/api/send-otp`, {
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
      const res = await fetch(`${SERVER_URL()}/api/verify-otp`, {
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
      const res = await fetch(`${SERVER_URL()}/api/send-otp`, {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Rejoignez l'incubateur universitaire</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-6 space-x-4">
          <div className={`flex items-center space-x-2 ${step === 'form' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'form' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>
              {step === 'verify' ? '✓' : '1'}
            </div>
            <span className="text-sm font-medium">Informations</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center space-x-2 ${step === 'verify' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'verify' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </div>
            <span className="text-sm font-medium">Vérification</span>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          {step === 'form' ? (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl">Inscription</CardTitle>
                <CardDescription>Remplissez vos informations</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Spécialité</Label>
                    <Input id="department" name="department" type="text" value={formData.department} onChange={handleChange} placeholder="Ex: Informatique, Gestion..." required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="level">Niveau</Label>
                      <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value as 'L3' | 'M2' })}>
                        <SelectTrigger id="level">
                          <SelectValue placeholder="Sélectionnez un niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L3">Licence 3 (L3)</SelectItem>
                          <SelectItem value="M2">Master 2 (M2)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">ID Étudiant</Label>
                      <Input id="studentId" name="studentId" type="text" value={formData.studentId} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer</Label>
                      <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? 'Envoi du code...' : 'Vérifier mon email →'}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">Ou s'inscrire avec</span></div>
                  </div>

                  <Button type="button" variant="outline" className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white" onClick={() => handleGoogleRegister()} disabled={loading}>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>

                  <div className="text-center mt-4">
                    <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                      Vous avez déjà un compte ? Se connecter
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-4 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-2">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
                <CardDescription>
                  Un code à 6 chiffres a été envoyé à <strong>{formData.email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-green-500 bg-green-50 text-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-center block">Code de vérification</Label>
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="_ _ _ _ _ _"
                      className="text-center text-3xl font-bold tracking-widest h-16 border-2 focus:border-blue-600"
                      required
                    />
                    <p className="text-xs text-gray-500 text-center">Vérifiez votre boîte mail (et dossier spam)</p>
                  </div>

                  <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700" disabled={loading || otpCode.length !== 6}>
                    <Shield className="w-4 h-4 mr-2" />
                    {loading ? 'Vérification...' : "Confirmer et s'inscrire"}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => { setStep('form'); setError(''); setSuccess(''); }} className="text-gray-500 hover:text-gray-700">
                      ← Modifier l'email
                    </button>
                    <button type="button" onClick={handleResendOtp} disabled={loading} className="text-blue-600 hover:text-blue-700 font-medium">
                      Renvoyer le code
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
