import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, BookOpen, Shield, Users, School, GraduationCap, UserCog, FileSpreadsheet, BarChart3, ClipboardList, Monitor, Smartphone, Globe, KeyRound, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Download, Eye, HelpCircle, Phone, Mail, MapPin, Clock, Star, Layers, Settings, UserPlus, FileText, PenTool, Award, BookOpenCheck, Headphones, Lock, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import diaLogo from '@/assets/dia_ugel_cix_2026.png';
import dgpLogo from '@/assets/logo_gred_lambayeque.jpg';
import screenLogin from '@/assets/tutorial/screen-login.jpg';
import screenDirector from '@/assets/tutorial/screen-director.jpg';
import screenDocente from '@/assets/tutorial/screen-docente.jpg';
import screenDigitacion from '@/assets/tutorial/screen-digitacion.jpg';
import screenResultados from '@/assets/tutorial/screen-resultados.jpg';

/* ──────────── Reusable sub-components ──────────── */

const SectionTitle = ({ id, icon: Icon, number, title }: { id: string; icon: any; number: string; title: string }) => (
  <h2 id={id} className="text-xl sm:text-2xl font-extrabold flex items-center gap-3 mt-12 mb-6 pb-3 border-b-4 border-secondary print:mt-8">
    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-black print:bg-transparent print:border print:border-primary print:text-primary shrink-0">{number}</span>
    <Icon className="h-6 w-6 text-secondary print:hidden shrink-0" />
    <span>{title}</span>
  </h2>
);

const Tip = ({ emoji = '💡', title, children }: { emoji?: string; title: string; children: React.ReactNode }) => (
  <div className="bg-accent/10 border-l-4 border-accent rounded-r-xl p-4 my-4">
    <p className="font-bold text-sm flex items-center gap-2">{emoji} {title}</p>
    <div className="text-sm mt-1">{children}</div>
  </div>
);

const Warning = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-destructive/10 border-l-4 border-destructive rounded-r-xl p-4 my-4">
    <p className="font-bold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> ¡Importante!</p>
    <div className="text-sm mt-1">{children}</div>
  </div>
);

