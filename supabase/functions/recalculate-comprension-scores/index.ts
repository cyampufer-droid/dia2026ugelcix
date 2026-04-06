import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatabaseResult {
  id: string;
  evaluacion_id: string;
  estudiante_id: string;
  respuestas_dadas: string[];
  puntaje_total: number | null;
}

interface EvaluationConfig {
  id: string;
  config_preguntas: {
    respuestas_correctas: string[];
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting score recalculation for Comprensión Lectora Primaria...');

    // Get updated evaluations config
    const { data: evaluaciones, error: evalError } = await supabase
      .from('evaluaciones')
      .select('id, config_preguntas')
      .eq('area', 'Comprensión Lectora')
      .eq('nivel', 'Primaria');

    if (evalError) {
      console.error('Error fetching evaluaciones:', evalError);
      throw evalError;
    }

    console.log(`Found ${evaluaciones.length} evaluaciones to process`);

    // Get all results for these evaluations
    const evaluacionIds = evaluaciones.map(e => e.id);
    
    const { data: resultados, error: resultsError } = await supabase
      .from('resultados')
      .select('id, evaluacion_id, estudiante_id, respuestas_dadas, puntaje_total')
      .in('evaluacion_id', evaluacionIds)
      .not('respuestas_dadas', 'is', null);

    if (resultsError) {
      console.error('Error fetching resultados:', resultsError);
      throw resultsError;
    }

    console.log(`Found ${resultados.length} results to recalculate`);

    if (!resultados || resultados.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No results found to recalculate',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create evaluation lookup map
    const evaluationMap = new Map();
    evaluaciones.forEach(evaluation => {
      evaluationMap.set(evaluation.id, evaluation.config_preguntas?.respuestas_correctas || []);
    });

    const updates = [];
    let processed = 0;

    // Process each result
    for (const resultado of resultados) {
      const correctAnswers = evaluationMap.get(resultado.evaluacion_id);
      
      if (!correctAnswers || correctAnswers.length === 0) {
        console.log(`No correct answers found for evaluation ${resultado.evaluacion_id}`);
        continue;
      }

      const respuestasArray = Array.isArray(resultado.respuestas_dadas) 
        ? resultado.respuestas_dadas 
        : [];

      // Calculate new score
      let newScore = 0;
      for (let i = 0; i < Math.min(respuestasArray.length, correctAnswers.length); i++) {
        const studentAnswer = respuestasArray[i]?.toUpperCase()?.trim() || '';
        const correctAnswer = correctAnswers[i]?.toUpperCase()?.trim() || '';
        
        if (studentAnswer && correctAnswer && studentAnswer === correctAnswer) {
          newScore++;
        }
      }

      // Determine achievement level
      let nivelLogro = 'En Inicio';
      if (newScore >= 19) {
        nivelLogro = 'Logro Destacado';
      } else if (newScore >= 15) {
        nivelLogro = 'Logro Esperado';
      } else if (newScore >= 11) {
        nivelLogro = 'En Proceso';
      }

      // Only update if score changed
      if (newScore !== resultado.puntaje_total) {
        updates.push({
          id: resultado.id,
          puntaje_total: newScore,
          nivel_logro: nivelLogro
        });

        console.log(`Result ${resultado.id}: ${resultado.puntaje_total} -> ${newScore} (${nivelLogro})`);
      }

      processed++;
    }

    console.log(`Updating ${updates.length} results out of ${processed} processed`);

    // Batch update results
    if (updates.length > 0) {
      // Process in batches of 50
      const batchSize = 50;
      let updated = 0;
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        for (const update of batch) {
          const { error: updateError } = await supabase
            .from('resultados')
            .update({
              puntaje_total: update.puntaje_total,
              nivel_logro: update.nivel_logro,
              fecha_sincronizacion: new Date().toISOString()
            })
            .eq('id', update.id);

          if (updateError) {
            console.error(`Error updating result ${update.id}:`, updateError);
          } else {
            updated++;
          }
        }
      }

      console.log(`Successfully updated ${updated} results`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Score recalculation completed`,
        processed,
        updated: updates.length,
        evaluaciones: evaluaciones.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in recalculation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});