import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Bell, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const AdminNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?userId=admin');
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50';
      case 'warning': return 'bg-orange-50';
      case 'error': return 'bg-red-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Notifications</h1>
          <p className="text-gray-500 font-medium text-sm">Suivez l'activité du système en temps réel.</p>
        </div>
        <Badge className="bg-blue-600 text-white font-black rounded-full px-4 py-1">
          {notifications.filter(n => !n.is_read).length} Nouvelles
        </Badge>
      </div>

      {notifications.length > 0 ? (
        <div className="grid gap-4">
          {notifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`border-0 shadow-sm transition-all duration-300 rounded-3xl overflow-hidden ${
                notif.is_read ? 'opacity-60 grayscale-[0.5]' : 'ring-2 ring-blue-600/5'
              }`}
            >
              <CardContent className="p-6 flex items-start gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${getBgColor(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-gray-900 tracking-tight">{notif.title}</h4>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{notif.message}</p>
                  {!notif.is_read && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 rounded-xl text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50"
                      onClick={() => markAsRead(notif.id)}
                    >
                      Marquer comme lu
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm rounded-[2.5rem]">
          <CardContent className="p-20 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tighter mb-2">Tout est calme</h3>
            <p className="text-gray-500 font-medium">Vous n'avez aucune notification pour le moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminNotifications;
