import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { GraduationCap, Bell, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Formation {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  totalSpots: number;
  availableSpots: number;
}

const StudentTrainings: React.FC = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [registered, setRegistered] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const trainRes = await fetch('/api/trainings');
      const trainData = await trainRes.json();
      if (trainData.success) setFormations(trainData.trainings);

      if (user) {
        const regRes = await fetch(`/api/trainings/my-registrations?studentId=${user.id}`);
        const regData = await regRes.json();
        if (regData.success) setRegistered(regData.registrations);
      }
    } catch (error) {
      toast.error('Erreur de chargement');
    }
  };

  const handleRegister = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/trainings/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Inscription réussie !', { description: 'Vous recevrez un rappel la veille.' });
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    if (!notificationsEnabled) {
      toast.success('Notifications activées', { description: 'Vous serez notifié des nouvelles formations.' });
    } else {
      toast.info('Notifications désactivées');
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Formations & Ateliers</h1>
            <p className="text-gray-600">Participez à nos événements pour booster votre projet</p>
          </div>
          <Button 
            variant={notificationsEnabled ? "outline" : "default"} 
            className={notificationsEnabled ? "border-green-500 text-green-700 bg-green-50" : "bg-blue-600 hover:bg-blue-700"}
            onClick={handleToggleNotifications}
          >
            {notificationsEnabled ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
            {notificationsEnabled ? "Notifications actives" : "M'avertir des nouveautés"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formations.map((formation) => {
            const isRegistered = registered.includes(formation.id);
            const isFull = formation.availableSpots === 0;

            return (
              <Card key={formation.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b bg-gray-50/50 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={isFull && !isRegistered ? "destructive" : "secondary"}>
                      {isRegistered ? 'Inscrit' : isFull ? 'Complet' : `${formation.availableSpots} places restantes`}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-gray-900">{formation.title}</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">{formation.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-3 text-blue-600" />
                      <span>{new Date(formation.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} • {formation.time}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-3 text-blue-600" />
                      <span>{formation.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-3 text-blue-600" />
                      <span>Par {formation.instructor}</span>
                    </div>
                  </div>
                  {isRegistered ? (
                    <Button disabled variant="outline" className="w-full border-green-500 text-green-600 bg-green-50">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Vous participez !
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      disabled={isFull}
                      onClick={() => handleRegister(formation.id)}
                    >
                      {isFull ? 'Liste d\'attente complète' : 'S\'inscrire à la formation'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentTrainings;
