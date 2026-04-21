import React, { useEffect, useState } from 'react';

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
  Star
} from 'lucide-react';

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
    // Load real assigned projects from localStorage
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    const assignedProjects = allProjects
      .filter((p: any) => p.mentorId === user?.id)
      .map((p: any) => {
        const student = allUsers.find((u: any) => u.id === p.studentId);
        return {
          id: p.id,
          title: p.title,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Inconnu',
          status: p.status,
          assignedDate: p.submittedDate, // or add a field for when it was assigned
        };
      });
      
    setProjects(assignedProjects);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Vue d'ensemble
          </h1>
          <p className="text-gray-600">
            Gérez vos projets assignés et suivez les progrès des étudiants
          </p>
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
            value={projects.filter(p => p.status === 'En cours').length}
            icon={Clock}
            color="orange"
          />
          <KPICard
            title="Complétés"
            value={projects.filter(p => p.status === 'Complété').length}
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
              {projects.map((project) => (
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
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Planifier une séance</h3>
                  <p className="text-sm text-gray-600">Organisez un mentorat avec un étudiant</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Évaluer un projet</h3>
                  <p className="text-sm text-gray-600">Donnez votre feedback et notes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default MentorDashboard;
