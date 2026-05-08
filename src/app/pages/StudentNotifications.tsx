import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Bell } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

const StudentNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${user?.id}`);
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <Badge variant="outline" className="text-gray-500">
            {notifications.filter(n => !n.is_read).length} nouvelles
          </Badge>
        </div>
        
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card key={notif.id} className={`border-0 shadow-sm transition-all ${notif.is_read ? 'opacity-70' : 'border-l-4 border-l-blue-600'}`}>
                <CardContent className="p-4 flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{notif.title}</h4>
                      <span className="text-xs text-gray-500">{new Date(notif.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                    {!notif.is_read && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 p-0 hover:bg-transparent" onClick={() => markAsRead(notif.id)}>
                        Marquer comme lu
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune notification pour le moment</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentNotifications;
