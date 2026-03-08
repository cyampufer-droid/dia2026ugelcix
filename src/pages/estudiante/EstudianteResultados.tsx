import { useAuth } from '@/contexts/AuthContext';
import BoletaResultados from '@/components/shared/BoletaResultados';

const EstudianteResultados = () => {
  const { profile } = useAuth();

  if (!profile?.id) {
    return <p className="text-center text-muted-foreground py-8">Cargando...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <BoletaResultados
        studentProfileId={profile.id}
        studentName={profile.nombre_completo}
        showAI
      />
    </div>
  );
};

export default EstudianteResultados;
