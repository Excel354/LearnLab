import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { Logo } from '../Logo';
import { StudentProfile, StudyBuddyMessage, StudyBuddyDailyLimit } from '../../types';
import { formatMathPowerText } from '../../utils/mathFormat';

interface StudyBuddyModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  limit: StudyBuddyDailyLimit;
  onUpdateLimit: (limit: StudyBuddyDailyLimit) => void;
  initialContext?: string;
}

export const StudyBuddyModal: React.FC<StudyBuddyModalProps> = ({
  isOpen,
  onClose,
  profile,
  limit,
  onUpdateLimit,
  initialContext,
}) => {
  const [messages, setMessages] = useState<StudyBuddyMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Hello ${profile.name}! 👋 I am your LearnLab StudyBuddy AI tutor. Ask me any questions about your homework, school topics, or upcoming exams, and I'll break them down step-by-step for you!`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [readingMessageId, setReadingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Insert initial context if passed (e.g. from a note or mistake)
  useEffect(() => {
    if (initialContext && isOpen) {
      setInputPrompt(initialContext);
    }
  }, [initialContext, isOpen]);

  if (!isOpen) return null;

  const isLimitReached = limit.usedCount >= limit.maxLimit;

  // Send Question to StudyBuddy AI endpoint
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isSending) return;

    if (isLimitReached) {
      return;
    }

    const userMsg: StudyBuddyMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/studybuddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          studentName: profile.name,
          educationLevel: profile.educationLevel,
          grade: profile.grade,
          country: profile.country,
          conversationHistory: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const aiMsg: StudyBuddyMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Increment daily reply usage
        const newLimit: StudyBuddyDailyLimit = {
          ...limit,
          usedCount: limit.usedCount + 1,
        };
        onUpdateLimit(newLimit);
      } else {
        throw new Error(data.error || 'Failed to receive tutor explanation.');
      }
    } catch (err: any) {
      console.error('StudyBuddy error:', err);
      const errMsg: StudyBuddyMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: "I'm having a brief connection hitch. Please ask again in a moment!",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Read message aloud
  const handleSpeakText = (msgId: string, text: string) => {
    if (!synthRef.current) return;

    if (readingMessageId === msgId) {
      synthRef.current.cancel();
      setReadingMessageId(null);
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.onend = () => setReadingMessageId(null);
    utterance.onerror = () => setReadingMessageId(null);

    setReadingMessageId(msgId);
    synthRef.current.speak(utterance);
  };

  const samplePrompts = [
    'How do I calculate kinetic energy with an example?',
    'Explain the Calvin cycle in plant photosynthesis simply.',
    'Give me 3 memory tricks for the periodic table.',
    'How can I answer WAEC essay questions effectively?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl h-[90vh] max-h-[700px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">StudyBuddy AI Tutor</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-indigo-200">
                Level-Adapted for {profile.grade} • {profile.country}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Visible Daily Reply Meter (Mandated in Section 41) */}
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/15 text-right">
              <span className="text-[10px] font-bold text-indigo-200 uppercase block">
                Daily Meter
              </span>
              <span className="text-xs font-bold text-white">
                {limit.usedCount} / {limit.maxLimit} replies used
              </span>
            </div>

            <button
              id="close-studybuddy-btn"
              onClick={() => {
                if (synthRef.current) synthRef.current.cancel();
                onClose();
              }}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isAi ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-900 text-white'
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isAi
                        ? 'bg-white text-slate-800 border border-slate-100 shadow-xs'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{formatMathPowerText(msg.text)}</p>
                  </div>

                  {isAi && (
                    <div className="flex items-center gap-2 pt-0.5 px-1">
                      <button
                        onClick={() => handleSpeakText(msg.id, msg.text)}
                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                      >
                        {readingMessageId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-rose-500" />
                            <span className="text-rose-600 font-bold">Stop Speaking</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Read Aloud</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 mr-auto max-w-[85%] items-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
                <span>StudyBuddy is thinking and structuring explanation...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Daily Limit Notice when reached */}
        {isLimitReached && (
          <div className="p-3.5 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              You have reached your daily limit of {limit.maxLimit} StudyBuddy replies today. Your quota will reset automatically at midnight!
            </span>
          </div>
        )}

        {/* Suggested Quick Prompts */}
        {messages.length <= 2 && !isLimitReached && (
          <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
            <span className="font-bold text-slate-500 text-[10px] uppercase">Suggestions:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="studybuddy-input-field"
              type="text"
              disabled={isSending || isLimitReached}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                isLimitReached
                  ? 'Daily reply quota reached. Resets at midnight.'
                  : 'Ask StudyBuddy a topic, homework question, or for study tips...'
              }
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            />

            <button
              id="studybuddy-send-btn"
              type="submit"
              disabled={isSending || !inputPrompt.trim() || isLimitReached}
              className={`p-3 rounded-xl text-white transition-all shadow-md ${
                isSending || !inputPrompt.trim() || isLimitReached
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
