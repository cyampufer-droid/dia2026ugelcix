import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, BookOpen, Shield, Users, School, GraduationCap, UserCog, FileSpreadsheet, BarChart3, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import diaLogo from '@/assets/dia_ugel_cix_2026.png';
import dgpLogo from '@/assets/logo_dgp_ugel_cix.jpg';

const GuiaUsuario = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar - hidden on print */}
      <div className="print:hidden sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir / Guardar PDF
        </Button>
      </div>

      {/* Document content */}
      <article className="max-w-4xl mx-auto px-6 py-10 print:px-0 print:py-0 print:max-w-none prose prose-sm sm:prose-base print:prose-sm dark:prose-invert">
        
        {/* PORTADA */}
        <div className="text-center mb-12 print:mb-8 border-b-4 border-primary pb-8">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img src={diaLogo} alt="DIA 2026" className="h-24 w-24 object-contain print:h-20 print:w-20" />
            <img src={dgpLogo} alt="DGP UGEL Chiclayo" className="h-24 w-24 object-contain rounded-full print:h-20 print:w-20" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">UGEL CHICLAYO – DIRECCIÓN DE GESTIÓN PEDAGÓGICA</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-4 not-prose">
            GUÍA PARA EL USO CORRECTO DE LA APLICACIÓN TECNOLÓGICA DE DIAGNÓSTICO INTEGRAL DE APRENDIZAJES
          </h1>
          <h2 className="text-xl font-bold text-primary not-prose">DIA 2026</h2>
          <p className="text-sm text-muted-foreground mt-4">Versión 1.0 – Marzo 2026</p>
          <p className="text-xs text-muted-foreground mt-1">Documento de uso interno – Protección de datos según Ley N.° 29733</p>
        </div>

        {/* ÍNDICE */}
        <section className="mb-10 print:mb-6 bg-muted/50 rounded-lg p-6 print:bg-transparent print:border print:border-border">
          <h2 className="text-lg font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 print:hidden" /> ÍNDICE DE CONTENIDOS</h2>
          <ol className="list-decimal ml-6 space-y-1 text-sm">
            <li><a href="#introduccion" className="text-primary hover:underline">Introducción y Objetivos</a></li>
            <li><a href="#requisitos" className="text-primary hover:underline">Requisitos Técnicos</a></li>
            <li><a href="#acceso" className="text-primary hover:underline">Acceso a la Plataforma</a></li>
            <li><a href="#roles" className="text-primary hover:underline">Roles y Permisos del Sistema</a></li>
            <li><a href="#admin" className="text-primary hover:underline">Módulo del Administrador</a></li>
            <li><a href="#director" className="text-primary hover:underline">Módulo del Director / Subdirector</a></li>
            <li><a href="#docente" className="text-primary hover:underline">Módulo del Docente</a></li>
            <li><a href="#estudiante" className="text-primary hover:underline">Módulo del Estudiante</a></li>
            <li><a href="#especialista" className="text-primary hover:underline">Módulo del Especialista UGEL</a></li>
            <li><a href="#padre" className="text-primary hover:underline">Módulo del Padre de Familia</a></li>
            <li><a href="#perfil" className="text-primary hover:underline">Mi Perfil</a></li>
            <li><a href="#seguridad" className="text-primary hover:underline">Seguridad y Protección de Datos</a></li>
            <li><a href="#problemas" className="text-primary hover:underline">Solución de Problemas Frecuentes</a></li>
            <li><a href="#soporte" className="text-primary hover:underline">Soporte Técnico y Contacto</a></li>
          </ol>
        </section>

        {/* 1. INTRODUCCIÓN */}
        <section id="introduccion" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2">1. INTRODUCCIÓN Y OBJETIVOS</h2>
          <p>
            La plataforma <strong>Diagnóstico Integral de Aprendizajes (DIA) 2026</strong> es una herramienta tecnológica desarrollada por la <strong>Dirección de Gestión Pedagógica (DGP)</strong> de la <strong>UGEL Chiclayo</strong> para medir, registrar y analizar los niveles de aprendizaje de los estudiantes de la provincia de Chiclayo en las áreas de <strong>Matemática, Lectura y Socioemocional</strong>.
          </p>
          <h3 className="font-semibold mt-4">Objetivos de la plataforma:</h3>
          <ul>
            <li>Aplicar evaluaciones diagnósticas estandarizadas a todos los niveles educativos (Inicial, Primaria y Secundaria).</li>
            <li>Registrar y digitalizar las respuestas de los estudiantes de manera eficiente.</li>
            <li>Generar reportes automáticos de niveles de logro por estudiante, aula, grado e institución.</li>
            <li>Facilitar la toma de decisiones pedagógicas basadas en evidencia.</li>
            <li>Garantizar la confidencialidad de los datos conforme a la Ley N.° 29733.</li>
          </ul>

          <h3 className="font-semibold mt-4">Áreas evaluadas:</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse not-prose">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border border-border px-3 py-2 text-left">Área</th>
                  <th className="border border-border px-3 py-2 text-left">Descripción</th>
                  <th className="border border-border px-3 py-2 text-left">Niveles aplicados</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-border px-3 py-2 font-medium">Matemática</td><td className="border border-border px-3 py-2">Resolución de problemas, operaciones, razonamiento lógico</td><td className="border border-border px-3 py-2">Inicial, Primaria, Secundaria</td></tr>
                <tr className="bg-muted/30"><td className="border border-border px-3 py-2 font-medium">Lectura</td><td className="border border-border px-3 py-2">Comprensión lectora, inferencia, vocabulario</td><td className="border border-border px-3 py-2">Inicial, Primaria, Secundaria</td></tr>
                <tr><td className="border border-border px-3 py-2 font-medium">Socioemocional</td><td className="border border-border px-3 py-2">Autoconocimiento, empatía, regulación emocional</td><td className="border border-border px-3 py-2">Inicial, Primaria, Secundaria</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold mt-4">Niveles de logro:</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse not-prose">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border border-border px-3 py-2 text-left">Nivel</th>
                  <th className="border border-border px-3 py-2 text-left">Descripción</th>
                  <th className="border border-border px-3 py-2 text-center">Rango referencial</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-border px-3 py-2 font-medium text-destructive">En Inicio</td><td className="border border-border px-3 py-2">El estudiante muestra un progreso mínimo en los aprendizajes evaluados</td><td className="border border-border px-3 py-2 text-center">0 – 10</td></tr>
                <tr className="bg-muted/30"><td className="border border-border px-3 py-2 font-medium text-yellow-600">En Proceso</td><td className="border border-border px-3 py-2">El estudiante está próximo a lograr los aprendizajes esperados</td><td className="border border-border px-3 py-2 text-center">11 – 13</td></tr>
                <tr><td className="border border-border px-3 py-2 font-medium text-green-600">Logro Esperado</td><td className="border border-border px-3 py-2">El estudiante evidencia el nivel esperado de competencias</td><td className="border border-border px-3 py-2 text-center">14 – 17</td></tr>
                <tr className="bg-muted/30"><td className="border border-border px-3 py-2 font-medium text-primary">Logro Destacado</td><td className="border border-border px-3 py-2">El estudiante supera el nivel esperado con habilidades sobresalientes</td><td className="border border-border px-3 py-2 text-center">18 – 20</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. REQUISITOS */}
        <section id="requisitos" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2">2. REQUISITOS TÉCNICOS</h2>
          
          <h3 className="font-semibold mt-4">Dispositivos compatibles:</h3>
          <ul>
            <li>✅ Computadora de escritorio o laptop (Windows, Mac, Linux)</li>
            <li>✅ Tablet (Android, iPad)</li>
            <li>✅ Teléfono celular (Android, iPhone)</li>
          </ul>

          <h3 className="font-semibold mt-4">Navegadores recomendados:</h3>
          <ul>
            <li>Google Chrome (versión 90 o superior) – <strong>Recomendado</strong></li>
            <li>Mozilla Firefox (versión 88 o superior)</li>
            <li>Microsoft Edge (versión 90 o superior)</li>
            <li>Safari (versión 14 o superior, para dispositivos Apple)</li>
          </ul>

          <h3 className="font-semibold mt-4">Conexión a Internet:</h3>
          <ul>
            <li>Se requiere conexión a Internet para acceder a la plataforma.</li>
            <li>Velocidad mínima recomendada: 1 Mbps.</li>
            <li>La plataforma está optimizada para funcionar con conexiones lentas (zonas rurales).</li>
          </ul>

          <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-r-lg mt-4">
            <p className="font-semibold text-sm">💡 Consejo:</p>
            <p className="text-sm">La plataforma es una <strong>Aplicación Web Progresiva (PWA)</strong>. Puede instalarse en el dispositivo desde el navegador para un acceso más rápido, similar a una aplicación nativa.</p>
          </div>
        </section>

        {/* 3. ACCESO */}
        <section id="acceso" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2">3. ACCESO A LA PLATAFORMA</h2>
          
          <h3 className="font-semibold mt-4">URL de acceso:</h3>
          <div className="bg-muted p-4 rounded-lg text-center">
            <code className="text-lg font-bold text-primary">https://dia2026-dgpugelchiclayo.lovable.app</code>
          </div>

          <h3 className="font-semibold mt-4">Credenciales de acceso:</h3>
          <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-r-lg">
            <p className="text-sm"><strong>Usuario:</strong> Su número de DNI (8 dígitos)</p>
            <p className="text-sm"><strong>Contraseña:</strong> Su número de DNI (8 dígitos)</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Las cuentas son creadas únicamente por el <strong>administrador de la UGEL</strong> o por el <strong>director de cada institución</strong>. No existe opción de autoregistro.
          </p>

          <h3 className="font-semibold mt-4">Pasos para ingresar:</h3>
          <ol>
            <li>Abra su navegador web e ingrese a la URL indicada.</li>
            <li>En la pantalla de inicio de sesión, escriba su <strong>DNI de 8 dígitos</strong> en el campo "DNI o Correo electrónico".</li>
            <li>Escriba su <strong>DNI</strong> nuevamente en el campo "Contraseña".</li>
            <li>Presione el botón <strong>"Ingresar"</strong>.</li>
            <li>El sistema lo redirigirá automáticamente al panel correspondiente según su rol asignado.</li>
          </ol>

          <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg mt-4">
            <p className="font-semibold text-sm">⚠️ Importante:</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>Si no puede ingresar, contacte al administrador de la plataforma para verificar que su cuenta haya sido creada.</li>
              <li>No comparta sus credenciales con otras personas.</li>
              <li>Se recomienda cambiar la contraseña en la primera sesión (función disponible en "Mi Perfil").</li>
            </ul>
          </div>
        </section>

        {/* 4. ROLES */}
        <section id="roles" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 print:hidden" /> 4. ROLES Y PERMISOS DEL SISTEMA
          </h2>
          <p>La plataforma maneja un sistema de roles jerárquico. Cada usuario tiene un rol que determina las funciones y módulos a los que puede acceder:</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse not-prose mt-4">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border border-border px-3 py-2 text-left">Rol</th>
                  <th className="border border-border px-3 py-2 text-left">Descripción</th>
                  <th className="border border-border px-3 py-2 text-left">Funciones principales</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-3 py-2 font-medium">Administrador</td>
                  <td className="border border-border px-3 py-2">Personal de la UGEL Chiclayo (DGP)</td>
                  <td className="border border-border px-3 py-2">Gestión total: usuarios, instituciones, reportes globales</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border border-border px-3 py-2 font-medium">Director</td>
                  <td className="border border-border px-3 py-2">Director de la institución educativa</td>
                  <td className="border border-border px-3 py-2">Configurar IE, registrar niveles/grados, personal, ver resultados</td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2 font-medium">Subdirector</td>
                  <td className="border border-border px-3 py-2">Subdirector de la institución educativa</td>
                  <td className="border border-border px-3 py-2">Mismas funciones que el Director</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border border-border px-3 py-2 font-medium">Docente</td>
                  <td className="border border-border px-3 py-2">Profesor de aula</td>
                  <td className="border border-border px-3 py-2">Registrar estudiantes, digitar respuestas, ver resultados de aula</td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2 font-medium">Estudiante</td>
                  <td className="border border-border px-3 py-2">Alumno evaluado</td>
                  <td className="border border-border px-3 py-2">Rendir evaluaciones en línea, ver sus resultados</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border border-border px-3 py-2 font-medium">Especialista</td>
                  <td className="border border-border px-3 py-2">Especialista pedagógico de la UGEL</td>
                  <td className="border border-border px-3 py-2">Consultar reportes y estadísticas generales</td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2 font-medium">Padre</td>
                  <td className="border border-border px-3 py-2">Padre/madre de familia</td>
                  <td className="border border-border px-3 py-2">Ver resultados de sus hijos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. MÓDULO ADMINISTRADOR */}
        <section id="admin" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2 flex items-center gap-2">
            <Users className="h-5 w-5 print:hidden" /> 5. MÓDULO DEL ADMINISTRADOR
          </h2>
          <p>El administrador es el usuario con el mayor nivel de acceso en la plataforma. Es responsable de la configuración inicial y la gestión global del sistema.</p>

          <h3 className="font-semibold mt-4">5.1. Dashboard del Administrador</h3>
          <p>Al ingresar, el administrador visualiza un panel con estadísticas generales:</p>
          <ul>
            <li>Total de instituciones registradas</li>
            <li>Total de usuarios en el sistema</li>
            <li>Total de evaluaciones aplicadas</li>
            <li>Porcentaje de avance general</li>
          </ul>

          <h3 className="font-semibold mt-4">5.2. Gestión de Usuarios</h3>
          <p>Ruta: <code>Panel lateral → Usuarios</code></p>
          <p>Desde este módulo se pueden realizar las siguientes acciones:</p>

          <h4 className="font-semibold mt-3">a) Crear usuario individual:</h4>
          <ol>
            <li>Presione el botón <strong>"+ Nuevo Usuario"</strong>.</li>
            <li>Complete los campos: <strong>DNI</strong> (8 dígitos), <strong>Nombre Completo</strong> y seleccione el <strong>Rol</strong>.</li>
            <li>Si el rol es Director o Docente, seleccione la <strong>Institución Educativa</strong>.</li>
            <li>Presione <strong>"Crear Usuario"</strong>.</li>
            <li>El sistema creará la cuenta automáticamente con DNI como usuario y contraseña.</li>
          </ol>

          <h4 className="font-semibold mt-3">b) Carga masiva de usuarios (CSV):</h4>
          <ol>
            <li>Presione el botón <strong>"📤 Carga Masiva"</strong>.</li>
            <li>Descargue la plantilla CSV proporcionada.</li>
            <li>Complete la plantilla con los datos: <code>dni, nombre_completo, rol, codigo_modular</code>.</li>
            <li>Suba el archivo CSV completado.</li>
            <li>Revise la vista previa y confirme la importación.</li>
          </ol>

          <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-r-lg mt-3">
            <p className="font-semibold text-sm">📋 Formato del archivo CSV:</p>
            <code className="text-xs block mt-1 bg-muted p-2 rounded">
              dni,nombre_completo,rol,codigo_modular<br/>
              12345678,GARCÍA LÓPEZ JUAN CARLOS,director,0123456<br/>
              87654321,PÉREZ MENDOZA ANA MARÍA,docente,0123456
            </code>
          </div>

          <h4 className="font-semibold mt-3">c) Gestionar usuarios existentes:</h4>
          <ul>
            <li><strong>Buscar:</strong> Use el campo de búsqueda para filtrar por nombre o DNI.</li>
            <li><strong>Filtrar por rol:</strong> Seleccione un rol del menú desplegable.</li>
            <li><strong>Resetear contraseña:</strong> Presione el botón de opciones (⋮) y seleccione "Resetear contraseña". La contraseña se restablecerá al DNI del usuario.</li>
            <li><strong>Cambiar rol:</strong> Presione editar y seleccione el nuevo rol.</li>
          </ul>

          <h3 className="font-semibold mt-4">5.3. Gestión de Instituciones Educativas</h3>
          <p>Ruta: <code>Panel lateral → Instituciones</code></p>
          <ol>
            <li>Visualice el listado completo de instituciones registradas.</li>
            <li>Use el buscador para filtrar por nombre, código modular o distrito.</li>
            <li>Las instituciones pueden ser cargadas masivamente mediante archivo CSV.</li>
          </ol>

          <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-r-lg mt-3">
            <p className="font-semibold text-sm">📋 Formato del CSV de instituciones:</p>
            <code className="text-xs block mt-1 bg-muted p-2 rounded">
              nombre,codigo_modular,codigo_local,provincia,distrito,centro_poblado,direccion,tipo_gestion<br/>
              I.E. SAN JOSÉ,0123456,012345,CHICLAYO,CHICLAYO,,AV. BALTA 123,Pública
            </code>
          </div>
        </section>

        {/* 6. MÓDULO DIRECTOR */}
        <section id="director" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2 flex items-center gap-2">
            <School className="h-5 w-5 print:hidden" /> 6. MÓDULO DEL DIRECTOR / SUBDIRECTOR
          </h2>
          <p>El director gestiona su institución educativa: configura niveles, grados, secciones, registra personal y supervisa resultados.</p>

          <h3 className="font-semibold mt-4">6.1. Dashboard del Director</h3>
          <p>Panel de inicio con estadísticas de la institución:</p>
          <ul>
            <li>Total de docentes registrados</li>
            <li>Total de estudiantes</li>
            <li>Evaluaciones completadas</li>
            <li>Porcentaje de avance por área</li>
          </ul>

          <h3 className="font-semibold mt-4">6.2. Configuración de la Institución</h3>
          <p>Ruta: <code>Panel lateral → Institución</code></p>
          <p>Permite verificar y actualizar los datos de la institución educativa:</p>
          <ul>
            <li>Nombre de la institución</li>
            <li>Código de Local</li>
            <li>Provincia, Distrito, Centro Poblado</li>
            <li>Dirección</li>
            <li>Tipo de Gestión (Pública / Privada)</li>
          </ul>

          <h3 className="font-semibold mt-4">6.3. Niveles y Grados</h3>
          <p>Ruta: <code>Panel lateral → Niveles y Grados</code></p>
          <ol>
            <li>Seleccione el <strong>Nivel</strong> educativo (Inicial, Primaria, Secundaria).</li>
            <li>Seleccione el <strong>Grado</strong> correspondiente.</li>
            <li>Agregue las <strong>Secciones</strong>:
              <ul>
                <li><strong>Inicial:</strong> Las secciones son de texto libre (ej: "Ositos", "Estrellitas").</li>
                <li><strong>Primaria y Secundaria:</strong> Seleccione secciones estandarizadas (A, B, C, D, etc.).</li>
              </ul>
            </li>
            <li>Presione <strong>"Guardar"</strong> para registrar.</li>
          </ol>
          <p>La estructura queda organizada jerárquicamente: <strong>Nivel → Grado → Secciones</strong>.</p>

          <h3 className="font-semibold mt-4">6.4. Registro de Personal</h3>
          <p>Ruta: <code>Panel lateral → Personal</code></p>
          <p>Desde aquí el director registra a los docentes y subdirectores de su institución.</p>
          
          <h4 className="font-semibold mt-3">a) Registro individual:</h4>
          <ol>
            <li>Presione <strong>"+ Agregar Personal"</strong>.</li>
            <li>Ingrese el <strong>DNI</strong>, <strong>Nombre Completo</strong> y seleccione el <strong>Cargo</strong> (Docente o Subdirector).</li>
            <li>Para Docentes, asigne el <strong>Grado y Sección</strong> donde enseña.</li>
            <li>Presione <strong>"Registrar"</strong>.</li>
          </ol>

          <h4 className="font-semibold mt-3">b) Carga masiva de personal (CSV):</h4>
          <ol>
            <li>Presione <strong>"📤 Carga Masiva"</strong>.</li>
            <li>Descargue y complete la plantilla CSV con: <code>dni, nombre_completo, cargo</code>.</li>
            <li>Suba el archivo y confirme la importación.</li>
          </ol>

          <h3 className="font-semibold mt-4">6.5. Resultados de la Institución</h3>
          <p>Ruta: <code>Panel lateral → Resultados</code></p>
          <ul>
            <li>Visualice los resultados consolidados de toda la institución.</li>
            <li>Filtre por nivel, grado, sección o área evaluada.</li>
            <li>Consulte gráficos de distribución de niveles de logro.</li>
          </ul>
        </section>

        {/* 7. MÓDULO DOCENTE */}
        <section id="docente" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 print:hidden" /> 7. MÓDULO DEL DOCENTE
          </h2>
          <p>El docente es responsable del registro de estudiantes, la digitación de respuestas y la consulta de resultados de su aula.</p>

          <h3 className="font-semibold mt-4">7.1. Dashboard del Docente</h3>
          <p>Panel con estadísticas del aula asignada: total de estudiantes, evaluaciones pendientes y completadas.</p>

          <h3 className="font-semibold mt-4">7.2. Registro de Estudiantes</h3>
          <p>Ruta: <code>Panel lateral → Estudiantes</code></p>
          <ol>
            <li>Presione <strong>"+ Agregar Estudiante"</strong>.</li>
            <li>Ingrese el <strong>DNI</strong> y <strong>Nombre Completo</strong> del estudiante.</li>
            <li>El estudiante queda automáticamente vinculado al grado y sección del docente.</li>
            <li>Presione <strong>"Registrar"</strong>.</li>
          </ol>

          <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-r-lg mt-3">
            <p className="font-semibold text-sm">💡 Nota:</p>
            <p className="text-sm">Al registrar un estudiante, el sistema crea automáticamente su cuenta de acceso con su DNI como usuario y contraseña, permitiéndole rendir evaluaciones en línea si fuera necesario.</p>
          </div>

          <h3 className="font-semibold mt-4">7.3. Digitación de Respuestas</h3>
          <p>Ruta: <code>Panel lateral → Digitación</code></p>
          <p>Este módulo permite al docente ingresar las respuestas de los estudiantes cuando las evaluaciones se aplican en formato impreso:</p>
          <ol>
            <li>Seleccione el <strong>Área</strong> de evaluación (Matemática, Lectura, Socioemocional).</li>
            <li>Se mostrará la lista de estudiantes del aula.</li>
            <li>Para cada estudiante, ingrese la <strong>alternativa seleccionada</strong> (A, B, C o D) para cada pregunta.</li>
            <li>El sistema calcula automáticamente el <strong>puntaje total</strong> y el <strong>nivel de logro</strong>.</li>
            <li>Presione <strong>"Guardar"</strong> para registrar las respuestas.</li>
          </ol>

          <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg mt-3">
            <p className="font-semibold text-sm">⚠️ Importante:</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>Verifique cuidadosamente las respuestas antes de guardar.</li>
              <li>Una vez guardadas, las respuestas pueden ser editadas pero queda registro del cambio.</li>
              <li>Complete la digitación de TODOS los estudiantes antes de la fecha límite establecida.</li>
            </ul>
          </div>

          <h3 className="font-semibold mt-4">7.4. Resultados del Aula</h3>
          <p>Ruta: <code>Panel lateral → Resultados</code></p>
          <ul>
            <li>Consulte los resultados individuales de cada estudiante.</li>
            <li>Visualice la tabla con nombre, puntaje y nivel de logro.</li>
            <li>Los niveles se muestran con colores indicativos:
              <ul>
                <li><span className="text-destructive font-semibold">Rojo:</span> En Inicio</li>
                <li><span className="text-yellow-600 font-semibold">Amarillo:</span> En Proceso</li>
                <li><span className="text-green-600 font-semibold">Verde:</span> Logro Esperado</li>
                <li><span className="text-primary font-semibold">Azul:</span> Logro Destacado</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* 8. MÓDULO ESTUDIANTE */}
        <section id="estudiante" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 print:hidden" /> 8. MÓDULO DEL ESTUDIANTE
          </h2>
          <p>Los estudiantes pueden rendir evaluaciones directamente en la plataforma (cuando así lo indique el docente) y consultar sus resultados.</p>

          <h3 className="font-semibold mt-4">8.1. Rendir Evaluación en Línea</h3>
          <p>Ruta: <code>Panel lateral → Mis Pruebas</code></p>
          <ol>
            <li>Al ingresar, se muestra la evaluación disponible con una <strong>barra de progreso</strong>.</li>
            <li>Lea cuidadosamente cada pregunta.</li>
            <li>Presione el <strong>botón de audio 🔊</strong> si desea escuchar la pregunta en voz alta (útil para estudiantes de Inicial y 1.er Grado).</li>
            <li>Seleccione la respuesta tocando/haciendo clic en la <strong>opción deseada</strong> (A, B, C o D).</li>
            <li>La opción seleccionada se resaltará en <strong>azul</strong>.</li>
            <li>Use los botones <strong>"Anterior"</strong> y <strong>"Siguiente"</strong> para navegar entre preguntas.</li>
            <li>Puede cambiar sus respuestas en cualquier momento antes de finalizar.</li>
            <li>Al llegar a la última pregunta, presione <strong>"✅ Finalizar"</strong> para enviar sus respuestas.</li>
          </ol>

          <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-r-lg mt-3">
            <p className="font-semibold text-sm">💡 Para estudiantes pequeños (Inicial / 1.er Grado):</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>Los botones son grandes y fáciles de tocar en tablets.</li>
              <li>El botón de audio 🔊 lee la pregunta en español peruano.</li>
              <li>Se recomienda que un adulto acompañe al estudiante durante la evaluación.</li>
            </ul>
          </div>

          <h3 className="font-semibold mt-4">8.2. Mis Resultados</h3>
          <p>Ruta: <code>Panel lateral → Resultados</code></p>
          <ul>
            <li>El estudiante visualiza su <strong>Boleta de Resultados</strong> con el puntaje y nivel de logro en cada área.</li>
            <li>Cada área incluye una <strong>recomendación pedagógica personalizada</strong> según el nivel alcanzado.</li>
          </ul>
        </section>

        {/* 9. MÓDULO ESPECIALISTA */}
        <section id="especialista" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 print:hidden" /> 9. MÓDULO DEL ESPECIALISTA UGEL
          </h2>
          <p>Los especialistas de la UGEL pueden acceder a reportes consolidados para el análisis pedagógico a nivel de la provincia.</p>

          <h3 className="font-semibold mt-4">Funciones disponibles:</h3>
          <ul>
            <li><strong>Dashboard:</strong> Estadísticas globales de la evaluación diagnóstica.</li>
            <li><strong>Reportes:</strong> Filtros por institución, nivel, grado, área y distrito.</li>
            <li>Gráficos de distribución de niveles de logro.</li>
            <li>Comparativas entre instituciones y distritos.</li>
          </ul>
        </section>

        {/* 10. MÓDULO PADRE */}
        <section id="padre" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2">10. MÓDULO DEL PADRE DE FAMILIA</h2>
          <p>Los padres de familia pueden consultar los resultados de sus hijos accediendo con las credenciales proporcionadas por la institución educativa.</p>

          <h3 className="font-semibold mt-4">Funciones disponibles:</h3>
          <ul>
            <li>Ver la boleta de resultados del estudiante.</li>
            <li>Consultar las recomendaciones pedagógicas para apoyar el aprendizaje en casa.</li>
          </ul>
        </section>

        {/* 11. MI PERFIL */}
        <section id="perfil" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2 flex items-center gap-2">
            <UserCog className="h-5 w-5 print:hidden" /> 11. MI PERFIL
          </h2>
          <p>Todos los usuarios pueden acceder a la sección "Mi Perfil" desde el panel lateral para:</p>
          <ul>
            <li>Ver sus datos personales (nombre, DNI, rol).</li>
            <li>Ver la institución educativa a la que están vinculados.</li>
            <li>Consultar el grado y sección asignado (para docentes y estudiantes).</li>
          </ul>
        </section>

        {/* 12. SEGURIDAD */}
        <section id="seguridad" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 print:hidden" /> 12. SEGURIDAD Y PROTECCIÓN DE DATOS
          </h2>
          <p>La plataforma DIA 2026 cumple con los estándares de protección de datos personales establecidos en la <strong>Ley N.° 29733 – Ley de Protección de Datos Personales</strong> del Perú.</p>

          <h3 className="font-semibold mt-4">Medidas implementadas:</h3>
          <ul>
            <li><strong>Autenticación segura:</strong> Cada usuario accede con credenciales únicas.</li>
            <li><strong>Control de acceso por roles:</strong> Cada usuario solo ve la información que le corresponde.</li>
            <li><strong>Encriptación:</strong> Las contraseñas se almacenan de forma encriptada.</li>
            <li><strong>Sesiones seguras:</strong> Las sesiones expiran automáticamente tras un periodo de inactividad.</li>
            <li><strong>Registro de actividad:</strong> Se mantiene un log de las acciones realizadas en el sistema.</li>
          </ul>

          <h3 className="font-semibold mt-4">Responsabilidades del usuario:</h3>
          <ul>
            <li>No compartir sus credenciales con terceros.</li>
            <li>Cerrar sesión al terminar de usar la plataforma, especialmente en dispositivos compartidos.</li>
            <li>No capturar pantallas con datos personales de estudiantes para compartir en redes sociales.</li>
            <li>Reportar inmediatamente cualquier acceso no autorizado.</li>
          </ul>
        </section>

        {/* 13. PROBLEMAS FRECUENTES */}
        <section id="problemas" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2">13. SOLUCIÓN DE PROBLEMAS FRECUENTES</h2>
          
          <div className="space-y-4 mt-4">
            <div className="border border-border rounded-lg p-4">
              <h4 className="font-semibold">❌ "Credenciales incorrectas"</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>Verifique que está ingresando su DNI completo (8 dígitos) tanto como usuario y contraseña.</li>
                <li>Asegúrese de no tener espacios en blanco antes o después del DNI.</li>
                <li>Si el problema persiste, solicite al administrador que resetee su contraseña.</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h4 className="font-semibold">❌ "Sesión expirada"</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>Su sesión ha expirado por inactividad.</li>
                <li>Presione "Cerrar Sesión" y vuelva a ingresar con sus credenciales.</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h4 className="font-semibold">❌ No veo mi institución / No puedo registrar personal</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>Verifique que el administrador haya vinculado su cuenta a una institución educativa.</li>
                <li>Contacte al administrador de la UGEL para que revise su asignación.</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h4 className="font-semibold">❌ La página carga lentamente</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>Verifique su conexión a Internet.</li>
                <li>Intente con el navegador Google Chrome actualizado.</li>
                <li>Cierre otras pestañas o aplicaciones que consuman ancho de banda.</li>
                <li>Si usa un teléfono, instale la app PWA para mejor rendimiento.</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h4 className="font-semibold">❌ No se guardan los datos / Error al guardar</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>Verifique su conexión a Internet.</li>
                <li>No cierre la ventana mientras el sistema esté guardando (indicador de carga visible).</li>
                <li>Si el error persiste, recargue la página (F5) e intente nuevamente.</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h4 className="font-semibold">❌ El audio no funciona en la evaluación del estudiante</h4>
              <ul className="text-sm mt-2 space-y-1">
                <li>Verifique que el volumen del dispositivo esté activado.</li>
                <li>La función de audio requiere un navegador moderno (Chrome, Firefox, Edge).</li>
                <li>En algunos dispositivos, es necesario interactuar con la página antes de que el audio funcione.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 14. SOPORTE */}
        <section id="soporte" className="mb-10">
          <h2 className="text-xl font-bold border-b-2 border-primary pb-2">14. SOPORTE TÉCNICO Y CONTACTO</h2>
          
          <div className="bg-muted/50 rounded-lg p-6 mt-4">
            <h3 className="font-semibold">Dirección de Gestión Pedagógica – UGEL Chiclayo</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p><strong>Equipo de Soporte Técnico DIA 2026</strong></p>
              <p>📧 Correo: dgp@ugelchiclayo.gob.pe</p>
              <p>📞 Teléfono: (074) 123456</p>
              <p>🏢 Dirección: UGEL Chiclayo, Av. José Leonardo Ortiz, Chiclayo – Lambayeque</p>
              <p>🕐 Horario de atención: Lunes a viernes, 8:00 a.m. – 5:00 p.m.</p>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-6 mt-4">
            <h3 className="font-semibold">Protocolo de soporte:</h3>
            <ol className="text-sm mt-2">
              <li><strong>Nivel 1:</strong> Docente o Director consulta con el responsable de TI de su institución.</li>
              <li><strong>Nivel 2:</strong> Director o responsable TI contacta al equipo DGP de la UGEL.</li>
              <li><strong>Nivel 3:</strong> El equipo DGP escala al equipo de desarrollo si el problema es técnico.</li>
            </ol>
          </div>
        </section>

        {/* PIE DE PÁGINA */}
        <footer className="border-t-4 border-primary pt-6 mt-12 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={diaLogo} alt="DIA 2026" className="h-12 w-12 object-contain" />
            <img src={dgpLogo} alt="DGP UGEL Chiclayo" className="h-12 w-12 object-contain rounded-full" />
          </div>
          <p className="font-semibold text-foreground">UGEL CHICLAYO – DIRECCIÓN DE GESTIÓN PEDAGÓGICA</p>
          <p>Diagnóstico Integral de Aprendizajes – DIA 2026</p>
          <p className="mt-2">Documento elaborado para uso interno institucional.</p>
          <p>© 2026 – Todos los derechos reservados.</p>
        </footer>
      </article>
    </div>
  );
};

export default GuiaUsuario;
