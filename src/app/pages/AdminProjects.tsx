import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  FolderKanban, 
  CheckCircle2, 
  XCircle, 
  Search,
  FileText,
  Download,
  Trash2,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface Project {
  id: string;
  studentId: string;
  studentName?: string;
  mentorId?: string;
  mentorName?: string;
  title: string;
  type?: string;
  fileCtt?: string;
  status: 'pending' | 'accepted' | 'incubation' | 'rejected';
  submittedDate: string;
  isLabel?: boolean;
  isPME?: boolean;
}

const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadProjects();
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setMentors(data.users.filter((u: any) => u.role === 'mentor'));
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  };

  useEffect(() => {
    filterProjects();
  }, [searchTerm, filterStatus, projects]);

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        const mappedProjects = data.projects
          .filter((p: any) => p && p.id)
          .map((p: any) => ({
            ...p,
            studentName: p.student_first_name ? `${p.student_first_name} ${p.student_last_name || ''}` : 'Inconnu',
            studentLabel: p.student_label || null,
            mentorName: p.mentor_id ? `${p.mentor_first_name || ''} ${p.mentor_last_name || ''}` : 'Non assigné',
            submittedDate: p.submitted_date || new Date().toISOString(),
            fileCtt: p.file_ctt || p.fileCtt,
            type: p.type
          }));
        setProjects(mappedProjects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Erreur lors du chargement des projets');
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    setFilteredProjects(filtered);
  };

  const handleStatusChange = async (projectId: string, newStatus: 'accepted' | 'incubation' | 'rejected') => {
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        loadProjects();
        toast.success(`Projet ${newStatus === 'accepted' ? 'accepté' : newStatus === 'rejected' ? 'rejeté' : 'mis en incubation'}`);
      }
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleAssignMentor = async (projectId: string, mentorId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/assign-mentor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId }),
      });
      const data = await res.json();
      if (data.success) {
        loadProjects();
        toast.success(`Mentor assigné et projet accepté`);
      }
    } catch (error) {
      toast.error('Erreur lors de l\'assignation du mentor');
    }
  };
  
  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Projet supprimé avec succès');
        loadProjects();
      } else {
        toast.error(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
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
        
        // Open in new tab using a link to bypass some popup blockers
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Optional: clean up blobUrl after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        toast.error('Fichier non trouvé');
      }
    } catch (error) {
      toast.error("Erreur lors de l'ouverture du fichier");
    }
  };

  const pendingCount = projects.filter(p => p.status === 'pending').length;
  const acceptedCount = projects.filter(p => p.status === 'accepted').length;
  const incubationCount = projects.filter(p => p.status === 'incubation').length;

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des projets</h1>
            <p className="text-gray-600">Examinez et gérez tous les projets soumis</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total projets</p>
                  <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">En attente</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Acceptés</p>
                  <p className="text-3xl font-bold text-green-600">{acceptedCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">En incubation</p>
                  <p className="text-3xl font-bold text-blue-600">{incubationCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un projet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="accepted">Acceptés</SelectItem>
                  <SelectItem value="incubation">En incubation</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Liste des projets</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filteredProjects.length > 0 ? (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <div 
                    key={project.id}
                    className="p-5 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FolderKanban className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{project.title}</h4>
                            <Badge className={getStatusColor(project.status)}>
                              {getStatusLabel(project.status)}
                            </Badge>
                            {project.type && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 font-bold flex items-center gap-1 h-6">
                                <Tag className="w-3 h-3" />
                                {project.type}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              Par {project.studentName}
                              {(project as any).studentLabel && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-0 text-[10px] uppercase h-5">
                                  {(project as any).studentLabel}
                                </Badge>
                              )}
                            </span>
                            <span>•</span>
                            <span>Soumis le {new Date(project.submittedDate).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t gap-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setIsDialogOpen(true);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Détails
                        </Button>

                        {project.fileCtt && (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                            onClick={() => handleDownloadFile(project.id, project.fileCtt!)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger PDF
                          </Button>
                        )}

                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:bg-red-50 hover:text-red-700 h-8 px-2"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                      
                      {project.status === 'pending' && (
                        <div className="flex items-center space-x-2 flex-1 justify-end">
                          <Select onValueChange={(val) => handleAssignMentor(project.id, val)}>
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                              <SelectValue placeholder="Assigner un mentor..." />
                            </SelectTrigger>
                            <SelectContent>
                              {mentors.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleStatusChange(project.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Aucun projet trouvé</h3>
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Les projets soumis apparaîtront ici'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6 mt-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Étudiant</h4>
                <p className="text-gray-600">{selectedProject.studentName}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Mentor Assigné</h4>
                <p className="text-gray-600">{selectedProject.mentorName}</p>
              </div>

              {selectedProject.fileCtt && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Cahier des charges</p>
                        <p className="text-sm text-gray-600">{selectedProject.fileCtt}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadFile(selectedProject.id, selectedProject.fileCtt!)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-4 border-t">
                <Badge className={getStatusColor(selectedProject.status)}>
                  {getStatusLabel(selectedProject.status)}
                </Badge>
                <span className="text-sm text-gray-500">
                  Soumis le {new Date(selectedProject.submittedDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProjects;
