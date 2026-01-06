
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useTheme, useI18n } from './contexts';
import { Staff } from './types';

interface AiAssistantProps {
  user: Staff;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ user }) => {
  const { theme } = useTheme();
  const { t } = useI18n();
  // Removed isOpen, isMinimized states as it's now a dedicated page
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Refs for API client and chat session
  const aiClientRef = useRef<GoogleGenAI | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  // System Instruction tailored for Alliance DigiKiosk
  const systemInstruction = `
    You are the intelligent assistant for ALLIANCE DigiKiosk, a Point of Sale and management system.
    Your goal is to help staff (Cashiers, Managers, Admins) operate the system efficiently.

    **Current User Context:**
    - Name: ${user.full_name}
    - Role: ${user.role}

    **System Features & Knowledge Base:**
    1. **POS (Point of Sale):**
       - Function: Sell Products (Phones, Accessories) and IT Services.
       - Features: Cart management, Product Search.
       - Payments: Supports Cash, Mobile Money (TMoney, Flooz), and Cards.
       - Receipt: Generates transaction receipts automatically.

    2. **Catalog:**
       - Items: Have SKU, Name, Category, Price.
       - Types: 'PRODUCT' (Stock tracked, e.g., Phones) vs 'SERVICE' (No stock, e.g., Printing).
       - Categories: PHONE, ACCESSORY, IT_SERVICE, CUSTOMER_SERVICE, SIM, RECHARGE, CODE.

    3. **Transfers (Mobile Money):**
       - Operations: Deposit (IN) and Withdrawal (OUT).
       - Providers: TMoney (Togocom) and Flooz (Moov).
       - Features: Logs transaction amount, fees, and commissions.

    4. **Expenses:**
       - Function: Track operational shop costs.
       - Categories: Rent, Electricity, Water, Internet, Salaries, Supplies, Transport.
       - Data: Logs amount, description, date, and user.

    5. **Tickets:**
       - Purpose: Track repairs ('IT') or admin tasks ('CUSTOMER_SERVICE').
       - Workflow: Status goes from OPEN -> IN_PROGRESS -> DONE.
       - Details: Priority (LOW/MEDIUM/HIGH), Customer Name, Assigned Staff.

    6. **Staff Management:**
       - Roles: ROOT (Super Admin), MANAGER (Shop Manager), CASHIER.
       - Security: Login via 4-digit PIN. Root admin cannot be deleted.

    **Guidelines:**
    - Be professional, concise, and helpful.
    - If the user asks how to do something, provide step-by-step guidance based on the app's UI.
    - If the user asks about data (e.g., "How many sales today?"), explain that you cannot access real-time DB data yet, but guide them to the Dashboard or Reports page.
    - Respond in the same language as the user (English or French).
  `;

  // Initialize Chat Session
  useEffect(() => {
    if (process.env.API_KEY) {
      try {
        aiClientRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatSessionRef.current = aiClientRef.current.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: systemInstruction,
          },
        });
        
        // Add initial welcome message locally
        setMessages([{ role: 'model', text: t('ai.welcome') }]);
      } catch (error) {
        console.error("Failed to initialize AI client", error);
        setMessages([{ role: 'model', text: "Error: AI Service unavailable (API Key issue)." }]);
      }
    } else {
      setMessages([{ role: 'model', text: "Configuration Error: API Key missing." }]);
    }
  }, [user.id, t]); // Re-init if user changes or lang changes

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Send message to Gemini
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({
        message: userMsg
      });
      
      const text = result.text;
      if (text) {
        setMessages(prev => [...prev, { role: 'model', text: text }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "(No response generated)" }]);
      }
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDark = theme === 'blue-dark';

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Sparkles className={isDark ? 'text-dark-accent' : 'text-light-accent'} />
            {t('ai.title')}
        </h1>
      </div>

      {/* Main Chat Area */}
      <div 
        className={`flex-1 flex flex-col rounded-xl border shadow-sm overflow-hidden
          ${isDark ? 'bg-dark-surface border-gray-700' : 'bg-white border-gray-200'}
        `}
      >
        {/* Messages List */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDark ? 'bg-dark-bg/30' : 'bg-gray-50/50'}`}>
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                        className={`max-w-[80%] p-4 rounded-2xl whitespace-pre-wrap shadow-sm
                            ${msg.role === 'user' 
                                ? (isDark ? 'bg-dark-primary text-white rounded-tr-none' : 'bg-light-primary text-white rounded-tr-none') 
                                : (isDark ? 'bg-gray-700 text-gray-100 rounded-tl-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none')
                            }
                        `}
                    >
                        {msg.text}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className={`p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-sm opacity-80 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white border border-gray-200 text-gray-500'}`}>
                        <Loader2 size={16} className="animate-spin" />
                        {t('ai.thinking')}
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
            <div className={`flex items-center gap-2 p-2 rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-opacity-50
                ${isDark ? 'bg-dark-bg border-gray-600 focus-within:ring-dark-primary' : 'bg-gray-50 border-gray-200 focus-within:ring-light-primary'}
            `}>
                <input 
                    className={`flex-1 bg-transparent outline-none p-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                    placeholder={t('ai.placeholder')}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    autoFocus
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className={`p-3 rounded-xl transition-colors ${isDark ? 'bg-dark-primary text-white hover:bg-opacity-90' : 'bg-light-primary text-white hover:bg-opacity-90'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
