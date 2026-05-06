import React from 'react';

import { Card, CardContent } from '../components/ui/card';
import { BarChart3 } from 'lucide-react';

const MentorEvaluations: React.FC = () => {
  return (
    <div>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Page d'évaluations - À venir</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentorEvaluations;
