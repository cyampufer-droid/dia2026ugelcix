import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, User, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import diaRobotImg from '@/assets/dia-robot.png';

type Msg = { role: 'user' | 'assistant'; content: string };

const getSpanishLatamMaleVoice = (): SpeechSynthesisVoice | null => {
  const voices = speechSynthesis.getVoices();
  
  // Priority order for Peruvian/Latin American Spanish male voice:
  // 1. es-PE (Peruvian Spanish)
  const peruVoice = voices.find(v => v.lang === 'es-PE');
  if (peruVoice) return peruVoice;

  // 2. es-419 (Latin American Spanish) - male preferred
  const latam419Male = voices.find(v => v.lang === 'es-419' && /male|hombre|jorge|carlos|andrés|diego|pedro/i.test(v.name));
  const latam419 = voices.find(v => v.lang === 'es-419');
  if (latam419Male) return latam419Male;
  if (latam419) return latam419;

  // 3. es-MX, es-CO, es-CL (nearby LatAm accents) - male preferred
  const latamCodes = ['es-MX', 'es-CO', 'es-CL', 'es-AR', 'es-EC', 'es-VE'];
  const latamMale = voices.find(v => latamCodes.includes(v.lang) && /male|hombre|jorge|carlos|andrés|diego|pedro/i.test(v.name));
  const latamAny = voices.find(v => latamCodes.includes(v.lang));
  if (latamMale) return latamMale;
  if (latamAny) return latamAny;

  // 4. Any es-* voice with male keywords
  const anySpanishMale = voices.find(v => v.lang.startsWith('es') && /male|hombre|jorge|carlos|andrés|diego|pedro/i.test(v.name));
  if (anySpanishMale) return anySpanishMale;

  // 5. Google Spanish (Latin America)
  const googleLatam = voices.find(v => v.lang.startsWith('es') && /google|latin/i.test(v.name));
  if (googleLatam) return googleLatam;

  // 6. Any Spanish voice as fallback
  return voices.find(v => v.lang.startsWith('es')) || null;
};

const speakText = (text: string, onEnd?: () => void): SpeechSynthesisUtterance => {
  // Strip markdown
  const clean = text
    .replace(/[#*_~`>\[\]()!|-]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = 'es-PE'; // Peruvian Spanish
  utterance.rate = 1.05;    // Slightly faster for youthful feel
  utterance.pitch = 1.05;   // Slightly higher for youthful tone
  const voice = getSpanishLatamMaleVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang; // Match the voice's lang
  }
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => onEnd?.();
  speechSynthesis.speak(utterance);
  return utterance;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;

const QUICK_QUESTIONS = [
  '¿Qué es el DIA 2026?',
  '¿Cómo inicio sesión?',
  '¿Cuáles son los niveles de logro?',
  '¿Qué roles existen?',
];

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  // Preload voices
  useEffect(() => {
    speechSynthesis.getVoices();
    const handler = () => speechSynthesis.getVoices();
    speechSynthesis.addEventListener('voiceschanged', handler);
    return () => speechSynthesis.removeEventListener('voiceschanged', handler);
  }, []);

  const toggleSpeak = useCallback((text: string, idx: number) => {
    if (speakingIdx === idx) {
      speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    speechSynthesis.cancel();
    setSpeakingIdx(idx);
    speakText(text, () => setSpeakingIdx(null));
  }, [speakingIdx]);

  // Stop speech when closing
  const handleClose = useCallback(() => {
    speechSynthesis.cancel();
    setSpeakingIdx(null);
    setIsOpen(false);
  }, []);

  const handleClear = useCallback(() => {
    speechSynthesis.cancel();
    setSpeakingIdx(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const streamChat = useCallback(async (allMessages: Msg[]) => {
    setIsLoading(true);
    let assistantSoFar = '';

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        upsertAssistant(errorData.error || 'Lo siento, ocurrió un error. Intenta de nuevo.');
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      if (!assistantSoFar) {
        upsertAssistant('Lo siento, no pude generar una respuesta. Intenta de nuevo.');
      }
    } catch (e) {
      console.error('Chatbot stream error:', e);
      upsertAssistant('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    streamChat(newMessages);
  }, [messages, isLoading, streamChat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center overflow-hidden"
          aria-label="Abrir asistente virtual DIA"
        >
          <img src={diaRobotImg} alt="DIA" className="h-12 w-12 object-contain" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden">
              <img src={diaRobotImg} alt="DIA" className="h-8 w-8 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">DIA · Asistente Virtual</h3>
              <p className="text-xs opacity-80"><p className="text-xs opacity-80">GRED Lambayeque · Siempre disponible</p></p>
            </div>
            <div className="flex gap-1">
              {messages.length > 0 && (
                <button
onClick={handleClear}
                  className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
                  aria-label="Limpiar chat"
                  title="Limpiar chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
                aria-label="Cerrar chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2 items-start">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                      <img src={diaRobotImg} alt="DIA" className="h-6 w-6 object-contain" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm">
                      <p className="font-medium mb-1">¡Hola! 👋 Soy DIA, tu asistente virtual</p>
                      <p className="text-muted-foreground text-xs">Estoy aquí para ayudarte con cualquier duda sobre la <p className="text-muted-foreground text-xs">Estoy aquí para ayudarte con cualquier duda sobre la plataforma de diagnóstico educativo de la GRED Lambayeque. ¿En qué puedo ayudarte?</p>. ¿En qué puedo ayudarte?</p>
                    </div>
                  </div>
                  <div className="pl-9 flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === 'user' ? 'bg-secondary/20' : 'bg-primary/10'
                  }`}>
                    {msg.role === 'user' ? <User className="h-4 w-4 text-secondary" /> : <img src={diaRobotImg} alt="DIA" className="h-6 w-6 object-contain" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div>
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        {!isLoading && (
                          <button
                            onClick={() => toggleSpeak(msg.content, i)}
                            className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            aria-label={speakingIdx === i ? 'Detener voz' : 'Escuchar respuesta'}
                          >
                            {speakingIdx === i ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                            {speakingIdx === i ? 'Detener' : 'Escuchar'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-2 items-start">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <img src={diaRobotImg} alt="DIA" className="h-6 w-6 object-contain" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-3 shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                rows={1}
                className="flex-1 resize-none bg-muted rounded-xl px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-24"
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
