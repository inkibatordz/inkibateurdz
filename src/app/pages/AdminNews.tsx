import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Newspaper, Plus, Trash2, Calendar, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  type: 'formation' | 'article' | 'evenement';
  date: string;
  imageUrl?: string;
}

const AdminNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'article' as 'formation' | 'article' | 'evenement',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/news');
      const data = await res.json();
      if (data.success) setNews(data.news);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('http://localhost:3001/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Actualité publiée avec succès !' });
        setFormData({ title: '', content: '', type: 'article', imageUrl: '' });
        fetchNews();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la publication.' });
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet article ?')) return;

    try {
      const res = await fetch(`http://localhost:3001/api/news/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchNews();
      }
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Actualités</h2>
        <Newspaper className="w-8 h-8 text-blue-600 opacity-20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <Card className="lg:col-span-1 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Nouvel Article
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {message.text && (
                <Alert className={message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}>
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="Ex: Nouvelle formation IA" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article / Actualité</SelectItem>
                    <SelectItem value="formation">Formation</SelectItem>
                    <SelectItem value="evenement">Événement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL de l'image (Optionnel)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="imageUrl" 
                    value={formData.imageUrl} 
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                    placeholder="https://..." 
                  />
                  <div className="p-2 bg-gray-100 rounded-md">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenu</Label>
                <Textarea 
                  id="content" 
                  rows={6} 
                  value={formData.content} 
                  onChange={(e) => setFormData({...formData, content: e.target.value})} 
                  placeholder="Écrivez votre article ici..." 
                  required 
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? 'Publication...' : 'Publier sur la Landing Page'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List Card */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Articles Publiés</CardTitle>
          </CardHeader>
          <CardContent>
            {news.length > 0 ? (
              <div className="space-y-4">
                {news.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border bg-white hover:border-blue-200 transition-colors group">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-24 h-24 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-24 h-24 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Newspaper className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                          {item.type}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 truncate">{item.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.content}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                Aucun article publié pour le moment.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNews;
