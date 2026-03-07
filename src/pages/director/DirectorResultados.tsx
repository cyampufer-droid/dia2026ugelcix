import { useAuth } from '@/contexts/AuthContext';
import ResultadosExplorer from '@/components/shared/ResultadosExplorer';

const DirectorResultados = () => {
  const { profile } = useAuth();
  return (
    <ResultadosExplorer
      scope="institucion"
      institucionId={profile?.institucion_id}
      title="Resultados Institucionales"
    />
  );
};

export default DirectorResultados;
