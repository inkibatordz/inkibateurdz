import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Search,
  UserCheck,
  UserX,
  Filter,
  Plus
} from 'lucide-react';
import { User } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isMentorDialogOpen, setIsMentorDialogOpen] = useState(false);
  const [mentorData, setMentorData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    staffId: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterRole, filterStatus, users]);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        // Exclude admin from the list
        const nonAdminUsers = data.users.filter((u: User) => u.role !== 'admin');
        setUsers(nonAdminUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(u => 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    // Status filter
    if (filterStatus === 'pending') {
      filtered = filtered.filter(u => !u.approved);
    } else if (filterStatus === 'approved') {
      filtered = filtered.filter(u => u.approved);
    }

    setFilteredUsers(filtered);
  };

  const handleApprove = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/approve`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        loadUsers();
        toast.success('Utilisateur approuvé avec succès');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadUsers();
        toast.success('Utilisateur supprimé');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeactivate = async (userId: string) => {
    // For now, deactivation is just setting status back to pending or similar
    // We can reuse a general update status endpoint if needed
    toast.info('Fonctionnalité de désactivation en cours de développement');
  };

  const handleCreateMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mentorData,
          role: 'mentor',
          status: 'approved' // Mentors created by admin are automatically approved
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsMentorDialogOpen(false);
        setMentorData({ firstName: '', lastName: '', email: '', password: '', department: '', staffId: '' });
        loadUsers();
        toast.success('Compte mentor créé avec succès');
      } else {
        toast.error(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-700';
      case 'mentor': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student': return 'Étudiant';
      case 'mentor': return 'Mentor';
      default: return role;
    }
  };

  const pendingCount = users.filter(u => !u.approved).length;
  const approvedCount = users.filter(u => u.approved).length;

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des utilisateurs</h1>
            <p className="text-gray-600">Approuvez, rejetez ou désactivez les comptes utilisateurs</p>
          </div>
          <Dialog open={isMentorDialogOpen} onOpenChange={setIsMentorDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Créer compte Mentor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau Mentor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateMentor} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input value={mentorData.firstName} onChange={e => setMentorData({...mentorData, firstName: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input value={mentorData.lastName} onChange={e => setMentorData({...mentorData, lastName: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={mentorData.email} onChange={e => setMentorData({...mentorData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <Input type="password" value={mentorData.password} onChange={e => setMentorData({...mentorData, password: e.target.value})} minLength={6} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Département / Spécialité</Label>
                    <Input value={mentorData.department} onChange={e => setMentorData({...mentorData, department: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>ID Personnel</Label>
                    <Input value={mentorData.staffId} onChange={e => setMentorData({...mentorData, staffId: e.target.value})} required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">Créer le compte</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total utilisateurs</p>
                  <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
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
                  <UserCheck className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approuvés</p>
                  <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
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
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="student">Étudiants</SelectItem>
                  <SelectItem value="mentor">Mentors</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>Liste des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-5 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </h4>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          {!user.approved && (
                            <Badge className="bg-orange-100 text-orange-700">
                              En attente
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{user.email}</span>
                          {user.role === 'student' && user.university && (
                            <>
                              <span>•</span>
                              <span>{user.university}</span>
                            </>
                          )}
                          {user.department && (
                            <>
                              <span>•</span>
                              <span>{user.department}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!user.approved ? (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(user.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approuver
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleReject(user.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeter
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleDeactivate(user.id)}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Désactiver
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Les nouveaux utilisateurs apparaîtront ici'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
