import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

export interface FormFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  placeholder?: string;
}

interface ChatFillsFormPanelProps {
  title: string;
  description: string;
  fields: FormFieldDef[];
  /** Endpoint on apps/server that returns { reply, extracted } given the chat history */
  extractEndpoint: string;
  values: Record<string, string>;
  onValuesChange: (values: Record<string, string>) => void;
  onSubmit: () => void;
  submitLabel: string;
}

/**
 * Left: live form. Right: AI chat. Each user chat turn is sent to
 * `extractEndpoint` on apps/server, which asks Claude to (a) reply
 * conversationally and (b) return structured field values extracted
 * from the conversation so far. The form re-renders from the merged
 * extraction on every turn.
 */
export function ChatFillsFormPanel({
  title,
  description,
  fields,
  extractEndpoint,
  values,
  onValuesChange,
  onSubmit,
  submitLabel,
}: ChatFillsFormPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Tell me about this in your own words — I'll fill out the form as we go. ${description}`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const allFilled = fields.every((f) => values[f.key]?.trim());

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch(extractEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          fields: fields.map((f) => f.key),
          currentValues: values,
        }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data: { reply: string; extracted: Record<string, string> } = await res.json();

      onValuesChange({ ...values, ...data.extracted });
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            "I couldn't reach the assistant service just now. You can keep typing, or fill the form fields directly on the left.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: live form */}
      <div className="border border-charcoal/15 p-6">
        <div className="text-2xl font-bold text-charcoal mb-1">{title}</div>
        <p className="text-base text-charcoal/60 mb-6">{description}</p>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={values[field.key] ?? ''}
                  onChange={(e) => onValuesChange({ ...values, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none resize-none"
                />
              ) : field.type === 'select' ? (
                <select
                  value={values[field.key] ?? ''}
                  onChange={(e) => onValuesChange({ ...values, [field.key]: e.target.value })}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none bg-white"
                >
                  <option value="">Select…</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={values[field.key] ?? ''}
                  onChange={(e) => onValuesChange({ ...values, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full border border-charcoal/20 px-3 py-2.5 text-base focus:border-navy outline-none"
                />
              )}
            </div>
          ))}
        </div>

        <Button className="w-full mt-6" size="lg" disabled={!allFilled} onClick={onSubmit}>
          {submitLabel}
        </Button>
        {!allFilled && (
          <p className="text-sm text-charcoal/50 mt-2 text-center">
            Fill in every field (via chat or directly) to continue.
          </p>
        )}
      </div>

      {/* Right: AI chat */}
      <div className="border border-teal/30 bg-teal/[0.03] flex flex-col h-[520px]">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-teal/20">
          <Sparkles size={18} className="text-teal" strokeWidth={2} />
          <span className="text-md font-bold text-charcoal">VivanteCare Assistant</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'max-w-[85%] px-3.5 py-2.5 text-base',
                m.role === 'user'
                  ? 'ml-auto bg-navy text-white'
                  : 'bg-white border border-charcoal/10 text-charcoal'
              )}
            >
              {m.content}
            </div>
          ))}
          {isSending && (
            <div className="bg-white border border-charcoal/10 text-charcoal/50 max-w-[60%] px-3.5 py-2.5 text-base">
              Thinking…
            </div>
          )}
        </div>

        <div className="border-t border-teal/20 p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type here…"
            className="flex-1 border border-charcoal/20 px-3 py-2 text-base outline-none focus:border-teal"
          />
          <Button size="md" onClick={handleSend} disabled={isSending || !input.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
