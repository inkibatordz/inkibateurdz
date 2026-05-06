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
  Download
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
import { User } from '../contexts/AuthContext';
import { apiGet, apiSend } from '@/lib/api';

interface Project {
  id: string;
  studentId: string;
  mentorId?: string;
  title: string;
  fileCtt?: string;
  status: 'pending' | 'accepted' | 'incubation' | 'rejected';
  submittedDate: string;
  isLabel?: boolean;
  isPME?: boolean;
}

const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [userLabels, setUserLabels] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    void loadProjects();
    void loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      const data = await apiGet<{ users: User[] }>('/api/users');
      const labels: Record<string, string> = {};
      data.users.forEach((u) => {
        labels[u.id] = `${u.firstName} ${u.lastName}`;
      });
      setUserLabels(labels);
      setMentors(data.users.filter((u) => u.role === 'mentor'));
    } catch {
      setMentors([]);
    }
  };

  useEffect(() => {
    filterProjects();
  }, [searchTerm, filterStatus, projects]);

  const loadProjects = async () => {
    try {
      const data = await apiGet<{ projects: Project[] }>('/api/projects');
      setProjects(data.projects);
    } catch {
      setProjects([]);
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
      await apiSend(`/api/projects/${encodeURIComponent(projectId)}`, 'PATCH', { status: newStatus });
      await loadProjects();
      toast.success(`Projet ${newStatus === 'accepted' ? 'accepté' : newStatus === 'rejected' ? 'rejeté' : 'mis en incubation'}`);
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleAssignMentor = async (projectId: string, mentorId: string) => {
    try {
      await apiSend(`/api/projects/${encodeURIComponent(projectId)}`, 'PATCH', {
        mentorId,
        status: 'accepted',
      });
      await loadProjects();
      toast.success(`Mentor assigné et projet accepté`);
    } catch (e) {
      toast.error(String(e));
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

  const getStudentName = (studentId: string) => userLabels[studentId] || 'Inconnu';

  const getMentorName = (mentorId?: string) => {
    if (!mentorId) return 'Non assigné';
    const mentor = mentors.find(m => m.id === mentorId);
    return mentor ? `${mentor.firstName} ${mentor.lastName}` : 'Inconnu';
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
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Par {getStudentName(project.studentId)}</span>
                            <span>•</span>
                            <span>Soumis le {new Date(project.submittedDate).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t gap-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsDialogOpen(true);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Voir détails ({project.fileCtt || 'Cahier'})
                      </Button>
                      
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
                <p className="text-gray-600">{getStudentName(selectedProject.studentId)}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Mentor Assigné</h4>
                <p className="text-gray-600">{getMentorName(selectedProject.mentorId)}</p>
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
                    <Button variant="outline" size="sm">
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
