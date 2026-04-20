'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatbotWidget() {
    const { user } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Chào bạn! Mình là AI Stylist. Hãy cho mình biết nhu cầu của bạn, mình sẽ tư vấn bộ trang phục phù hợp nhất!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Prevent body scroll on mobile when chat is open
    useEffect(() => {
        if (isOpen && window.innerWidth < 640) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        if (!user) {
            setMessages(prev => [...prev, { role: 'bot', content: 'Vui lòng đăng nhập để bắt đầu trò chuyện cùng AI nhé!' }]);
            return;
        }

        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'bot', content: '' }]);

        try {
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

            const response = await fetch(`${baseUrl}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userText,
                    conversationId: `session-${user?.username || 'user'}`
                }),
            });

            if (response.status === 401 || response.status === 403) {
                throw new Error('UNAUTHORIZED');
            }
            if (!response.ok) throw new Error('Network Error');

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;

            // Dùng buffer để gom các mảnh dữ liệu (chunk) bị server cắt ngang
            let buffer = '';

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                if (value) {
                    // Cộng dồn dữ liệu mới vào buffer
                    buffer += decoder.decode(value, { stream: true });

                    // SSE chuẩn luôn ngăn cách các event bằng 2 dấu xuống dòng (\n\n)
                    const parts = buffer.split('\n\n');

                    // Giữ lại phần cuối cùng (có thể chưa nhận đủ \n\n do stream đang dở)
                    buffer = parts.pop() || '';

                    for (const part of parts) {
                        // Dùng Regex xóa chữ "data:" ở đầu dòng nhưng GIỮ NGUYÊN mọi khoảng trắng và \n
                        const text = part.replace(/^data:/gm, '');

                        // Cập nhật State (Chỉ bỏ qua nếu text rỗng hoàn toàn, cho phép in ra khoảng trắng)
                        if (text !== '') {
                            setMessages(prev => {
                                const newMessages = [...prev];
                                const lastIndex = newMessages.length - 1;
                                newMessages[lastIndex] = {
                                    ...newMessages[lastIndex],
                                    content: newMessages[lastIndex].content + text
                                };
                                return newMessages;
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi Stream Chatbot:", error);
            const errorMsg = error.message === 'UNAUTHORIZED'
                ? "Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại để tiếp tục nhé!"
                : "Xin lỗi, hệ thống AI hiện tại đang quá tải. Bạn vui lòng thử lại sau nhé!";

            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = errorMsg;
                return newMessages;
            });
            if (error.message === 'UNAUTHORIZED') {
                localStorage.removeItem('token');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
            {/* TOGGLE BUTTON */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-black text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-gray-700/50 flex items-center justify-center hover:scale-105 transition-transform duration-300 group"
                    aria-label="Mở chat AI"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-12 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                </button>
            )}

            {/* CHAT WINDOW
                Mobile: fixed full-screen overlay (bottom sheet style)
                Desktop (sm+): floating panel anchored bottom-right
            */}
            {isOpen && (
                <>
                    {/* Mobile backdrop */}
                    <div
                        className="fixed inset-0 bg-black/30 sm:hidden z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className={[
                        // Base — full-screen on mobile, fixed-size panel on sm+
                        'fixed sm:absolute',
                        // Mobile: full screen with safe area, slide up from bottom
                        'inset-x-0 bottom-0 top-16 sm:inset-auto',
                        // Desktop: anchored to bottom-right of the parent fixed div
                        'sm:bottom-0 sm:right-0',
                        // Size
                        'sm:w-[26rem] sm:h-[37rem]',
                        // Shape
                        'rounded-t-3xl sm:rounded-3xl',
                        // Appearance
                        'bg-white shadow-[0_15px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-100',
                        'flex flex-col overflow-hidden',
                        // Stacking
                        'z-50',
                        // Entry animation
                        'animate-in fade-in slide-in-from-bottom-4 duration-300',
                    ].join(' ')}>

                        {/* HEADER */}
                        <div className="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black rounded-full flex items-center justify-center border-2 border-gray-100 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-white">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base sm:text-xl text-gray-900 leading-tight">AI Fashion Stylist</h3>
                                    <p className={`text-sm sm:text-lg ${user ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                        {user ? `Online | ${user.username}` : 'Vui lòng đăng nhập'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-black transition-colors p-2 rounded-full hover:bg-gray-100"
                                aria-label="Đóng chat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* MESSAGES */}
                        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#F9F9F8] flex flex-col gap-4 sm:gap-5">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[88%] sm:max-w-[85%] px-4 sm:px-5 py-3 sm:py-3.5 shadow-sm text-md leading-relaxed ${msg.role === 'user'
                                        ? 'bg-black text-white rounded-t-2xl rounded-bl-2xl rounded-tr-none font-medium'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-b-2xl rounded-tr-2xl rounded-tl-none'
                                        }`}>
                                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-li:my-0">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>

                                        {isLoading && msg.role === 'bot' && msg.content === '' && (
                                            <span className="flex gap-1.5 items-center h-5">
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* INPUT */}
                        <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0">
                            <div className="flex gap-2 items-center bg-gray-100 rounded-full p-1.5 pr-2.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder={user ? "Nhu cầu của bạn là gì?..." : "Đăng nhập để chat..."}
                                    className="flex-1 bg-transparent px-4 sm:px-5 py-2 sm:py-2.5 outline-none text-md sm:text-lg text-gray-800 placeholder:text-gray-400"
                                    disabled={isLoading || !user}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !input.trim() || !user}
                                    className="w-9 h-9 sm:w-10 sm:h-10 bg-black text-white rounded-full flex items-center justify-center disabled:bg-gray-300 transition-all hover:scale-105 shrink-0"
                                    aria-label="Gửi tin nhắn"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 transform translate-x-[1px] translate-y-[-1px]">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}