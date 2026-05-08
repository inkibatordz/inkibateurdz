import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Registration with Admin Approval
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
        setSuccess("Inscription réussie ! Votre compte est maintenant en attente d'approbation par l'administration. Vous pourrez vous connecter une fois validé.");
        setTimeout(() => navigate('/login'), 6000);
      } else {
        setError(result.message || "Une erreur est survenue lors de l'inscription");
      }
    } catch {
      setError('Impossible de contacter le serveur. Assurez-vous que le serveur est démarré.');
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

        <Card className="glass border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
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
              {success && (
                <Alert className="border-green-100 bg-green-50/50 text-green-800 rounded-2xl">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="font-bold text-xs">{success}</AlertDescription>
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
                {loading ? 'Inscription...' : 'Créer mon compte →'}
              </Button>

              <div className="text-center pt-4">
                <Link to="/login" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  Déjà membre ? Se connecter
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
