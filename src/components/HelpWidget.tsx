import { useState, useRef, useEffect } from 'react';
import { MessageCircleQuestion, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const contacts = [
  { nivel: 'Inicial', phone: '51915004222', name: 'Maestra Anghi Briseth Peña Vega' },
  { nivel: 'Primaria', phone: '51945001625', name: 'Maestra Carmen Rosa Huamán Ruiz' },
  { nivel: 'Secundaria', phone: '51954412208', name: 'Maestra Rosa Cristina Tezén Mestanza' },
];

const HelpWidget = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getWhatsAppUrl = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Hola ${name}, necesito asistencia técnica con el sistema DIA 2026.`);
    return `https://wa.me/${phone}?text=${msg}`;
  };

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50">
      <Button
        onClick={() => setOpen(!open)}
        className="gap-2 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2"
        size="sm"
      >
        {open ? <X className="h-4 w-4" /> : <MessageCircleQuestion className="h-4 w-4" />}
        Necesito ayuda
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl p-4 animate-fade-in">
          <p className="text-sm font-semibold text-foreground mb-3">Seleccione su nivel educativo:</p>
          <div className="space-y-2">
            {contacts.map((c) => (
              <button
                key={c.nivel}
                onClick={() => openWhatsApp(c.phone, c.name)}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-foreground">{c.nivel}</span>
                  <p className="text-xs text-muted-foreground">{c.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpWidget;
