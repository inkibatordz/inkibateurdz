import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, User, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface ChatRoomProps {
  projectId: string;
  projectName: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ projectId, projectName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${projectId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
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

  return (
    <Card className="flex flex-col h-[500px] border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-blue-600 text-white p-4">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Chat : {projectName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {msg.first_name} {msg.last_name} ({msg.role})
                  </span>
                </div>
                <div 
                  className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${
                    msg.sender_id === user?.id 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-gray-400 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <User className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Aucun message pour le moment</p>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 rounded-xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-blue-600/20"
          />
          <Button 
            type="submit" 
            className="rounded-xl bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0 shadow-lg shadow-blue-200 transition-all active:scale-95"
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatRoom;
