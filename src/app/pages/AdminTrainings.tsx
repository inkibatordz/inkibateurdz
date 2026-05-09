import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { GraduationCap, Plus, Bell, Calendar, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface Formation {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  totalSpots: number;
  availableSpots: number;
}

const BASE_URL = '';

const AdminTrainings: React.FC = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const [selectedFormationTitle, setSelectedFormationTitle] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    instructor: '',
    totalSpots: 30
  });

  useEffect(() => {
    loadFormations();
  }, []);

  const loadFormations = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/trainings`);
      const data = await res.json();
      if (data.success) {
        setFormations(data.trainings);
      }
    } catch (error) {
      console.error('Error fetching formations:', error);
      toast.error('Erreur lors du chargement des formations');
    }
  };

  const handleAddFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFormation = {
      id: `form-${Date.now()}`,
      ...formData
    };

    try {
      const res = await fetch(`${BASE_URL}/api/trainings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFormation),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Formation ajoutée avec succès');
        setIsDialogOpen(false);
        setFormData({
          title: '', description: '', date: '', time: '', location: '', instructor: '', totalSpots: 30
        });
        loadFormations();
      } else {
        toast.error(data.message || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Error adding formation:', error);
      toast.error('Erreur serveur');
    }
  };

  const handleViewParticipants = async (id: string, title: string) => {
    setSelectedFormationId(id);
    setSelectedFormationTitle(title);
    try {
      const res = await fetch(`${BASE_URL}/api/trainings/${id}/participants`);
      const data = await res.json();
      if (data.success) {
        setParticipants(data.participants);
        setIsParticipantsOpen(true);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des participants');
    }
  };

  const handleUpdateLabel = async (userId: string, newLabel: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/${userId}/label`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel === 'none' ? null : newLabel }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Statut mis à jour');
        setParticipants(prev => prev.map(p => p.id === userId ? { ...p, label: newLabel === 'none' ? null : newLabel } : p));
      } else {
        toast.error(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const handleRemoveParticipant = async (studentId: string) => {
    if (!window.confirm('Voulez-vous vraiment retirer cet étudiant de la formation ?')) return;

    try {
      const res = await fetch(`${BASE_URL}/api/trainings/${selectedFormationId}/participants/${studentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Étudiant retiré de la formation');
        setParticipants(prev => prev.filter(p => p.id !== studentId));
        loadFormations(); // Refresh spots count
      } else {
        toast.error(data.message || 'Erreur lors du retrait');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette formation ?')) return;

    try {
      const res = await fetch(`${BASE_URL}/api/trainings/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Formation supprimée');
        loadFormations();
      }
    } catch (error) {
      console.error('Error deleting formation:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSendNotification = async (id: string, title: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/trainings/${id}/notify`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Notifications envoyées', {
          description: `Tous les étudiants ont été informés de la formation: ${title}`
        });
      } else {
        toast.error('Échec de l\'envoi des notifications');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Gestion des Formations</h1>
            <p className="text-gray-500">Planifiez des sessions de formation et suivez les inscriptions.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                <Plus className="w-5 h-5 mr-2" />
                Nouvelle Formation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Ajouter une formation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddFormation} className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Titre</Label>
                  <Input 
                    placeholder="Ex: Atelier Business Model Canvas"
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Description</Label>
                  <Input 
                    placeholder="Brève description des objectifs..."
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Date</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Heure</Label>
                    <Input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Lieu</Label>
                    <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Places</Label>
                    <Input type="number" min="1" value={formData.totalSpots} onChange={e => setFormData({...formData, totalSpots: parseInt(e.target.value)})} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Formateur</Label>
                  <Input value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} required />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11">Publier la formation</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Formations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {formations.length > 0 ? formations.map((formation) => (
            <Card key={formation.id} className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
              <div className="h-2 bg-blue-600 w-full" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {formation.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm line-clamp-2 min-h-[40px]">
                  {formation.description}
                </p>
                
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    {new Date(formation.date).toLocaleDateString('fr-FR')} à {formation.time}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                      {formation.availableSpots} / {formation.totalSpots} places
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      Par {formation.instructor}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4">
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleSendNotification(formation.id, formation.title)}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Notifier
                  </Button>
                  <Button 
                    variant="secondary"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-900"
                    onClick={() => handleViewParticipants(formation.id, formation.title)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Inscrits
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="col-span-2 text-red-500 hover:text-red-600 hover:bg-red-50 mt-1"
                    onClick={() => handleDelete(formation.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer la formation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Aucune formation</h3>
              <p className="text-gray-500">Commencez par ajouter votre première session de formation.</p>
            </div>
          )}
        </div>

        {/* Participants Modal */}
        <Dialog open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-center justify-between pr-8">
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">{selectedFormationTitle}</DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">Liste des participants inscrits ({participants.length})</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {participants.length > 0 ? (
                <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Étudiant</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cursus</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Label</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {participants.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group/row">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                                {p.firstName?.[0]}{p.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 leading-tight">{p.firstName} {p.lastName}</p>
                                <p className="text-xs text-gray-400">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-gray-700">{p.department}</p>
                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded uppercase font-bold tracking-tighter">
                              {p.level}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <Select 
                              value={p.label || 'none'} 
                              onValueChange={(val) => handleUpdateLabel(p.id, val)}
                            >
                              <SelectTrigger className="h-9 w-[130px] rounded-lg border-gray-200 text-sm font-medium focus:ring-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Aucun</SelectItem>
                                <SelectItem value="labellise" className="text-emerald-600">Labellisé</SelectItem>
                                <SelectItem value="incube" className="text-blue-600">Incubé</SelectItem>
                                <SelectItem value="pme" className="text-purple-600">PME</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover/row:opacity-100"
                              onClick={() => handleRemoveParticipant(p.id)}
                              title="Retirer de la formation"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Users className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="text-gray-900 font-bold">Aucun inscrit</h4>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">Il n'y a pas encore d'étudiants inscrits à cette session de formation.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 text-right">
              <Button variant="outline" onClick={() => setIsParticipantsOpen(false)} className="rounded-xl px-8 border-gray-300">
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminTrainings;
