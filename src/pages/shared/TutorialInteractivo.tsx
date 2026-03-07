import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, ArrowRight, Play, School, GraduationCap, Users, Settings,
  ClipboardList, BarChart3, BookOpen, Shield, CheckCircle2, Rocket,
  Star, ChevronRight, Monitor, KeyRound, Layers, UserPlus, FileText,
  PenTool, Award, Eye, Home, Image
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import diaLogo from '@/assets/dia_ugel_cix_2026.png';
import dgpLogo from '@/assets/logo_dgp_ugel_cix.jpg';
import screenLogin from '@/assets/tutorial/screen-login.jpg';
import screenAdmin from '@/assets/tutorial/screen-admin.jpg';
import screenDirector from '@/assets/tutorial/screen-director.jpg';
import screenDocente from '@/assets/tutorial/screen-docente.jpg';
import screenDigitacion from '@/assets/tutorial/screen-digitacion.jpg';
import screenResultados from '@/assets/tutorial/screen-resultados.jpg';

/* ────────── Step Data ────────── */

interface TutorialStep {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  content: React.ReactNode;
}

const StepBullet = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-start gap-3 py-2"
  >
    <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-secondary" />
    </div>
    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{text}</p>
  </motion.div>
);

const AnimatedNumber = ({ n }: { n: string }) => (
  <motion.span
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground text-lg font-black shadow-lg"
  >
    {n}
  </motion.span>
);

