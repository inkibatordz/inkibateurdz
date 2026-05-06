import React, { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { getApiBase } from '@/lib/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${getApiBase()}/api/auth/email-exists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.exists) setSuccess(true);
      else setError('Aucun compte trouvé avec cet email');
    } catch {
      setError('Impossible de vérifier le compte.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-gray-600">
            Réinitialisez votre mot de passe
          </p>
        </div>

        {/* Reset Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">Réinitialisation</CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700" 
                  disabled={loading}
                >
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </Button>

                <div className="text-center mt-4">
                  <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                    Retour à la connexion
                  </Link>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email envoyé !
                </h3>
                <p className="text-gray-600 mb-6">
                  Un lien de réinitialisation a été envoyé à {email}. 
                  Vérifiez votre boîte de réception.
                </p>
                <Link to="/login">
                  <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
