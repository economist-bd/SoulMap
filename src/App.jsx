import React, { useState, useEffect, useRef } from 'react';
import { Heart, Wind, BookOpen, Home, Send, Smile, Frown, Meh, Sun, Sparkles, Loader2, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [mood, setMood] = useState(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [breathePhase, setBreathePhase] = useState('শ্বাস নিন');
  const [breatheTimer, setBreatheTimer] = useState(0);
  const messagesEndRef = useRef(null);

  // Initial Chat History
  const [journalEntries, setJournalEntries] = useState([
    { id: 1, text: "নমস্কার! আমি আপনার 'মনের শান্তি' এআই সহকারী। আজকের দিনটি আপনার কেমন কাটছে? মনের কোনো কথা শেয়ার করতে চাইলে নির্দ্বিধায় লিখতে পারেন।", sender: "ai", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [journalEntries]);

  // --- Real Gemini API Integration ---
  const fetchGeminiResponse = async (userMessage) => {
    setIsLoading(true);
    
    // The execution environment provides the key at runtime for this canvas.
    // In real life, use: const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // .env ফাইল থেকে API Key কল করা হচ্ছে
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const systemPrompt = `
      তুমি একজন সহানুভূতিশীল, বন্ধুবৎসল এবং জ্ঞানগর্ভ মানসিক স্বাস্থ্য গাইড। তোমার নাম 'SoulGuide'। 
      ব্যবহারকারী তার দৈনন্দিন জীবনের চাপ, ক্লান্তি বা অনুভূতির কথা জানাবে। 
      তোমার দায়িত্ব হলো তাকে সান্ত্বনা দেওয়া, মোটিভেট করা এবং শান্ত থাকতে সাহায্য করা। 
      অবশ্যই বাংলায় উত্তর দেবে। উত্তরগুলো ২-৩ লাইনের মধ্যে সংক্ষিপ্ত, মধুর এবং খুব আন্তরিক হবে।
    `;

    const payload = {
      contents: [{ parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    // Exponential Backoff Retry Logic
    const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('API Error');
        return await response.json();
      } catch (error) {
        if (retries === 0) throw error;
        await new Promise(res => setTimeout(res, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
    };

    try {
      const data = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiText) {
        setJournalEntries(prev => [...prev, {
          id: Date.now() + 1,
          text: aiText,
          sender: "ai",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setJournalEntries(prev => [...prev, {
        id: Date.now() + 1,
        text: "দুঃখিত, এই মুহূর্তে আমি সংযোগ করতে পারছি না। দয়া করে একটু পর আবার চেষ্টা করুন।",
        sender: "ai",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText;
    
    // Add User Message
    setJournalEntries(prev => [...prev, {
      id: Date.now(),
      text: userMessage,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    
    setInputText("");
    
    // Call API
    await fetchGeminiResponse(userMessage);
  };

  // --- Breathing Exercise Logic ---
  useEffect(() => {
    let interval;
    if (activeTab === 'breathe') {
      let time = 0;
      interval = setInterval(() => {
        time = (time + 1) % 16; // 4s Inhale, 4s Hold, 8s Exhale
        setBreatheTimer(time);
        if (time < 4) {
          setBreathePhase('গভীর শ্বাস নিন...');
        } else if (time < 8) {
          setBreathePhase('ধরে রাখুন...');
        } else {
          setBreathePhase('ধীরে ধীরে শ্বাস ছাড়ুন...');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);


  // ---- Components ----

  const renderHomeTab = () => (
    <div className="p-6 space-y-8 animate-fade-in relative">
      
      {/* PWA Install App Simulation Header */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">অ্যাপ হিসেবে ইনস্টল করুন</span>
         </div>
         <button className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-700 transition">
            <Download className="w-3 h-3" /> ইনস্টল
         </button>
      </div>

      <div className="text-center mt-2">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">স্বাগতম!</h1>
        <p className="text-stone-500">অভ্যন্তরীণ শান্তি আনলক করুন, চাপ ঝেড়ে ফেলুন।</p>
      </div>

      {/* Hero Image / Vibe */}
      <div className="bg-gradient-to-br from-amber-200 to-orange-300 rounded-3xl p-6 shadow-lg text-stone-800 relative overflow-hidden h-48 flex items-center justify-center">
        <Sun className="absolute -top-6 -right-6 text-white opacity-40 w-32 h-32" />
        <p className="text-xl font-medium text-center z-10 leading-relaxed">
          "শান্তি আসে ভেতর থেকে,<br/>বাইরে এটি খুঁজবেন না।" <br/>
          <span className="text-sm mt-3 block font-semibold text-orange-900">- গৌতম বুদ্ধ</span>
        </p>
      </div>

      {/* Mood Tracker */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h3 className="text-lg font-semibold text-stone-700 mb-4 text-center">আজ আপনার মেজাজ কেমন?</h3>
        <div className="flex justify-around">
          <button onClick={() => setMood('happy')} className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${mood === 'happy' ? 'bg-emerald-100 text-emerald-700 scale-110 shadow-sm' : 'text-stone-400 hover:bg-stone-50'}`}>
            <Smile className="w-10 h-10 mb-2" />
            <span className="text-sm font-medium">ভালো</span>
          </button>
          <button onClick={() => setMood('neutral')} className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${mood === 'neutral' ? 'bg-amber-100 text-amber-700 scale-110 shadow-sm' : 'text-stone-400 hover:bg-stone-50'}`}>
            <Meh className="w-10 h-10 mb-2" />
            <span className="text-sm font-medium">স্বাভাবিক</span>
          </button>
          <button onClick={() => setMood('sad')} className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${mood === 'sad' ? 'bg-rose-100 text-rose-700 scale-110 shadow-sm' : 'text-stone-400 hover:bg-stone-50'}`}>
            <Frown className="w-10 h-10 mb-2" />
            <span className="text-sm font-medium">খারাপ</span>
          </button>
        </div>
        {mood && <p className="text-center text-sm font-medium text-emerald-600 mt-4 animate-pulse">আপনার অনুভূতি রেকর্ড করা হয়েছে!</p>}
      </div>
    </div>
  );

  const renderBreatheTab = () => (
    <div className="p-6 h-full flex flex-col items-center justify-center space-y-12 mt-12 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-stone-800">মন শান্ত করুন</h2>
        <p className="text-stone-500 mt-2 text-sm">বৃত্তটির অ্যানিমেশন অনুসরণ করে শ্বাস নিন</p>
      </div>

      {/* Breathing Circle Animation */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <div className={`absolute w-full h-full bg-emerald-200 rounded-full opacity-40 transition-transform duration-1000 ease-in-out ${breatheTimer < 4 ? 'scale-110' : breatheTimer < 8 ? 'scale-110' : 'scale-50'}`}></div>
        <div className={`absolute w-48 h-48 bg-emerald-300 rounded-full opacity-50 transition-transform duration-1000 ease-in-out ${breatheTimer < 4 ? 'scale-125' : breatheTimer < 8 ? 'scale-125' : 'scale-75'}`}></div>
        <div className="relative w-36 h-36 bg-emerald-500 rounded-full shadow-xl flex items-center justify-center z-10 transition-transform duration-1000">
           <Wind className="w-12 h-12 text-white" />
        </div>
      </div>

      <div className="text-2xl font-medium text-emerald-700 h-8">
        {breathePhase}
      </div>
    </div>
  );

  const renderJournalTab = () => (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-stone-50 animate-fade-in">
      <div className="p-4 bg-white shadow-sm z-10 flex flex-col items-center border-b border-stone-100">
        <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-stone-800">এআই থেরাপিস্ট</h2>
        </div>
        <p className="text-xs text-stone-500 mt-1">আপনার মনের কথা নির্ভয়ে শেয়ার করুন</p>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {journalEntries.map((entry) => (
          <div key={entry.id} className={`flex ${entry.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm ${entry.sender === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-stone-700 border border-stone-200 rounded-bl-none'}`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{entry.text}</p>
              <p className={`text-[10px] mt-1.5 text-right font-medium ${entry.sender === 'user' ? 'text-emerald-200' : 'text-stone-400'}`}>{entry.time}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3.5 rounded-2xl bg-white text-stone-700 border border-stone-200 rounded-bl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-sm text-stone-500">SoulGuide ভাবছে...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-stone-200 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "অপেক্ষা করুন..." : "আপনার মনের কথা লিখুন..."}
            className="flex-1 px-4 py-3 bg-stone-100 border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputText.trim()} 
            className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition shadow-md disabled:opacity-50 disabled:hover:bg-emerald-600"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="bg-stone-300 min-h-screen font-sans flex justify-center items-center">
      {/* Mobile App Container - Simulated Device */}
      <div className="w-full max-w-md bg-[#faf9f6] h-[100dvh] sm:h-[90vh] sm:rounded-[2.5rem] sm:border-8 sm:border-stone-800 shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'breathe' && <BreatheTab />}
          {activeTab === 'journal' && <JournalTab />}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full bg-white border-t border-stone-200 px-6 py-3 flex justify-between items-center z-50 rounded-b-[2rem] sm:pb-4">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 transition-all duration-300 ${activeTab === 'home' ? 'text-emerald-600 -translate-y-1' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">হোম</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('breathe')}
            className={`flex flex-col items-center p-2 transition-all duration-300 ${activeTab === 'breathe' ? 'text-emerald-600 -translate-y-1' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <Wind className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">রিলাক্স</span>
          </button>

          <button 
            onClick={() => setActiveTab('journal')}
            className={`flex flex-col items-center p-2 transition-all duration-300 ${activeTab === 'journal' ? 'text-emerald-600 -translate-y-1' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <BookOpen className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">এআই থেরাপি</span>
          </button>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
    </div>
  );
}