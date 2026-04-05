# Instrucciones de Deployment - Fix RLS Policy para Docentes

## Problema arreglado

La política RLS (Row Level Security) `"Docentes update resultados"` en la tabla `resultados` tenía solo la cláusula `USING` pero le faltaba la cláusula `WITH CHECK`. Esto causaba que los upserts realizados por la aplicación fueran bloqueados silenciosamente por PostgreSQL, por lo que los docentes veían el mensaje "Sincronización completada" pero los datos no se persistían en la base de datos.

## Paso a paso para aplicar el fix en Supabase

1. Abre el dashboard de Supabase usando el `VITE_SUPABASE_PROJECT_ID` definido en tu `.env`:
   `https://supabase.com/dashboard/project/<VITE_SUPABASE_PROJECT_ID>`
2. En el menú izquierdo, haz clic en **SQL Editor**.
3. Haz clic en **New query**.
4. Copia y pega el siguiente SQL:

```sql
-- Eliminar la política anterior (incompleta)
DROP POLICY IF EXISTS "Docentes update resultados" ON public.resultados;

-- Crear la política corregida con USING y WITH CHECK
CREATE POLICY "Docentes update resultados" ON public.resultados
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'docente')
    AND estudiante_id IN (
      SELECT id FROM public.profiles
      WHERE grado_seccion_id = public.get_user_grado_seccion(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'docente')
    AND estudiante_id IN (
      SELECT id FROM public.profiles
      WHERE grado_seccion_id = public.get_user_grado_seccion(auth.uid())
    )
  );
```

5. Haz clic en **Run** ▶️.
6. Deberías ver el mensaje: `Success. No rows returned`.

## Verificación de que funciona

1. Abre la aplicación: https://dia2026gredlambayeque.vercel.app
2. Inicia sesión como **docente**.
3. Ve a **"Digitar Respuestas"**.
4. Ingresa las respuestas de al menos un estudiante y guarda.
5. Cierra sesión completamente.
6. Vuelve a iniciar sesión como el mismo docente.
7. Ve a **"Digitar Respuestas"** o **"Resultados"**.
8. ✅ Los datos deben estar guardados y visibles.

## Datos existentes

- Los 65,000 estudiantes ya registrados **no se ven afectados** por este cambio.
- Las respuestas guardadas anteriormente que lograron persistir **se mantienen intactas**.
- Las instituciones de Chiclayo, Lambayeque y Ferreñafe y sus directores **siguen activos**.
- Solo se corrige la política que bloqueaba nuevos upserts de respuestas por docentes.
