
ALTER TABLE evaluaciones DROP CONSTRAINT evaluaciones_area_check;
ALTER TABLE evaluaciones ADD CONSTRAINT evaluaciones_area_check CHECK (area = ANY (ARRAY['Matemática'::text, 'Comprensión Lectora'::text, 'Habilidades Socioemocionales'::text]));
