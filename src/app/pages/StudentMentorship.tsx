import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Send, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../contexts/AuthContext';
import { apiGet, apiSend } from '@/lib/api';

interface Message {
  id: string;
  senderId: string;
  senderRole: 'student' | 'mentor';
  text: string;
  timestamp: string;
  chatId: string;
}

const StudentMentorship: React.FC = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<User[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    void (async () => {
      if (!user?.id) {
        setMentors([]);
        return;
      }
      try {
        const [pData, uData] = await Promise.all([
          apiGet<{ projects: { mentorId?: string; status: string }[] }>(
            `/api/projects?studentId=${encodeURIComponent(user.id)}`
          ),
          apiGet<{ users: User[] }>('/api/users'),
        ]);
        const myProjects = pData.projects.filter(
          (p) => p.status === 'accepted' || p.status === 'incubation'
        );
        const mentorIds = [...new Set(myProjects.map((p) => p.mentorId).filter(Boolean))] as string[];
        const uniqueMentors = uData.users.filter((u) => mentorIds.includes(u.id));
        setMentors(uniqueMentors);
        if (uniqueMentors.length > 0) {
          setSelectedMentor((prev) =>
            prev && uniqueMentors.some((m) => m.id === prev.id) ? prev : uniqueMentors[0]
          );
        } else setSelectedMentor(null);
      } catch {
        setMentors([]);
      }
    })();
  }, [user]);

  useEffect(() => {
    void (async () => {
      if (!selectedMentor || !user) {
        setMessages([]);
        return;
      }
      const chatId = `${user.id}-${selectedMentor.id}`;
      try {
        const data = await apiGet<{ messages: Message[] }>(
          `/api/messages?chatId=${encodeURIComponent(chatId)}`
        );
        setMessages(data.messages);
      } catch {
        setMessages([]);
      }
    })();
  }, [selectedMentor, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMentor || !user) return;

    const chatId = `${user.id}-${selectedMentor.id}`;
    const message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderRole: 'student' as const,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      chatId,
    };

    try {
      await apiSend('/api/messages', 'POST', message);
      setMessages((prev) => [...prev, message as Message]);
      setNewMessage('');
    } catch {
      /* optional toast */
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mentorat & Suivi</h1>
          <p className="text-gray-600">Discutez directement avec votre mentor pour avancer sur votre projet.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          <Card className="border-0 shadow-sm hidden lg:block lg:col-span-1 border-r">
            <CardHeader className="p-4 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" /> Mes Mentors
              </h3>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[500px]">
              {mentors.length > 0 ? mentors.map(mentor => (
                <div 
                  key={mentor.id}
                  onClick={() => setSelectedMentor(mentor)}
                  className={`p-4 cursor-pointer border-l-4 flex items-center space-x-3 transition-colors ${selectedMentor?.id === mentor.id ? 'bg-blue-50 border-blue-600' : 'border-transparent hover:bg-gray-50'}`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-blue-200 text-blue-700 font-semibold">
                      {getInitials(mentor.firstName, mentor.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{mentor.firstName} {mentor.lastName}</p>
                    <p className="text-xs text-gray-500">Mentor Principal</p>
                  </div>
                </div>
              )) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Aucun mentor assigné
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm lg:col-span-3 flex flex-col h-full">
            {selectedMentor ? (
              <>
                <div className="p-4 border-b flex items-center space-x-3 bg-white rounded-t-xl">
                  <Avatar>
                    <AvatarFallback className="bg-blue-600 text-white font-semibold">
                      {getInitials(selectedMentor.firstName, selectedMentor.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedMentor.firstName} {selectedMentor.lastName}</h3>
                    <p className="text-xs text-green-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> En ligne
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                  {messages.length > 0 ? messages.map((msg) => {
                    const isMe = msg.senderRole === 'student';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl p-3 ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border rounded-bl-sm shadow-sm'}`}>
                          <p className="text-sm">{msg.text}</p>
                          <span className={`text-[10px] mt-1 block ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                      Envoyez un message pour démarrer la discussion
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-t rounded-b-xl">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..." 
                      className="flex-1"
                    />
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Sélectionnez un mentor pour commencer à discuter
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentMentorship;
