import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import inspectiaLogo from '@/assets/inspectia-logo.png';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-3xl mx-auto">
        <img src={inspectiaLogo} alt="Inspectia" className="h-24 mx-auto mb-8" />
        <h1 className="text-5xl font-bold text-white mb-6">
          Inspectia
        </h1>
        <p className="text-xl text-white/90 mb-8 leading-relaxed">
          Gestión moderna de proyectos con metodología Kanban. 
          Organiza, colabora y lleva tus proyectos al siguiente nivel.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 shadow-lg"
            onClick={() => navigate('/auth')}
          >
            Comenzar ahora
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white text-white hover:bg-white/10"
            onClick={() => navigate('/auth')}
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
