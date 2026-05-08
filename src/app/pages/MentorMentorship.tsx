import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Send, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderRole: 'student' | 'mentor';
  text: string;
  timestamp: string;
  chatId: string;
}

const MentorMentorship: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user]);

  const loadStudents = async () => {
    try {
      const res = await fetch(`/api/projects?mentorId=${user?.id}`);
      const data = await res.json();
      if (data.success) {
        // Extract unique students from projects
        const studentMap = new Map();
        data.projects.forEach((p: any) => {
          if (p.student_id) {
            studentMap.set(p.student_id, {
              id: p.student_id,
              firstName: p.student_first_name || 'Étudiant',
              lastName: p.student_last_name || `#${p.student_id?.slice(-4)}`,
              projectId: p.id,
              projectTitle: p.title
            });
          }
        });
        const uniqueStudents = Array.from(studentMap.values());
        setStudents(uniqueStudents);
        if (uniqueStudents.length > 0 && !selectedStudent) {
          setSelectedStudent(uniqueStudents[0]);
        }
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedStudent]);

  const fetchMessages = async () => {
    if (!selectedStudent) return;
    try {
      const res = await fetch(`/api/messages/${selectedStudent.projectId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudent || !user) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedStudent.projectId,
          senderId: user.id,
          content: newMessage.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
          <p className="text-gray-600">Discutez directement avec vos étudiants encadrés.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          <Card className="border-0 shadow-sm hidden lg:block lg:col-span-1 border-r">
            <CardHeader className="p-4 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" /> Mes Étudiants
              </h3>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[500px]">
              {students.length > 0 ? students.map(student => (
                <div 
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 cursor-pointer border-l-4 flex items-center space-x-3 transition-colors ${selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-600' : 'border-transparent hover:bg-gray-50'}`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-blue-200 text-blue-700 font-semibold">
                      {getInitials(student.firstName, student.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-gray-500">Étudiant</p>
                  </div>
                </div>
              )) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Aucun étudiant assigné
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm lg:col-span-3 flex flex-col h-full">
            {selectedStudent ? (
              <>
                <div className="p-4 border-b flex items-center space-x-3 bg-white rounded-t-xl">
                  <Avatar>
                    <AvatarFallback className="bg-blue-600 text-white font-semibold">
                      {getInitials(selectedStudent.firstName, selectedStudent.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                    <p className="text-xs text-green-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> En ligne
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                  {messages.length > 0 ? messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl p-3 ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border rounded-bl-sm shadow-sm'}`}>
                          <p className="text-sm">{msg.content}</p>
                          <span className={`text-[10px] mt-1 block ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
                Sélectionnez un étudiant pour commencer à discuter
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MentorMentorship;
