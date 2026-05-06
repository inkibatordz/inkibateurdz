import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  purple: 'bg-purple-100 text-purple-600',
};

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, trend, color }) => {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-sm mt-2 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
