import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Package, Monitor, Server, Plus, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  id: string;
  title: string;
  type: string;
  size?: string;
  url?: string;
}

interface Request {
  id: string;
  materialName: string;
  studentName: string;
  studentId: string;
  projectTitle: string;
  supervisor: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

const AdminMaterial: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'laptop',
    size: '1',
    url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const matRes = await fetch('/api/materials');
      const matData = await matRes.json();
      if (matData.success) setMaterials(matData.materials);

      const reqRes = await fetch('/api/material-requests');
      const reqData = await reqRes.json();
      if (reqData.success) {
        const mappedRequests = reqData.requests.map((r: any) => ({
          id: r.id,
          materialName: r.material_name,
          studentName: `${r.first_name} ${r.last_name}`,
          studentId: r.student_id,
          projectTitle: r.project_title,
          supervisor: r.supervisor,
          status: r.status,
          date: r.date
        }));
        setRequests(mappedRequests);
      }
    } catch (error) {
      toast.error('Erreur de chargement');
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          category: formData.type,
          size: formData.size,
          url: formData.url,
          date: new Date().toLocaleDateString('fr-FR')
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Matériel ajouté');
        setIsDialogOpen(false);
        setFormData({ title: '', type: 'laptop', size: '1', url: '' });
        loadData();
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm('Supprimer ce matériel ?')) return;
    try {
      await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      toast.success('Matériel supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleApproveRequest = async (reqId: string) => {
    try {
      const res = await fetch(`/api/material-requests/${reqId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Demande approuvée');
        loadData();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    try {
      const res = await fetch(`/api/material-requests/${reqId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Demande rejetée');
        loadData();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-orange-100 text-orange-700">En attente</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-700">Approuvé / Réservé</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700">Refusé</Badge>;
      default: return null;
    }
  };

  return (
    <div>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion du Matériel</h1>
            <p className="text-gray-600">Gérez l'inventaire et les demandes des étudiants</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Matériel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau Matériel</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMaterial} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nom du matériel</Label>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="Ex: Écran Dell 27''" required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laptop">Ordinateur / Laptop</SelectItem>
                        <SelectItem value="vr">Casque VR / AR</SelectItem>
                        <SelectItem value="server">Serveur / Réseau</SelectItem>
                        <SelectItem value="electronics">Électronique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantité / Détails</Label>
                    <Input 
                      value={formData.size} 
                      onChange={e => setFormData({...formData, size: e.target.value})} 
                      placeholder="Ex: 1 unité, 16Go..."
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lien de la photo (URL)</Label>
                  <Input 
                    value={formData.url} 
                    onChange={e => setFormData({...formData, url: e.target.value})} 
                    placeholder="https://images.unsplash.com/photo..."
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Ajouter à l'inventaire</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Requests Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Demandes de matériel</CardTitle>
            <CardDescription>Acceptez ou refusez les demandes des étudiants</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {requests.length > 0 ? (
              <div className="divide-y relative overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Étudiant</th>
                      <th className="px-6 py-3">Projet</th>
                      <th className="px-6 py-3">Matériel Demandé</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {req.studentName}
                          <br /><span className="text-xs text-gray-500 font-normal">Encadrant: {req.supervisor}</span>
                        </td>
                        <td className="px-6 py-4">{req.projectTitle}</td>
                        <td className="px-6 py-4 font-medium">{req.materialName}</td>
                        <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                        <td className="px-6 py-4 text-right">
                          {req.status === 'pending' && (
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8" onClick={() => handleApproveRequest(req.id)}>
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Accepter
                              </Button>
                              <Button size="sm" variant="destructive" className="h-8" onClick={() => handleRejectRequest(req.id)}>
                                <XCircle className="w-4 h-4 mr-1" /> Refuser
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <p>Aucune demande de matériel pour le moment.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventaire Actuel</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {materials.map((item) => (
              <Card key={item.id} className="border-0 shadow-sm relative group overflow-hidden flex flex-col">
                {item.url && (
                  <div className="h-40 w-full overflow-hidden">
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                )}
                <CardContent className="p-6 flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    {!item.url && (
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                        {item.type === 'laptop' ? <Monitor className="w-6 h-6" /> : item.type === 'server' ? <Server className="w-6 h-6" /> : <Package className="w-6 h-6"/>}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{item.title}</h4>
                      <p className="text-xs text-gray-500 font-medium">Détails: {item.size}</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button variant="secondary" size="icon" className="bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-50 hover:text-red-700 shadow-sm" onClick={() => handleDeleteMaterial(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminMaterial;
