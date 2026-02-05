import React from "react";

// ELA Question Visual Components for Grade 1
export const ELAQuestionVisuals: Record<string, React.FC> = {
  // Q1: Letter /b/ sound - show the letters
  "q1": () => (
    <div className="flex justify-center gap-4 my-4 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
      {["d", "b", "p", "q"].map((letter, i) => (
        <div key={i} className="w-14 h-14 bg-white rounded-xl border-2 border-gray-300 flex items-center justify-center text-3xl font-bold text-[#1C2D5A] shadow-sm">
          {letter}
        </div>
      ))}
    </div>
  ),
  // Q2: Cat beginning sound - show a cat
  "q2": () => (
    <div className="flex justify-center my-4">
      <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
        <svg viewBox="0 0 120 100" className="w-28 h-24 mx-auto">
          {/* Cat body */}
          <ellipse cx="60" cy="70" rx="35" ry="25" fill="#F97316" />
          {/* Cat head */}
          <circle cx="60" cy="40" r="25" fill="#FB923C" />
          {/* Ears */}
          <polygon points="40,20 45,40 35,35" fill="#FB923C" />
          <polygon points="80,20 75,40 85,35" fill="#FB923C" />
          <polygon points="42,22 45,38 37,34" fill="#FBBF24" />
          <polygon points="78,22 75,38 83,34" fill="#FBBF24" />
          {/* Eyes */}
          <ellipse cx="50" cy="38" rx="5" ry="6" fill="white" />
          <ellipse cx="70" cy="38" rx="5" ry="6" fill="white" />
          <circle cx="50" cy="39" r="3" fill="#1C2D5A" />
          <circle cx="70" cy="39" r="3" fill="#1C2D5A" />
          {/* Nose */}
          <polygon points="60,48 57,52 63,52" fill="#EC4899" />
          {/* Mouth */}
          <path d="M55 54 Q60 58 65 54" stroke="#4B5563" strokeWidth="1.5" fill="none" />
          {/* Whiskers */}
          <line x1="35" y1="48" x2="48" y2="50" stroke="#4B5563" strokeWidth="1" />
          <line x1="35" y1="52" x2="48" y2="52" stroke="#4B5563" strokeWidth="1" />
          <line x1="72" y1="50" x2="85" y2="48" stroke="#4B5563" strokeWidth="1" />
          <line x1="72" y1="52" x2="85" y2="52" stroke="#4B5563" strokeWidth="1" />
          {/* Tail */}
          <path d="M95 65 Q110 55 105 75" stroke="#F97316" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
        <p className="text-center text-lg font-bold text-orange-600 mt-2">🐱 CAT</p>
      </div>
    </div>
  ),
  // Q3: Rhymes with cat
  "q3": () => (
    <div className="flex justify-center gap-6 my-4">
      <div className="bg-orange-50 rounded-xl p-3 border-2 border-orange-200 text-center">
        <div className="text-4xl mb-1">🐱</div>
        <p className="font-bold text-orange-600">cat</p>
      </div>
      <div className="flex items-center text-2xl text-gray-400">→</div>
      <div className="bg-blue-50 rounded-xl p-3 border-2 border-blue-200 text-center">
        <div className="text-4xl mb-1">❓</div>
        <p className="font-bold text-blue-600">rhymes?</p>
      </div>
    </div>
  ),
  // Q4: How many sounds in "dog"
  "q4": () => (
    <div className="flex justify-center my-4">
      <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
        <svg viewBox="0 0 140 100" className="w-32 h-24 mx-auto">
          {/* Dog body */}
          <ellipse cx="70" cy="70" rx="40" ry="25" fill="#92400E" />
          {/* Dog head */}
          <circle cx="50" cy="45" r="25" fill="#A16207" />
          {/* Ears */}
          <ellipse cx="30" cy="35" rx="10" ry="15" fill="#78350F" />
          <ellipse cx="70" cy="30" rx="10" ry="12" fill="#78350F" />
          {/* Eyes */}
          <circle cx="42" cy="42" r="5" fill="white" />
          <circle cx="58" cy="42" r="5" fill="white" />
          <circle cx="43" cy="43" r="3" fill="#1C2D5A" />
          <circle cx="59" cy="43" r="3" fill="#1C2D5A" />
          {/* Nose */}
          <ellipse cx="50" cy="54" rx="6" ry="4" fill="#1C2D5A" />
          {/* Mouth */}
          <path d="M45 58 Q50 62 55 58" stroke="#4B5563" strokeWidth="1.5" fill="none" />
          {/* Tail */}
          <path d="M110 60 Q130 40 120 70" stroke="#92400E" strokeWidth="8" fill="none" strokeLinecap="round" />
        </svg>
        <div className="text-center mt-2">
          <div className="flex justify-center gap-2">
            {["D", "O", "G"].map((letter, i) => (
              <div key={i} className="w-10 h-10 bg-white rounded-lg border-2 border-amber-400 flex items-center justify-center text-xl font-bold text-amber-700">
                {letter}
              </div>
            ))}
          </div>
          <p className="text-sm text-amber-600 mt-1">Count the sounds!</p>
        </div>
      </div>
    </div>
  ),
  // Q5: Letter after M
  "q5": () => (
    <div className="flex justify-center my-4">
      <div className="flex items-center gap-1 bg-sky-50 rounded-xl p-4 border-2 border-sky-200">
        {["K", "L", "M", "?", "O", "P"].map((letter, i) => (
          <div key={i} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold ${
            letter === "?" ? "bg-[#FFDE59] text-[#1C2D5A] border-2 border-dashed border-[#1C2D5A]" : "bg-white border-2 border-sky-300 text-sky-700"
          }`}>
            {letter}
          </div>
        ))}
      </div>
    </div>
  ),
  // Q6: Ending sound in "map"
  "q6": () => (
    <div className="flex justify-center my-4">
      <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200 text-center">
        <div className="text-4xl mb-2">🗺️</div>
        <span className="text-3xl font-bold text-green-700">ma<span className="text-4xl text-green-500 underline decoration-wavy decoration-2">p</span></span>
      </div>
    </div>
  ),
  // Q7: Uppercase letter
  "q7": () => (
    <div className="flex justify-center gap-3 my-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
      {["a", "B", "c", "d"].map((letter, i) => (
        <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-sm ${
          letter === letter.toUpperCase() ? "bg-purple-200 text-purple-800 border-2 border-purple-400" : "bg-white text-gray-600 border-2 border-gray-300"
        }`}>
          {letter}
        </div>
      ))}
    </div>
  ),
  // Q8: Same sound as "sun"
  "q8": () => (
    <div className="flex justify-center my-4">
      <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-300 text-center">
        <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto">
          <circle cx="50" cy="50" r="25" fill="#FDE047" />
          <circle cx="50" cy="50" r="20" fill="#FBBF24" />
          {/* Sun rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line key={i} x1="50" y1="50" x2={50 + 40 * Math.cos(angle * Math.PI / 180)} y2={50 + 40 * Math.sin(angle * Math.PI / 180)} stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
          ))}
          {/* Smile */}
          <path d="M40 55 Q50 65 60 55" stroke="#92400E" strokeWidth="2" fill="none" />
          {/* Eyes */}
          <circle cx="42" cy="45" r="3" fill="#92400E" />
          <circle cx="58" cy="45" r="3" fill="#92400E" />
        </svg>
        <p className="font-bold text-yellow-600 text-lg mt-1">☀️ SUN</p>
      </div>
    </div>
  ),
  // Q9: Missing vowel c_t
  "q9": () => (
    <div className="flex justify-center my-4">
      <div className="flex items-center gap-2 bg-rose-50 rounded-xl p-4 border-2 border-rose-200">
        <span className="text-4xl font-bold text-rose-700">c</span>
        <div className="w-12 h-12 border-4 border-dashed border-rose-400 rounded-lg flex items-center justify-center text-2xl text-rose-400">?</div>
        <span className="text-4xl font-bold text-rose-700">t</span>
      </div>
    </div>
  ),
  // Q10: Sight word
  "q10": () => (
    <div className="flex justify-center my-4">
      <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200">
        <p className="text-sm text-emerald-600 mb-2 text-center font-medium">✨ Sight Words are special words!</p>
        <div className="flex gap-2 justify-center">
          {["the", "and", "is", "it"].map((word, i) => (
            <span key={i} className="px-3 py-1.5 bg-emerald-100 rounded-lg font-bold text-emerald-700 text-base border border-emerald-300">{word}</span>
          ))}
        </div>
      </div>
    </div>
  ),
  // Q11: I see a dog
  "q11": () => (
    <div className="flex justify-center my-4">
      <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 text-center">
        <p className="text-xl font-bold text-blue-700">"I see a <span className="text-3xl">🐕</span>"</p>
        <p className="text-sm text-blue-500 mt-1">What animal do you see?</p>
      </div>
    </div>
  ),
  // Q16: The cat is big
  "q16": () => (
    <div className="flex justify-center my-4">
      <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200 text-center">
        <div className="text-5xl mb-2">🐱</div>
        <p className="text-lg font-bold text-orange-700">"The cat is big."</p>
        <p className="text-sm text-orange-500 mt-1">What is big?</p>
      </div>
    </div>
  ),
  // Q17: Word that names a person
  "q17": () => (
    <div className="flex justify-center my-4">
      <div className="bg-pink-50 rounded-xl p-4 border-2 border-pink-200">
        <div className="flex gap-4 justify-center">
          <div className="text-center">
            <div className="text-4xl">🏃</div>
            <p className="text-sm text-gray-500">run</p>
          </div>
          <div className="text-center">
            <div className="text-4xl">🦘</div>
            <p className="text-sm text-gray-500">jump</p>
          </div>
          <div className="text-center">
            <div className="text-4xl">👩</div>
            <p className="text-sm text-pink-600 font-bold">mom</p>
          </div>
          <div className="text-center">
            <div className="text-4xl">😊</div>
            <p className="text-sm text-gray-500">happy</p>
          </div>
        </div>
        <p className="text-center text-sm text-pink-600 mt-2">Which is a person?</p>
      </div>
    </div>
  ),
  // Q18: More than one (cats)
  "q18": () => (
    <div className="flex justify-center gap-6 my-4">
      <div className="bg-orange-50 rounded-xl p-3 border-2 border-orange-200 text-center">
        <div className="text-3xl">🐱</div>
        <p className="font-bold text-orange-600">cat</p>
        <p className="text-xs text-gray-500">one</p>
      </div>
      <div className="bg-orange-100 rounded-xl p-3 border-2 border-orange-300 text-center">
        <div className="text-3xl">🐱🐱🐱</div>
        <p className="font-bold text-orange-700">cats</p>
        <p className="text-xs text-gray-600">many</p>
      </div>
    </div>
  ),
  // Q19: Vowels
  "q19": () => (
    <div className="flex justify-center my-4">
      <div className="bg-pink-50 rounded-xl p-4 border-2 border-pink-200">
        <p className="text-sm text-pink-500 mb-2 text-center">🎵 The vowels sing!</p>
        <div className="flex gap-2 justify-center">
          {["A", "E", "I", "O", "U"].map((v, i) => (
            <div key={i} className="w-9 h-9 bg-pink-200 rounded-full flex items-center justify-center font-bold text-pink-700 text-lg">
              {v}
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  // Q20: We go to school
  "q20": () => (
    <div className="flex justify-center my-4">
      <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200 text-center">
        <div className="text-5xl mb-2">🏫</div>
        <p className="text-lg font-bold text-indigo-700">"We go to school."</p>
        <p className="text-sm text-indigo-500 mt-1">Where do we go?</p>
      </div>
    </div>
  ),
  // Q21: Rhyme with cat
  "q21": () => (
    <div className="flex justify-center my-4">
      <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
        <div className="flex gap-3 items-center justify-center">
          <div className="text-4xl">🐱</div>
          <span className="text-2xl font-bold text-purple-700">cat</span>
          <span className="text-gray-400">→</span>
          <span className="text-xl text-purple-500">bat, hat, mat, rat...</span>
        </div>
      </div>
    </div>
  ),
  // Q22: The dog runs fast
  "q22": () => (
    <div className="flex justify-center my-4">
      <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200 text-center">
        <div className="text-5xl mb-2">🐕💨</div>
        <p className="text-lg font-bold text-amber-700">"The dog runs fast."</p>
        <p className="text-sm text-amber-500 mt-1">Who runs fast?</p>
      </div>
    </div>
  ),
  // Q24: Five vowels
  "q24": () => (
    <div className="flex justify-center my-4">
      <div className="flex gap-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border-2 border-pink-200">
        {[1, 2, 3, 4, 5].map((_, i) => (
          <div key={i} className="w-10 h-10 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center font-bold text-purple-700 text-lg shadow-sm border-2 border-white">
            ?
          </div>
        ))}
      </div>
    </div>
  ),
  // Park scene for Q28
  "q28": () => (
    <div className="bg-gradient-to-b from-sky-200 to-green-100 rounded-xl p-3 border-2 border-sky-400 my-4">
      <svg viewBox="0 0 500 280" className="w-full max-w-md mx-auto">
        {/* Sky gradient background */}
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#BAE6FD" />
          </linearGradient>
          <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        
        {/* Sky */}
        <rect x="0" y="0" width="500" height="160" fill="url(#skyGradient)" />
        
        {/* Fluffy Clouds */}
        <g fill="white" opacity="0.9">
          <circle cx="80" cy="40" r="20" />
          <circle cx="100" cy="35" r="25" />
          <circle cx="125" cy="40" r="18" />
          <circle cx="380" cy="50" r="22" />
          <circle cx="405" cy="45" r="28" />
          <circle cx="435" cy="52" r="20" />
        </g>
        
        {/* Bright Sun */}
        <g>
          <circle cx="440" cy="50" r="35" fill="#FDE047" />
          <circle cx="440" cy="50" r="28" fill="#FBBF24" />
          <line x1="440" y1="5" x2="440" y2="20" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
          <line x1="470" y1="20" x2="480" y2="10" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
          <line x1="485" y1="50" x2="495" y2="50" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
          <line x1="395" y1="50" x2="385" y2="50" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
          <line x1="470" y1="80" x2="480" y2="90" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
          <line x1="410" y1="20" x2="400" y2="10" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
          <line x1="410" y1="80" x2="400" y2="90" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
        </g>
        
        {/* Grass field */}
        <rect x="0" y="160" width="500" height="120" fill="url(#grassGradient)" />
        
        {/* Park path */}
        <ellipse cx="250" cy="260" rx="180" ry="30" fill="#D4A574" opacity="0.6" />
        
        {/* Left Tree */}
        <rect x="45" y="130" width="15" height="50" fill="#8B5A2B" rx="2" />
        <circle cx="52" cy="105" r="40" fill="#22C55E" />
        <circle cx="30" cy="115" r="25" fill="#16A34A" />
        <circle cx="75" cy="110" r="30" fill="#15803D" />
        
        {/* Right Tree */}
        <rect x="420" y="125" width="15" height="55" fill="#8B5A2B" rx="2" />
        <circle cx="427" cy="95" r="45" fill="#22C55E" />
        <circle cx="400" cy="105" r="28" fill="#16A34A" />
        <circle cx="455" cy="100" r="32" fill="#15803D" />
        
        {/* Slide */}
        <rect x="130" y="140" width="8" height="60" fill="#6B7280" />
        <rect x="175" y="140" width="8" height="60" fill="#6B7280" />
        <rect x="125" y="135" width="65" height="8" fill="#6B7280" />
        <polygon points="138,145 180,145 168,195 150,195" fill="#EF4444" />
        
        {/* Swing Set */}
        <rect x="300" y="120" width="8" height="80" fill="#6B7280" />
        <rect x="370" y="120" width="8" height="80" fill="#6B7280" />
        <rect x="295" y="115" width="90" height="8" fill="#6B7280" />
        <line x1="325" y1="123" x2="320" y2="165" stroke="#4B5563" strokeWidth="2" />
        <line x1="335" y1="123" x2="340" y2="165" stroke="#4B5563" strokeWidth="2" />
        <rect x="315" y="165" width="30" height="6" fill="#8B5A2B" rx="2" />
        
        {/* Child on slide */}
        <circle cx="158" cy="162" r="10" fill="#FDBF6F" />
        <circle cx="155" cy="159" r="2" fill="#4B5563" />
        <circle cx="161" cy="159" r="2" fill="#4B5563" />
        <path d="M155 165 Q158 168 161 165" stroke="#4B5563" strokeWidth="1.5" fill="none" />
        <rect x="152" y="172" width="12" height="15" fill="#EC4899" rx="2" />
        
        {/* Child with ball */}
        <circle cx="230" cy="200" r="12" fill="#FDBF6F" />
        <circle cx="226" cy="197" r="2.5" fill="#4B5563" />
        <circle cx="234" cy="197" r="2.5" fill="#4B5563" />
        <path d="M225 204 Q230 208 235 204" stroke="#4B5563" strokeWidth="1.5" fill="none" />
        <rect x="222" y="212" width="16" height="18" fill="#3B82F6" rx="2" />
        
        {/* Ball */}
        <circle cx="265" cy="205" r="14" fill="#EF4444" />
        <path d="M255 205 Q265 195 275 205" stroke="white" strokeWidth="2" fill="none" />
        
        {/* Flowers */}
        <g fill="#F472B6">
          <circle cx="200" cy="250" r="5" />
          <circle cx="280" cy="255" r="4" />
          <circle cx="380" cy="245" r="5" />
        </g>
        <g fill="#FBBF24">
          <circle cx="200" cy="250" r="2" />
          <circle cx="280" cy="255" r="1.5" />
          <circle cx="380" cy="245" r="2" />
        </g>
        
        {/* Birds */}
        <path d="M150 70 Q155 65 160 70" stroke="#4B5563" strokeWidth="2" fill="none" />
        <path d="M160 70 Q165 65 170 70" stroke="#4B5563" strokeWidth="2" fill="none" />
        <path d="M200 50 Q204 46 208 50" stroke="#4B5563" strokeWidth="2" fill="none" />
        <path d="M208 50 Q212 46 216 50" stroke="#4B5563" strokeWidth="2" fill="none" />
      </svg>
      <p className="text-center text-sm text-sky-700 mt-2 font-medium">
        🌞 A sunny day at the park with children playing! 🎈
      </p>
    </div>
  ),
};

// Helper function to get ELA visual by question ID
export const getELAVisualForQuestion = (questionId: string): React.ReactNode | null => {
  const Visual = ELAQuestionVisuals[questionId];
  return Visual ? <Visual /> : null;
};
