export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      evaluaciones: {
        Row: {
          anio: number
          area: string
          config_preguntas: Json
          created_at: string
          grado: string
          id: string
          nivel: string
          numero_preguntas: number
        }
        Insert: {
          anio?: number
          area: string
          config_preguntas?: Json
          created_at?: string
          grado: string
          id?: string
          nivel: string
          numero_preguntas?: number
        }
        Update: {
          anio?: number
          area?: string
          config_preguntas?: Json
          created_at?: string
          grado?: string
          id?: string
          nivel?: string
          numero_preguntas?: number
        }
        Relationships: []
      }
      instituciones: {
        Row: {
          centro_poblado: string | null
          codigo_local: string | null
          codigo_modular: string | null
          created_at: string
          direccion: string | null
          distrito: string
          id: string
          nombre: string
          provincia: string
          tipo_gestion: string
        }
        Insert: {
          centro_poblado?: string | null
          codigo_local?: string | null
          codigo_modular?: string | null
          created_at?: string
          direccion?: string | null
          distrito: string
          id?: string
          nombre: string
          provincia?: string
          tipo_gestion?: string
        }
        Update: {
          centro_poblado?: string | null
          codigo_local?: string | null
          codigo_modular?: string | null
          created_at?: string
          direccion?: string | null
          distrito?: string
          id?: string
          nombre?: string
          provincia?: string
          tipo_gestion?: string
        }
        Relationships: []
      }
      niveles_grados: {
        Row: {
          created_at: string
          grado: string
          id: string
          institucion_id: string
          nivel: string
          seccion: string
        }
        Insert: {
          created_at?: string
          grado: string
          id?: string
          institucion_id: string
          nivel: string
          seccion?: string
        }
        Update: {
          created_at?: string
          grado?: string
          id?: string
          institucion_id?: string
          nivel?: string
          seccion?: string
        }
        Relationships: [
          {
            foreignKeyName: "niveles_grados_institucion_id_fkey"
            columns: ["institucion_id"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          dni: string
          grado_seccion_id: string | null
          id: string
          institucion_id: string | null
          nombre_completo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dni: string
          grado_seccion_id?: string | null
          id?: string
          institucion_id?: string | null
          nombre_completo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dni?: string
          grado_seccion_id?: string | null
          id?: string
          institucion_id?: string | null
          nombre_completo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_grado_seccion_id_fkey"
            columns: ["grado_seccion_id"]
            isOneToOne: false
            referencedRelation: "niveles_grados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_institucion_id_fkey"
            columns: ["institucion_id"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados: {
        Row: {
          created_at: string
          estudiante_id: string
          evaluacion_id: string
          fecha_sincronizacion: string | null
          id: string
          nivel_logro: string | null
          puntaje_total: number | null
          respuestas_dadas: string[] | null
        }
        Insert: {
          created_at?: string
          estudiante_id: string
          evaluacion_id: string
          fecha_sincronizacion?: string | null
          id?: string
          nivel_logro?: string | null
          puntaje_total?: number | null
          respuestas_dadas?: string[] | null
        }
        Update: {
          created_at?: string
          estudiante_id?: string
          evaluacion_id?: string
          fecha_sincronizacion?: string | null
          id?: string
          nivel_logro?: string | null
          puntaje_total?: number | null
          respuestas_dadas?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "resultados_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_grado_seccion: { Args: { _user_id: string }; Returns: string }
      get_user_institucion: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "estudiante"
        | "docente"
        | "director"
        | "subdirector"
        | "especialista"
        | "padre"
        | "administrador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "estudiante",
        "docente",
        "director",
        "subdirector",
        "especialista",
        "padre",
        "administrador",
      ],
    },
  },
} as const
