import React, { useState, useEffect } from 'react';
import { RefreshCw, Trophy, Clock, Share2, PlayCircle, AlertCircle, Heart } from 'lucide-react';

const TUBE_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 
  'bg-yellow-400', 'bg-purple-500', 'bg-pink-500', 
  'bg-orange-500', 'bg-cyan-500'
];
const TUBE_CAPACITY = 4;

export default function ColorSortPuzzle() {
  // গেমের বিভিন্ন স্টেট
  const [appState, setAppState] = useState('intro'); // intro, playing, won, gameover
  const [age, setAge] = useState('');
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem('magicSortLevel')) || 1);
  const [score, setScore] = useState(() => parseInt(localStorage.getItem('magicSortScore')) || 0);
  
  const [tubes, setTubes] = useState([]);
  const [selectedTubeIdx, setSelectedTubeIdx] = useState(null);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [shake, setShake] = useState(false); // ভুল চালের এনিমেশন

  // লোকাল স্টোরেজে লেভেল ও স্কোর সেভ করা
  useEffect(() => {
    localStorage.setItem('magicSortLevel', level);
    localStorage.setItem('magicSortScore', score);
  }, [level, score]);

  // টাইমার লজিক
  useEffect(() => {
    let timerId;
    if (appState === 'playing' && timeLeft > 0) {
      timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && appState === 'playing') {
      setAppState('gameover');
    }
    return () => clearInterval(timerId);
  }, [appState, timeLeft]);

  // লেভেল জেনারেট করার ফাংশন
  const generateLevel = (levelNum) => {
    // লেভেল অনুযায়ী ডিফিকাল্টি সেট করা
    const numColors = Math.min(3 + Math.floor((levelNum - 1) / 3), TUBE_COLORS.length);
    const totalTubes = numColors + 2; 
    
    // লেভেল অনুযায়ী সময় নির্ধারণ (বেশি রঙ = বেশি সময়)
    const timeForLevel = 60 + (numColors * 30) - (levelNum * 2); 
    setTimeLeft(Math.max(60, timeForLevel)); // কমপক্ষে ৬০ সেকেন্ড

    let allBlocks = [];
    for (let i = 0; i < numColors; i++) {
      for (let j = 0; j < TUBE_CAPACITY; j++) {
        allBlocks.push(TUBE_COLORS[i]);
      }
    }

    // শাফেল করা (Fisher-Yates)
    for (let i = allBlocks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allBlocks[i], allBlocks[j]] = [allBlocks[j], allBlocks[i]];
    }

    const initialTubes = [];
    let blockIndex = 0;
    for (let i = 0; i < numColors; i++) {
      const tube = [];
      for (let j = 0; j < TUBE_CAPACITY; j++) {
        tube.push(allBlocks[blockIndex++]);
      }
      initialTubes.push(tube);
    }
    
    initialTubes.push([]);
    initialTubes.push([]);

    setTubes(initialTubes);
    setMoves(0);
    setSelectedTubeIdx(null);
    setAppState('playing');
  };

  // জয়ের শর্ত পরীক্ষা
  useEffect(() => {
    if (appState !== 'playing' || tubes.length === 0) return;

    let won = true;
    for (let i = 0; i < tubes.length; i++) {
      const tube = tubes[i];
      if (tube.length > 0) {
        if (tube.length !== TUBE_CAPACITY) { won = false; break; }
        const firstColor = tube[0];
        if (!tube.every((color) => color === firstColor)) { won = false; break; }
      }
    }

    if (won) {
      setAppState('won');
      // সময়ের উপর ভিত্তি করে বোনাস স্কোর
      const timeBonus = Math.floor(timeLeft / 2);
      setScore(s => s + 100 + timeBonus); 
      setSelectedTubeIdx(null);
    }
  }, [tubes, appState, timeLeft]);

  // টিউবে ক্লিক লজিক
  const handleTubeClick = (idx) => {
    if (appState !== 'playing') return;

    if (selectedTubeIdx === null) {
      if (tubes[idx].length > 0) setSelectedTubeIdx(idx);
      return;
    }

    if (selectedTubeIdx === idx) {
      setSelectedTubeIdx(null);
      return;
    }

    const sourceTube = [...tubes[selectedTubeIdx]];
    const targetTube = [...tubes[idx]];

    if (sourceTube.length === 0) {
      setSelectedTubeIdx(null);
      return;
    }

    const topColor = sourceTube[sourceTube.length - 1];

    // ভুল চাল হলে একটু কাঁপবে
    if (targetTube.length === TUBE_CAPACITY || (targetTube.length > 0 && targetTube[targetTube.length - 1] !== topColor)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setSelectedTubeIdx(null);
      return;
    }

    let blocksToMove = 0;
    for (let i = sourceTube.length - 1; i >= 0; i--) {
      if (sourceTube[i] === topColor) blocksToMove++;
      else break;
    }

    const spaceInTarget = TUBE_CAPACITY - targetTube.length;
    const actualMoves = Math.min(blocksToMove, spaceInTarget);

    for (let i = 0; i < actualMoves; i++) {
      targetTube.push(sourceTube.pop());
    }

    const newTubes = [...tubes];
    newTubes[selectedTubeIdx] = sourceTube;
    newTubes[idx] = targetTube;

    setTubes(newTubes);
    setMoves((m) => m + 1);
    setSelectedTubeIdx(null);
  };

  // বয়স অনুযায়ী ফিডব্যাক মেসেজ
  const getMotivationalMessage = () => {
    const userAge = parseInt(age);
    if (userAge <= 12) return "দারুণ! তুমি তো অনেক বুদ্ধিমান! তোমার ব্রেন সুপার ফাস্ট কাজ করছে! পরের লেভেলে আরও মজা হবে।";
    if (userAge <= 18) return "চমৎকার লজিক! তোমার যৌক্তিক চিন্তাশক্তি দারুণভাবে বৃদ্ধি পাচ্ছে। এভাবেই এগিয়ে যাও!";
    return "অসাধারণ! আপনার বিশ্লেষণ ও সিদ্ধান্ত নেওয়ার ক্ষমতা চমৎকার। মস্তিষ্ককে সচল রাখতে এভাবেই খেলতে থাকুন!";
  };

  // ফেসবুক শেয়ার
  const shareOnFacebook = () => {
    const url = window.location.href; // লাইভ হওয়ার পর ডোমেইন আসবে
    const text = `আমি ম্যাজিক সর্ট গেমে লেভেল ${level} পার করেছি! আমার স্কোর ${score}। ব্রেন শার্প করার এই গেমটি আপনিও খেলে দেখুন!`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
  };

  // গেম রিস্টার্ট বা নেক্সট লেভেল
  const handleNextLevel = () => {
    setLevel(l => l + 1);
    generateLevel(level + 1);
  };

  const handleRetry = () => {
    generateLevel(level);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // UI রেন্ডার: ইন্ট্রো স্ক্রিন
  if (appState === 'intro') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
          
          <h1 className="text-4xl font-extrabold text-center mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ম্যাজিক সর্ট পাজল
          </h1>
          
          <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl mb-6">
            <h3 className="flex items-center gap-2 text-blue-300 font-bold mb-2">
              <AlertCircle className="w-5 h-5" /> শিক্ষণীয় উদ্দেশ্য
            </h3>
            <p className="text-sm text-blue-100/80 leading-relaxed text-justify">
              এই গেমটি মূলত আপনার এবং আপনার সন্তানের <strong>যৌক্তিক চিন্তাভাবনা (Logical Thinking)</strong>, <strong>সমস্যা সমাধানের দক্ষতা (Problem Solving)</strong> এবং <strong>মনোযোগ (Focus)</strong> বৃদ্ধি করার জন্য ডিজাইন করা হয়েছে। 
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-slate-300 mb-2 font-medium">আপনার সঠিক বয়স লিখুন:</label>
            <input 
              type="number" 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="যেমন: 12"
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-lg"
            />
          </div>

          <button 
            onClick={() => age ? generateLevel(level) : alert('অনুগ্রহ করে গেম শুরু করার আগে বয়স লিখুন।')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-500/30"
          >
            <PlayCircle className="w-6 h-6" /> গেম শুরু করুন
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // UI রেন্ডার: গেম বোর্ড
  return (
    <div className={`min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center py-6 px-4 selection:bg-transparent ${shake ? 'animate-pulse' : ''}`}>
      
      {/* টপ বার */}
      <div className="w-full max-w-lg flex justify-between items-end mb-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            লেভেল {level}
          </h1>
          <p className="text-slate-400 text-sm mt-1">স্কোর: {score} • চাল: {moves}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg font-bold ${timeLeft < 15 ? 'bg-red-500/20 text-red-400 animate-bounce' : 'bg-slate-700 text-slate-200'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
          <button onClick={() => generateLevel(level)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors active:scale-95" title="রিস্টার্ট">
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </button>
        </div>
      </div>

      {/* গেম বোর্ড (টিউব) */}
      <div className="flex-1 flex items-center justify-center w-full max-w-lg">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
          {tubes.map((tube, idx) => {
            const isSelected = selectedTubeIdx === idx;
            return (
              <div
                key={idx}
                onClick={() => handleTubeClick(idx)}
                className={`relative w-12 sm:w-16 h-40 sm:h-56 rounded-b-3xl border-[3px] sm:border-4 border-t-0 cursor-pointer transition-all duration-300 ease-in-out flex flex-col-reverse overflow-hidden 
                  ${isSelected ? '-translate-y-4 sm:-translate-y-6 border-blue-400 shadow-[0_10px_20px_rgba(59,130,246,0.3)]' : 'border-slate-500/50 hover:border-slate-400'}
                  bg-slate-800/40`}
              >
                <div className="absolute inset-0 w-full h-full pointer-events-none rounded-b-2xl bg-gradient-to-r from-white/10 to-transparent w-1/3"></div>
                {tube.map((color, colorIdx) => (
                  <div key={colorIdx} className={`w-full h-1/4 ${color} transition-all duration-300 relative border-t border-black/10`}>
                    <div className="absolute top-0 w-full h-1 bg-white/20"></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* গেম ওভার মডাল */}
      {appState === 'gameover' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full border border-red-500/30">
            <Clock className="w-20 h-20 text-red-500 mb-4 animate-pulse" />
            <h2 className="text-3xl font-bold text-white mb-2">সময় শেষ!</h2>
            <p className="text-slate-300 text-center mb-6">লজিক মেলাতে একটু বেশি সময় লেগে গেছে। চিন্তার কিছু নেই, আবার চেষ্টা করুন!</p>
            <button onClick={handleRetry} className="w-full py-4 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-blue-500/30">
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      )}

      {/* জয়ের মডাল */}
      {appState === 'won' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full border border-yellow-500/30 animate-in zoom-in duration-300">
            <Trophy className="w-24 h-24 text-yellow-400 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            <h2 className="text-3xl font-extrabold text-white mb-2 bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">লেভেল কমপ্লিট!</h2>
            
            <div className="bg-slate-900/50 p-4 rounded-xl w-full mb-6 border border-slate-700">
              <p className="text-slate-200 text-center text-lg italic">
                "{getMotivationalMessage()}"
              </p>
            </div>

            <p className="text-slate-400 mb-6 font-mono text-lg">মোট স্কোর: <span className="text-blue-400 font-bold">{score}</span></p>
            
            <div className="flex flex-col gap-3 w-full">
              <button onClick={handleNextLevel} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-bold text-lg transition-colors shadow-lg">
                পরবর্তী লেভেল খেলুন
              </button>
              <button onClick={shareOnFacebook} className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" /> ফেসবুকে শেয়ার করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// ফুটার কম্পোনেন্ট
function Footer() {
  return (
    <div className="mt-8 text-center text-slate-500 text-xs sm:text-sm max-w-md">
      <div className="flex items-center justify-center gap-1 mb-1">
        Made with <Heart className="w-4 h-4 text-red-500 inline animate-pulse" /> for Education
      </div>
      <p className="font-semibold text-slate-400">
        পরিকল্পনা ও নির্দেশনায়: <span className="text-blue-400">মোঃ মঞ্জুরুল হক</span>
      </p>
      <p>প্রাবন্ধিক অর্থনীতি, জিয়াউদ্দিন স্কুল এন্ড কলেজ, কিশোরগঞ্জ</p>
    </div>
  );
}