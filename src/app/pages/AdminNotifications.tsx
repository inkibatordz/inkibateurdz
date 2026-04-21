import React from 'react';

import { Card, CardContent } from '../components/ui/card';
import { Bell } from 'lucide-react';

const AdminNotifications: React.FC = () => {
  return (
    <div>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Page de notifications - À venir</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;
