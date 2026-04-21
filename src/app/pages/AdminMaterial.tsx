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
  name: string;
  type: string;
  availableCount: number;
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
    name: '',
    type: 'laptop',
    availableCount: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedMaterials = JSON.parse(localStorage.getItem('materials') || '[]');
    setMaterials(storedMaterials);
    const storedRequests = JSON.parse(localStorage.getItem('materialRequests') || '[]');
    setRequests(storedRequests.sort((a: Request, b: Request) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const newMaterial: Material = {
      id: `m-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      availableCount: Number(formData.availableCount)
    };

    const updatedMaterials = [...materials, newMaterial];
    localStorage.setItem('materials', JSON.stringify(updatedMaterials));
    setMaterials(updatedMaterials);
    setIsDialogOpen(false);
    setFormData({ name: '', type: 'laptop', availableCount: 1 });
    toast.success('Matériel ajouté à l\'inventaire');
  };

  const handleDeleteMaterial = (id: string) => {
    const updatedMaterials = materials.filter(m => m.id !== id);
    localStorage.setItem('materials', JSON.stringify(updatedMaterials));
    setMaterials(updatedMaterials);
    toast.success('Matériel supprimé de l\'inventaire');
  };

  const handleApproveRequest = (reqId: string) => {
    // Check if we can decrease stock based on name match (basic implementation)
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    // Optional: you could try to match by name and decrease stock or the admin manages stock manually.
    // Let's just approve it for the MVP
    const updatedRequests = requests.map(r => r.id === reqId ? { ...r, status: 'approved' as const } : r);
    localStorage.setItem('materialRequests', JSON.stringify(updatedRequests));
    setRequests(updatedRequests);
    toast.success('Demande approuvée (Réservée)');
  };

  const handleRejectRequest = (reqId: string) => {
    const updatedRequests = requests.map(r => r.id === reqId ? { ...r, status: 'rejected' as const } : r);
    localStorage.setItem('materialRequests', JSON.stringify(updatedRequests));
    setRequests(updatedRequests);
    toast.success('Demande rejetée');
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
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
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
                    <Label>Quantité en stock</Label>
                    <Input 
                      type="number" min="0" 
                      value={formData.availableCount} 
                      onChange={e => setFormData({...formData, availableCount: parseInt(e.target.value)})} 
                      required 
                    />
                  </div>
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
              <Card key={item.id} className="border-0 shadow-sm relative group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      {item.type === 'laptop' ? <Monitor className="w-6 h-6" /> : item.type === 'server' ? <Server className="w-6 h-6" /> : <Package className="w-6 h-6"/>}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">Stock: {item.availableCount}</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleDeleteMaterial(item.id)}>
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
