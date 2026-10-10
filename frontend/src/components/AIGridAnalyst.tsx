import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { analyzeLatestTick, type AnalystResponse } from '../services/api';

interface AIGridAnalystProps {
  tickNonce?: number;
}

type Message = { id: number; role: 'user' | 'assistant'; text: string };

export const AIGridAnalyst: React.FC<AIGridAnalystProps> = ({ tickNonce }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [analysis, setAnalysis] = useState<AnalystResponse | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const lastAutoTick = useRef<number | undefined>(undefined);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingText, loading]);

  useEffect(() => {
    if (!streamingText) return;
    let index = 0;
    setMessages((current) => current.filter((message) => message.id !== -1));
    const timer = window.setInterval(() => {
      index = Math.min(index + 3, streamingText.length);
      setMessages((current) => [
        ...current.filter((message) => message.id !== -1),
        { id: -1, role: 'assistant', text: streamingText.slice(0, index) },
      ]);
      if (index >= streamingText.length) {
        window.clearInterval(timer);
        setMessages((current) => current.map((message) =>
          message.id === -1 ? { ...message, id: ++sequence.current } : message,
        ));
        setStreamingText('');
      }
    }, 18);
    return () => window.clearInterval(timer);
  }, [streamingText]);

  const runAnalysis = async (userQuestion?: string) => {
    if (loading) return;
    const prompt = userQuestion?.trim();
    if (prompt) setMessages((current) => [...current, { id: ++sequence.current, role: 'user', text: prompt }]);
    setLoading(true);
    setError('');
    setQuestion('');
    try {
      const result = await analyzeLatestTick(prompt);
      setAnalysis(result);
      const answer = [
        result.what_happened,
        result.why,
        ...result.recommendations.map((item) => `${item.text}${item.evidence ? ` (Evidence: ${item.evidence})` : ''}`),
        result.answer,
      ].filter(Boolean).join('\n\n') || 'The analyst returned no explanation.';
      setStreamingText(answer);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'AI analysis failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tickNonce === undefined || tickNonce === 0 || lastAutoTick.current === tickNonce) return;
    lastAutoTick.current = tickNonce;
    void runAnalysis();
  }, [tickNonce]);

  const onAsk = (event: FormEvent) => {
    event.preventDefault();
    if (question.trim()) void runAnalysis(question);
  };

  return (
    <section className="border-y border-slate-200 py-5 space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">AI Grid Analyst</p>
        <h3 className="text-lg font-semibold text-slate-950">Ask about the latest coordination tick</h3>
        <p className="text-sm text-slate-600">Answers use the backend's latest tick snapshot and do not apply grid actions.</p>
      </div>

      <div ref={transcriptRef} aria-live="polite" className="h-64 overflow-y-auto border border-slate-200 bg-slate-50 p-3 space-y-3">
        {messages.length === 0 && !loading && <p className="text-sm text-slate-500">Run a coordination tick, then ask a question about its results.</p>}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[85%] whitespace-pre-wrap px-3 py-2 text-sm ${message.role === 'user' ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
              {message.text}
            </p>
          </div>
        ))}
        {loading && <p className="text-sm text-slate-500">Analyst is thinking…</p>}
        {error && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>

      <form onSubmit={onAsk} className="flex gap-2">
        <input value={question} onChange={(event) => setQuestion(event.target.value)} disabled={loading} placeholder="Ask about a decision or SafetyGate result" className="min-w-0 flex-1 border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400" />
        <button type="submit" disabled={loading || !question.trim()} className="border border-blue-700 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-50">Send</button>
      </form>
      {analysis?.tick !== undefined && <p className="text-xs text-slate-500">Snapshot: coordination tick {analysis.tick}</p>}
    </section>
  );
};
