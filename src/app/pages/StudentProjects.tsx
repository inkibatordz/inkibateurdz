import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { FolderKanban, Plus, Upload, FileText, Download, Calendar as CalendarIcon, MessageCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import ChatRoom from '../components/ChatRoom';

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
    fileCtt: '',
    fileData: ''
  });

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/projects?studentId=${user.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        const mappedProjects = data.projects
          .filter((p: any) => p && p.id)
          .map((p: any) => ({
            ...p,
            studentName: p.student_first_name ? `${p.student_first_name} ${p.student_last_name || ''}` : 'Inconnu',
            mentorName: p.mentor_id ? `${p.mentor_first_name || ''} ${p.mentor_last_name || ''}` : 'Non assigné',
            submittedDate: p.submitted_date || new Date().toISOString()
          }));
        setProjects(mappedProjects);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des projets');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const projectData = {
      title: formData.title,
      studentId: user?.id,
      description: 'Nouveau projet soumis via la plateforme', // Default description
      fileCtt: formData.fileCtt,
      fileData: formData.fileData
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Projet soumis avec succès !');
        setIsDialogOpen(false);
        setFormData({ title: '', fileCtt: '', fileData: '' });
        loadProjects();
      } else {
        toast.error(data.message || 'Erreur lors de la soumission');
      }
    } catch (error) {
      toast.error('Erreur de connexion au serveur');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB for example)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 5MB)');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          fileCtt: file.name,
          fileData: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadFile = async (projectId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/file`);
      const data = await res.json();
      if (data.success && data.fileData) {
        let base64Data = data.fileData;
        let contentType = 'application/pdf';
        
        if (base64Data.includes(';base64,')) {
          const parts = base64Data.split(';base64,');
          contentType = parts[0].split(':')[1];
          base64Data = parts[1];
        }

        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        
        // Open in new tab to "see" it
        window.open(blobUrl, '_blank');
        
        // Optional: clean up blobUrl after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        toast.error('Fichier non trouvé');
      }
    } catch (error) {
      toast.error('Erreur lors de l\\'ouverture du fichier');
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
                      onChange={handleFileChange}
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

                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                      <div className="flex items-center space-x-2">
                        {project.fileCtt ? (
                          <>
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-gray-700">{project.fileCtt}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Aucun document joint</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Chat avec Mentor
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl p-0 border-0 bg-transparent shadow-none">
                            <ChatRoom projectId={project.id} projectName={project.title} />
                          </DialogContent>
                        </Dialog>
                        {project.fileCtt && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                            onClick={() => handleDownloadFile(project.id, project.fileCtt || 'document.pdf')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger mon PDF
                          </Button>
                        )}
                      </div>
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