const steps: TutorialStep[] = [
  {
    id: 'bienvenida',
    title: '¡Bienvenido al DIA 2026!',
    subtitle: 'Diagnóstico Integral de Aprendizajes',
    icon: Rocket,
    color: 'primary',
    content: (
      <div className="space-y-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg sm:text-xl text-foreground font-semibold leading-relaxed"
        >
          ¡Hola, profesor! ¡Hola, directivo! 🎉 Qué bueno tenerte aquí. Esta guía interactiva te va a mostrar
          paso a paso cómo usar la plataforma DIA 2026 para diagnosticar los aprendizajes de tus estudiantes.
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: ClipboardList, label: 'Matemática', desc: 'Resolución de problemas' },
            { icon: BookOpen, label: 'Comunicación', desc: 'Comprensión lectora' },
            { icon: Users, label: 'Socioemocional', desc: 'Autoconocimiento y empatía' },
          ].map((area, i) => (
            <motion.div
              key={area.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.15 }}
              className="rounded-2xl border-2 border-secondary/30 bg-secondary/5 p-5 text-center"
            >
              <area.icon className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="font-bold text-sm">{area.label}</p>
              <p className="text-xs text-muted-foreground">{area.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-accent/10 border-l-4 border-accent rounded-r-xl p-4"
        >
          <p className="text-sm font-medium">
            💡 <strong>Tip:</strong> Puedes avanzar con las flechas o haciendo clic en "Siguiente". ¡Vamos con todo! 💪
          </p>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'acceso',
    title: 'Acceso a la Plataforma',
    subtitle: '¿Cómo ingreso al DIA 2026?',
    icon: KeyRound,
    color: 'primary',
    content: (
      <div className="space-y-5">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-muted-foreground">
          Ingresar es súper sencillo. Solo necesitas tu <strong className="text-foreground">DNI de 8 dígitos</strong> y tu contraseña.
          Si es la primera vez, tu contraseña inicial también es tu DNI.
        </motion.p>
        {[
          { icon: Monitor, text: 'Abre tu navegador (Chrome, Firefox, Edge) y entra a la dirección de la plataforma DIA 2026.' },
          { icon: KeyRound, text: 'Escribe tu DNI (8 dígitos) en el campo "DNI o Correo electrónico" y tu contraseña.' },
          { icon: Shield, text: 'Acepta el tratamiento de datos personales (Ley N.° 29733) marcando la casilla.' },
          { icon: CheckCircle2, text: 'Haz clic en "Ingresar". Si es tu primer acceso, el sistema te pedirá cambiar tu contraseña.' },
        ].map((step, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }}>
            <StepBullet icon={step.icon} text={step.text} />
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="bg-destructive/10 border-l-4 border-destructive rounded-r-xl p-4"
        >
          <p className="text-sm">⚠️ <strong>Importante:</strong> Tu nueva contraseña debe tener mínimo 6 caracteres. ¡No la compartas con nadie!</p>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'roles',
    title: 'Roles de Usuario',
    subtitle: 'Cada persona tiene su función',
    icon: Shield,
    color: 'primary',
    content: (
      <div className="space-y-4">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-muted-foreground">
          La plataforma tiene roles diferenciados. Cada rol ve exactamente lo que necesita. ¡Nada más, nada menos!
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Settings, role: 'Administrador', desc: 'Gestiona IEs, crea directores y especialistas' },
            { icon: School, role: 'Director / Subdirector', desc: 'Configura su IE, registra docentes, ve resultados' },
            { icon: GraduationCap, role: 'Docente', desc: 'Registra estudiantes, digita respuestas' },
            { icon: Star, role: 'Docente PIP', desc: 'Docente con permisos de director' },
            { icon: BarChart3, role: 'Especialista UGEL', desc: 'Ve reportes a nivel de toda la UGEL' },
            { icon: Users, role: 'Padre de Familia', desc: 'Consulta los resultados de su hijo/a' },
          ].map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="flex items-center gap-3 rounded-xl border-2 border-border p-4 hover:border-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <r.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">{r.role}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'director',
    title: 'Guía para el Director',
    subtitle: 'Configura tu Institución Educativa',
    icon: School,
    color: 'primary',
    content: (
      <div className="space-y-5">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-muted-foreground">
          ¡Director, directora! Tu rol es clave. Tú configuras la IE y registras a tus docentes. Aquí va tu flujo completo:
        </motion.p>
        {[
          { n: '1', icon: School, title: 'Verifica tu IE', text: 'Al ingresar, revisa que los datos de tu institución educativa estén correctos (nombre, código modular, distrito).' },
          { n: '2', icon: Layers, title: 'Configura Niveles y Secciones', text: 'Ve a "Niveles/Grados/Secciones" y agrega los niveles (Inicial, Primaria, Secundaria), grados y secciones que tiene tu IE.' },
          { n: '3', icon: UserPlus, title: 'Registra a tus Docentes', text: 'Ve a "Personal" y registra a cada docente con su DNI, nombre completo y asígnale su grado y sección.' },
          { n: '4', icon: BarChart3, title: 'Consulta Resultados', text: 'Una vez que los docentes digiten las respuestas, podrás ver los resultados consolidados de toda tu IE.' },
        ].map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="flex gap-4 items-start"
          >
            <AnimatedNumber n={step.n} />
            <div>
              <p className="font-bold flex items-center gap-2"><step.icon className="h-4 w-4 text-secondary" /> {step.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{step.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 'docente',
    title: 'Guía para el Docente',
    subtitle: 'Registra estudiantes y digita respuestas',
    icon: GraduationCap,
    color: 'primary',
    content: (
      <div className="space-y-5">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-muted-foreground">
          ¡Profe! Tu trabajo es fundamental. Tú registras a tus estudiantes y digitas sus respuestas. ¡Es más fácil de lo que crees!
        </motion.p>
        {[
          { n: '1', icon: UserPlus, title: 'Registra Estudiantes', text: 'Ve a "Estudiantes" y agrega a cada uno con su DNI y nombre completo. También puedes cargar una lista Excel.' },
          { n: '2', icon: FileText, title: 'Aplica la Evaluación', text: 'Imprime o proyecta la prueba y que tus estudiantes la desarrollen en el aula. Las pruebas están disponibles en la sección de descarga.' },
          { n: '3', icon: PenTool, title: 'Digita las Respuestas', text: 'Ve a "Digitación", selecciona el área (Matemática o Lectura), y marca la respuesta de cada estudiante. El sistema calcula el puntaje automáticamente.' },
          { n: '4', icon: Eye, title: 'Revisa los Resultados', text: 'En "Resultados" verás el nivel de logro de cada estudiante (C, B, A, AD) y gráficos de tu aula.' },
        ].map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="flex gap-4 items-start"
          >
            <AnimatedNumber n={step.n} />
            <div>
              <p className="font-bold flex items-center gap-2"><step.icon className="h-4 w-4 text-secondary" /> {step.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{step.text}</p>
            </div>
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="bg-accent/10 border-l-4 border-accent rounded-r-xl p-4"
        >
          <p className="text-sm">💡 <strong>Tip:</strong> Si no tienes internet al momento de digitar, ¡no te preocupes! La plataforma guarda los datos localmente y los sincroniza cuando vuelvas a estar conectado. 📶</p>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'niveles',
    title: 'Niveles de Logro',
    subtitle: '¿Qué significan C, B, A y AD?',
    icon: Award,
    color: 'primary',
    content: (
      <div className="space-y-5">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-muted-foreground">
          Los resultados se expresan en 4 niveles de logro del Currículo Nacional. Cada uno indica cuánto ha avanzado el estudiante:
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { nivel: 'C', nombre: 'En Inicio', color: 'bg-red-500', desc: 'El estudiante muestra un progreso mínimo. Necesita acompañamiento intensivo.' },
            { nivel: 'B', nombre: 'En Proceso', color: 'bg-yellow-500', desc: 'Está en camino de lograr la competencia, pero aún necesita apoyo.' },
            { nivel: 'A', nombre: 'Logro Esperado', color: 'bg-green-500', desc: 'Demuestra manejo satisfactorio de la competencia evaluada.' },
            { nivel: 'AD', nombre: 'Destacado', color: 'bg-blue-500', desc: 'Evidencia un nivel superior al esperado. ¡Excelente trabajo!' },
          ].map((l, i) => (
            <motion.div
              key={l.nivel}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.12 }}
              className="rounded-2xl border-2 border-border p-5 relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-2 h-full ${l.color}`} />
              <div className="pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-2xl font-black ${l.color.replace('bg-', 'text-')}`}>{l.nivel}</span>
                  <span className="font-bold text-sm">{l.nombre}</span>
                </div>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="bg-primary/5 border-l-4 border-primary rounded-r-xl p-4"
        >
          <p className="text-sm">📊 Los resultados incluyen <strong>conclusiones descriptivas</strong> por competencia, respondiendo: ¿Qué logros tiene? ¿Qué dificultades presenta? ¿Cómo puede mejorar?</p>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'especialista',
    title: 'Para Especialistas y Administradores',
    subtitle: 'Reportes consolidados y gestión',
    icon: BarChart3,
    color: 'primary',
    content: (
      <div className="space-y-5">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-muted-foreground">
          Si eres especialista o administrador, tienes acceso a los datos consolidados de toda la UGEL o de todas las instituciones educativas.
        </motion.p>
        <StepBullet icon={BarChart3} text="Visualiza gráficos de rendimiento por distrito, por institución educativa, por grado y por área." />
        <StepBullet icon={Layers} text="Filtra los resultados por nivel educativo (Inicial, Primaria, Secundaria) y por área evaluada." />
        <StepBullet icon={Users} text="Consulta listas de estudiantes con sus niveles de logro para identificar quiénes necesitan más apoyo." />
        <StepBullet icon={Settings} text="El administrador puede crear instituciones educativas, registrar directores y gestionar usuarios del sistema." />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="bg-accent/10 border-l-4 border-accent rounded-r-xl p-4"
        >
          <p className="text-sm">💡 <strong>Tip:</strong> Usa los datos para tomar decisiones pedagógicas informadas. Los resultados del DIA permiten focalizar el acompañamiento donde más se necesita.</p>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'capturas',
    title: 'Conoce los Módulos',
    subtitle: 'Capturas de pantalla de la plataforma',
    icon: Image,
    color: 'primary',
    content: (
      <div className="space-y-6">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-muted-foreground">
          Aquí te mostramos cómo luce cada módulo de la plataforma para que te familiarices antes de ingresar. 👀
        </motion.p>
        {[
          { img: screenLogin, label: '🔐 Pantalla de Inicio de Sesión', desc: 'Ingresa con tu DNI y contraseña. Interfaz sencilla y segura.' },
          { img: screenAdmin, label: '🛠️ Panel del Administrador', desc: 'Vista general con estadísticas de instituciones, docentes y estudiantes registrados.' },
          { img: screenDirector, label: '🏫 Módulo del Director', desc: 'Configura tu institución educativa, niveles, grados, secciones y registra docentes.' },
          { img: screenDocente, label: '👩‍🏫 Módulo del Docente', desc: 'Registra estudiantes, consulta listas y gestiona tu aula de forma sencilla.' },
          { img: screenDigitacion, label: '✏️ Grilla de Digitación', desc: 'Digita las respuestas de cada estudiante pregunta por pregunta. El sistema calcula los puntajes.' },
          { img: screenResultados, label: '📊 Resultados y Reportes', desc: 'Gráficos de barras, tortas y tablas con los niveles de logro de tus estudiantes.' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.12 }}
            className="rounded-2xl border-2 border-border overflow-hidden"
          >
            <div className="relative aspect-video bg-muted">
              <img src={item.img} alt={item.label} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-4">
              <p className="font-bold text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="bg-accent/10 border-l-4 border-accent rounded-r-xl p-4"
        >
          <p className="text-sm">💡 <strong>Tip:</strong> La plataforma real puede verse ligeramente diferente según las actualizaciones, pero la estructura y funciones son las mismas.</p>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'cierre',
    title: '¡Listo para empezar! 🚀',
    subtitle: 'Juntos mejoramos los aprendizajes',
    icon: Rocket,
    color: 'primary',
    content: (
      <div className="space-y-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg sm:text-xl text-foreground font-semibold leading-relaxed"
        >
          ¡Felicitaciones! Ya conoces todo lo necesario para usar la plataforma DIA 2026. Recuerda que esta herramienta es para
          ti, para tus estudiantes y para la mejora de la educación en Chiclayo.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl gradient-primary text-primary-foreground p-6 text-center space-y-3"
        >
          <Award className="h-12 w-12 mx-auto text-secondary" />
          <p className="text-xl font-bold">¡Tú haces la diferencia!</p>
          <p className="text-sm opacity-90">Cada dato que registras contribuye a mejorar los aprendizajes de miles de estudiantes en nuestra provincia.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
            className="rounded-xl border-2 border-border p-4"
          >
            <p className="font-bold text-sm mb-1">📧 Soporte técnico</p>
            <p className="text-xs text-muted-foreground">cyampufer@ugelchiclayo.edu.pe</p>
            <p className="text-xs text-muted-foreground">📞 979 915 310</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
            className="rounded-xl border-2 border-border p-4"
          >
            <p className="font-bold text-sm mb-1">📖 Manual completo</p>
            <p className="text-xs text-muted-foreground">Consulta el manual detallado en la sección <strong>/guia</strong> de la plataforma.</p>
          </motion.div>
        </div>
      </div>
    ),
  },
];

/* ────────── Main Component ────────── */

const TutorialInteractivo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [started, setStarted] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* ── Splash screen ── */
  if (!started) {
    return (
      <div className="min-h-screen gradient-primary flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative bg */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center text-primary-foreground max-w-lg space-y-8"
        >
          <div className="flex items-center justify-center gap-6">
            <motion.img
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              src={diaLogo}
              alt="DIA 2026"
              className="h-24 w-24 object-contain"
            />
            <motion.img
              initial={{ rotate: 10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              src={dgpLogo}
              alt="DGP"
              className="h-24 w-24 object-contain rounded-xl"
            />
          </div>

          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-bold uppercase tracking-widest text-secondary mb-2"
            >
              UGEL Chiclayo · Dirección de Gestión Pedagógica
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl sm:text-5xl font-black leading-tight"
            >
              Tutorial Interactivo
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-xl sm:text-2xl font-extrabold text-secondary mt-2"
            >
              DIA 2026
            </motion.p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-base opacity-90 max-w-md mx-auto"
          >
            Aprende a usar la plataforma de Diagnóstico Integral de Aprendizajes paso a paso.
            Dirigido a <strong>directivos y docentes</strong>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => setStarted(true)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-10 py-6 rounded-2xl shadow-lg font-bold gap-3"
            >
              <Play className="h-6 w-6" /> Comenzar Tutorial
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/guia')} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10">
                <BookOpen className="h-4 w-4 mr-2" /> Manual completo
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ── Tutorial slides ── */
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <Home className="h-4 w-4" />
            </Button>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-muted-foreground">Tutorial DIA 2026</p>
              <p className="text-xs text-muted-foreground">{currentStep + 1} de {steps.length}</p>
            </div>
          </div>

          <div className="flex-1 max-w-xs">
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step dots */}
          <div className="hidden md:flex gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentStep(i); containerRef.current?.scrollTo({ top: 0 }); }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentStep ? 'bg-primary scale-125' : i < currentStep ? 'bg-secondary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step header */}
              <div className="flex items-center gap-4 mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg"
                >
                  <step.icon className="h-7 w-7 text-primary-foreground" />
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl sm:text-3xl font-extrabold text-foreground"
                  >
                    {step.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-muted-foreground"
                  >
                    {step.subtitle}
                  </motion.p>
                </div>
              </div>

              {/* Step content */}
              {step.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Anterior
          </Button>

          <span className="text-sm font-bold text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>

          {currentStep < steps.length - 1 ? (
            <Button onClick={goNext} className="gap-2">
              Siguiente <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => navigate('/login')} className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Ir a la Plataforma <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialInteractivo;
