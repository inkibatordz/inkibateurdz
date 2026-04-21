import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Send, Users, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderRole: 'student' | 'mentor';
  text: string;
  timestamp: string;
}

const StudentMentorship: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      senderId: 'mentor-1',
      senderRole: 'mentor',
      text: 'Bonjour ! Avez-vous terminé le cahier des charges de votre projet ?',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || 'unknown',
      senderRole: 'student',
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mentorat & Suivi</h1>
          <p className="text-gray-600">Discutez directement avec votre mentor pour avancer sur votre projet.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          {/* Contacts Sidebar */}
          <Card className="border-0 shadow-sm hidden lg:block lg:col-span-1 border-r">
            <CardHeader className="p-4 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" /> Mes Mentors
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 bg-blue-50 cursor-pointer border-l-4 border-blue-600 flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-200 text-blue-700 font-semibold">SM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">Dr. Sarah Martin</p>
                  <p className="text-xs text-gray-500">Mentor Principal</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="border-0 shadow-sm lg:col-span-3 flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center space-x-3 bg-white rounded-t-xl">
              <Avatar>
                <AvatarFallback className="bg-blue-600 text-white font-semibold">SM</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">Dr. Sarah Martin</h3>
                <p className="text-xs text-green-600 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> En ligne
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg) => {
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
              })}
            </div>

            {/* Chat Input */}
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentMentorship;
