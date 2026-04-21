import React, { useEffect, useState } from 'react';

import KPICard from '../components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  FolderKanban, 
  CheckCircle2, 
  Rocket, 
  Users, 
  Clock,
  Calendar,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: string;
  title: string;
  status: 'pending' | 'accepted' | 'incubation' | 'rejected';
  submittedDate: string;
}

interface MentorSession {
  id: string;
  mentorName: string;
  date: string;
  time: string;
  location: string;
  topic: string;
}

interface Training {
  id: string;
  title: string;
  date: string;
  time: string;
  instructor: string;
  spots: number;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [upcomingSession, setUpcomingSession] = useState<MentorSession | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);

  useEffect(() => {
    // Load student projects
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const userProjects = allProjects.filter((p: any) => p.studentId === user?.id);
    setProjects(userProjects);

    // Mock upcoming mentorship session
    setUpcomingSession({
      id: '1',
      mentorName: 'Dr. Sarah Martin',
      date: '2026-02-25',
      time: '14:00',
      location: 'Salle Innovation A',
      topic: 'Validation du Business Model'
    });

    // Mock trainings
    setTrainings([
      {
        id: '1',
        title: 'Pitch Perfect: Comment convaincre les investisseurs',
        date: '2026-03-01',
        time: '10:00 - 12:00',
        instructor: 'Jean Dupont',
        spots: 15
      },
      {
        id: '2',
        title: 'Marketing Digital pour Startups',
        date: '2026-03-05',
        time: '14:00 - 17:00',
        instructor: 'Marie Lambert',
        spots: 8
      },
      {
        id: '3',
        title: 'Finances et Levée de Fonds',
        date: '2026-03-10',
        time: '09:00 - 12:00',
        instructor: 'Pierre Rousseau',
        spots: 12
      }
    ]);
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'incubation': return 'bg-blue-100 text-blue-700 border-blue-200';
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

  const pendingCount = projects.filter(p => p.status === 'pending').length;
  const acceptedCount = projects.filter(p => p.status === 'accepted').length;
  const incubationCount = projects.filter(p => p.status === 'incubation').length;

  return (
    <div className="space-y-8">
        {/* Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Vue d'ensemble
          </h1>
          <p className="text-gray-600">
            Suivez l'avancement de vos projets et vos prochaines sessions
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Projets en attente"
            value={pendingCount}
            icon={Clock}
            color="orange"
          />
          <KPICard
            title="Projets acceptés"
            value={acceptedCount}
            icon={CheckCircle2}
            color="green"
          />
          <KPICard
            title="En incubation"
            value={incubationCount}
            icon={Rocket}
            color="blue"
          />
          <KPICard
            title="Séances de mentorat"
            value={upcomingSession ? 1 : 0}
            icon={Users}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                  <span>Mes projets</span>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.slice(0, 5).map((project) => (
                      <div 
                        key={project.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{project.title}</h4>
                            <p className="text-sm text-gray-500">
                              Soumis le {new Date(project.submittedDate).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FolderKanban className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">Aucun projet</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Commencez par soumettre votre premier projet
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Soumettre un projet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Mentorship Session */}
          <div>
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle>Prochaine séance</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {upcomingSession ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-600 text-white">
                          SM
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {upcomingSession.mentorName}
                        </h4>
                        <p className="text-sm text-gray-500">Mentor principal</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-600">
                          {new Date(upcomingSession.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-600">{upcomingSession.time}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-600">{upcomingSession.location}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-1">Sujet</p>
                      <p className="text-sm text-gray-600">{upcomingSession.topic}</p>
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Rejoindre la séance
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Aucune séance planifiée
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Workshops & Trainings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Ateliers et formations à venir</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trainings.map((training) => (
                <div 
                  key={training.id}
                  className="p-5 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {training.spots} places
                    </Badge>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {training.title}
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p>{new Date(training.date).toLocaleDateString('fr-FR')}</p>
                    <p>{training.time}</p>
                    <p className="text-gray-500">Par {training.instructor}</p>
                  </div>
                  <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                    S'inscrire
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default StudentDashboard;
