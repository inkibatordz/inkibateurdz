import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Package, Monitor, Server, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface Material {
  id: string;
  title: string;
  type: string;
  size?: string;
}

interface Request {
  id: string;
  materialName: string;
  studentName: string;
  projectTitle: string;
  supervisor: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

const StudentMaterial: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    materialName: '',
    projectTitle: '',
    supervisor: ''
  });

  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const matRes = await fetch('/api/materials');
      const matData = await matRes.json();
      if (matData.success) setMaterials(matData.materials);

      if (user) {
        const reqRes = await fetch(`/api/material-requests?studentId=${user.id}`);
        const reqData = await reqRes.json();
        if (reqData.success) {
          const mappedRequests = reqData.requests.map((r: any) => ({
            id: r.id,
            materialName: r.material_name,
            studentName: `${r.first_name} ${r.last_name}`,
            projectTitle: r.project_title,
            supervisor: r.supervisor,
            status: r.status,
            date: r.date
          }));
          setRequests(mappedRequests);
        }
      }
    } catch (error) {
      toast.error('Erreur de chargement');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const res = await fetch('/api/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialName: formData.materialName,
          studentId: user.id,
          projectTitle: formData.projectTitle,
          supervisor: formData.supervisor
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Demande envoyée avec succès');
        setIsDialogOpen(false);
        setFormData({ materialName: '', projectTitle: '', supervisor: '' });
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-orange-100 text-orange-700">En attente</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-700">Approuvé</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700">Refusé</Badge>;
      default: return null;
    }
  };

  return (
    <div>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Matériel & Ressources</h1>
            <p className="text-gray-600">Consultez l'inventaire et faites vos demandes de matériel</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Faire une demande
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Formulaire de demande de matériel</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nom & Prénom</Label>
                  <Input value={`${user?.firstName} ${user?.lastName}`} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialName">Matériel demandé</Label>
                  <Input 
                    id="materialName" 
                    placeholder="Ex: MacBook Pro M2" 
                    value={formData.materialName}
                    onChange={(e) => setFormData({...formData, materialName: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectTitle">Titre de projet</Label>
                  <Input 
                    id="projectTitle" 
                    placeholder="Nom de votre projet..." 
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({...formData, projectTitle: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supervisor">Nom de l'encadrant</Label>
                  <Input 
                    id="supervisor" 
                    placeholder="Dr. Martin..." 
                    value={formData.supervisor}
                    onChange={(e) => setFormData({...formData, supervisor: e.target.value})}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Soumettre la demande</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Matériel disponible</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {materials.map((item) => (
                <Card key={item.id} className="border-0 shadow-sm">
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      {item.type === 'laptop' ? <Monitor className="w-6 h-6" /> : item.type === 'server' ? <Server className="w-6 h-6" /> : <Package className="w-6 h-6"/>}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">Détails: {item.size || 'Disponible'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">État de mes demandes</h2>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                {requests.length > 0 ? (
                  <div className="divide-y">
                    {requests.map(req => (
                      <div key={req.id} className="p-4 flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-gray-900">{req.materialName}</span>
                          {getStatusBadge(req.status)}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" /> {new Date(req.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                    <Package className="w-12 h-12 text-gray-300 mb-3" />
                    <p>Aucune demande effectuée</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMaterial;
