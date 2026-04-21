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
    const storedFormations = JSON.parse(localStorage.getItem('formations') || 'null');
    if (storedFormations && storedFormations.length > 0) {
      setFormations(storedFormations);
    } else {
      const defaultFormations = [
        {
          id: 'f1',
          title: 'Pitch Perfect: Comment convaincre les investisseurs',
          description: 'Apprenez les techniques pour structurer votre pitch et capter l\'attention.',
          date: '2026-03-01',
          time: '10:00 - 12:00',
          location: 'Amphi Innovation',
          instructor: 'Jean Dupont',
          totalSpots: 30,
          availableSpots: 12
        },
        {
          id: 'f2',
          title: 'Marketing Digital pour Startups',
          description: 'Les fondamentaux pour lancer votre marque sur les réseaux sociaux.',
          date: '2026-03-05',
          time: '14:00 - 17:00',
          location: 'Salle 4B',
          instructor: 'Marie Lambert',
          totalSpots: 20,
          availableSpots: 0
        }
      ];
      localStorage.setItem('formations', JSON.stringify(defaultFormations));
      setFormations(defaultFormations);
    }
  }, []);

  const handleRegister = (id: string) => {
    setRegistered([...registered, id]);
    const updatedFormations = formations.map(f => f.id === id ? { ...f, availableSpots: f.availableSpots - 1 } : f);
    setFormations(updatedFormations);
    localStorage.setItem('formations', JSON.stringify(updatedFormations));
    toast.success('Inscription réussie !', { description: 'Vous recevrez un rappel la veille.' });
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
