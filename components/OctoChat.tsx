import React, { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/app';
import { RoomData, ChatMessage } from '../types';
import { initializeOctoChat, sendMessageToOcto } from '../services/geminiService';
import { Send, X } from 'lucide-react';

interface OctoChatProps {
    user: firebase.User;
    roomData: RoomData | null;
}

const OctoChat: React.FC<OctoChatProps> = ({ user, roomData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current && user.displayName) {
            initializeOctoChat(user.displayName);
            setMessages([
                { role: 'model', text: `Blub Blub! 🐙 Hallo ${user.displayName.split(' ')[0]}! Ich bin Octo. Wie geht's deinem Garten?` }
            ]);
            initialized.current = true;
        }
    }, [user.displayName]);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { scrollToBottom(); }, [messages, isOpen, isTyping]);

    const handleSend = async () => {
        if(!input.trim()) return;
        
        const userText = input;
        setInput("");
        
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsTyping(true);
        
        const reply = await sendMessageToOcto(userText);
        
        setMessages(prev => [...prev, { role: 'model', text: reply }]);
        setIsTyping(false);
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)} 
                className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 bg-white p-2 rounded-full shadow-xl border-4 border-purple-200 animate-bounce hover:scale-110 transition-transform"
            >
                <img 
                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Octopus.png" 
                    className="w-10 h-10" 
                    alt="Octo" 
                />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center pointer-events-none">
                    <div className="bg-white w-full md:w-[380px] h-[70vh] md:h-[550px] md:rounded-3xl shadow-2xl flex flex-col pointer-events-auto animate-pop border m-0 md:m-4 overflow-hidden">
                        <div className="bg-purple-600 p-4 text-white flex justify-between items-center shadow-md">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="text-2xl">🐙</span> Octo AI
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-purple-700 p-1 rounded">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white border text-gray-800 shadow-sm rounded-bl-none'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex items-center gap-2 text-xs text-gray-400 ml-4 animate-pulse">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                                    Octo denkt...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        <div className="p-3 bg-white border-t flex gap-2">
                            <input 
                                value={input} 
                                onChange={e => setInput(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && handleSend()} 
                                placeholder="Frag Octo etwas..." 
                                className="flex-1 bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-200 transition-all" 
                            />
                            <button 
                                onClick={handleSend} 
                                disabled={!input.trim() || isTyping}
                                className="bg-purple-600 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-purple-700 transition-colors"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OctoChat;