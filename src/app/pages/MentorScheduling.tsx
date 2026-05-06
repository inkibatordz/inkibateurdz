import React from 'react';

import { Card, CardContent } from '../components/ui/card';
import { Calendar } from 'lucide-react';

const MentorScheduling: React.FC = () => {
  return (
    <div>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Planification</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Page de planification - À venir</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentorScheduling;
