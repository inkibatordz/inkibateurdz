import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { User, Mail, BookOpen, Hash, GraduationCap, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { apiGet } from '@/lib/api';

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState({ total: 0, pending: 0, accepted: 0 });

  React.useEffect(() => {
    void (async () => {
      if (!user?.id) {
        setStats({ total: 0, pending: 0, accepted: 0 });
        return;
      }
      try {
        const data = await apiGet<{ projects: { status: string }[] }>(
          `/api/projects?studentId=${encodeURIComponent(user.id)}`
        );
        const myProjects = data.projects;
        setStats({
          total: myProjects.length,
          pending: myProjects.filter((p) => p.status === 'pending').length,
          accepted: myProjects.filter((p) => p.status === 'accepted' || p.status === 'incubation').length,
        });
      } catch {
        setStats({ total: 0, pending: 0, accepted: 0 });
      }
    })();
  }, [user]);

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mon Profil</h1>
          <p className="text-gray-600">Consultez vos informations personnelles</p>
        </div>

        {/* Profile Header Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.firstName} {user.lastName}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 capitalize">
                    {user.role === 'student' ? 'Étudiant' : user.role}
                  </Badge>
                  {(user as any).level && (
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-0">
                      {(user as any).level}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informations Personnelles</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Nom complet</p>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Membre depuis</p>
                      <p className="font-medium">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informations Académiques</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Spécialité / Département</p>
                      <p className="font-medium">{(user as any).department || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <GraduationCap className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Niveau d'études</p>
                      <p className="font-medium">{(user as any).level || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Hash className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Numéro Étudiant</p>
                      <p className="font-medium">{(user as any).studentId || 'Non spécifié'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-lg">Activité sur la plateforme</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500 mt-1">Projets soumis</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl">
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                <p className="text-sm text-gray-500 mt-1">En attente</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
                <p className="text-sm text-gray-500 mt-1">Acceptés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentProfile;
