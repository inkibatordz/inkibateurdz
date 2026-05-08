import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  GraduationCap, 
  Newspaper, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Users2,
  ChevronDown,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/ui/sheet";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  type: 'formation' | 'article' | 'evenement';
  date: string;
  imageUrl?: string;
}

const LandingPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data.success) setNews(data.news);
      })
      .catch(err => console.error('Error fetching news:', err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation - Glassmorphism */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 safe-top ${
        scrolled ? 'bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 py-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.02)]' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <Logo className="w-12 h-12 group-hover:rotate-12 transition-transform duration-300" />
            <div className="flex flex-col">
              <span className="text-xl font-black text-gray-900 tracking-tight leading-none">2TI</span>
              <span className="text-[10px] font-bold text-teal-600 tracking-[0.2em]">TLEMCEN TECH INCUBATOR</span>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-6">
              {['Actualités', 'Services', 'Mentors', 'À propos'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                  {item}
                </a>
              ))}
              <Link to="/login">
                <Button variant="ghost" className="font-bold text-gray-700">Se connecter</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-xl shadow-blue-200/50 transition-all hover:scale-105 active:scale-95">
                  Rejoindre
                </Button>
              </Link>
            </div>

            {/* Mobile Nav Trigger */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col gap-8 mt-10">
                    {['Actualités', 'Services', 'Mentors', 'À propos'].map((item) => (
                      <a 
                        key={item} 
                        href={`#${item.toLowerCase()}`} 
                        className="text-lg font-bold text-gray-900"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item}
                      </a>
                    ))}
                    <div className="flex flex-col gap-4 pt-6 border-t">
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full h-12 font-bold">Se connecter</Button>
                      </Link>
                      <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full h-12 bg-blue-600 font-bold">Rejoindre l'élite</Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Visual Excellence */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50 animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-100 rounded-full blur-[120px] opacity-50"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="mb-6 py-1.5 px-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-full font-bold">
                  ✨ L'avenir de l'entrepreneuriat étudiant
                </Badge>
                <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-gray-900 mb-6 lg:mb-8 leading-[0.95] tracking-tighter">
                  Propulsez vos <br />
                  <span className="text-gradient">Rêves Innovants</span>
                </h1>
                <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Accompagnement d'élite, réseau d'experts et ressources de pointe pour transformer votre idée en startup à succès.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start">
                  <Link to="/register">
                    <Button className="h-14 px-10 text-lg bg-gray-900 hover:bg-black text-white rounded-2xl shadow-2xl transition-all hover:scale-105">
                      Démarrer l'aventure
                    </Button>
                  </Link>
                  <div className="flex -space-x-3 items-center">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" />
                      </div>
                    ))}
                    <p className="ml-4 text-sm font-bold text-gray-500 tracking-tight">+500 Étudiants actifs</p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-1 relative"
            >
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200" 
                  alt="Students working" 
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
              </div>
              <div className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl z-20 hidden md:block animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-2 rounded-xl text-green-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Approuvé par</p>
                    <p className="text-sm font-black text-gray-900">Ministère Supérieur</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Marks - Smooth Gradients */}
      <section className="py-12 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {['Microsoft', 'Google Cloud', 'Cisco', 'Algeria Venture', 'USTHB'].map(name => (
            <span key={name} className="text-2xl font-black tracking-tighter text-gray-400">{name}</span>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Pourquoi nous choisir ?</h2>
            <p className="text-gray-500 max-w-xl mx-auto font-medium">Nous fournissons les outils nécessaires pour bâtir des fondations solides.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Accélération", desc: "Processus rapide pour passer de l'idée au prototype fonctionnel.", color: "bg-orange-500" },
              { icon: Globe, title: "Networking", desc: "Accès direct à un réseau d'investisseurs et de partenaires locaux.", color: "bg-blue-500" },
              { icon: Users2, title: "Mentorat Pro", desc: "Accompagnement personnalisé par des entrepreneurs chevronnés.", color: "bg-purple-500" }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="premium-card p-10 group tap-active"
              >
                <div className={`${feature.color} w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-${feature.color.split('-')[1]}-200 transition-transform group-hover:rotate-6`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed font-bold opacity-80">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* News & Events - The Admin Dynamic Part */}
      <section id="actualités" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <Badge className="bg-blue-600 mb-4">LE FIL D'ACTU</Badge>
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-tight">
                Dernières de <br /> l'Incubateur
              </h2>
            </div>
            <Link to="/register">
              <Button variant="outline" className="rounded-full border-gray-200 font-bold group">
                Voir tout le flux <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <AnimatePresence>
            {news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {news.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="group overflow-hidden rounded-[2.5rem] border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-500 h-full">
                      <div className="relative h-64 overflow-hidden">
                        <img 
                          src={item.imageUrl || "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80&w=800"} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur text-gray-900 font-black py-1 px-4 border-0">
                          {item.type.toUpperCase()}
                        </Badge>
                      </div>
                      <CardContent className="p-8">
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-4">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-gray-500 line-clamp-3 mb-6 font-medium leading-relaxed">
                          {item.content}
                        </p>
                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-400">Lecture 3 min</span>
                          <Button size="icon" className="rounded-full bg-gray-50 hover:bg-blue-600 text-gray-900 hover:text-white transition-all shadow-none">
                            <ArrowRight className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
                <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
                <p className="text-xl font-bold text-gray-300 tracking-tight uppercase">Pas de nouvelles pour le moment</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-blue-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">Prêt à changer le monde ?</h2>
            <p className="text-xl text-blue-100 mb-12 max-w-xl mx-auto font-medium">Rejoignez des centaines d'étudiants qui ont déjà franchi le pas.</p>
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-black px-12 h-16 text-xl rounded-2xl shadow-xl shadow-black/10">
                S'inscrire maintenant
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Premium Dark */}
      <footer className="bg-gray-950 text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-8">
                <Logo className="w-10 h-10" />
                <span className="text-xl font-black tracking-tighter">2TI TLEMCEN</span>
              </div>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                L'excellence technologique au service de l'innovation algérienne.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-all text-gray-400 hover:text-white">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-8 uppercase tracking-widest text-gray-400 text-sm">Navigation</h4>
              <ul className="space-y-4 text-gray-500 font-bold">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Accueil</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Programmes</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Mentors</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-8 uppercase tracking-widest text-gray-400 text-sm">Légal</h4>
              <ul className="space-y-4 text-gray-500 font-bold">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Conditions</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Mentions Légales</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-8 uppercase tracking-widest text-gray-400 text-sm">Newsletter</h4>
              <p className="text-gray-500 mb-6 text-sm font-bold">Recevez nos dernières opportunités.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email" className="bg-white/5 border-0 rounded-xl px-4 py-3 flex-1 text-sm focus:ring-2 ring-blue-600 outline-none transition-all" />
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4">
                  OK
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-600 font-bold text-sm">© 2026 2TI - Tlemcen Tech Incubator. Designed for Excellence.</p>
            <div className="flex items-center gap-2 text-gray-600">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-widest">Algeria, Global Vision</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
