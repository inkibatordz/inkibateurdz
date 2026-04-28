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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const myProjects = allProjects.filter((p: any) => p.mentorId === user?.id && (p.status === 'accepted' || p.status === 'incubation'));
    
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const myStudents = myProjects.map((p: any) => allUsers.find((u: any) => u.id === p.studentId)).filter(Boolean);
    
    const uniqueStudents = myStudents.filter((v:any,i:any,a:any)=>a.findIndex((t:any)=>(t.id === v.id))===i);
    setStudents(uniqueStudents);
    if (uniqueStudents.length > 0) {
      setSelectedStudent(uniqueStudents[0]);
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudent && user) {
      const chatId = `${selectedStudent.id}-${user.id}`;
      const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
      setMessages(allMessages.filter((m: Message) => m.chatId === chatId));
    } else {
      setMessages([]);
    }
  }, [selectedStudent, user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudent || !user) return;

    const chatId = `${selectedStudent.id}-${user.id}`;
    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderRole: 'mentor',
      text: newMessage,
      timestamp: new Date().toISOString(),
      chatId
    };

    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    allMessages.push(message);
    localStorage.setItem('messages', JSON.stringify(allMessages));

    setMessages([...messages, message]);
    setNewMessage('');
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
                    const isMe = msg.senderRole === 'mentor';
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
