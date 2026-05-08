import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { FolderKanban, FileText, Download, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import ChatRoom from '../components/ChatRoom';

interface Project {
  id: string;
  studentId: string;
  mentorId?: string;
  title: string;
  fileCtt?: string;
  status: 'pending' | 'accepted' | 'incubation' | 'rejected';
  submittedDate: string;
  mentorFeedback?: string;
  meetingSchedule?: { date: string, organizer: string };
  progress: number;
}

const MentorProjects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/projects?mentorId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        const mappedProjects = data.projects.map((p: any) => ({
          ...p,
          studentName: `${p.student_first_name} ${p.student_last_name}`,
          mentorName: p.mentor_id ? `${p.mentor_first_name} ${p.mentor_last_name}` : 'Non assigné',
          submittedDate: p.submitted_date
        }));
        setProjects(mappedProjects);
      }
    } catch (error) {
      toast.error('Erreur de chargement des projets');
    }
  };

  const updateProjectOnServer = async (projectId: string, updates: { progress?: number, feedback?: string }) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/mentor-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        loadProjects();
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Erreur de connexion');
      return false;
    }
  };

  const handleUpdateFeedback = async () => {
    if (!selectedProject) return;
    const success = await updateProjectOnServer(selectedProject.id, { feedback });
    if (success) {
      toast.success('Feedback mis à jour');
      setSelectedProject({ ...selectedProject, mentorFeedback: feedback });
    }
  };

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    // Meeting schedule logic is still client-side for now or needs a table
    // Let's keep it mock for now or implement a table later.
    toast.info('Fonctionnalité en cours de migration...');
    setIsMeetingDialogOpen(false);
  };

  const handleUpdateProgress = async (progressValue: string) => {
    if (!selectedProject) return;
    const prog = parseInt(progressValue);
    const success = await updateProjectOnServer(selectedProject.id, { progress: prog });
    if (success) {
      toast.success('Progression mise à jour');
      setSelectedProject({ ...selectedProject, progress: prog });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge className="bg-green-100 text-green-700">Accepté</Badge>;
      case 'incubation': return <Badge className="bg-blue-100 text-blue-700">En incubation</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Projets assignés</h1>
          <p className="text-gray-600">Gérez et suivez les projets des étudiants que vous encadrez.</p>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b bg-gray-50/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{project.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Étudiant : <strong>{(project as any).studentName || 'Inconnu'}</strong>
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 rounded-lg p-4 mb-4">
                     <div className="mb-4 sm:mb-0">
                        <p className="text-sm text-gray-600 font-medium">Progression</p>
                        <p className="text-2xl font-bold text-blue-600">{project.progress || 0}%</p>
                     </div>
                     <div className="flex space-x-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Chat
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl p-0 border-0 bg-transparent shadow-none">
                            <ChatRoom projectId={project.id} projectName={project.title} />
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedProject(project);
                            setFeedback(project.mentorFeedback || '');
                            setIsDialogOpen(true);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Gérer le projet
                        </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Aucun projet assigné</h3>
              <p className="text-gray-500 text-sm">
                L'administrateur ne vous a pas encore assigné de projet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Project Management Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestion : {selectedProject?.title}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6 mt-4">
              
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                 <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase">Étudiant</h4>
                    <p className="font-medium text-gray-900">{(selectedProject as any).studentName || 'Inconnu'}</p>
                 </div>
                 <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase">Fichier CTT</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-900">{selectedProject.fileCtt || 'Non fourni'}</span>
                    </div>
                 </div>
              </div>

              {/* Progress Update */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Mettre à jour la progression</h4>
                <div className="flex items-center space-x-4">
                  <Select 
                    value={selectedProject.progress?.toString() || "0"} 
                    onValueChange={handleUpdateProgress}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Progression..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% - Démarrage</SelectItem>
                      <SelectItem value="25">25% - Recherche</SelectItem>
                      <SelectItem value="50">50% - Prototypage</SelectItem>
                      <SelectItem value="75">75% - Test & Validation</SelectItem>
                      <SelectItem value="100">100% - Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Feedback Update */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <h4 className="font-medium text-gray-900">Feedback et Remarques</h4>
                   <Button size="sm" onClick={handleUpdateFeedback}>Enregistrer</Button>
                </div>
                <textarea 
                  className="w-full min-h-[100px] p-3 border rounded-md text-sm"
                  placeholder="Écrivez vos remarques pour l'étudiant ici..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              {/* Meeting Section */}
              <div className="space-y-3 pt-4 border-t">
                 <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Prochain Rendez-vous</h4>
                    <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="w-4 h-4 mr-2" /> Planifier
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Planifier un rendez-vous</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleScheduleMeeting} className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
                              </div>
                              <div className="space-y-2">
                                <Label>Heure</Label>
                                <Input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} required />
                              </div>
                           </div>
                           <Button type="submit" className="w-full">Enregistrer le rendez-vous</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                 </div>
                 
                 {selectedProject.meetingSchedule ? (
                    <div className="bg-blue-50/50 p-4 rounded-lg flex items-center space-x-3">
                       <CalendarIcon className="w-5 h-5 text-blue-600" />
                       <div>
                          <p className="font-medium text-blue-900">
                             {new Date(selectedProject.meetingSchedule.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {new Date(selectedProject.meetingSchedule.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-sm text-blue-700">Organisé par vous</p>
                       </div>
                    </div>
                 ) : (
                    <p className="text-sm text-gray-500 italic">Aucun rendez-vous de suivi n'est planifié.</p>
                 )}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorProjects;
