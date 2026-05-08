import React, { useEffect, useState } from 'react';

import KPICard from '../components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Users, 
  FolderKanban, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Mail
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalProjects: 0,
    pendingProjects: 0,
    activeStudents: 0,
    activeMentors: 0
  });

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');

    setStats({
      totalUsers: users.length,
      pendingApprovals: users.filter((u: any) => !u.approved).length,
      totalProjects: projects.length,
      pendingProjects: projects.filter((p: any) => p.status === 'pending').length,
      activeStudents: users.filter((u: any) => u.role === 'student' && u.approved).length,
      activeMentors: users.filter((u: any) => u.role === 'mentor' && u.approved).length
    });
  }, []);

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Vue d'ensemble administrateur
          </h1>
          <p className="text-gray-600">
            Gérez les utilisateurs, les projets et suivez les statistiques globales
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Utilisateurs totaux"
            value={stats.totalUsers}
            icon={Users}
            color="blue"
            trend={{ value: '+12%', positive: true }}
          />
          <KPICard
            title="Approbations en attente"
            value={stats.pendingApprovals}
            icon={Clock}
            color="orange"
          />
          <KPICard
            title="Projets totaux"
            value={stats.totalProjects}
            icon={FolderKanban}
            color="purple"
            trend={{ value: '+8%', positive: true }}
          />
          <KPICard
            title="Projets en attente"
            value={stats.pendingProjects}
            icon={CheckCircle2}
            color="green"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <Badge className="bg-orange-500 text-white">{stats.pendingApprovals}</Badge>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gérer les utilisateurs</h3>
              <p className="text-sm text-gray-600 mb-4">
                Approuvez ou rejetez les nouvelles inscriptions
              </p>
              <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto">
                Voir les demandes <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-purple-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-purple-600" />
                </div>
                <Badge className="bg-orange-500 text-white">{stats.pendingProjects}</Badge>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gérer les projets</h3>
              <p className="text-sm text-gray-600 mb-4">
                Examinez et validez les projets soumis
              </p>
              <Button variant="ghost" size="sm" className="text-purple-600 p-0 h-auto">
                Voir les projets <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-green-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Statistiques</h3>
              <p className="text-sm text-gray-600 mb-4">
                Consultez les rapports et analyses
              </p>
              <Button variant="ghost" size="sm" className="text-green-600 p-0 h-auto">
                Voir les stats <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Health Section */}
        <div className="mt-8">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-900 to-slate-800 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                    <Mail className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Santé du Système Email</h3>
                    <p className="text-gray-400 text-sm font-medium">Vérifiez si les notifications et codes OTP fonctionnent.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl px-6"
                    onClick={async () => {
                      const email = prompt("Entrez un email pour tester l'envoi :");
                      if (!email) return;
                      try {
                        const res = await fetch('/api/test-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email })
                        });
                        const data = await res.json();
                        if (data.success) alert("✅ Succès ! L'email de test est parti.");
                        else alert("❌ Échec : " + data.message + "\n\nGuide : " + (data.setup_guide || "Vérifiez Render."));
                      } catch (e) {
                        alert("❌ Erreur de connexion au serveur.");
                      }
                    }}
                  >
                    Tester l'envoi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Utilisateurs actifs</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Étudiants</p>
                      <p className="text-sm text-gray-600">Comptes actifs</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{stats.activeStudents}</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Mentors</p>
                      <p className="text-sm text-gray-600">Comptes actifs</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{stats.activeMentors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Nouveau projet</span> soumis par Marie Dubois
                    </p>
                    <p className="text-xs text-gray-500">Il y a 2 heures</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Nouvelle inscription</span> - Thomas Martin (Mentor)
                    </p>
                    <p className="text-xs text-gray-500">Il y a 5 heures</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Projet accepté</span> - Application IoT Smart Campus
                    </p>
                    <p className="text-xs text-gray-500">Hier</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Nouvelle inscription</span> - Sophie Laurent (Étudiant)
                    </p>
                    <p className="text-xs text-gray-500">Il y a 2 jours</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default AdminDashboard;
