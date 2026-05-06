import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  BarChart3, FolderKanban, Users, GraduationCap,
  CheckCircle2, Clock, XCircle, TrendingUp, Award, Building2
} from 'lucide-react';
import { apiGet } from '@/lib/api';

interface Project {
  id: string;
  studentId: string;
  mentorId?: string;
  title: string;
  status: 'pending' | 'accepted' | 'incubation' | 'rejected';
  submittedDate: string;
  isLabel?: boolean;
  isPME?: boolean;
}

interface User {
  id: string;
  role: string;
  approved: boolean;
}

const StatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.FC<any>;
  color: string;
  bgColor: string;
}> = ({ title, value, subtitle, icon: Icon, color, bgColor }) => (
  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center`}>
          <Icon className={`w-7 h-7 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ProgressBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 w-32 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{value}</span>
      <span className="text-xs text-gray-400 w-10">({pct}%)</span>
    </div>
  );
};

const AdminStatistics: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [pData, uData] = await Promise.all([
          apiGet<{ projects: Project[] }>('/api/projects'),
          apiGet<{ users: User[] }>('/api/users'),
        ]);
        setProjects(pData.projects);
        setUsers(uData.users);
      } catch {
        setProjects([]);
        setUsers([]);
      }
    };
    void load();
  }, []);

  // Project stats
  const totalProjects = projects.length;
  const pendingProjects = projects.filter(p => p.status === 'pending').length;
  const acceptedProjects = projects.filter(p => p.status === 'accepted').length;
  const incubationProjects = projects.filter(p => p.status === 'incubation').length;
  const rejectedProjects = projects.filter(p => p.status === 'rejected').length;
  const assignedProjects = projects.filter(p => !!p.mentorId).length;

  // Label / PME / Incubé stats (based on project flags or status)
  // "Labellisé" = accepted with mentor assigned
  const labelProjects = projects.filter(p => p.status === 'accepted' && !!p.mentorId).length;
  // "Incubé" = status incubation
  const incubedProjects = incubationProjects;
  // "PME" = rejected but may be re-evaluated — for now use a count of older accepted projects as PME potential
  // Since there is no explicit PME field, we use isLabel / isPME flags if they exist
  const pmeProjects = projects.filter(p => p.isPME).length;

  // User stats
  const totalStudents = users.filter(u => u.role === 'student').length;
  const approvedStudents = users.filter(u => u.role === 'student' && u.approved).length;
  const totalMentors = users.filter(u => u.role === 'mentor').length;

  // Monthly submission trend (last 6 months)
  const monthlyData = (() => {
    const months: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const count = projects.filter(p => {
        const pd = new Date(p.submittedDate);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      }).length;
      months.push({ label, count });
    }
    return months;
  })();

  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);

  return (
    <div>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Statistiques & Rapports</h1>
          <p className="text-gray-600">Vue d'ensemble de l'activité de l'incubateur</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Projets" value={totalProjects} subtitle={`${assignedProjects} avec mentor`} icon={FolderKanban} color="text-purple-600" bgColor="bg-purple-50" />
          <StatCard title="En attente" value={pendingProjects} icon={Clock} color="text-orange-600" bgColor="bg-orange-50" />
          <StatCard title="Étudiants actifs" value={approvedStudents} subtitle={`sur ${totalStudents} inscrits`} icon={GraduationCap} color="text-blue-600" bgColor="bg-blue-50" />
          <StatCard title="Mentors" value={totalMentors} icon={Users} color="text-green-600" bgColor="bg-green-50" />
        </div>

        {/* Project Status Breakdown + Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Status breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Répartition par statut
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <ProgressBar label="Acceptés" value={acceptedProjects} total={totalProjects} color="bg-green-500" />
              <ProgressBar label="En incubation" value={incubationProjects} total={totalProjects} color="bg-blue-500" />
              <ProgressBar label="En attente" value={pendingProjects} total={totalProjects} color="bg-orange-400" />
              <ProgressBar label="Rejetés" value={rejectedProjects} total={totalProjects} color="bg-red-400" />
            </CardContent>
          </Card>

          {/* Impact Metrics */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                Impact & Résultats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-yellow-700">{labelProjects}</p>
                  <p className="text-sm text-yellow-800 font-medium mt-1">Labellisés</p>
                  <p className="text-xs text-yellow-600">Acceptés + Encadrés</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-blue-700">{incubedProjects}</p>
                  <p className="text-sm text-blue-800 font-medium mt-1">Incubés</p>
                  <p className="text-xs text-blue-600">En phase d'incubation</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-700">{pmeProjects}</p>
                  <p className="text-sm text-green-800 font-medium mt-1">PME</p>
                  <p className="text-xs text-green-600">Entreprises créées</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Taux d'acceptation</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {totalProjects > 0 ? Math.round(((acceptedProjects + incubationProjects) / totalProjects) * 100) : 0}%
                  </span>
                  <span className="text-sm text-gray-500 pb-1">des projets soumis</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Dépôts de projets — 6 derniers mois
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {totalProjects === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun projet soumis pour le moment.</p>
              </div>
            ) : (
              <div className="flex items-end gap-4 h-40">
                {monthlyData.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600">{m.count > 0 ? m.count : ''}</span>
                    <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                      <div
                        className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-700"
                        style={{ height: `${Math.max((m.count / maxMonthly) * 100, m.count > 0 ? 8 : 2)}px` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects List by Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Projets Labellisés', items: projects.filter(p => p.status === 'accepted' && !!p.mentorId), color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
            { label: 'Projets Incubés', items: projects.filter(p => p.status === 'incubation'), color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
          ].map(({ label, items, color, badge }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-base">{label} ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {items.length > 0 ? (
                  <ul className="divide-y">
                    {items.map(p => (
                      <li key={p.id} className={`px-5 py-3 flex items-center justify-between hover:${color} transition-colors`}>
                        <div className="flex items-center gap-3">
                          <FolderKanban className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[220px]">{p.title}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>
                          {new Date(p.submittedDate).toLocaleDateString('fr-FR')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-6 text-sm text-gray-400 text-center italic">Aucun projet pour le moment.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminStatistics;
