import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

import KPICard from '../components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  Users, 
  ArrowRight,
  Star,
  MessageSquare
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import ChatRoom from '../components/ChatRoom';

interface AssignedProject {
  id: string;
  title: string;
  studentName: string;
  status: string;
  assignedDate: string;
  grade?: number;
}

const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<AssignedProject[]>([]);

  useEffect(() => {
    const fetchAssignedProjects = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/projects?mentorId=${user.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.projects)) {
          const mappedProjects = data.projects
            .filter((p: any) => p && p.id)
            .map((p: any) => ({
              ...p,
              studentName: p.student_first_name ? `${p.student_first_name} ${p.student_last_name || ''}` : 'Inconnu',
              mentorName: p.mentor_id ? `${p.mentor_first_name || ''} ${p.mentor_last_name || ''}` : 'Non assigné',
              assignedDate: p.submitted_date || new Date().toISOString()
            }));
          setProjects(mappedProjects);
        }
      } catch (error) {
        console.error('Error fetching mentor projects:', error);
      }
    };

    fetchAssignedProjects();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'incubation': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'accepted': return 'Accepté';
      case 'incubation': return 'En incubation';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">
              Vue d'ensemble
            </h1>
            <p className="text-gray-500 font-medium">
              Gérez vos projets assignés et suivez les progrès des étudiants
            </p>
          </div>
          {user?.label && (
            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 py-2.5 px-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-100 animate-float h-fit">
              <Star className="w-4 h-4 mr-2" />
              {user.label}
            </Badge>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Projets assignés"
            value={projects.length}
            icon={FolderKanban}
            color="blue"
          />
          <KPICard
            title="En cours"
            value={projects.filter(p => p && p.status === 'En cours').length}
            icon={Clock}
            color="orange"
          />
          <KPICard
            title="Complétés"
            value={projects.filter(p => p && p.status === 'Complété').length}
            icon={CheckCircle2}
            color="green"
          />
          <KPICard
            title="Séances cette semaine"
            value={4}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Assigned Projects */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <span>Projets assignés</span>
              <Button variant="ghost" size="sm" className="text-blue-600">
                Voir tout <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {projects.filter(p => p).map((project) => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-5 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FolderKanban className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{project.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Par {project.studentName}</span>
                        <span>•</span>
                        <span>Assigné le {new Date(project.assignedDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {project.grade && (
                      <div className="flex items-center space-x-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium text-gray-700">{project.grade}/5</span>
                      </div>
                    )}
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl p-0 border-0 bg-transparent shadow-none">
                        <ChatRoom projectId={project.id} projectName={project.title} />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
  );
};

export default MentorDashboard;
