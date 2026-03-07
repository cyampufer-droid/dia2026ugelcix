import { useAuth } from '@/contexts/AuthContext';
import ResultadosExplorer from '@/components/shared/ResultadosExplorer';

const DocenteResultados = () => {
  const { profile, isPIP } = useAuth();

  // PIP docentes get institution-level access like directors
  if (isPIP) {
    return (
      <ResultadosExplorer
        scope="institucion"
        institucionId={profile?.institucion_id}
        title="Resultados Institucionales"
      />
    );
  }

  return (
    <ResultadosExplorer
      scope="seccion"
      gradoSeccionId={profile?.grado_seccion_id}
      especialidad={profile?.especialidad}
      title="Resultados de Mi Aula"
    />
  );
};

export default DocenteResultados;