const StepCard = ({ step, title, description }: { step: number; title: string; description: string }) => (
  <div className="flex gap-4 items-start">
    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary text-secondary-foreground font-black text-sm shrink-0 shadow">{step}</span>
    <div>
      <p className="font-bold text-sm">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const FeatureBox = ({ icon: Icon, title, items, color = 'primary' }: { icon: any; title: string; items: string[]; color?: string }) => (
  <div className={`rounded-xl border-2 border-${color}/20 bg-${color}/5 p-5`}>
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`h-5 w-5 text-${color}`} />
      <h4 className="font-bold text-sm">{title}</h4>
    </div>
    <ul className="text-sm space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const RoleCard = ({ role, description, functions, color, icon: Icon }: { role: string; description: string; functions: string[]; color: string; icon: any }) => (
  <div className={`rounded-xl border-2 p-5 ${color}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h4 className="font-bold">{role}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <ul className="text-sm space-y-1">
      {functions.map((fn, i) => (
        <li key={i} className="flex items-start gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
          <span>{fn}</span>
        </li>
      ))}
    </ul>
  </div>
);

const TroubleshootCard = ({ problem, solutions }: { problem: string; solutions: string[] }) => (
  <div className="rounded-xl border-2 border-destructive/20 bg-destructive/5 p-5">
    <h4 className="font-bold text-sm flex items-center gap-2 text-destructive">
      <XCircle className="h-4 w-4" /> {problem}
    </h4>
    <ul className="text-sm mt-3 space-y-1.5">
      {solutions.map((s, i) => (
        <li key={i} className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  </div>
);

/* ──────────── Main Component ──────────── */

const GuiaUsuario = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir / Guardar PDF
        </Button>
      </div>

      <article className="max-w-4xl mx-auto px-6 py-10 print:px-0 print:py-0 print:max-w-none text-foreground text-sm sm:text-base leading-relaxed">

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  CARÁTULA IMPACTANTE                                       */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="relative min-h-[90vh] flex flex-col items-center justify-center text-center rounded-3xl overflow-hidden mb-8 print:min-h-0 print:rounded-none print:mb-4 gradient-primary text-primary-foreground p-8 sm:p-12">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 print:hidden" style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, hsl(38 92% 55% / 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, hsl(160 50% 40% / 0.3) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, hsl(220 65% 50% / 0.2) 0%, transparent 70%)`
          }} />
          <div className="absolute inset-0 print:hidden" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />

          <div className="relative z-10 space-y-6">
            {/* Logos */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
                <img src={diaLogo} alt="DIA 2026" className="h-24 sm:h-32 w-24 sm:w-32 object-contain" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
                <img src={dgpLogo} alt="GRED Lambayeque" className="h-24 sm:h-32 w-24 sm:w-32 object-contain rounded-xl" />
              </div>
            </div>

            {/* Subtitle */}
            <div className="inline-block px-6 py-2 rounded-full bg-secondary/90 text-secondary-foreground text-xs sm:text-sm font-bold tracking-wider uppercase shadow-lg">
              GRED Lambayeque – Plan Educativo Regional 2026
            </div>

            {/* Main title */}
            <h1 className="text-3xl sm:text-5xl font-black leading-tight max-w-3xl mx-auto drop-shadow-lg">
              MANUAL DE USO DE LA HERRAMIENTA TECNOLÓGICA
            </h1>

            <div className="space-y-2">
              <p className="text-xl sm:text-3xl font-extrabold text-secondary drop-shadow">
                Diagnóstico Integral de Aprendizajes
              </p>
              <p className="text-5xl sm:text-7xl font-black tracking-tight text-secondary drop-shadow-lg">
                DIA 2026
              </p>
            </div>

            {/* Version badge */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-sm">
                📅 Versión 1.0 – Marzo 2026
              </div>
              <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-sm">
                🔒 Uso interno institucional
              </div>
            </div>

            {/* Decorative bottom */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="h-1 w-12 rounded-full bg-secondary" />
              <Star className="h-4 w-4 text-secondary" />
              <div className="h-1 w-12 rounded-full bg-secondary" />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  CONTRACARÁTULA con logo                                   */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center justify-center text-center py-16 mb-8 print:py-8 print:mb-4 border-b-4 border-secondary/30">
          <div className="rounded-full bg-primary/5 p-6 mb-6 shadow-lg border-4 border-secondary/30">
            <img src={dgpLogo} alt="GRED Lambayeque" className="h-36 sm:h-44 w-36 sm:w-44 object-contain rounded-full" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary mb-2">Plan Educativo Regional 2026</h2>
          <p className="text-lg font-semibold text-muted-foreground mb-1">GRED Lambayeque</p>
          <p className="text-sm text-muted-foreground mb-6">Gerencia Regional de Educación – Región Lambayeque</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg text-center mt-4">
            <div className="bg-primary/5 rounded-xl p-4">
              <Award className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-xs font-bold text-primary">Calidad Educativa</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-4">
              <BarChart3 className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-xs font-bold text-primary">Gestión por Resultados</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-4">
              <GraduationCap className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-xs font-bold text-primary">Aprendizajes para Todos</p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  PRESENTACIÓN (3/4 de página)                              */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="mb-12 print:mb-6">
          <div className="bg-card rounded-3xl border-2 border-primary/10 p-8 sm:p-12 shadow-card min-h-[70vh] flex flex-col justify-between print:min-h-0 print:shadow-none">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-8 rounded-full bg-secondary" />
                <span className="text-sm font-bold text-secondary uppercase tracking-widest">Presentación</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary mb-6 leading-tight">
                Estimados Directores, Docentes y Comunidad Educativa de la Provincia de Chiclayo
              </h2>

              <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
                <p>
                  La <strong className="text-foreground">Coordinación General Regional</strong> de la GRED Lambayeque tiene el agrado de poner a disposición de toda la comunidad educativa el presente <strong className="text-foreground">Manual de Uso de la Herramienta Tecnológica DIA 2026</strong>, diseñado con el propósito de facilitar la comprensión y el correcto uso de esta plataforma digital que servirá como instrumento fundamental para el diagnóstico integral de los aprendizajes de nuestros estudiantes. de poner a disposición de toda la comunidad educativa el presente <strong className="text-foreground">Manual de Uso de la Herramienta Tecnológica DIA 2026</strong>, diseñado con el propósito de facilitar la comprensión y el correcto uso de esta plataforma digital que servirá como instrumento fundamental para el diagnóstico integral de los aprendizajes de nuestros estudiantes.
                </p>
                <p>
                  El <strong className="text-foreground">Diagnóstico Integral de Aprendizajes (DIA)</strong> es una estrategia que nos permite recoger información valiosa sobre el nivel de desarrollo de las competencias de los estudiantes en las áreas de <strong className="text-foreground">Matemática, Comunicación (Lectura) y el aspecto Socioemocional</strong>, abarcando los tres niveles educativos: <strong className="text-foreground">Inicial, Primaria y Secundaria</strong>.
                </p>
                <p>
                  Esta herramienta tecnológica ha sido desarrollada pensando en las necesidades reales de nuestras instituciones educativas, considerando la diversidad de contextos —urbanos y rurales— de la provincia de Chiclayo. Su diseño es intuitivo, accesible desde cualquier dispositivo con conexión a Internet, y permite a cada actor educativo cumplir su función de manera eficiente y organizada.
                </p>
                <p>
                  El presente manual describe paso a paso todas las funcionalidades disponibles según cada rol de usuario: <strong className="text-foreground">Administrador, Director, Subdirector, Docente, Docente PIP, Estudiante, Especialista y Padre de Familia</strong>. Incluye instrucciones detalladas, consejos prácticos, ejemplos visuales y una sección de solución de problemas frecuentes.
                </p>
                <p>
                  Confiamos en que esta herramienta contribuirá significativamente a la mejora de la gestión pedagógica en nuestra jurisdicción, permitiendo una toma de decisiones informada y oportuna, basada en evidencia, en beneficio del aprendizaje de los estudiantes.
                </p>
              </div>
            </div>

            {/* Firma del Director */}
            <div className="mt-10 pt-8 border-t-2 border-secondary/30">
              <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
                <div className="text-center sm:text-left">
                  <p className="text-xs text-muted-foreground mb-1">Atentamente,</p>
                  <p className="text-xl sm:text-2xl font-black text-primary tracking-tight">Carlos Alberto Yampufé Requejo</p>
                  <div className="mt-2 inline-block px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                    Director de Gestión Pedagógica
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 font-semibold">GRED Lambayeque</p>
                  <p className="text-xs text-muted-foreground">Marzo 2026</p>
                </div>
                <img src={dgpLogo} alt="DGP" className="h-20 w-20 object-contain rounded-full border-2 border-secondary/30 shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  ÍNDICE DE CONTENIDOS                                      */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="mb-12 print:mb-6 rounded-2xl border-2 border-primary/10 bg-card overflow-hidden shadow-card">
          <div className="gradient-primary text-primary-foreground p-6">
            <h2 className="text-xl font-extrabold flex items-center gap-3">
              <BookOpen className="h-6 w-6" /> ÍNDICE DE CONTENIDOS
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { n: '01', title: 'Introducción y Objetivos', id: 'introduccion', icon: Star },
                { n: '02', title: 'Requisitos Técnicos', id: 'requisitos', icon: Monitor },
                { n: '03', title: 'Acceso a la Plataforma', id: 'acceso', icon: KeyRound },
                { n: '04', title: 'Roles y Permisos', id: 'roles', icon: Shield },
                { n: '05', title: 'Módulo del Administrador', id: 'admin', icon: Settings },
                { n: '06', title: 'Módulo del Director / Subdirector', id: 'director', icon: School },
                { n: '07', title: 'Módulo del Docente', id: 'docente', icon: GraduationCap },
                { n: '08', title: 'Docente PIP', id: 'pip', icon: Star },
                { n: '09', title: 'Módulo del Estudiante', id: 'estudiante', icon: ClipboardList },
                { n: '10', title: 'Módulo del Especialista UGEL', id: 'especialista', icon: BarChart3 },
                { n: '11', title: 'Módulo del Padre de Familia', id: 'padre', icon: Users },
                { n: '12', title: 'Mi Perfil', id: 'perfil', icon: UserCog },
                { n: '13', title: 'Seguridad y Protección de Datos', id: 'seguridad', icon: Lock },
                { n: '14', title: 'Solución de Problemas', id: 'problemas', icon: HelpCircle },
                { n: '15', title: 'Soporte Técnico', id: 'soporte', icon: Phone },
              ].map(({ n, title, id, icon: Ic }) => (
                <a key={id} href={`#${id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors group">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10 text-secondary font-black text-xs group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">{n}</span>
                  <Ic className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors">{title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  1. INTRODUCCIÓN Y OBJETIVOS                               */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="introduccion" icon={Star} number="01" title="INTRODUCCIÓN Y OBJETIVOS" />

        <p>
          La plataforma <strong>Diagnóstico Integral de Aprendizajes (DIA) 2026</strong> es una herramienta tecnológica desarrollada por la <strong>Dirección de Gestión Pedagógica (DGP)</strong> La plataforma <strong>Diagnóstico Integral de Aprendizajes (DIA) 2026</strong> es una herramienta tecnológica desarrollada por la <strong>Coordinación General Regional</strong> de la <strong>GRED Lambayeque</strong> para medir, registrar y analizar los niveles de aprendizaje de los estudiantes de la Región Lambayeque.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <FeatureBox icon={ClipboardList} title="¿Qué hace la plataforma?" items={[
            'Aplica evaluaciones diagnósticas estandarizadas',
            'Registra y digitaliza respuestas de estudiantes',
            'Genera reportes automáticos de niveles de logro',
            'Facilita decisiones pedagógicas basadas en evidencia',
          ]} />
          <FeatureBox icon={Award} title="Áreas Evaluadas" color="secondary" items={[
            'Matemática: resolución de problemas',
            'Comunicación (Lectura): comprensión lectora',
            'Socioemocional: autoconocimiento, empatía, regulación',
          ]} />
        </div>

        <h3 className="font-bold text-lg mb-3 mt-6 flex items-center gap-2">
          <Layers className="h-5 w-5 text-secondary" /> Niveles de Logro
        </h3>
        <p className="mb-3">Los resultados se clasifican en 4 niveles, cada uno con un color identificador:</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="rounded-xl p-4 text-center border-2 border-destructive/30 bg-destructive/5">
            <div className="w-10 h-10 rounded-full bg-destructive/20 mx-auto mb-2 flex items-center justify-center text-lg font-black text-destructive">C</div>
            <p className="font-bold text-sm text-destructive">En Inicio</p>
            <p className="text-xs text-muted-foreground mt-1">0 – 10 pts</p>
            <p className="text-xs text-muted-foreground">Progreso mínimo</p>
          </div>
          <div className="rounded-xl p-4 text-center border-2 border-warning/30 bg-warning/5">
            <div className="w-10 h-10 rounded-full bg-warning/20 mx-auto mb-2 flex items-center justify-center text-lg font-black text-warning">B</div>
            <p className="font-bold text-sm text-warning">En Proceso</p>
            <p className="text-xs text-muted-foreground mt-1">11 – 14 pts</p>
            <p className="text-xs text-muted-foreground">Próximo al logro</p>
          </div>
          <div className="rounded-xl p-4 text-center border-2 border-accent/30 bg-accent/5">
            <div className="w-10 h-10 rounded-full bg-accent/20 mx-auto mb-2 flex items-center justify-center text-lg font-black text-accent">A</div>
            <p className="font-bold text-sm text-accent">Logro Esperado</p>
            <p className="text-xs text-muted-foreground mt-1">15 – 18 pts</p>
            <p className="text-xs text-muted-foreground">Nivel esperado</p>
          </div>
          <div className="rounded-xl p-4 text-center border-2 border-primary/30 bg-primary/5">
            <div className="w-10 h-10 rounded-full bg-primary/20 mx-auto mb-2 flex items-center justify-center text-sm font-black text-primary">AD</div>
            <p className="font-bold text-sm text-primary">Destacado</p>
            <p className="text-xs text-muted-foreground mt-1">19 – 20 pts</p>
            <p className="text-xs text-muted-foreground">Sobresaliente</p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  2. REQUISITOS TÉCNICOS                                    */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="requisitos" icon={Monitor} number="02" title="REQUISITOS TÉCNICOS" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="rounded-xl border-2 border-primary/10 bg-card p-5 text-center">
            <Monitor className="h-10 w-10 text-primary mx-auto mb-3" />
            <h4 className="font-bold text-sm mb-2">Computadora / Laptop</h4>
            <p className="text-xs text-muted-foreground">Windows, Mac o Linux con navegador web actualizado</p>
          </div>
          <div className="rounded-xl border-2 border-primary/10 bg-card p-5 text-center">
            <Smartphone className="h-10 w-10 text-secondary mx-auto mb-3" />
            <h4 className="font-bold text-sm mb-2">Tablet / Celular</h4>
            <p className="text-xs text-muted-foreground">Android o iOS. Diseño adaptable a cualquier tamaño de pantalla</p>
          </div>
          <div className="rounded-xl border-2 border-primary/10 bg-card p-5 text-center">
            <Globe className="h-10 w-10 text-accent mx-auto mb-3" />
            <h4 className="font-bold text-sm mb-2">Conexión a Internet</h4>
            <p className="text-xs text-muted-foreground">Mínimo 1 Mbps. Optimizada para zonas con señal limitada</p>
          </div>
        </div>

        <h3 className="font-bold text-sm mb-3">🌐 Navegadores recomendados:</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          {['Google Chrome (v90+) ⭐ Recomendado', 'Mozilla Firefox (v88+)', 'Microsoft Edge (v90+)', 'Safari (v14+)'].map(b => (
            <span key={b} className="px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 text-xs font-semibold">{b}</span>
          ))}
        </div>

        <Tip title="Instalación como App (PWA)">
          <p>La plataforma se puede instalar en su dispositivo como una aplicación. En Chrome, busque el ícono <strong>"Instalar"</strong> en la barra de direcciones. ¡Así tendrá acceso directo desde su pantalla de inicio!</p>
        </Tip>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  3. ACCESO A LA PLATAFORMA                                 */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="acceso" icon={KeyRound} number="03" title="ACCESO A LA PLATAFORMA" />

        <h3 className="font-bold text-sm mb-3">🔗 URL de acceso:</h3>
        <div className="bg-primary/5 rounded-xl p-5 text-center border-2 border-primary/10 mb-6">
          <code className="text-lg sm:text-xl font-black text-primary">https://dia2026ugelcix.lovable.app</code>
        </div>

        <h3 className="font-bold text-sm mb-3">🔐 Credenciales de acceso:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl bg-accent/5 border-2 border-accent/20 p-5 text-center">
            <UserCog className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="font-bold text-sm">Usuario</p>
            <p className="text-2xl font-black text-accent mt-1">Su DNI</p>
            <p className="text-xs text-muted-foreground mt-1">8 dígitos</p>
          </div>
          <div className="rounded-xl bg-secondary/5 border-2 border-secondary/20 p-5 text-center">
            <Lock className="h-8 w-8 text-secondary mx-auto mb-2" />
            <p className="font-bold text-sm">Contraseña</p>
            <p className="text-2xl font-black text-secondary mt-1">Su DNI</p>
            <p className="text-xs text-muted-foreground mt-1">8 dígitos (primera vez)</p>
          </div>
        </div>

        <h3 className="font-bold text-sm mb-4">📋 Pasos para ingresar:</h3>

        {/* Screenshot de Login */}
        <div className="my-6 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-card">
          <div className="bg-primary/10 px-4 py-2 text-xs font-bold text-primary flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Captura de pantalla – Pantalla de Inicio de Sesión
          </div>
          <img src={screenLogin} alt="Pantalla de login" className="w-full object-cover" />
        </div>

        <div className="space-y-4 pl-2">
          <StepCard step={1} title="Abra su navegador" description="Ingrese a la URL: dia2026ugelcix.lovable.app" />
          <StepCard step={2} title="Ingrese su DNI como usuario" description='Escriba los 8 dígitos de su DNI en el campo "DNI o Correo electrónico"' />
          <StepCard step={3} title="Ingrese su DNI como contraseña" description='Escriba nuevamente su DNI en el campo "Contraseña"' />
          <StepCard step={4} title="Acepte el aviso de privacidad" description="Marque la casilla de aceptación del tratamiento de datos personales (Ley N.° 29733)" />
          <StepCard step={5} title='Presione "Ingresar"' description="El sistema le redirigirá automáticamente al panel que corresponde a su rol" />
          <StepCard step={6} title="Cambie su contraseña" description="En su primera sesión, se recomienda cambiar la contraseña desde Mi Perfil" />
        </div>

        <Warning>
          <ul className="space-y-1.5">
            <li>Las cuentas son creadas por el <strong>Administrador de UGEL</strong> o el <strong>Director de su IE</strong>. No existe autoregistro.</li>
            <li>No comparta sus credenciales con otras personas.</li>
            <li>Si no puede ingresar, contacte al administrador para verificar su cuenta.</li>
          </ul>
        </Warning>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  4. ROLES Y PERMISOS                                       */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="roles" icon={Shield} number="04" title="ROLES Y PERMISOS DEL SISTEMA" />

        <p className="mb-6">La plataforma tiene un sistema de roles jerárquico. Cada usuario accede solo a las funciones correspondientes a su rol:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RoleCard icon={Settings} role="Administrador" description="Personal de GRED Lambayeque" color="border-primary/20 bg-primary/5"
            functions={['Gestión total del sistema', 'Crear/editar usuarios y roles', 'Registrar instituciones educativas', 'Acceso a reportes globales']} />
          <RoleCard icon={School} role="Director / Subdirector" description="Directivo de la institución educativa" color="border-secondary/20 bg-secondary/5"
            functions={['Configurar niveles, grados y secciones', 'Registrar personal docente', 'Ver resultados de toda la IE', 'Descargar evaluaciones de entrada']} />
          <RoleCard icon={GraduationCap} role="Docente" description="Profesor de aula" color="border-accent/20 bg-accent/5"
            functions={['Registrar estudiantes de su aula', 'Digitar respuestas de evaluaciones', 'Ver resultados de su aula', 'Descargar evaluaciones de su grado']} />
          <RoleCard icon={Star} role="Docente PIP" description="Profesor de Innovación Pedagógica" color="border-info/20 bg-info/5"
            functions={['Mismas funciones que un Director', 'Gestionar toda la institución', 'Registrar personal y estudiantes', 'Ver y analizar todos los resultados']} />
          <RoleCard icon={ClipboardList} role="Estudiante" description="Alumno evaluado" color="border-destructive/20 bg-destructive/5"
            functions={['Rendir evaluaciones en línea', 'Ver su boleta de resultados', 'Escuchar preguntas con audio']} />
          <RoleCard icon={BarChart3} role="Especialista UGEL" description="Especialista pedagógico" color="border-primary/20 bg-primary/5"
            functions={['Consultar reportes consolidados', 'Filtrar por IE, nivel, grado', 'Análisis comparativo entre IIEE']} />
          <RoleCard icon={Users} role="Padre de Familia" description="Padre/madre/apoderado" color="border-secondary/20 bg-secondary/5"
            functions={['Ver resultados de sus hijos', 'Consultar recomendaciones pedagógicas']} />
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  5. MÓDULO DEL ADMINISTRADOR                               */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="admin" icon={Settings} number="05" title="MÓDULO DEL ADMINISTRADOR" />

        <p>El administrador tiene el mayor nivel de acceso. Es responsable de la configuración inicial y la gestión global del sistema.</p>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-secondary" /> 5.1 Dashboard del Administrador
        </h3>
        <p>Al ingresar, se muestra un panel con estadísticas generales de toda la jurisdicción:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {['Instituciones registradas', 'Usuarios en el sistema', 'Evaluaciones aplicadas', 'Porcentaje de avance'].map((stat, i) => (
            <div key={i} className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
              <p className="text-xs font-bold text-primary">{stat}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-secondary" /> 5.2 Gestión de Usuarios
        </h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Usuarios</code></p>

        <div className="rounded-xl border-2 border-primary/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-accent" /> a) Crear usuario individual
          </h4>
          <div className="space-y-3 pl-2">
            <StepCard step={1} title='Presione "+ Nuevo Usuario"' description="Se abrirá un formulario de registro" />
            <StepCard step={2} title="Complete los datos" description="DNI (8 dígitos), Nombre Completo y Rol" />
            <StepCard step={3} title="Seleccione institución" description="Si el rol es Director o Docente, seleccione la Institución Educativa" />
            <StepCard step={4} title='Presione "Crear Usuario"' description="El sistema creará la cuenta con DNI como usuario y contraseña" />
          </div>
        </div>

        <div className="rounded-xl border-2 border-primary/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-accent" /> b) Carga masiva de usuarios (CSV)
          </h4>
          <div className="space-y-3 pl-2">
            <StepCard step={1} title='Presione "📤 Carga Masiva"' description="Se abrirá el módulo de importación" />
            <StepCard step={2} title="Descargue la plantilla" description="Obtenga el archivo CSV modelo con las columnas correctas" />
            <StepCard step={3} title="Complete la plantilla" description="Llene: dni, nombre_completo, rol, codigo_modular" />
            <StepCard step={4} title="Suba el archivo" description="Cargue el CSV, revise la vista previa y confirme" />
          </div>
          <Tip title="Formato del archivo CSV">
            <code className="text-xs block mt-1 bg-muted p-3 rounded-lg">
              dni,nombre_completo,rol,codigo_modular<br/>
              12345678,GARCÍA LÓPEZ JUAN CARLOS,director,0123456<br/>
              87654321,PÉREZ MENDOZA ANA MARÍA,docente,0123456
            </code>
          </Tip>
        </div>

        <div className="rounded-xl border-2 border-primary/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
            <UserCog className="h-4 w-4 text-accent" /> c) Gestionar usuarios existentes
          </h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Buscar:</strong> Use el campo de búsqueda para filtrar por nombre o DNI</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Filtrar por rol:</strong> Seleccione un rol del menú desplegable</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Resetear contraseña:</strong> Botón de opciones (⋮) → "Resetear contraseña" (se restablece al DNI)</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Cambiar rol:</strong> Presione editar y seleccione el nuevo rol</span></li>
          </ul>
        </div>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <School className="h-5 w-5 text-secondary" /> 5.3 Gestión de Instituciones Educativas
        </h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Instituciones</code></p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />Visualice el listado completo de IIEE registradas</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />Busque por nombre, código modular o distrito</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />Carga masiva mediante archivo CSV</li>
        </ul>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  6. MÓDULO DEL DIRECTOR / SUBDIRECTOR                      */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="director" icon={School} number="06" title="MÓDULO DEL DIRECTOR / SUBDIRECTOR" />

        <p>El director gestiona su institución educativa: configura niveles, grados, secciones, registra personal y supervisa resultados.</p>

        <p>El director gestiona su institución educativa: configura niveles, grados, secciones, registra personal y supervisa resultados. A continuación se describe cada paso que debe seguir.</p>

        {/* Screenshot del Dashboard Director */}
        <div className="my-6 rounded-2xl overflow-hidden border-2 border-secondary/20 shadow-card">
          <div className="bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Captura de pantalla – Dashboard del Director
          </div>
          <img src={screenDirector} alt="Dashboard del Director" className="w-full object-cover" />
        </div>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-secondary" /> 6.1 Dashboard del Director
        </h3>
        <p>Al ingresar, el Director visualiza un panel con estadísticas generales de su institución:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {['Total docentes', 'Total estudiantes', 'Evaluaciones completadas', 'Avance por área'].map((stat, i) => (
            <div key={i} className="rounded-xl bg-secondary/5 border border-secondary/10 p-4 text-center">
              <p className="text-xs font-bold text-secondary">{stat}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border-2 border-secondary/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3">📋 ¿Qué puede ver el Director en el Dashboard?</h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>Resumen de <strong>cantidad de docentes</strong> registrados en la IE</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>Resumen de <strong>cantidad de estudiantes</strong> por nivel y grado</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>Indicadores de <strong>evaluaciones completadas</strong> vs pendientes</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>Acceso rápido a <strong>descarga de evaluaciones de entrada</strong> (Primaria)</span></li>
          </ul>
        </div>

        <Tip emoji="📥" title="Descarga de Evaluaciones de Entrada (Primaria)">
          <p>Si su IE tiene nivel Primaria, en el Dashboard encontrará los <strong>cuadernillos de evaluación de entrada</strong> de Matemática y Comunicación para todos los grados (1° a 6°). Presione <strong>"Ver"</strong> para previsualizar o <strong>"Descargar"</strong> para guardar el PDF.</p>
        </Tip>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <Settings className="h-5 w-5 text-secondary" /> 6.2 Configuración de la Institución
        </h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Institución</code></p>
        <p className="mb-3">Permite verificar y actualizar los datos de la institución educativa.</p>
        <div className="space-y-3 pl-2 mb-4">
          <StepCard step={1} title="Ingrese al menú Institución" description="Desde el panel lateral izquierdo, presione 'Institución'" />
          <StepCard step={2} title="Verifique los datos" description="Revise: nombre de la IE, código modular, código local, provincia, distrito, centro poblado" />
          <StepCard step={3} title="Actualice si es necesario" description="Modifique dirección, tipo de gestión u otros datos y presione 'Guardar'" />
        </div>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <Layers className="h-5 w-5 text-secondary" /> 6.3 Niveles y Grados
        </h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Niveles y Grados</code></p>
        <p className="mb-3">Este es el <strong>primer paso obligatorio</strong> antes de registrar personal o estudiantes.</p>
        <div className="space-y-3 pl-2 mb-4">
          <StepCard step={1} title="Seleccione el Nivel" description="Inicial, Primaria o Secundaria" />
          <StepCard step={2} title="Seleccione el Grado" description="Los grados disponibles dependen del nivel seleccionado" />
          <StepCard step={3} title="Agregue las Secciones" description="Inicial: texto libre (ej: 'Ositos'). Primaria/Secundaria: opciones estandarizadas (PIP, A, B, C...)" />
          <StepCard step={4} title='Presione "Guardar"' description="La estructura queda: Nivel → Grado → Secciones" />
        </div>

        <Warning>
          <ul className="space-y-1.5">
            <li><strong>Importante:</strong> Sin configurar niveles y grados, no podrá asignar docentes a secciones ni registrar estudiantes.</li>
            <li>Configure <strong>TODOS</strong> los niveles, grados y secciones de su IE antes de proceder.</li>
          </ul>
        </Warning>

        <Tip title="Sección PIP">
          <p>En Primaria y Secundaria, la primera opción de sección es <strong>"PIP"</strong> (Profesor de Innovación Pedagógica). Al asignar un docente a esta sección, automáticamente tendrá los mismos privilegios y funciones que un Director.</p>
        </Tip>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-secondary" /> 6.4 Registro de Personal
        </h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Personal</code></p>
        <p className="mb-3">El Director debe registrar a <strong>todos los docentes y subdirectores</strong> de su IE.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl border-2 border-primary/10 bg-card p-5">
            <h4 className="font-bold text-sm mb-3">👤 Registro individual</h4>
            <ol className="text-sm space-y-1.5 list-decimal list-inside">
              <li>Presione <strong>"+ Agregar Personal"</strong></li>
              <li>Ingrese <strong>DNI</strong> (8 dígitos) y <strong>Nombre Completo</strong></li>
              <li>Seleccione <strong>Cargo</strong> (Docente o Subdirector)</li>
              <li>Para Docentes: asigne <strong>Grado y Sección</strong></li>
              <li>En Secundaria: seleccione la <strong>Especialidad</strong> (Matemática o Comunicación)</li>
              <li>Presione <strong>"Registrar"</strong></li>
            </ol>
          </div>
          <div className="rounded-xl border-2 border-primary/10 bg-card p-5">
            <h4 className="font-bold text-sm mb-3">📤 Carga masiva (CSV)</h4>
            <ol className="text-sm space-y-1.5 list-decimal list-inside">
              <li>Presione <strong>"📤 Carga Masiva"</strong></li>
              <li>Descargue la plantilla CSV</li>
              <li>Complete: <code className="bg-muted px-1 rounded text-xs">dni, nombre_completo, cargo</code></li>
              <li>Suba el archivo y confirme</li>
            </ol>
          </div>
        </div>

        <Tip title="Credenciales automáticas">
          <p>Al registrar personal, el sistema crea automáticamente una cuenta con <strong>DNI como usuario y contraseña</strong>. El docente podrá ingresar usando su DNI en ambos campos.</p>
        </Tip>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-secondary" /> 6.5 Resultados de la Institución
        </h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Resultados</code></p>
        <p className="mb-3">El Director puede visualizar los resultados de <strong>toda su institución</strong> con múltiples niveles de detalle:</p>

        {/* Screenshot de Resultados */}
        <div className="my-6 rounded-2xl overflow-hidden border-2 border-secondary/20 shadow-card">
          <div className="bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Captura de pantalla – Panel de Resultados
          </div>
          <img src={screenResultados} alt="Panel de Resultados" className="w-full object-cover" />
        </div>

        <div className="rounded-xl border-2 border-secondary/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3">📊 Opciones de visualización de resultados:</h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Por Estudiante:</strong> resultados individuales con nombre, puntaje y nivel de logro</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Por Sección:</strong> distribución de niveles de logro por sección</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Por Grado:</strong> comparativa entre grados del mismo nivel</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Por Nivel:</strong> resultados consolidados de Inicial, Primaria y/o Secundaria</span></li>
          </ul>
        </div>

        <div className="rounded-xl border-2 border-secondary/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3">📋 Paso a paso para consultar resultados:</h4>
          <div className="space-y-3 pl-2">
            <StepCard step={1} title="Ingrese a Resultados" description="Desde el panel lateral izquierdo, presione 'Resultados'" />
            <StepCard step={2} title="Seleccione el tipo de vista" description="Use el menú desplegable para elegir: Por Estudiante, Por Sección, Por Grado o Por Nivel" />
            <StepCard step={3} title="Aplique filtros" description="Seleccione el área (Matemática o Lectura) para filtrar los resultados" />
            <StepCard step={4} title="Analice los gráficos" description="Observe la distribución de niveles de logro: C (Inicio), B (Proceso), A (Logro Esperado), AD (Destacado)" />
            <StepCard step={5} title="Busque estudiantes específicos" description="En la vista 'Por Estudiante', use el campo de búsqueda por nombre o DNI" />
          </div>
        </div>

        <Tip title="Colores de Niveles de Logro">
          <p>Los resultados usan colores para identificar rápidamente el nivel: <span className="text-destructive font-bold">Rojo = C (Inicio)</span>, <span className="text-warning font-bold">Amarillo = B (Proceso)</span>, <span className="text-accent font-bold">Verde = A (Logro Esperado)</span>, <span className="text-primary font-bold">Azul = AD (Destacado)</span>.</p>
        </Tip>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  7. MÓDULO DEL DOCENTE                                     */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="docente" icon={GraduationCap} number="07" title="MÓDULO DEL DOCENTE" />

        <p>El docente es responsable del registro de estudiantes, la digitación de respuestas y la consulta de resultados de su aula. A continuación se detalla cada función paso a paso.</p>

        {/* Screenshot del Dashboard Docente */}
        <div className="my-6 rounded-2xl overflow-hidden border-2 border-accent/20 shadow-card">
          <div className="bg-accent/10 px-4 py-2 text-xs font-bold text-accent flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Captura de pantalla – Dashboard del Docente
          </div>
          <img src={screenDocente} alt="Dashboard del Docente" className="w-full object-cover" />
        </div>

        <h3 className="font-bold text-lg mt-6 mb-3">📊 7.1 Dashboard del Docente</h3>
        <p className="mb-3">Al ingresar, el Docente visualiza un panel con información de su aula:</p>
        <div className="rounded-xl border-2 border-accent/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3">📋 ¿Qué puede ver el Docente en el Dashboard?</h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Total de estudiantes</strong> registrados en su sección</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Evaluaciones pendientes</strong> por digitar</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Evaluaciones completadas</strong> por área</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>Acceso rápido a <strong>cuadernillos de evaluación de entrada</strong> (solo Primaria)</span></li>
          </ul>
        </div>

        <Tip emoji="📥" title="Evaluaciones de Entrada (Primaria)">
          <p>Si es docente de <strong>Primaria</strong>, en su Dashboard encontrará los cuadernillos de evaluación de entrada de <strong>Matemática y Comunicación de su grado específico</strong>. Puede verlos o descargarlos directamente para imprimir y aplicar en su aula.</p>
        </Tip>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-secondary" /> 7.2 Registro de Estudiantes
        </h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Estudiantes</code></p>
        <p className="mb-3">El docente debe registrar a <strong>todos los estudiantes de su aula</strong> antes de iniciar las evaluaciones.</p>
        <div className="space-y-3 pl-2 mb-4">
          <StepCard step={1} title='Presione "+ Agregar Estudiante"' description="Se abrirá el formulario de registro" />
          <StepCard step={2} title="Ingrese los datos del estudiante" description="DNI (8 dígitos) y Nombre Completo" />
          <StepCard step={3} title="Vinculación automática" description="El estudiante queda asignado automáticamente al grado y sección del docente" />
          <StepCard step={4} title='Presione "Registrar"' description="Se crea automáticamente su cuenta (DNI como usuario y contraseña)" />
        </div>

        <Tip title="Credenciales del Estudiante">
          <p>Al registrar un estudiante, el sistema genera una cuenta con <strong>DNI como usuario y contraseña</strong>. Comparta estas credenciales con el estudiante o padre de familia para que pueda acceder a sus resultados.</p>
        </Tip>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <PenTool className="h-5 w-5 text-secondary" /> 7.3 Digitación de Respuestas
        </h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Digitación</code></p>
        <p className="mb-3">Este módulo permite ingresar las respuestas cuando las evaluaciones se aplican en formato <strong>impreso (papel)</strong>.</p>

        {/* Screenshot de Digitación */}
        <div className="my-6 rounded-2xl overflow-hidden border-2 border-accent/20 shadow-card">
          <div className="bg-accent/10 px-4 py-2 text-xs font-bold text-accent flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Captura de pantalla – Módulo de Digitación
          </div>
          <img src={screenDigitacion} alt="Módulo de Digitación de Respuestas" className="w-full object-cover" />
        </div>

        <div className="space-y-3 pl-2 mb-4">
          <StepCard step={1} title="Seleccione el Área" description="Matemática, Lectura o Socioemocional" />
          <StepCard step={2} title="Visualice la lista de estudiantes" description="Se muestra una grilla con todos los estudiantes de su aula y las preguntas del área seleccionada" />
          <StepCard step={3} title="Ingrese las respuestas" description="Para cada estudiante, marque la alternativa seleccionada (A, B, C o D) en cada pregunta" />
          <StepCard step={4} title="Verifique el cálculo automático" description="El sistema calcula automáticamente el puntaje total y asigna el nivel de logro: C (0-10), B (11-14), A (15-18), AD (19-20)" />
          <StepCard step={5} title='Presione "Guardar"' description="Las respuestas quedan registradas y los puntajes se actualizan automáticamente" />
        </div>

        <Warning>
          <ul className="space-y-1.5">
            <li>Verifique cuidadosamente las respuestas <strong>antes de guardar</strong>. Una alternativa incorrecta afecta el puntaje total.</li>
            <li>Complete la digitación de <strong>TODOS</strong> los estudiantes antes de la fecha límite.</li>
            <li>Las respuestas pueden editarse posteriormente si detecta algún error.</li>
          </ul>
        </Warning>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-secondary" /> 7.4 Resultados del Aula
        </h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Resultados</code></p>
        <p className="mb-3">El Docente puede consultar los resultados de <strong>todos los estudiantes de su aula</strong>:</p>

        <div className="rounded-xl border-2 border-accent/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3">📋 Paso a paso para consultar resultados:</h4>
          <div className="space-y-3 pl-2">
            <StepCard step={1} title="Ingrese a Resultados" description="Desde el panel lateral izquierdo, presione 'Resultados'" />
            <StepCard step={2} title="Seleccione la vista" description="Use el menú desplegable: 'Por Estudiante' para ver el detalle individual" />
            <StepCard step={3} title="Filtre por área" description="Seleccione Matemática o Lectura para ver los puntajes específicos" />
            <StepCard step={4} title="Busque un estudiante" description="Use el campo de búsqueda para encontrar por nombre o DNI" />
          </div>
        </div>

        <div className="rounded-xl border-2 border-accent/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3">📊 ¿Qué visualiza el Docente?</h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Tabla de resultados:</strong> nombre, puntaje y nivel de logro de cada estudiante</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Niveles de logro con colores:</strong> <span className="text-destructive font-bold">C (Inicio)</span>, <span className="text-warning font-bold">B (Proceso)</span>, <span className="text-accent font-bold">A (Logro Esperado)</span>, <span className="text-primary font-bold">AD (Destacado)</span></span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Gráficos de distribución:</strong> proporción de estudiantes por nivel de logro</span></li>
          </ul>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  8. DOCENTE PIP                                            */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="pip" icon={Star} number="08" title="DOCENTE PIP (PROFESOR DE INNOVACIÓN PEDAGÓGICA)" />

        <div className="rounded-xl border-2 border-info/20 bg-info/5 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center">
              <Star className="h-6 w-6 text-info" />
            </div>
            <div>
              <h3 className="font-bold text-lg">¿Qué es el Docente PIP?</h3>
              <p className="text-sm text-muted-foreground">Profesor de Innovación Pedagógica / Tecnológica</p>
            </div>
          </div>
          <p className="text-sm mb-4">
            El <strong>Docente PIP</strong> es un profesor de aula asignado a la sección especial <strong>"PIP"</strong> en Primaria o Secundaria. Este docente tiene <strong>los mismos privilegios y funciones que un Director</strong>, lo que le permite gestionar integralmente la institución educativa.
          </p>
          <h4 className="font-bold text-sm mb-2">Funciones del Docente PIP:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Acceder al panel del Director',
              'Configurar niveles, grados y secciones',
              'Registrar personal (docentes, subdirectores)',
              'Ver resultados de toda la institución',
              'Descargar evaluaciones de entrada',
              'Gestionar usuarios de su IE',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-info shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <Tip title="¿Cómo se asigna un Docente PIP?">
          <p>El Director registra al docente en la sección <strong>"PIP"</strong> (primera opción disponible en Primaria y Secundaria). Automáticamente, el sistema le otorga privilegios de Director y le muestra el menú completo de gestión institucional.</p>
        </Tip>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  9. MÓDULO DEL ESTUDIANTE                                  */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="estudiante" icon={ClipboardList} number="09" title="MÓDULO DEL ESTUDIANTE" />

        <p>Los estudiantes acceden a la plataforma para rendir evaluaciones en línea y consultar sus resultados. A continuación se describe paso a paso lo que puede hacer y visualizar.</p>

        <div className="rounded-xl border-2 border-destructive/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3">🔐 ¿Cómo ingresa el Estudiante?</h4>
          <div className="space-y-3 pl-2">
            <StepCard step={1} title="Ingrese a la plataforma" description="Abra dia2026ugelcix.lovable.app en su navegador o tablet" />
            <StepCard step={2} title="Escriba su DNI como usuario" description="8 dígitos de su Documento Nacional de Identidad" />
            <StepCard step={3} title="Escriba su DNI como contraseña" description="La primera vez, su contraseña es su mismo DNI" />
            <StepCard step={4} title="Acepte el aviso de privacidad" description="Marque la casilla de tratamiento de datos personales" />
            <StepCard step={5} title='Presione "Ingresar"' description="El sistema lo llevará automáticamente al módulo de pruebas" />
          </div>
        </div>

        {/* Screenshot Login */}
        <div className="my-6 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-card">
          <div className="bg-primary/10 px-4 py-2 text-xs font-bold text-primary flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Captura de pantalla – Pantalla de Inicio de Sesión
          </div>
          <img src={screenLogin} alt="Pantalla de login de la plataforma DIA 2026" className="w-full object-cover" />
        </div>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-secondary" /> 9.1 Rendir Evaluación en Línea
        </h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Mis Pruebas</code></p>
        <p className="mb-3">El estudiante visualiza las evaluaciones disponibles para su grado. El proceso paso a paso es:</p>

        <div className="space-y-3 pl-2 mb-4">
          <StepCard step={1} title="Seleccione la evaluación" description="Se mostrará la evaluación disponible para su grado con una barra de progreso" />
          <StepCard step={2} title="Lea cada pregunta con atención" description="Lea cuidadosamente el enunciado y las opciones. Puede usar el botón 🔊 para escuchar la pregunta en voz alta" />
          <StepCard step={3} title="Seleccione su respuesta" description="Toque o haga clic en la opción deseada (A, B, C o D). La opción seleccionada se resaltará en azul" />
          <StepCard step={4} title="Navegue entre preguntas" description='Use los botones "← Anterior" y "Siguiente →" para moverse entre las preguntas' />
          <StepCard step={5} title="Revise sus respuestas" description="Antes de finalizar, verifique que todas las preguntas estén respondidas" />
          <StepCard step={6} title="Finalice la evaluación" description='Al terminar, presione "✅ Finalizar" para enviar sus respuestas. ¡No se puede modificar después de finalizar!' />
        </div>

        <Warning>
          <ul className="space-y-1.5">
            <li>Una vez presionado <strong>"Finalizar"</strong>, las respuestas no se pueden modificar.</li>
            <li>Asegúrese de tener <strong>conexión estable a Internet</strong> durante toda la evaluación.</li>
            <li>No cierre el navegador ni cambie de pestaña durante la prueba.</li>
          </ul>
        </Warning>

        <Tip emoji="👶" title="Para estudiantes pequeños (Inicial / 1.er Grado)">
          <ul className="space-y-1">
            <li>Los botones son <strong>grandes</strong> y fáciles de tocar en tablets</li>
            <li>El botón de audio <strong>🔊</strong> lee la pregunta en español peruano</li>
            <li>Se recomienda que un <strong>adulto acompañe</strong> al estudiante durante la evaluación</li>
          </ul>
        </Tip>

        <h3 className="font-bold text-lg mt-6 mb-3">📋 9.2 Mis Resultados</h3>
        <p className="mb-2">Ruta: <code className="bg-muted px-2 py-0.5 rounded text-xs">Panel lateral → Resultados</code></p>
        <p className="mb-3">Después de finalizar las evaluaciones, el estudiante puede consultar sus resultados:</p>

        <div className="rounded-xl border-2 border-destructive/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3">📋 Paso a paso para ver resultados:</h4>
          <div className="space-y-3 pl-2">
            <StepCard step={1} title="Ingrese a Resultados" description="Desde el panel lateral izquierdo, presione 'Resultados'" />
            <StepCard step={2} title="Visualice su Boleta" description="Se muestra el puntaje obtenido y el nivel de logro en cada área evaluada" />
            <StepCard step={3} title="Consulte su nivel de logro" description="C = En Inicio (0-10), B = En Proceso (11-14), A = Logro Esperado (15-18), AD = Destacado (19-20)" />
            <StepCard step={4} title="Lea las recomendaciones" description="Se incluyen sugerencias pedagógicas personalizadas según el nivel alcanzado" />
          </div>
        </div>

        <div className="rounded-xl border-2 border-destructive/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3">👁️ ¿Qué visualiza el Estudiante?</h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Boleta de Resultados:</strong> puntaje y nivel de logro en cada área (Matemática, Lectura, Socioemocional)</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Colores indicativos:</strong> <span className="text-destructive font-bold">Rojo = C</span>, <span className="text-warning font-bold">Amarillo = B</span>, <span className="text-accent font-bold">Verde = A</span>, <span className="text-primary font-bold">Azul = AD</span></span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Análisis Personalizado:</strong> conclusiones descriptivas generadas automáticamente por competencia</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Recomendaciones pedagógicas:</strong> sugerencias específicas para mejorar según el nivel alcanzado</span></li>
          </ul>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  10. MÓDULO DEL ESPECIALISTA                               */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="especialista" icon={BarChart3} number="10" title="MÓDULO DEL ESPECIALISTA UGEL" />

        <p>Los especialistas pedagógicos de la UGEL acceden a reportes consolidados para el análisis a nivel de la provincia.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <FeatureBox icon={BarChart3} title="Dashboard" items={[
            'Estadísticas globales de la evaluación diagnóstica',
            'Indicadores de avance por institución',
          ]} />
          <FeatureBox icon={FileText} title="Reportes" color="secondary" items={[
            'Filtros por IE, nivel, grado, área y distrito',
            'Gráficos de distribución de niveles de logro',
            'Comparativas entre instituciones y distritos',
          ]} />
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  11. MÓDULO DEL PADRE                                      */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="padre" icon={Users} number="11" title="MÓDULO DEL PADRE DE FAMILIA" />

        <p className="mb-4">Los padres, madres y apoderados son actores fundamentales en el proceso educativo. La plataforma DIA 2026 les permite conocer los resultados de aprendizaje de sus hijos/as y recibir orientaciones para apoyarlos desde el hogar.</p>

        <div className="rounded-2xl border-2 border-secondary/20 bg-secondary/5 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">¿Cómo obtiene acceso el Padre de Familia?</h3>
              <p className="text-sm text-muted-foreground">Credenciales proporcionadas por la IE</p>
            </div>
          </div>
          <p className="text-sm mb-3">
            El <strong>docente de aula</strong> o el <strong>director de la institución educativa</strong> entrega las credenciales de acceso del estudiante al padre de familia. El usuario y contraseña son el <strong>DNI del estudiante</strong> (8 dígitos).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-card border border-border p-4 text-center">
              <UserCog className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="font-bold text-sm">Usuario</p>
              <p className="text-xl font-black text-accent">DNI del estudiante</p>
              <p className="text-xs text-muted-foreground">8 dígitos</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 text-center">
              <Lock className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="font-bold text-sm">Contraseña</p>
              <p className="text-xl font-black text-secondary">DNI del estudiante</p>
              <p className="text-xs text-muted-foreground">8 dígitos (primera vez)</p>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-secondary" /> 11.1 Cómo ingresar a la plataforma
        </h3>
        <p className="mb-2">Siga estos pasos desde su celular, tablet o computadora:</p>

        <div className="space-y-3 pl-2 mb-4">
          <StepCard step={1} title="Abra su navegador" description="Ingrese a dia2026ugelcix.lovable.app desde Chrome, Firefox, Edge o Safari" />
          <StepCard step={2} title="Escriba el DNI de su hijo/a como usuario" description="Los 8 dígitos del Documento Nacional de Identidad del estudiante" />
          <StepCard step={3} title="Escriba el mismo DNI como contraseña" description="La primera vez, la contraseña es el mismo DNI" />
          <StepCard step={4} title="Acepte el aviso de privacidad" description="Marque la casilla de aceptación del tratamiento de datos personales (Ley N.° 29733)" />
          <StepCard step={5} title='Presione "Ingresar"' description="El sistema lo llevará a la boleta de resultados del estudiante" />
        </div>

        <Tip emoji="📱" title="Acceso desde celular">
          <p>La plataforma funciona perfectamente desde cualquier celular con internet. Puede instalarla como aplicación: en Chrome, busque el ícono <strong>"Instalar"</strong> en la barra de direcciones para tener acceso directo desde su pantalla de inicio.</p>
        </Tip>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <Eye className="h-5 w-5 text-secondary" /> 11.2 Boleta de Resultados
        </h3>
        <p className="mb-3">Al ingresar, encontrará la <strong>Boleta de Resultados</strong> con información detallada del rendimiento de su hijo/a:</p>

        <div className="rounded-xl border-2 border-secondary/10 bg-card p-5 mb-4">
          <h4 className="font-bold text-sm mb-3">📋 ¿Qué información contiene la Boleta?</h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Puntaje por área:</strong> resultado numérico en Matemática, Comprensión Lectora y Socioemocional</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Nivel de logro:</strong> <span className="text-destructive font-bold">C (En Inicio)</span>, <span className="text-warning font-bold">B (En Proceso)</span>, <span className="text-accent font-bold">A (Logro Esperado)</span>, <span className="text-primary font-bold">AD (Destacado)</span></span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Conclusiones descriptivas:</strong> explicación detallada de logros, dificultades y sugerencias de mejora</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span><strong>Niveles de lectura:</strong> en Comprensión Lectora se desagregan los resultados por nivel Literal, Inferencial y Crítico Reflexivo</span></li>
          </ul>
        </div>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-secondary" /> 11.3 Entender los Niveles de Logro
        </h3>
        <p className="mb-3">Los niveles de logro indican el avance del estudiante respecto a las competencias de su grado:</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="rounded-xl p-4 text-center border-2 border-destructive/30 bg-destructive/5">
            <div className="w-10 h-10 rounded-full bg-destructive/20 mx-auto mb-2 flex items-center justify-center text-lg font-black text-destructive">C</div>
            <p className="font-bold text-xs text-destructive">En Inicio</p>
            <p className="text-xs text-muted-foreground mt-1">Necesita mucho apoyo y acompañamiento</p>
          </div>
          <div className="rounded-xl p-4 text-center border-2 border-warning/30 bg-warning/5">
            <div className="w-10 h-10 rounded-full bg-warning/20 mx-auto mb-2 flex items-center justify-center text-lg font-black text-warning">B</div>
            <p className="font-bold text-xs text-warning">En Proceso</p>
            <p className="text-xs text-muted-foreground mt-1">Avanza, pero requiere refuerzo en casa</p>
          </div>
          <div className="rounded-xl p-4 text-center border-2 border-accent/30 bg-accent/5">
            <div className="w-10 h-10 rounded-full bg-accent/20 mx-auto mb-2 flex items-center justify-center text-lg font-black text-accent">A</div>
            <p className="font-bold text-xs text-accent">Logro Esperado</p>
            <p className="text-xs text-muted-foreground mt-1">Alcanzó el nivel esperado para su grado</p>
          </div>
          <div className="rounded-xl p-4 text-center border-2 border-primary/30 bg-primary/5">
            <div className="w-10 h-10 rounded-full bg-primary/20 mx-auto mb-2 flex items-center justify-center text-sm font-black text-primary">AD</div>
            <p className="font-bold text-xs text-primary">Destacado</p>
            <p className="text-xs text-muted-foreground mt-1">¡Supera lo esperado! Excelente</p>
          </div>
        </div>

        <h3 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-secondary" /> 11.4 Recomendaciones para el Hogar
        </h3>
        <p className="mb-3">La plataforma genera <strong>recomendaciones personalizadas</strong> según el nivel de logro alcanzado. Estas le ayudarán a apoyar el aprendizaje desde casa:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <FeatureBox icon={ClipboardList} title="Matemática" items={[
            'Juegos con números y operaciones en casa',
            'Resolución de problemas cotidianos',
            'Uso de materiales concretos (semillas, tapas)',
            'Práctica con situaciones de compra/venta',
          ]} />
          <FeatureBox icon={BookOpen} title="Comprensión Lectora" color="secondary" items={[
            'Lectura compartida diaria (cuentos, noticias)',
            'Hacer preguntas sobre lo leído',
            'Visitar la biblioteca o intercambiar libros',
            'Inventar historias juntos',
          ]} />
        </div>

        <div className="rounded-xl border-2 border-accent/20 bg-accent/5 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-5 w-5 text-accent" />
            <h4 className="font-bold text-sm">Apoyo Socioemocional</h4>
          </div>
          <ul className="text-sm space-y-1.5">
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>Converse diariamente con su hijo/a sobre cómo se siente</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>Celebre sus logros, por pequeños que sean</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>Establezca rutinas y horarios de estudio</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>Fomente la autonomía y la responsabilidad</span></li>
          </ul>
        </div>

        <Warning>
          <ul className="space-y-1.5">
            <li>Si no puede ingresar, comuníquese con el <strong>docente de aula</strong> o con la <strong>dirección de la IE</strong> para verificar las credenciales.</li>
            <li>Los resultados son <strong>confidenciales</strong>. No los comparta con personas ajenas al proceso educativo.</li>
            <li>Para soporte técnico puede llamar al <strong>979 915 310</strong> o escribir a <strong>cyampufer@ugelchiclayo.edu.pe</strong>.</li>
          </ul>
        </Warning>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  12. MI PERFIL                                             */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="perfil" icon={UserCog} number="12" title="MI PERFIL" />

        <p className="mb-4">Todos los usuarios pueden acceder a "Mi Perfil" desde el panel lateral para:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
            <UserCog className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-xs font-bold">Datos personales</p>
            <p className="text-xs text-muted-foreground mt-1">Nombre, DNI, rol</p>
          </div>
          <div className="rounded-xl bg-secondary/5 border border-secondary/10 p-4 text-center">
            <School className="h-8 w-8 text-secondary mx-auto mb-2" />
            <p className="text-xs font-bold">Institución</p>
            <p className="text-xs text-muted-foreground mt-1">IE asignada</p>
          </div>
          <div className="rounded-xl bg-accent/5 border border-accent/10 p-4 text-center">
            <GraduationCap className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-xs font-bold">Grado y Sección</p>
            <p className="text-xs text-muted-foreground mt-1">Para docentes y estudiantes</p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  13. SEGURIDAD                                             */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="seguridad" icon={Lock} number="13" title="SEGURIDAD Y PROTECCIÓN DE DATOS" />

        <p className="mb-4">La plataforma DIA 2026 cumple con la <strong>Ley N.° 29733 – Ley de Protección de Datos Personales</strong> del Perú.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <FeatureBox icon={Shield} title="Medidas del sistema" items={[
            'Autenticación segura con credenciales únicas',
            'Control de acceso por roles',
            'Contraseñas almacenadas de forma encriptada',
            'Sesiones con expiración automática',
            'Registro de actividad en el sistema',
          ]} />
          <FeatureBox icon={Users} title="Responsabilidades del usuario" color="destructive" items={[
            'No compartir credenciales con terceros',
            'Cerrar sesión en dispositivos compartidos',
            'No capturar pantallas con datos de estudiantes',
            'Reportar accesos no autorizados inmediatamente',
          ]} />
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  14. SOLUCIÓN DE PROBLEMAS                                 */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="problemas" icon={HelpCircle} number="14" title="SOLUCIÓN DE PROBLEMAS FRECUENTES" />

        <div className="space-y-4">
          <TroubleshootCard problem='"Credenciales incorrectas"' solutions={[
            'Verifique que ingresa su DNI completo (8 dígitos) tanto como usuario y contraseña',
            'Asegúrese de no tener espacios en blanco antes o después del DNI',
            'Solicite al administrador que resetee su contraseña si el problema persiste',
          ]} />
          <TroubleshootCard problem='"Sesión expirada"' solutions={[
            'Su sesión ha expirado por inactividad',
            'Presione "Cerrar Sesión" y vuelva a ingresar con sus credenciales',
          ]} />
          <TroubleshootCard problem="No veo mi institución / No puedo registrar personal" solutions={[
            'Verifique que el administrador haya vinculado su cuenta a una institución educativa',
            'Contacte al administrador de la UGEL para que revise su asignación',
          ]} />
          <TroubleshootCard problem="La página carga lentamente" solutions={[
            'Verifique su conexión a Internet',
            'Use Google Chrome actualizado para mejor rendimiento',
            'Cierre pestañas o apps que consuman ancho de banda',
            'Instale la app PWA desde el navegador para acceso más rápido',
          ]} />
          <TroubleshootCard problem="No se guardan los datos / Error al guardar" solutions={[
            'Verifique su conexión a Internet',
            'No cierre la ventana mientras el sistema esté guardando',
            'Recargue la página (F5) e intente nuevamente',
          ]} />
          <TroubleshootCard problem="El audio no funciona en la evaluación" solutions={[
            'Verifique que el volumen del dispositivo esté activado',
            'Use un navegador moderno (Chrome, Firefox, Edge)',
            'Interactúe con la página antes (toque cualquier parte de la pantalla)',
          ]} />
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  15. SOPORTE TÉCNICO                                       */}
        {/* ════════════════════════════════════════════════════════════ */}
        <SectionTitle id="soporte" icon={Phone} number="15" title="SOPORTE TÉCNICO Y CONTACTO" />

        <div className="rounded-2xl gradient-primary text-primary-foreground p-8 mb-6">
          <h3 className="text-xl font-extrabold mb-4">Dirección de Gestión Pedagógica</h3>
          <p className="font-semibold mb-4">GRED Lambayeque</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-secondary shrink-0" />
              <span>cyampufer@ugelchiclayo.edu.pe</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-secondary shrink-0" />
              <span>979 915 310</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-secondary shrink-0" />
              <span>Av. José Leonardo Ortiz, Chiclayo</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-secondary shrink-0" />
              <span>Lunes a viernes, 8:00 a.m. – 5:00 p.m.</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-primary/10 bg-card p-6">
          <h3 className="font-bold text-sm mb-4">📞 Protocolo de Soporte</h3>
          <div className="space-y-3">
            <StepCard step={1} title="Nivel 1 – IE" description="El docente o director consulta con el responsable de TI de su institución" />
            <StepCard step={2} title="Nivel 2 – UGEL" description="El director o responsable TI contacta al equipo DGP de la UGEL" />
            <StepCard step={3} title="Nivel 3 – Desarrollo" description="El equipo DGP escala al equipo de desarrollo si el problema es técnico" />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  PIE DE PÁGINA                                             */}
        {/* ════════════════════════════════════════════════════════════ */}
        <footer className="mt-16 pt-8 border-t-4 border-secondary">
          <div className="text-center">
            <div className="flex items-center justify-center gap-6 mb-6">
              <img src={diaLogo} alt="DIA 2026" className="h-16 w-16 object-contain" />
              <img src={dgpLogo} alt="GRED Lambayeque" className="h-16 w-16 object-contain rounded-full" />
            </div>
            <p className="text-lg font-extrabold text-primary">GRED LAMBAYEQUE</p>
            <p className="font-semibold text-muted-foreground">Plan Educativo Regional 2026</p>
            <p className="text-sm text-muted-foreground mt-1">Diagnóstico Integral de Aprendizajes – DIA 2026</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="h-0.5 w-16 bg-secondary rounded-full" />
              <Star className="h-4 w-4 text-secondary" />
              <div className="h-0.5 w-16 bg-secondary rounded-full" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Documento elaborado para uso interno institucional</p>
            <p className="text-xs text-muted-foreground">© 2026 – Todos los derechos reservados</p>
          </div>
        </footer>

      </article>
    </div>
  );
};

export default GuiaUsuario;
