import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ChatMessage, ScheduleRule } from '@/types';

interface ScheduleChatPanelProps {
  title: string;
  description: string;
  /** Endpoint on apps/server that returns { reply, rules } given the chat history and current rules. */
  extractEndpoint: string;
  /** Short description of whose schedule this is, embedded in the extraction system prompt (e.g. "a healthcare worker's own availability"). */
  context?: string;
  rules: ScheduleRule[];
  onRulesChange: (rules: ScheduleRule[]) => void;
  onSubmit: () => void;
  submitLabel: string;
  /** Hide the Available/Occupied badge for single-purpose lists (e.g. shift demand, which has no "kind"). */
  showKindBadge?: boolean;
  /** Cap the list at N rules — a shift request is one recurrence, so NewShiftPage passes 1. */
  maxRules?: number;
  /** Extra condition (beyond having ≥1 rule) that must be true before submitLabel is enabled, e.g. other required fields on the page. */
  submitDisabled?: boolean;
  /** Shown under the disabled submit button instead of the default hint, when submitDisabled is true. */
  disabledHint?: string;
}

/**
 * Sibling of ChatFillsFormPanel: same left-form/right-chat layout, but the
 * left side is a growing list of recurring time-window rules (built from
 * free-form chat like "weekends in August, 7am-7pm") instead of flat form
 * fields. The server maintains the full current rule list each turn, so
 * the client just replaces its rules with whatever comes back.
 */
export function ScheduleChatPanel({
  title,
  description,
  extractEndpoint,
  context,
  rules,
  onRulesChange,
  onSubmit,
  submitLabel,
  showKindBadge = true,
  maxRules,
  submitDisabled = false,
  disabledHint,
}: ScheduleChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Tell me about this in your own words — I'll build the list as we go. ${description}`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
          existingRules: rules,
          context,
        }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data: { reply: string; rules: ScheduleRule[] } = await res.json();

      const withIds = (data.rules ?? []).map((r) => ({ ...r, id: r.id ?? crypto.randomUUID() }));
      onRulesChange(maxRules ? withIds.slice(0, maxRules) : withIds);
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
            "I couldn't reach the assistant service just now. You can keep typing, or remove/re-describe entries once it's back.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: rule list */}
      <div className="border border-charcoal/15 p-6">
        <div className="text-2xl font-bold text-charcoal mb-1">{title}</div>
        <p className="text-base text-charcoal/60 mb-6">{description}</p>

        {rules.length === 0 ? (
          <p className="text-base text-charcoal/50 italic py-4">
            Nothing yet — describe it in the chat and entries will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="border border-charcoal/15 p-3 flex items-start justify-between gap-3">
                <div>
                  {showKindBadge && (
                    <span
                      className={cn(
                        'text-xs font-bold uppercase px-2 py-0.5 mr-2 inline-block mb-1',
                        rule.kind === 'available' ? 'bg-teal/10 text-teal' : 'bg-charcoal/10 text-charcoal/70'
                      )}
                    >
                      {rule.kind === 'available' ? 'Available' : 'Occupied'}
                    </span>
                  )}
                  <div className="text-base text-charcoal">{rule.label}</div>
                </div>
                <button
                  onClick={() => onRulesChange(rules.filter((r) => r.id !== rule.id))}
                  className="text-charcoal/40 hover:text-red-600 shrink-0"
                  aria-label="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button className="w-full mt-6" size="lg" disabled={rules.length === 0 || submitDisabled} onClick={onSubmit}>
          {submitLabel}
        </Button>
        {rules.length === 0 ? (
          <p className="text-sm text-charcoal/50 mt-2 text-center">
            Add at least one entry via chat to continue.
          </p>
        ) : (
          submitDisabled &&
          disabledHint && <p className="text-sm text-charcoal/50 mt-2 text-center">{disabledHint}</p>
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
