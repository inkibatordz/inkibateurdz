import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { FolderKanban, Plus, Upload, FileText, Calendar as CalendarIcon, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api';

interface Project {
  id: string;
  studentId: string;
  title: string;
  fileCtt?: string;
  status: 'pending' | 'accepted' | 'incubation' | 'rejected';
  submittedDate: string;
  mentorFeedback?: string;
  meetingSchedule?: { date: string, organizer: string };
  progress: number;
}

const StudentProjects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    fileCtt: ''
  });

  useEffect(() => {
    void loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user?.id) {
      setProjects([]);
      return;
    }
    try {
      const data = await apiGet<{ projects: Project[] }>(
        `/api/projects?studentId=${encodeURIComponent(user.id)}`
      );
      setProjects(data.projects);
    } catch {
      setProjects([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const newProject = {
      id: `project-${Date.now()}`,
      studentId: user.id,
      title: formData.title,
      fileCtt: formData.fileCtt || 'cahier-des-charges.pdf',
      submittedDate: new Date().toISOString(),
    };

    try {
      await apiSend('/api/projects', 'POST', newProject);
      await loadProjects();
      setIsDialogOpen(false);
      setFormData({ title: '', fileCtt: '' });
      toast.success('Projet soumis avec succès !');
    } catch (err) {
      toast.error(String(err));
    }
  };

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

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes projets</h1>
            <p className="text-gray-600">Gérez vos projets et suivez leur progression</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Soumettre un projet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Soumettre un nouveau projet</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du projet</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Application mobile pour la gestion universitaire"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fileCtt">Cahier des charges / Fichier CTT</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="fileCtt"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setFormData({ ...formData, fileCtt: e.target.files?.[0]?.name || '' })}
                      className="cursor-pointer"
                      required
                    />
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">Formats acceptés: PDF, DOC, DOCX</p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Soumettre
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{project.title}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Soumis le {new Date(project.submittedDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Project Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Progression du projet</h4>
                        <span className="text-sm text-gray-600">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {/* Mentor Feedback */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="text-sm font-medium text-blue-900 mb-1 flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Feedback du Mentor
                      </h4>
                      <p className="text-sm text-blue-800">
                        {project.mentorFeedback || <span className="italic">Aucun feedback pour le moment.</span>}
                      </p>
                    </div>

                    {/* Meeting Schedule */}
                    {project.meetingSchedule ? (
                      <div className="flex items-center space-x-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                        <span>Rendez-vous planifié le <strong>{new Date(project.meetingSchedule.date).toLocaleDateString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</strong> par {project.meetingSchedule.organizer}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span className="italic">Aucun rendez-vous planifié.</span>
                      </div>
                    )}

                    {project.fileCtt && (
                      <div className="flex items-center space-x-2 pt-4 border-t mt-4">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-700">{project.fileCtt}</span>
                        <Button variant="ghost" size="sm" className="ml-auto text-blue-600">
                          Télécharger CTT
                        </Button>
                      </div>
                    )}
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
              <h3 className="font-medium text-gray-900 mb-2">Aucun projet pour le moment</h3>
              <p className="text-gray-500 text-sm mb-6">
                Commencez par soumettre votre premier projet pour rejoindre l'incubateur
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Soumettre un projet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentProjects;
