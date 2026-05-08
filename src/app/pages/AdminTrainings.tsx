import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { GraduationCap, Plus, Bell, Calendar, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

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
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  
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
    setSelectedFormation(title);
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
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Formations</h1>
            <p className="text-gray-600">Publiez de nouvelles formations et notifiez les étudiants</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter formation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvelle formation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddFormation} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Titre de la formation</Label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure</Label>
                    <Input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lieu / Salle</Label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Instructeur</Label>
                  <Input value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Places disponibles (Total)</Label>
                  <Input type="number" min="1" value={formData.totalSpots} onChange={e => setFormData({...formData, totalSpots: parseInt(e.target.value)})} required />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Créer la formation</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formations.length > 0 ? formations.map((formation) => (
            <Card key={formation.id} className="border-0 shadow-sm relative group">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl text-gray-900 pr-8">{formation.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-3 text-blue-600" />
                    <span>{new Date(formation.date).toLocaleDateString('fr-FR')} à {formation.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Places dispo: {formation.availableSpots} / {formation.totalSpots}</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleSendNotification(formation.id, formation.title)}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Notifier
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => handleViewParticipants(formation.id, formation.title)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Étudiants
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(formation.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-2 p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Aucune formation programmée.</p>
            </div>
          )}
        </div>

        <Dialog open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Inscrits : {selectedFormation}
                <span className="ml-auto text-sm text-gray-400 font-normal">
                  {participants.length} étudiant(s)
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
              {participants.length > 0 ? (
                <div className="space-y-3">
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs shadow-sm">
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-gray-500 font-medium">{p.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{p.department}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{p.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Aucun inscrit pour le moment</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminTrainings;
