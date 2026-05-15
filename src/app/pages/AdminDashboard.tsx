import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalProjects: 0,
    pendingProjects: 0,
    activeStudents: 0,
    activeMentors: 0
  });
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        
        const projectsRes = await fetch('/api/projects');
        const projectsData = await projectsRes.json();

        const notifsRes = await fetch('/api/notifications?userId=admin');
        const notifsData = await notifsRes.json();

        if (usersData.success && projectsData.success) {
          const allUsers = usersData.users;
          const allProjects = projectsData.projects;

          setStats({
            totalUsers: allUsers.length,
            pendingApprovals: allUsers.filter((u: any) => u.status === 'pending').length,
            totalProjects: allProjects.length,
            pendingProjects: allProjects.filter((p: any) => p.status === 'pending').length,
            activeStudents: allUsers.filter((u: any) => u.role === 'student' && u.status === 'approved').length,
            activeMentors: allUsers.filter((u: any) => u.role === 'mentor' && u.status === 'approved').length
          });
        }

        if (notifsData.success) {
          setNotifications(notifsData.notifications.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-500';
      case 'warning': return 'bg-orange-500';
      case 'error': return 'bg-rose-500';
      default: return 'bg-blue-500';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffMins > 0) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    return "À l'instant";
  };

  return (
    <div className="space-y-10 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">
              Tableau de Bord
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Bienvenue sur votre espace de gestion premium.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="rounded-xl border-gray-200 font-bold text-xs h-11 px-6 shadow-sm hover:bg-white hover:shadow-md transition-all"
              onClick={() => navigate('/admin/notifications')}
            >
              <Clock className="w-4 h-4 mr-2 text-blue-600" />
              Journal d'activité
            </Button>
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 font-black text-xs h-11 px-6 shadow-xl shadow-blue-100 transition-all">
              Générer Rapport
            </Button>
          </div>
        </div>

        {/* KPIs - Premium Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => navigate('/admin/users')} className="group cursor-pointer">
            <Card className="border-0 shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <Badge className="bg-green-50 text-green-600 border-0 font-black text-[10px]">+12%</Badge>
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Utilisateurs</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stats.totalUsers}</h3>
              </CardContent>
            </Card>
          </div>
          
          <div onClick={() => navigate('/admin/users?status=pending')} className="group cursor-pointer">
            <Card className="border-0 shadow-sm hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500 rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                    <Clock className="w-6 h-6" />
                  </div>
                  {stats.pendingApprovals > 0 && (
                    <Badge className="bg-orange-600 text-white border-0 font-black text-[10px] animate-pulse">Action Requis</Badge>
                  )}
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">En Attente</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stats.pendingApprovals}</h3>
              </CardContent>
            </Card>
          </div>

          <div onClick={() => navigate('/admin/projects')} className="group cursor-pointer">
            <Card className="border-0 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-600 border-0 font-black text-[10px]">+5%</Badge>
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Projets</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stats.totalProjects}</h3>
              </CardContent>
            </Card>
          </div>

          <div onClick={() => navigate('/admin/projects?status=pending')} className="group cursor-pointer">
            <Card className="border-0 shadow-sm hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-500 rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nouveaux Projets</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stats.pendingProjects}</h3>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions - Design Reimagined */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Statistiques des Rôles
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-blue-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 relative z-10">Étudiants Actifs</p>
                    <h4 className="text-4xl font-black text-gray-900 tracking-tighter relative z-10">{stats.activeStudents}</h4>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 relative z-10">Sur un total de {stats.totalUsers} utilisateurs</p>
                  </div>
                  <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-indigo-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 relative z-10">Mentors Actifs</p>
                    <h4 className="text-4xl font-black text-gray-900 tracking-tighter relative z-10">{stats.activeMentors}</h4>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 relative z-10">Accompagnement en cours</p>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Activity Feed - Elegant Sidebar style */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Flux d'Activité</h3>
              <Badge variant="outline" className="rounded-full font-black text-[10px] text-blue-600 bg-blue-50 border-blue-100 uppercase tracking-widest">Temps Réel</Badge>
            </div>
            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-8">
                  {notifications.length > 0 ? notifications.map((notif) => (
                    <div key={notif.id} className="flex gap-4 group cursor-pointer" onClick={() => navigate('/admin/notifications')}>
                      <div className={`w-1.5 h-12 ${getNotifColor(notif.type)} rounded-full group-hover:scale-y-125 transition-transform origin-top`} />
                      <div>
                        <p className="text-sm text-gray-900 leading-tight">
                          <span className="font-black">{notif.title}</span> : {notif.message.length > 60 ? notif.message.substring(0, 60) + '...' : notif.message}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{getTimeAgo(notif.created_at)}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10">
                       <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                       <p className="text-xs font-bold text-gray-400">Aucune activité récente</p>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => navigate('/admin/notifications')}
                >
                  Voir tout l'historique
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};

export default AdminDashboard;
