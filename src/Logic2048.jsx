import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RefreshCw, AlertCircle, PlayCircle, Share2, Heart, TrendingUp } from 'lucide-react';

// টাইলসের রঙের কনফিগারেশন
const TILE_COLORS = {
  2: 'bg-slate-200 text-slate-800',
  4: 'bg-slate-300 text-slate-800',
  8: 'bg-orange-300 text-white',
  16: 'bg-orange-400 text-white shadow-[0_0_10px_rgba(251,146,60,0.5)]',
  32: 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.6)]',
  64: 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.7)]',
  128: 'bg-yellow-300 text-slate-800 shadow-[0_0_20px_rgba(253,224,71,0.8)] text-3xl',
  256: 'bg-yellow-400 text-slate-800 shadow-[0_0_25px_rgba(250,204,21,0.8)] text-3xl',
  512: 'bg-yellow-500 text-white shadow-[0_0_30px_rgba(234,179,8,0.9)] text-3xl',
  1024: 'bg-emerald-400 text-white shadow-[0_0_35px_rgba(52,211,153,0.9)] text-2xl',
  2048: 'bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,1)] text-2xl',
};

const BOARD_SIZE = 4;

export default function Logic2048() {
  const [appState, setAppState] = useState('intro'); // intro, playing, won, gameover
  const [age, setAge] = useState('');
  const [board, setBoard] = useState(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('logic2048HighScore')) || 0);
  
  // সোয়াইপ ডিটেকশনের জন্য স্টেট
  const [touchStart, setTouchStart] = useState({ x: null, y: null });

  // হাইস্কোর সেভ করা
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('logic2048HighScore', score);
    }
  }, [score, highScore]);

  // নতুন বোর্ড শুরু করা
  const initializeBoard = () => {
    let newBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setAppState('playing');
  };

  // খালি ঘরে ২ বা ৪ যোগ করা
  const addRandomTile = (currentBoard) => {
    const emptyCells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    
    if (emptyCells.length === 0) return currentBoard;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map(row => [...row]);
    // 90% চান্স ২ আসার, 10% চান্স ৪ আসার
    newBoard[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  // গেম ওভার এবং জয়ের শর্ত চেক
  const checkGameState = (currentBoard) => {
    // জয়ের চেক (২০৪৮ হয়েছে কিনা)
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === 2048 && appState !== 'won') {
          setAppState('won');
          return;
        }
      }
    }

    // গেম ওভার চেক (কোনো খালি ঘর নেই এবং পাশাপাশি মেলানো সম্ভব নয়)
    let isGameOver = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === 0) {
          isGameOver = false;
          break;
        }
        if (c < BOARD_SIZE - 1 && currentBoard[r][c] === currentBoard[r][c + 1]) isGameOver = false;
        if (r < BOARD_SIZE - 1 && currentBoard[r][c] === currentBoard[r + 1][c]) isGameOver = false;
      }
    }

    if (isGameOver) {
      setAppState('gameover');
    }
  };

  // টাইলস মুভ করার লজিক (কোর লজিক)
  const moveTiles = useCallback((direction) => {
    if (appState !== 'playing') return;

    let newBoard = board.map(row => [...row]);
    let hasChanged = false;
    let gainedScore = 0;

    const slideAndMerge = (row) => {
      let filteredRow = row.filter(val => val !== 0);
      let newRow = [];
      let i = 0;
      
      while (i < filteredRow.length) {
        if (i < filteredRow.length - 1 && filteredRow[i] === filteredRow[i + 1]) {
          newRow.push(filteredRow[i] * 2);
          gainedScore += filteredRow[i] * 2;
          i += 2; // मर्ज হয়েছে, তাই ২ ঘর স্কিপ
        } else {
          newRow.push(filteredRow[i]);
          i++;
        }
      }
      
      while (newRow.length < BOARD_SIZE) {
        newRow.push(0);
      }
      return newRow;
    };

    if (direction === 'LEFT' || direction === 'RIGHT') {
      for (let r = 0; r < BOARD_SIZE; r++) {
        let row = newBoard[r];
        if (direction === 'RIGHT') row = row.reverse();
        
        const newRow = slideAndMerge(row);
        
        if (direction === 'RIGHT') newRow.reverse();
        
        if (newBoard[r].join(',') !== newRow.join(',')) hasChanged = true;
        newBoard[r] = newRow;
      }
    } else if (direction === 'UP' || direction === 'DOWN') {
      for (let c = 0; c < BOARD_SIZE; c++) {
        let col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
        if (direction === 'DOWN') col = col.reverse();
        
        const newCol = slideAndMerge(col);
        
        if (direction === 'DOWN') newCol.reverse();
        
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (newBoard[r][c] !== newCol[r]) hasChanged = true;
          newBoard[r][c] = newCol[r];
        }
      }
    }

    if (hasChanged) {
      newBoard = addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(s => s + gainedScore);
      checkGameState(newBoard);
    }
  }, [board, appState]);

  // কীবোর্ড কন্ট্রোল
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // ব্রাউজার স্ক্রল বন্ধ করা
      }
      switch (e.key) {
        case 'ArrowUp': moveTiles('UP'); break;
        case 'ArrowDown': moveTiles('DOWN'); break;
        case 'ArrowLeft': moveTiles('LEFT'); break;
        case 'ArrowRight': moveTiles('RIGHT'); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveTiles]);

  // টাচ (সোয়াইপ) কন্ট্রোল (PWA এর জন্য)
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.x || !touchStart.y) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchStart.x - touchEndX;
    const deltaY = touchStart.y - touchEndY;

    // সোয়াইপের দিক নির্ণয় (যেদিকে বেশি দূরত্ব অতিক্রম করেছে)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > 30) { // ন্যূনতম দূরত্ব
        if (deltaX > 0) moveTiles('LEFT');
        else moveTiles('RIGHT');
      }
    } else {
      if (Math.abs(deltaY) > 30) {
        if (deltaY > 0) moveTiles('UP');
        else moveTiles('DOWN');
      }
    }
    setTouchStart({ x: null, y: null });
  };

  // বয়স অনুযায়ী ফিডব্যাক মেসেজ
  const getMotivationalMessage = () => {
    const userAge = parseInt(age);
    if (userAge <= 12) return "দারুণ! তুমি তো গণিতে অনেক পাকা! তোমার ব্রেন সুপার ফাস্ট কাজ করছে!";
    if (userAge <= 18) return "অসাধারণ স্ট্র্যাটেজি! ছোট ছোট সংখ্যাকে একত্রিত করে বড় কিছু তৈরির এই কৌশল তোমার বাস্তব জীবনেও কাজে লাগবে।";
    return "চমৎকার সিদ্ধান্ত নেওয়ার ক্ষমতা! অর্থনীতিতে যেমন ছোট সঞ্চয় থেকে বড় মূলধন তৈরি হয়, আপনি ঠিক সেভাবেই ২০৪৮ অর্জন করেছেন!";
  };

  // ফেসবুক শেয়ার
  const shareOnFacebook = () => {
    const url = window.location.href;
    const text = `আমি "স্ট্র্যাটেজিক ২০৪৮" গেমে ${score} স্কোর করেছি! ব্রেন ও স্ট্র্যাটেজি শার্প করার এই শিক্ষণীয় গেমটি আপনিও খেলে দেখুন!`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
  };

  // UI রেন্ডার: ইন্ট্রো স্ক্রিন
  if (appState === 'intro') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-yellow-500 rounded-full blur-3xl opacity-20"></div>
          
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-3xl font-black text-white">2048</span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            স্ট্র্যাটেজিক ২০৪৮
          </h1>
          
          <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-xl mb-6">
            <h3 className="flex items-center gap-2 text-emerald-300 font-bold mb-2">
              <TrendingUp className="w-5 h-5" /> শিক্ষণীয় উদ্দেশ্য
            </h3>
            <p className="text-sm text-emerald-100/80 leading-relaxed text-justify">
              অর্থনীতিতে যেমন ছোট সম্পদ একত্রিত করে বৃহৎ মূলধন তৈরি করতে হয়, এই গেমটিও ঠিক তাই শেখায়। এটি আপনার <strong>গাণিতিক দক্ষতা</strong>, <strong>ভবিষ্যৎ পরিকল্পনা</strong> এবং <strong>রিসোর্স ম্যানেজমেন্ট</strong> ক্ষমতাকে শাণিত করবে।
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-slate-300 mb-2 font-medium">আপনার সঠিক বয়স লিখুন:</label>
            <input 
              type="number" 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="যেমন: 15"
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-lg"
            />
          </div>

          <button 
            onClick={() => age ? initializeBoard() : alert('অনুগ্রহ করে গেম শুরু করার আগে বয়স লিখুন।')}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            <PlayCircle className="w-6 h-6" /> চ্যালেঞ্জ গ্রহণ করুন
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // UI রেন্ডার: গেম বোর্ড
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center py-6 px-4 touch-none selection:bg-transparent">
      
      {/* টপ বার ও স্কোরবোর্ড */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            2048
          </h1>
          <p className="text-slate-400 text-sm mt-1">সবগুলো মিলিয়ে ২০৪৮ তৈরি করুন!</p>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">স্কোর</p>
            <p className="text-lg font-bold text-white leading-none mt-1">{score}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-center hidden sm:block">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">সর্বোচ্চ</p>
            <p className="text-lg font-bold text-yellow-400 leading-none mt-1">{highScore}</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md flex justify-between items-center mb-6">
         <p className="text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
           কীবোর্ডের অ্যারো-কি (↑↓←→) অথবা সোয়াইপ করুন
         </p>
         <button onClick={initializeBoard} className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 rounded-xl transition-colors active:scale-95" title="নতুন গেম">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
         </button>
      </div>

      {/* গেম গ্রিড */}
      <div 
        className="w-full max-w-md aspect-square bg-slate-700 p-3 sm:p-4 rounded-2xl shadow-2xl relative border-4 border-slate-800"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-4 grid-rows-4 gap-2 sm:gap-3 w-full h-full">
          {board.map((row, rIdx) => (
            row.map((cellValue, cIdx) => (
              <div 
                key={`${rIdx}-${cIdx}`} 
                className={`flex items-center justify-center rounded-xl font-bold text-2xl sm:text-3xl transition-all duration-200 
                  ${cellValue === 0 ? 'bg-slate-800/50' : TILE_COLORS[cellValue] || 'bg-black text-white shadow-xl'}
                  ${cellValue !== 0 ? 'scale-100' : 'scale-95 opacity-50'}`}
              >
                {cellValue !== 0 ? cellValue : ''}
              </div>
            ))
          ))}
        </div>

        {/* গেম ওভার ওভারলে */}
        {appState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center flex-col p-6 text-center animate-in fade-in duration-300">
            <h2 className="text-4xl font-black text-white mb-2">গেম ওভার!</h2>
            <p className="text-slate-300 mb-6">আর কোনো চাল বাকি নেই। আপনার চূড়ান্ত স্কোর: <span className="text-yellow-400 font-bold">{score}</span></p>
            <button onClick={initializeBoard} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white transition-colors shadow-lg">
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* জয়ের ওভারলে */}
        {appState === 'won' && (
          <div className="absolute inset-0 bg-emerald-900/80 backdrop-blur-md rounded-xl flex items-center justify-center flex-col p-6 text-center animate-in fade-in zoom-in duration-300">
            <Trophy className="w-20 h-20 text-yellow-400 mb-4 animate-bounce" />
            <h2 className="text-4xl font-black text-white mb-2">আপনি জিতেছেন!</h2>
            <div className="bg-slate-900/50 p-3 rounded-xl mb-6">
               <p className="text-emerald-200 text-sm italic">"{getMotivationalMessage()}"</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setAppState('playing')} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors">
                খেলা চালিয়ে যান
              </button>
              <button onClick={shareOnFacebook} className="flex-1 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" /> শেয়ার
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ফুটার কম্পোনেন্ট
function Footer() {
  return (
    <div className="mt-10 text-center text-slate-500 text-xs sm:text-sm max-w-md">
      <div className="flex items-center justify-center gap-1 mb-1">
        Made with <Heart className="w-4 h-4 text-red-500 inline animate-pulse" /> for Education
      </div>
      <p className="font-semibold text-slate-400">
        পরিকল্পনা ও নির্দেশনায়: <span className="text-emerald-400">মোঃ মঞ্জুরুল হক</span>
      </p>
      <p>প্রভাষক অর্থনীতি, জিয়াউদ্দিন স্কুল এন্ড কলেজ, কিশোরগঞ্জ</p>
    </div>
  );
}