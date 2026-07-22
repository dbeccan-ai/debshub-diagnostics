// Reading Recovery Workbook Activities
// Deterministic, printable content for each of the 21 days.
// Assessment days (1, 10, 21) are handled separately (they route to the diagnostic).

export type Band = "1-2" | "3-4" | "5-6" | "7-8";

export type WorksheetBlock =
  | { type: "word-list"; title: string; columns?: number; words: string[] }
  | { type: "fill-blank"; title: string; items: { sentence: string; answer: string }[] }
  | { type: "matching"; title: string; pairs: { left: string; right: string }[] }
  | {
      type: "short-passage";
      title: string;
      passage: string;
      questions: { q: string; a?: string }[];
    }
  | { type: "writing-prompt"; title: string; prompt: string; lines?: number }
  | { type: "checklist"; title: string; items: string[] }
  | { type: "fluency-tracker"; title: string; instructions: string; reads?: number }
  | { type: "reflection"; title: string; prompts: string[] };

export interface DayActivity {
  day: number;
  title: string;
  category: string;
  objective: string;
  estimatedMinutes: number;
  warmUp: string[];
  instructions: string[];
  variantsByBand: Record<Band, WorksheetBlock[]>;
  extension?: string;
}

export const pickBand = (grade: number | null | undefined): Band => {
  const g = grade ?? 2;
  if (g <= 2) return "1-2";
  if (g <= 4) return "3-4";
  if (g <= 6) return "5-6";
  return "7-8";
};

// ---------- Helper generators to keep this file readable ----------

const wordList = (title: string, words: string[], columns = 4): WorksheetBlock => ({
  type: "word-list",
  title,
  columns,
  words,
});

const fillBlank = (
  title: string,
  items: { sentence: string; answer: string }[]
): WorksheetBlock => ({ type: "fill-blank", title, items });

const matching = (
  title: string,
  pairs: { left: string; right: string }[]
): WorksheetBlock => ({ type: "matching", title, pairs });

const shortPassage = (
  title: string,
  passage: string,
  questions: { q: string; a?: string }[]
): WorksheetBlock => ({ type: "short-passage", title, passage, questions });

const writingPrompt = (title: string, prompt: string, lines = 8): WorksheetBlock => ({
  type: "writing-prompt",
  title,
  prompt,
  lines,
});

const checklist = (title: string, items: string[]): WorksheetBlock => ({
  type: "checklist",
  title,
  items,
});

const reflection = (title: string, prompts: string[]): WorksheetBlock => ({
  type: "reflection",
  title,
  prompts,
});

const fluencyTracker = (title: string, instructions: string, reads = 3): WorksheetBlock => ({
  type: "fluency-tracker",
  title,
  instructions,
  reads,
});

// ---------- Activities ----------

export const activities: Record<number, DayActivity> = {
  // ============================================================
  // DAY 2 — Phonics Warm-up: Letter Sounds Review
  // ============================================================
  2: {
    day: 2,
    title: "Phonics Warm-up: Letter Sounds Review",
    category: "Phonics",
    objective:
      "Review consonant and vowel sounds and practice blending them into short words.",
    estimatedMinutes: 20,
    warmUp: [
      "Say the alphabet aloud together — clap once on every vowel (a, e, i, o, u).",
      "Ask the student to name three words that start with the /s/ sound.",
      "Stretch a word: say 'cat' slowly — /c/ /a/ /t/ — then blend it back together.",
    ],
    instructions: [
      "Sit beside the student so both of you can see the worksheet.",
      "Read each row of sounds aloud. Have the student echo each sound.",
      "For each word, model it once, then have the student decode it slowly and blend.",
      "Circle any sound or word the student misses — those become the review list for tomorrow.",
      "Finish with the Extension challenge if time allows.",
    ],
    variantsByBand: {
      "1-2": [
        wordList("Consonant sounds — say each one", [
          "b", "c", "d", "f", "g", "h",
          "j", "k", "l", "m", "n", "p",
          "r", "s", "t", "v", "w", "z",
        ], 6),
        wordList("Short vowel sounds", ["ă (apple)", "ĕ (egg)", "ĭ (igloo)", "ŏ (octopus)", "ŭ (umbrella)"], 5),
        wordList("Blend & read (CVC words)", [
          "cat", "sit", "mop", "bug", "red",
          "pen", "hat", "log", "cup", "van",
        ], 5),
        fillBlank("Write the missing vowel", [
          { sentence: "c _ t (the pet that says meow)", answer: "a" },
          { sentence: "d _ g (the pet that says woof)", answer: "o" },
          { sentence: "s _ n (the shining star in the sky)", answer: "u" },
          { sentence: "b _ d (where you sleep)", answer: "e" },
          { sentence: "p _ g (the animal that says oink)", answer: "i" },
        ]),
      ],
      "3-4": [
        wordList("Consonant blends", ["bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "sl", "sm", "sn", "sp", "st", "sw", "tr"], 6),
        wordList("Long vowel patterns", ["ai (rain)", "ay (day)", "ee (tree)", "ea (leaf)", "ie (pie)", "oa (boat)", "ow (snow)", "ue (blue)"], 4),
        wordList("Blend & read", ["train", "sleep", "bright", "float", "cloud", "sprout", "throne", "stream"], 4),
        fillBlank("Complete the word with the correct blend", [
          { sentence: "___ain (falls from the sky)", answer: "r / br" },
          { sentence: "___og (jumps in a pond)", answer: "fr" },
          { sentence: "___ee (grows tall with leaves)", answer: "tr" },
          { sentence: "___oud (a fluffy shape in the sky)", answer: "cl" },
          { sentence: "___ay (a color between black and white)", answer: "gr" },
        ]),
      ],
      "5-6": [
        wordList("Digraphs & trigraphs", ["sh", "ch", "th", "wh", "ph", "ng", "tch", "dge", "igh", "ough"], 5),
        wordList("Vowel teams & r-controlled", ["oi/oy", "ou/ow", "au/aw", "ar", "er", "ir", "or", "ur"], 4),
        wordList("Decode these", ["thought", "bridge", "sprout", "coach", "chief", "phone", "twist", "sprinkle"], 4),
        fillBlank("Choose the correct spelling pattern", [
          { sentence: "The h___se galloped away. (or / ar)", answer: "or (horse)" },
          { sentence: "She ate a p___ch. (ea / ee)", answer: "ea (peach)" },
          { sentence: "The l___ht was bright. (ig / igh)", answer: "igh (light)" },
          { sentence: "He heard a str___ge sound. (an / ang)", answer: "an (strange)" },
        ]),
      ],
      "7-8": [
        wordList("Advanced patterns & morphemes", ["-tion", "-sion", "-ture", "-cious", "-tious", "pre-", "un-", "re-", "-ment", "-ness"], 5),
        wordList("Silent-letter patterns", ["kn (knight)", "wr (write)", "gn (gnome)", "mb (thumb)", "gh (ghost)", "ps (psychology)"], 3),
        wordList("Multisyllabic decoding", ["information", "conclusion", "adventure", "conscious", "cautious", "improvement", "kindness", "prehistoric"], 3),
        fillBlank("Break the word into syllables (use / )", [
          { sentence: "conversation", answer: "con/ver/sa/tion" },
          { sentence: "unbelievable", answer: "un/be/liev/a/ble" },
          { sentence: "adventurous", answer: "ad/ven/tur/ous" },
          { sentence: "cautiously", answer: "cau/tious/ly" },
        ]),
      ],
    },
    extension:
      "Race the clock: how many decode words can the student read correctly in 60 seconds? Record the score to compare next week.",
  },

  // ============================================================
  // DAY 3 — Sight Word Practice (Set 1)
  // ============================================================
  3: {
    day: 3,
    title: "Sight Word Practice (Set 1)",
    category: "Vocabulary",
    objective:
      "Recognize and read the first set of high-frequency (sight) words automatically — no sounding out.",
    estimatedMinutes: 20,
    warmUp: [
      "Flashcard style: say each word and have the student echo it.",
      "Then flip the words in a random order — student must read within 3 seconds.",
    ],
    instructions: [
      "Cut the word list into flashcards (or read straight from the sheet).",
      "Do three quick rounds: I read → student reads → student reads alone.",
      "Complete the fill-in-the-blank sentences using the sight words above.",
      "Mark any word the student hesitates on — practice those again tomorrow.",
    ],
    variantsByBand: {
      "1-2": [
        wordList("Sight word set 1", [
          "the", "and", "a", "to", "is",
          "you", "it", "of", "in", "was",
          "said", "he", "she", "we", "they",
          "have", "go", "for", "with", "my",
        ], 5),
        fillBlank("Write the missing sight word", [
          { sentence: "___ dog ran fast.", answer: "The" },
          { sentence: "I like ___ read books.", answer: "to" },
          { sentence: "___ we go outside?", answer: "Can" },
          { sentence: "He ___ hello to me.", answer: "said" },
          { sentence: "This is ___ pencil.", answer: "my" },
        ]),
      ],
      "3-4": [
        wordList("Sight word set 1", [
          "because", "before", "around", "always", "another",
          "different", "important", "sometimes", "together", "through",
          "should", "would", "could", "enough", "special",
          "friend", "people", "family", "school", "everyone",
        ], 5),
        fillBlank("Complete the sentence", [
          { sentence: "We walked ___ the park.", answer: "through" },
          { sentence: "My ___ came over to play.", answer: "friend" },
          { sentence: "You ___ finish your homework.", answer: "should" },
          { sentence: "___ , I feel very tired.", answer: "Sometimes" },
        ]),
      ],
      "5-6": [
        wordList("Academic word set 1", [
          "analyze", "compare", "contrast", "describe", "explain",
          "identify", "interpret", "predict", "summarize", "evaluate",
          "evidence", "argument", "conclusion", "perspective", "context",
          "author", "purpose", "central idea", "theme", "detail",
        ], 4),
        matching("Match the word to its meaning", [
          { left: "analyze", right: "Break something apart to understand it" },
          { left: "predict", right: "Guess what might happen next" },
          { left: "summarize", right: "Say the main idea in a few words" },
          { left: "evidence", right: "Facts that support an idea" },
          { left: "perspective", right: "The way someone sees something" },
        ]),
      ],
      "7-8": [
        wordList("Academic word set 1", [
          "hypothesis", "evaluate", "synthesize", "elaborate", "justify",
          "counterargument", "inference", "connotation", "denotation", "rhetoric",
          "perspective", "context", "credibility", "bias", "objective",
          "subjective", "cite", "analyze", "critique", "interpret",
        ], 4),
        matching("Match the term to its definition", [
          { left: "inference", right: "A conclusion drawn from evidence" },
          { left: "connotation", right: "The feeling or idea a word suggests" },
          { left: "bias", right: "A leaning toward one side" },
          { left: "cite", right: "Give credit to a source" },
          { left: "counterargument", right: "An opposing point of view" },
        ]),
      ],
    },
    extension: "Speed round: read the full list in under 60 seconds with zero errors.",
  },

  // ============================================================
  // DAY 4 — Guided Reading Session 1
  // ============================================================
  4: {
    day: 4,
    title: "Guided Reading Session 1",
    category: "Reading",
    objective: "Read a short passage aloud with support and receive live feedback.",
    estimatedMinutes: 25,
    warmUp: [
      "Preview the title and the first sentence together.",
      "Ask: 'What do you think this story will be about?'",
    ],
    instructions: [
      "The adult reads the passage aloud once for a model.",
      "The student reads the same passage aloud.",
      "Pause after each paragraph — ask the student to retell what they just read.",
      "Use the observation checklist to mark strengths and gaps.",
    ],
    variantsByBand: {
      "1-2": [
        shortPassage(
          "The Little Frog",
          "A little frog sat on a big rock. The sun was warm. He looked at the pond. A bug flew by. Snap! The frog jumped high and caught the bug. Then he hopped back to his rock and closed his eyes.",
          [
            { q: "Where did the little frog sit?", a: "On a big rock" },
            { q: "What did the frog catch?", a: "A bug" },
            { q: "How do you think the frog felt at the end?", a: "Happy / full / sleepy" },
          ]
        ),
        checklist("Observer checklist", [
          "Read left-to-right, top-to-bottom",
          "Sounded out unknown words",
          "Self-corrected mistakes",
          "Used punctuation (stopped at periods)",
          "Could retell what happened",
        ]),
      ],
      "3-4": [
        shortPassage(
          "The Lost Key",
          "Mia turned her backpack upside down and shook it hard. Books, pencils and an old apple tumbled onto the floor — but no key. She sat back on her heels and thought. Where had she been today? The library. The playground. The bus. She jumped up and grabbed her jacket. The key was in the pocket the whole time.",
          [
            { q: "What was Mia looking for?", a: "Her key" },
            { q: "Where did she finally find it?", a: "In her jacket pocket" },
            { q: "Why do you think she checked her jacket last?", a: "Answers will vary — she didn't think to check somewhere she wasn't using." },
          ]
        ),
        checklist("Observer checklist", [
          "Read smoothly, not word-by-word",
          "Used expression at punctuation",
          "Self-corrected errors",
          "Understood the sequence of events",
          "Could answer inferential questions",
        ]),
      ],
      "5-6": [
        shortPassage(
          "The Storm",
          "The sky darkened faster than Kwame had expected. He pedaled harder, but the first heavy drops were already hitting his helmet. By the time he reached the crossroads, the rain had become a roar. He spotted the old bus shelter and skidded inside just as the wind picked up. He wiped his face, laughed shakily, and pulled out his phone to call home.",
          [
            { q: "What warned Kwame that a storm was coming?", a: "The sky darkening" },
            { q: "Why did he skid into the shelter?", a: "To get out of the wind and rain" },
            { q: "What does 'laughed shakily' suggest about how he felt?", a: "Relieved but still nervous / scared" },
          ]
        ),
        checklist("Observer checklist", [
          "Fluent phrasing (no choppy reading)",
          "Used expression appropriate to tension",
          "Attacked unfamiliar words strategically",
          "Answered literal AND inferential questions",
          "Made a connection to a personal experience",
        ]),
      ],
      "7-8": [
        shortPassage(
          "The Interview",
          "Nadia rehearsed her opening line one more time, but the words dissolved the moment the door opened. The panel of three looked up simultaneously. She managed a smile, sat down, and forced her hands into her lap so they would stop trembling. When the first question came, she was surprised to hear her own voice answer calmly — as though someone braver had stepped in to speak for her.",
          [
            { q: "What was Nadia preparing to do?", a: "An interview" },
            { q: "What physical detail shows her nervousness?", a: "Her trembling hands" },
            { q: "What does the final sentence suggest about Nadia?", a: "She surprised herself; she was braver than she thought." },
            { q: "What is the author's mood or tone in this passage?", a: "Tense, then quietly triumphant" },
          ]
        ),
        checklist("Observer checklist", [
          "Reads with fluent, natural phrasing",
          "Adjusts pace for tension and dialogue",
          "Handles multi-syllabic words automatically",
          "Answers inferential and analytical questions with textual evidence",
          "Identifies tone or mood shifts",
        ]),
      ],
    },
    extension:
      "Have the student re-read the passage a second time — did fluency and expression improve?",
  },

  // ============================================================
  // DAY 5 — Comprehension Strategy: Making Predictions
  // ============================================================
  5: {
    day: 5,
    title: "Comprehension Strategy: Making Predictions",
    category: "Comprehension",
    objective: "Use clues from a text to predict what might happen next.",
    estimatedMinutes: 20,
    warmUp: [
      "Show the student the cover of any book. Ask 'What do you think this story is about? Why?'",
      "Explain: predictions use CLUES from words + pictures + what we already know.",
    ],
    instructions: [
      "Read the passage aloud until each STOP mark.",
      "At each STOP, the student writes or says a prediction and explains their clue.",
      "After finishing, check together which predictions were close and why.",
    ],
    variantsByBand: {
      "1-2": [
        shortPassage(
          "The Missing Cookie (stop and predict)",
          "Ben set his cookie on the plate. He turned to get his milk. When he turned back, the cookie was GONE. [STOP 1 — what happened to the cookie?] He looked at his dog, Rex, who was licking his lips and wagging his tail. [STOP 2 — what will Ben do next?]",
          [
            { q: "Prediction 1 — what happened to the cookie?", a: "Answers will vary" },
            { q: "Prediction 2 — what will Ben do?", a: "Answers will vary" },
            { q: "What clues did you use?", a: "Rex licking his lips, wagging tail" },
          ]
        ),
      ],
      "3-4": [
        shortPassage(
          "The Strange Package (stop and predict)",
          "A brown box appeared on Aisha's doorstep. There was no name and no return address. She shook it gently — something rattled. [STOP 1 — what could be inside?] She carried it inside and started to peel back the tape. From under the flaps, a small, wet nose peeked out. [STOP 2 — what will happen next?]",
          [
            { q: "Prediction 1 — what's inside?", a: "Answers vary" },
            { q: "Prediction 2 — what happens next?", a: "Answers vary" },
            { q: "What clues in the text helped you?", a: "Something rattled; a wet nose peeked out" },
          ]
        ),
      ],
      "5-6": [
        shortPassage(
          "The Locked Door (stop and predict)",
          "Every hallway in the museum was open — every one except the last. A red rope hung across the doorway, and behind it stood a heavy oak door with three brass locks. [STOP 1 — why is this door locked?] Marcus glanced left, glanced right, and slipped under the rope. [STOP 2 — what will he find?]",
          [
            { q: "Prediction 1 — why is the door locked?", a: "Answers vary" },
            { q: "Prediction 2 — what will he find?", a: "Answers vary" },
            { q: "What clues did the author give you?", a: "Only door with a rope; three heavy locks; he sneaks under" },
          ]
        ),
      ],
      "7-8": [
        shortPassage(
          "The Warning (stop and predict)",
          "The letter was typed, unsigned, and slid under the office door sometime after midnight. Ines read it twice. The message was simple: 'Do not present tomorrow.' [STOP 1 — who might have sent this and why?] She folded the letter, placed it in her briefcase, and reached for her presentation slides. [STOP 2 — what does her reaction tell you, and what will happen tomorrow?]",
          [
            { q: "Prediction 1 — who sent it and why?", a: "Answers vary — someone threatened by her presentation" },
            { q: "Prediction 2 — what will happen tomorrow?", a: "Answers vary" },
            { q: "What textual evidence supports your prediction?", a: "She kept preparing → she plans to present anyway" },
          ]
        ),
      ],
    },
    extension:
      "Ask the student to write their own 'stop and predict' story ending — one that surprises the reader.",
  },

  // ============================================================
  // DAY 6 — Phonics: Blending & Segmenting
  // ============================================================
  6: {
    day: 6,
    title: "Phonics: Blending & Segmenting Practice",
    category: "Phonics",
    objective:
      "Segment words into individual sounds, then blend those sounds back into whole words.",
    estimatedMinutes: 20,
    warmUp: [
      "Say a word slowly, one sound at a time (e.g. /sh/ /i/ /p/). Student blends it → 'ship!'",
      "Reverse: adult says the whole word, student breaks it apart into sounds.",
    ],
    instructions: [
      "Work through the word list — segment first (tap each sound), then blend.",
      "For each fill-in, ask the student to say the whole word before writing.",
      "Circle any word that took longer than 5 seconds — that becomes tomorrow's warm-up.",
    ],
    variantsByBand: {
      "1-2": [
        wordList("Segment & blend (CVC)", ["ship", "chip", "shop", "thin", "chin", "them", "wish", "dish", "path", "moth"], 5),
        fillBlank("Add the correct digraph (sh, ch, th, wh)", [
          { sentence: "___ip (sails in the water)", answer: "sh" },
          { sentence: "___in (part of your face below your mouth)", answer: "ch" },
          { sentence: "___umb (a finger)", answer: "th" },
          { sentence: "___en (a question about time)", answer: "wh" },
        ]),
      ],
      "3-4": [
        wordList("CCVC / CVCC blends", ["stop", "spin", "trip", "flag", "clip", "hand", "jump", "lamp", "sink", "list"], 5),
        fillBlank("Fill in the missing blend", [
          { sentence: "The ___og croaks. (fr)", answer: "fr (frog)" },
          { sentence: "I ___ammed the door. (sl)", answer: "sl (slammed)" },
          { sentence: "The ___ain came down. (r)", answer: "r (rain)" },
          { sentence: "He read the ___ory. (st)", answer: "st (story)" },
        ]),
      ],
      "5-6": [
        wordList("Multisyllabic blending", ["monster", "pumpkin", "picnic", "trumpet", "insect", "napkin", "kingdom", "sunset"], 4),
        fillBlank("Split into syllables (use / )", [
          { sentence: "picnic", answer: "pic/nic" },
          { sentence: "sunset", answer: "sun/set" },
          { sentence: "monster", answer: "mon/ster" },
          { sentence: "trumpet", answer: "trum/pet" },
        ]),
      ],
      "7-8": [
        wordList("Prefixes + roots", ["preview", "review", "unwind", "rewrite", "unfair", "predate", "unstable", "reconnect"], 4),
        fillBlank("Identify the prefix and the root", [
          { sentence: "preview →", answer: "pre + view" },
          { sentence: "unwind →", answer: "un + wind" },
          { sentence: "reconnect →", answer: "re + connect" },
          { sentence: "unstable →", answer: "un + stable" },
        ]),
      ],
    },
  },

  // ============================================================
  // DAY 7 — Week 1 Review & Reflection
  // ============================================================
  7: {
    day: 7,
    title: "Week 1 Review & Reflection",
    category: "Review",
    objective: "Consolidate the week's phonics, sight words and comprehension work.",
    estimatedMinutes: 25,
    warmUp: [
      "Ask: 'What was the hardest thing this week? What felt easiest?'",
      "High-five for showing up 6 days in a row!",
    ],
    instructions: [
      "Complete each of the mixed practice sections below.",
      "Score together — celebrate progress, note the 1–2 skills to keep sharpening.",
      "Fill in the reflection journal at the bottom.",
    ],
    variantsByBand: {
      "1-2": [
        wordList("Review — read these", ["cat", "ship", "that", "the", "said", "shop", "was", "run", "chin", "have"], 5),
        fillBlank("Complete the sentence", [
          { sentence: "___ dog is big.", answer: "The" },
          { sentence: "I ___ hello.", answer: "said" },
          { sentence: "The ___ is on the water.", answer: "ship" },
        ]),
        reflection("My reflection", [
          "One thing I got better at this week is…",
          "One word I want to master next week is…",
          "How I feel about reading right now (draw a face or write a word):",
        ]),
      ],
      "3-4": [
        wordList("Review words", ["through", "because", "friend", "another", "special", "important", "school", "everyone"], 4),
        fillBlank("Fill in the blank", [
          { sentence: "We walked ___ the park.", answer: "through" },
          { sentence: "She is my best ___.", answer: "friend" },
          { sentence: "___ we finish, we can play.", answer: "Once/When/After" },
        ]),
        reflection("Reflection", [
          "One skill that improved this week…",
          "One thing that still feels tricky…",
          "My favorite activity was… because…",
        ]),
      ],
      "5-6": [
        wordList("Review — academic vocabulary", ["analyze", "predict", "summarize", "evidence", "context", "purpose", "theme", "detail"], 4),
        matching("Match term to meaning", [
          { left: "predict", right: "Guess what might happen next" },
          { left: "summarize", right: "Give the main idea briefly" },
          { left: "evidence", right: "Proof from the text" },
          { left: "theme", right: "The underlying message" },
        ]),
        reflection("Reflection", [
          "A comprehension strategy I used this week…",
          "A word I now understand better…",
          "My goal for next week is…",
        ]),
      ],
      "7-8": [
        wordList("Review — academic vocabulary", ["inference", "connotation", "cite", "bias", "hypothesis", "counterargument", "credibility", "critique"], 4),
        matching("Match term to meaning", [
          { left: "inference", right: "A conclusion drawn from evidence" },
          { left: "bias", right: "A leaning toward one side" },
          { left: "counterargument", right: "An opposing view" },
          { left: "credibility", right: "How trustworthy a source is" },
        ]),
        reflection("Reflection", [
          "A strategy that worked well for me…",
          "A concept I want to master before Week 2 ends…",
          "One thing I'd tell a friend struggling with reading…",
        ]),
      ],
    },
    extension:
      "Award yourself a sticker or write your name on the Week 1 achievement line: ______________________",
  },

  // ============================================================
  // DAY 8 — Sight Word Practice (Set 2)
  // ============================================================
  8: {
    day: 8,
    title: "Sight Word Practice (Set 2)",
    category: "Vocabulary",
    objective: "Master a second batch of high-frequency words.",
    estimatedMinutes: 20,
    warmUp: [
      "Quick review of last week's sight words — 10-second flash.",
      "Introduce today's list: read each word twice.",
    ],
    instructions: [
      "Read the list aloud together, then have the student read alone.",
      "Complete the sentence exercises.",
      "Time the student reading the full list — record the seconds.",
    ],
    variantsByBand: {
      "1-2": [
        wordList("Sight word set 2", [
          "come", "look", "make", "help", "little",
          "here", "there", "some", "when", "then",
          "want", "like", "play", "get", "just",
          "know", "put", "one", "two", "three",
        ], 5),
        fillBlank("Fill in the sight word", [
          { sentence: "___ here and see.", answer: "Come" },
          { sentence: "I ___ to play.", answer: "want / like" },
          { sentence: "___ is the ball?", answer: "Where / Here" },
        ]),
      ],
      "3-4": [
        wordList("Sight word set 2", [
          "believe", "brought", "caught", "certain", "clothes",
          "cousin", "example", "favorite", "finally", "instead",
          "language", "measure", "minute", "neighbor", "picture",
          "problem", "question", "reason", "sentence", "yesterday",
        ], 5),
        fillBlank("Complete the sentence", [
          { sentence: "___, we finished the puzzle.", answer: "Finally" },
          { sentence: "My ___ is chocolate.", answer: "favorite" },
          { sentence: "I ___ my homework home.", answer: "brought" },
        ]),
      ],
      "5-6": [
        wordList("Academic word set 2", [
          "conclude", "demonstrate", "establish", "illustrate", "outline",
          "reveal", "significant", "sufficient", "acquire", "distinguish",
          "estimate", "generate", "isolate", "modify", "occur",
          "process", "structure", "temporary", "vary", "voluntary",
        ], 4),
        matching("Match term to meaning", [
          { left: "distinguish", right: "Tell one thing from another" },
          { left: "generate", right: "Make or create" },
          { left: "modify", right: "Change slightly" },
          { left: "voluntary", right: "Done by choice" },
        ]),
      ],
      "7-8": [
        wordList("Academic word set 2", [
          "advocate", "arbitrary", "coherent", "conducive", "diminish",
          "empirical", "feasible", "implicit", "juxtapose", "mitigate",
          "nuance", "paradigm", "plausible", "reciprocal", "scrutinize",
          "substantiate", "tangible", "unprecedented", "viable", "wary",
        ], 4),
        matching("Match term to meaning", [
          { left: "mitigate", right: "Make less severe" },
          { left: "plausible", right: "Reasonable to believe" },
          { left: "scrutinize", right: "Examine closely" },
          { left: "substantiate", right: "Support with evidence" },
          { left: "wary", right: "Cautious" },
        ]),
      ],
    },
    extension: "Use 5 of today's words in a single short paragraph.",
  },

  // ============================================================
  // DAY 9 — Fluency Building: Repeated Reading
  // ============================================================
  9: {
    day: 9,
    title: "Fluency Building: Repeated Reading",
    category: "Fluency",
    objective: "Improve reading speed and smoothness by re-reading the same passage.",
    estimatedMinutes: 20,
    warmUp: [
      "Explain: fluency = reading like you talk — smooth, not choppy.",
      "Model reading one sentence twice — first slow, then smooth.",
    ],
    instructions: [
      "Set a timer for 60 seconds. The student reads the passage aloud.",
      "Count words read correctly (WCPM = words correct per minute).",
      "Rest 60 seconds, then read again. Repeat for a total of 3 timed reads.",
      "Chart the results — the goal is improvement, not perfection.",
    ],
    variantsByBand: {
      "1-2": [
        shortPassage(
          "At the Park (repeated read)",
          "Sam and Kim ran to the park. They saw a big red ball. Sam kicked the ball to Kim. Kim kicked it back. They played until the sun went down. Then they walked home smiling.",
          [{ q: "How did they feel?", a: "Happy / smiling" }]
        ),
        fluencyTracker(
          "WCPM tracker — record words read correctly per minute",
          "Read the passage aloud for 60 seconds. Record the number of words you read correctly each time.",
          3
        ),
      ],
      "3-4": [
        shortPassage(
          "The Kite (repeated read)",
          "The wind pulled the string tight in Ravi's hand. His kite climbed higher and higher, dancing between the clouds. He laughed out loud as it dipped and rose again. For that whole afternoon, the sky felt like his own playground.",
          [{ q: "What did the kite feel like to Ravi?", a: "Like his own playground / joyful" }]
        ),
        fluencyTracker(
          "WCPM tracker",
          "Read for 60 seconds. Record words correct each try. Aim for improvement, not speed.",
          3
        ),
      ],
      "5-6": [
        shortPassage(
          "The Old Bridge (repeated read)",
          "The wooden bridge creaked under Layla's feet as she crossed above the rushing stream. She paused at the middle, gripping the rope handrails, and looked down. The water twisted and foamed over the smooth grey rocks. She took a slow breath, laughed at her own nervousness, and walked confidently to the other side.",
          [{ q: "How did Layla's feelings change?", a: "From nervous to confident" }]
        ),
        fluencyTracker("WCPM tracker", "Time yourself for 60s per read. Track WCPM across 3 reads.", 3),
      ],
      "7-8": [
        shortPassage(
          "The Debate (repeated read)",
          "Jonas gripped the sides of the podium until his knuckles turned white. The auditorium blurred into a single wash of faces. He inhaled, remembered the point he had rehearsed a hundred times, and began. Within a minute, the tremor in his voice had steadied, and he could feel the room shift subtly toward him — leaning in, listening.",
          [{ q: "What signals that Jonas is winning the room?", a: "The audience leaning in and listening" }]
        ),
        fluencyTracker(
          "WCPM tracker",
          "60 seconds per read × 3 reads. Also self-rate expression, phrasing and pacing 1–5 after each.",
          3
        ),
      ],
    },
    extension:
      "For your 4th read, focus on expression only — read as if you were performing the passage for an audience.",
  },

  // ============================================================
  // DAY 11 — Comprehension Strategy: Asking Questions
  // ============================================================
  11: {
    day: 11,
    title: "Comprehension Strategy: Asking Questions",
    category: "Comprehension",
    objective: "Generate strong questions while reading — who, what, where, when, why, how.",
    estimatedMinutes: 20,
    warmUp: [
      "Explain: good readers ask questions in their heads as they read.",
      "Model: read one sentence, then say a 'wonder' question out loud.",
    ],
    instructions: [
      "Read the passage together.",
      "After each paragraph, the student writes one question they wondered.",
      "Then classify each question as WHO / WHAT / WHERE / WHEN / WHY / HOW.",
      "Discuss which questions the text answered — and which are still open.",
    ],
    variantsByBand: {
      "1-2": [
        shortPassage(
          "The Big Egg",
          "One morning, Ellie found a huge blue egg in her yard. It was warm. She sat next to it and waited. Suddenly, the egg started to shake.",
          [
            { q: "Write a WHO question:" },
            { q: "Write a WHAT question:" },
            { q: "Write a WHY question:" },
          ]
        ),
      ],
      "3-4": [
        shortPassage(
          "The New Kid",
          "Maya walked into the classroom on her first day at the new school. Everyone stared. She smiled anyway and took the empty seat by the window. The girl next to her slid a note across the desk that read: 'Sit with us at lunch.'",
          [
            { q: "Write a WHO question:" },
            { q: "Write a WHY question:" },
            { q: "Write a HOW question:" },
          ]
        ),
      ],
      "5-6": [
        shortPassage(
          "The Signal",
          "The old radio in Amir's basement crackled to life at exactly 2 a.m. — the same time, every night for the past week. Tonight, instead of static, a voice spoke: three numbers, then silence. Amir wrote them down. He had a feeling this wasn't random.",
          [
            { q: "Write a WHY question:" },
            { q: "Write a HOW question:" },
            { q: "Write a WHAT-IF question:" },
          ]
        ),
      ],
      "7-8": [
        shortPassage(
          "The Announcement",
          "The principal's voice came over the intercom halfway through third period. Every student froze mid-sentence. The message was two lines long, delivered without emotion, and by the time it ended the meaning had rippled through the school in a hundred whispered guesses.",
          [
            { q: "Write an inferential question:" },
            { q: "Write an analytical question:" },
            { q: "Write a question the text does NOT answer:" },
          ]
        ),
      ],
    },
    extension: "Turn one of your open questions into a short story continuation.",
  },

  // ============================================================
  // DAY 12 — Word Family Activities
  // ============================================================
  12: {
    day: 12,
    title: "Word Family Activities",
    category: "Phonics",
    objective: "Recognize and generate words that share the same rime or root.",
    estimatedMinutes: 20,
    warmUp: [
      "A word family shares an ending — like -at: cat, hat, bat, sat.",
      "Together, name 3 words in the -op family (hop, mop, top).",
    ],
    instructions: [
      "For each family listed, generate at least 4 real words.",
      "Then use two of your words in a sentence.",
    ],
    variantsByBand: {
      "1-2": [
        wordList("Rhyming families to fill", ["-at (cat, hat, ___)", "-ig (pig, dig, ___)", "-op (hop, mop, ___)", "-un (sun, run, ___)"], 2),
        writingPrompt("Sentence practice", "Choose two words from above and write a silly sentence using both.", 4),
      ],
      "3-4": [
        wordList("Fill each family (4 words each)", ["-ake (bake, ___, ___, ___)", "-ight (light, ___, ___, ___)", "-eam (dream, ___, ___, ___)", "-ound (found, ___, ___, ___)"], 2),
        writingPrompt("Sentence practice", "Write a sentence that uses two words from different families.", 4),
      ],
      "5-6": [
        wordList("Root word families — generate 4 words each", ["port (import, export, ___, ___)", "spect (inspect, respect, ___, ___)", "graph (paragraph, autograph, ___, ___)", "form (inform, reform, ___, ___)"], 1),
        writingPrompt("Sentence practice", "Write two sentences — each one using a different root family word.", 4),
      ],
      "7-8": [
        wordList("Latin/Greek roots — generate 4 words each", ["bio (biology, biography, ___, ___)", "tele (telephone, television, ___, ___)", "auto (automatic, autograph, ___, ___)", "chron (chronic, chronology, ___, ___)"], 1),
        writingPrompt("Sentence practice", "Write a short paragraph using at least three root-family words. Underline them.", 6),
      ],
    },
  },

  // ============================================================
  // DAY 13 — Independent Reading Practice
  // ============================================================
  13: {
    day: 13,
    title: "Independent Reading Practice",
    category: "Reading",
    objective: "Read a self-selected text for 15–20 minutes and reflect.",
    estimatedMinutes: 25,
    warmUp: [
      "Let the student choose a book, article, or comic they enjoy.",
      "Set a timer for 15 minutes of quiet reading.",
    ],
    instructions: [
      "Read silently or quietly aloud.",
      "When the timer ends, fill out the reading log below.",
    ],
    variantsByBand: {
      "1-2": [
        writingPrompt("Book title / Author", "Write the title and author of what you read today.", 2),
        writingPrompt("My favorite part", "Draw or write about your favorite part.", 6),
        checklist("Self-check", [
          "I stayed on the page for the whole time",
          "I sounded out any tricky words",
          "I can tell someone what I read",
        ]),
      ],
      "3-4": [
        writingPrompt("Reading log", "Title, author, pages read, and your favorite quote or moment.", 6),
        writingPrompt("Retell", "Retell what you read in 3–5 sentences.", 6),
      ],
      "5-6": [
        writingPrompt("Reading response", "Title & author. What is the central idea so far? What clues tell you that?", 8),
        writingPrompt("Vocabulary catch", "Write 2 new words you saw, plus what you think they mean.", 4),
      ],
      "7-8": [
        writingPrompt("Reading response", "Title & author. Summarize what you read in 4–6 sentences. What is the author's likely purpose?", 10),
        writingPrompt("Analysis", "Choose one sentence you found powerful. Copy it exactly. Then explain why it stood out.", 6),
      ],
    },
  },

  // ============================================================
  // DAY 14 — Week 2 Review & Celebration
  // ============================================================
  14: {
    day: 14,
    title: "Week 2 Review & Celebration",
    category: "Review",
    objective: "Celebrate mid-point progress and consolidate two weeks of learning.",
    estimatedMinutes: 25,
    warmUp: [
      "Compare Week 1 vs Week 2 fluency scores together.",
      "Say out loud: one thing YOU are proud of.",
    ],
    instructions: [
      "Complete the mixed review below.",
      "Fill in the celebration certificate at the bottom.",
    ],
    variantsByBand: {
      "1-2": [
        wordList("Read across the row", ["ship", "chin", "them", "when", "flag", "stop", "the", "said", "have", "want"], 5),
        fillBlank("Fill it in", [
          { sentence: "The ___ swims in the sea.", answer: "fish" },
          { sentence: "I ___ my mom.", answer: "hug / love" },
          { sentence: "We ___ to school.", answer: "go / walk" },
        ]),
        reflection("Certificate", [
          "I, ________________, finished 14 days of Reading Recovery.",
          "My biggest win so far…",
          "Next week's goal…",
        ]),
      ],
      "3-4": [
        matching("Review match", [
          { left: "predict", right: "Guess what might happen next" },
          { left: "friend", right: "Someone you like and trust" },
          { left: "through", right: "Going from one side to the other" },
          { left: "brought", right: "Past tense of bring" },
        ]),
        reflection("Certificate", [
          "I, ________________, finished 14 days of Reading Recovery.",
          "Two things I can do now that I couldn't do 2 weeks ago…",
          "One thing I still want to master…",
        ]),
      ],
      "5-6": [
        matching("Review match", [
          { left: "summarize", right: "Give the main idea briefly" },
          { left: "evidence", right: "Facts that support an idea" },
          { left: "context", right: "The situation around a word or idea" },
          { left: "theme", right: "The underlying message" },
        ]),
        reflection("Certificate", [
          "I, ________________, completed the halfway point of Reading Recovery.",
          "A strategy that changed how I read…",
          "My Week 3 focus is…",
        ]),
      ],
      "7-8": [
        matching("Review match", [
          { left: "inference", right: "Conclusion from evidence" },
          { left: "counterargument", right: "Opposing view" },
          { left: "cite", right: "Give credit to a source" },
          { left: "credibility", right: "Trustworthiness of a source" },
        ]),
        reflection("Certificate", [
          "I, ________________, completed the halfway point of Reading Recovery.",
          "A skill that has clearly grown…",
          "My focus for the final week…",
        ]),
      ],
    },
    extension: "Take a photo of your certificate and share it with a family member.",
  },

  // ============================================================
  // DAY 15 — Vocabulary Building Games
  // ============================================================
  15: {
    day: 15,
    title: "Vocabulary Building Games",
    category: "Vocabulary",
    objective: "Deepen word knowledge through matching, synonyms and context clues.",
    estimatedMinutes: 20,
    warmUp: [
      "Play 'Word Ping-Pong': adult says a word, student says a synonym, and back and forth.",
      "Example: big → large → huge → gigantic.",
    ],
    instructions: [
      "Complete each mini-game below.",
      "Try to use one new word out loud in conversation today.",
    ],
    variantsByBand: {
      "1-2": [
        matching("Match the synonym", [
          { left: "big", right: "large" },
          { left: "happy", right: "glad" },
          { left: "small", right: "little" },
          { left: "fast", right: "quick" },
          { left: "cold", right: "chilly" },
        ]),
        fillBlank("Context clue — choose the best word", [
          { sentence: "The puppy was so ___ she wagged her tail.", answer: "happy / glad" },
          { sentence: "The soup was ___ so I blew on it.", answer: "hot" },
          { sentence: "The turtle moved ___.", answer: "slowly" },
        ]),
      ],
      "3-4": [
        matching("Match the synonym", [
          { left: "important", right: "significant" },
          { left: "afraid", right: "frightened" },
          { left: "began", right: "started" },
          { left: "quiet", right: "silent" },
          { left: "brave", right: "courageous" },
        ]),
        fillBlank("Context clue", [
          { sentence: "The room was so ___ you could hear a pin drop.", answer: "quiet / silent" },
          { sentence: "It was a ___ decision because it would change everything.", answer: "significant / important" },
          { sentence: "She was ___ enough to speak in front of everyone.", answer: "brave / courageous" },
        ]),
      ],
      "5-6": [
        matching("Match the synonym", [
          { left: "reveal", right: "expose" },
          { left: "modify", right: "change" },
          { left: "significant", right: "important" },
          { left: "distinguish", right: "differentiate" },
          { left: "sufficient", right: "enough" },
        ]),
        fillBlank("Context clue", [
          { sentence: "The evidence was ___ to prove the case.", answer: "sufficient" },
          { sentence: "She had to ___ her plan after the weather changed.", answer: "modify" },
          { sentence: "Please ___ between opinion and fact.", answer: "distinguish" },
        ]),
      ],
      "7-8": [
        matching("Match to definition", [
          { left: "juxtapose", right: "Place side by side for contrast" },
          { left: "nuance", right: "A subtle difference in meaning" },
          { left: "plausible", right: "Believable" },
          { left: "mitigate", right: "Make less severe" },
          { left: "wary", right: "Cautious" },
        ]),
        fillBlank("Use the word in context", [
          { sentence: "The film ___ the calm village with the chaos of the city.", answer: "juxtaposes" },
          { sentence: "There is a ___ difference between confidence and arrogance.", answer: "nuanced / subtle" },
          { sentence: "He was ___ of strangers asking too many questions.", answer: "wary" },
        ]),
      ],
    },
    extension:
      "Pick any 3 words from today and draw a quick sketch that shows each meaning.",
  },

  // ============================================================
  // DAY 16 — Fluency: Expression & Phrasing
  // ============================================================
  16: {
    day: 16,
    title: "Fluency: Expression & Phrasing",
    category: "Fluency",
    objective: "Read with appropriate expression — using punctuation and dialogue cues.",
    estimatedMinutes: 20,
    warmUp: [
      "Read one sentence three ways: happy, angry, whispering. Notice how meaning shifts.",
      "Explain: periods = full stop, commas = short pause, ! = strong feeling, ? = curious tone.",
    ],
    instructions: [
      "Read the passage aloud. First read: focus on stopping at periods.",
      "Second read: add expression to the dialogue.",
      "Have the observer fill out the checklist.",
    ],
    variantsByBand: {
      "1-2": [
        shortPassage(
          "The Lost Puppy",
          "\"Where is my puppy?\" cried Ana. She looked under the bed. She looked behind the chair. \"Woof!\" A little tail wagged out from under a blanket. \"There you are!\" Ana laughed.",
          [{ q: "Which lines need excitement in your voice?", a: "The dialogue lines" }]
        ),
        checklist("Expression checklist", [
          "Stopped at each period",
          "Raised voice at question marks",
          "Sounded excited at exclamation marks",
          "Read dialogue like a character talking",
        ]),
      ],
      "3-4": [
        shortPassage(
          "The Surprise",
          "\"Close your eyes,\" Dad said. \"Are you sure?\" I asked. \"Trust me!\" I closed them. I heard a rustle, a whisper, and then — \"Open!\" There, right in front of me, was the bike I had been asking for all year.",
          [{ q: "How does your voice change on the last sentence?", a: "Louder, excited, surprised" }]
        ),
        checklist("Expression checklist", [
          "Paused at commas",
          "Voice rose at question marks",
          "Different characters sounded different",
          "Final sentence felt exciting",
        ]),
      ],
      "5-6": [
        shortPassage(
          "The Test",
          "\"Time!\" the teacher called. Pens dropped. I stared at my last unanswered question. \"You had thirty minutes,\" she said, walking down the aisle. \"Turn them over.\" I flipped my paper and stared at the ceiling. Maybe next time.",
          [{ q: "What tone does the last line need?", a: "Quiet, disappointed, reflective" }]
        ),
        checklist("Expression checklist", [
          "Stopped fully at periods",
          "Dialogue sounded like real speech",
          "Pace slowed at reflective moments",
          "Emotion matched the situation",
        ]),
      ],
      "7-8": [
        shortPassage(
          "The Confrontation",
          "\"You saw what happened,\" she said. Her voice was even, but her hands were not. \"I saw enough,\" I answered. \"Then say it.\" I looked at her, then at the floor. \"No,\" I said. \"Not yet.\"",
          [{ q: "What tension does the reader need to convey?", a: "Restrained, controlled, uneasy" }]
        ),
        checklist("Expression checklist", [
          "Pace slowed to build tension",
          "Two speakers sounded distinct",
          "Pauses used for effect",
          "Emotional undercurrent audible",
        ]),
      ],
    },
    extension:
      "Record yourself reading the passage on a phone. Play it back — what would you change?",
  },

  // ============================================================
  // DAY 17 — Comprehension Strategy: Summarizing
  // ============================================================
  17: {
    day: 17,
    title: "Comprehension Strategy: Summarizing",
    category: "Comprehension",
    objective: "Identify main ideas and retell a text concisely.",
    estimatedMinutes: 25,
    warmUp: [
      "A summary tells the MAIN IDEA + a few key details — nothing extra.",
      "Try it: summarize your day in 2 sentences.",
    ],
    instructions: [
      "Read the passage.",
      "Fill in the graphic organizer: Main Idea + 3 Key Details.",
      "Then write a 2–3 sentence summary using your organizer.",
    ],
    variantsByBand: {
      "1-2": [
        shortPassage(
          "Bees",
          "Bees are tiny insects that help our world. They fly from flower to flower to drink nectar. When they do, they carry pollen too. That pollen helps flowers and fruits grow. Without bees, we would have far fewer foods.",
          [
            { q: "Main idea →" },
            { q: "Detail 1 →" },
            { q: "Detail 2 →" },
            { q: "Detail 3 →" },
            { q: "Two-sentence summary →" },
          ]
        ),
      ],
      "3-4": [
        shortPassage(
          "The Water Cycle",
          "Water is always moving. The sun heats water in oceans and lakes, and it rises into the sky as vapor. Up high, it cools and forms clouds. When the clouds get heavy, water falls back to earth as rain or snow. Then the whole cycle starts again.",
          [
            { q: "Main idea →" },
            { q: "Key detail 1 →" },
            { q: "Key detail 2 →" },
            { q: "Key detail 3 →" },
            { q: "Three-sentence summary →" },
          ]
        ),
      ],
      "5-6": [
        shortPassage(
          "The First Flight",
          "In 1903, the Wright brothers changed the world. On a windy beach in North Carolina, their homemade plane lifted off the ground for 12 seconds. It didn't fly far — only 120 feet — but that short hop proved something huge: humans could fly. Within a decade, aviation had transformed travel, war and commerce.",
          [
            { q: "Central idea →" },
            { q: "Detail 1 →" },
            { q: "Detail 2 →" },
            { q: "Detail 3 →" },
            { q: "Three-sentence summary →" },
          ]
        ),
      ],
      "7-8": [
        shortPassage(
          "The Printing Press",
          "Before the 1450s, books were copied by hand — a slow, expensive process that put reading out of reach for most people. When Johannes Gutenberg introduced movable type, a single press could produce hundreds of pages a day. Books became cheaper, literacy spread, and ideas that had been locked in monasteries began circulating across Europe. Historians consider the printing press one of the most important inventions in human history.",
          [
            { q: "Central idea →" },
            { q: "Detail 1 →" },
            { q: "Detail 2 →" },
            { q: "Detail 3 →" },
            { q: "Four-sentence summary →" },
          ]
        ),
      ],
    },
    extension: "Summarize the same passage in exactly ONE sentence. Harder than it looks.",
  },

  // ============================================================
  // DAY 18 — Guided Reading Session 3
  // ============================================================
  18: {
    day: 18,
    title: "Guided Reading Session 3",
    category: "Reading",
    objective:
      "Read a more challenging passage aloud and answer literal, inferential and analytical questions.",
    estimatedMinutes: 25,
    warmUp: [
      "Preview the title. Ask: 'What do you already know about this topic?'",
      "Skim for any tricky words — decode them before starting.",
    ],
    instructions: [
      "Student reads the passage aloud without a model this time.",
      "Answer all three question types.",
      "Observer fills the checklist below.",
    ],
    variantsByBand: {
      "1-2": [
        shortPassage(
          "The Snowman",
          "Mia rolled three snowballs — a big one, a middle one, and a small one. She stacked them up. Then she put stones for eyes, a carrot for a nose, and a red scarf around the neck. \"You are the best snowman ever,\" she said. Just then, the sun came out from behind a cloud.",
          [
            { q: "Literal: What did Mia use for the nose?", a: "A carrot" },
            { q: "Inferential: What might happen because the sun came out?", a: "The snowman might melt" },
            { q: "Analytical: Why did the author end the story with the sun?", a: "To hint that the snowman won't last" },
          ]
        ),
        checklist("Observer checklist", [
          "Read fluently without adult modeling",
          "Handled tricky words",
          "Answered a why question",
        ]),
      ],
      "3-4": [
        shortPassage(
          "The Old Photograph",
          "Alex found the photo tucked inside an old library book. It showed two children standing in front of the same house he lived in now — but the house looked newer, and the trees were smaller. On the back, someone had written 'Summer 1962.' He held the picture up to the window, then out to his own front yard. Something about that summer felt suddenly close.",
          [
            { q: "Literal: Where did Alex find the photo?", a: "Inside an old library book" },
            { q: "Inferential: How long ago was the photo taken?", a: "About 60+ years" },
            { q: "Analytical: What does 'suddenly close' suggest Alex feels?", a: "A connection across time" },
          ]
        ),
        checklist("Observer checklist", [
          "Read with steady pacing",
          "Self-corrected any errors",
          "Answered inferential question with evidence",
        ]),
      ],
      "5-6": [
        shortPassage(
          "The Rescue",
          "The little dog trembled at the edge of the culvert, too scared to move. Kai lay flat on his stomach and stretched out a hand. \"It's okay,\" he whispered. The dog stared at him for a long moment, then took one step forward. Kai's fingers closed gently around the collar. He didn't rush. He just held on until the dog finally let out a small, exhausted sigh — and let him lift her out.",
          [
            { q: "Literal: What did Kai do to reach the dog?", a: "Lay flat and stretched his hand" },
            { q: "Inferential: Why didn't Kai rush?", a: "So he wouldn't scare the dog further" },
            { q: "Analytical: What does the dog's sigh reveal about how she felt?", a: "Relief / trust / exhaustion" },
          ]
        ),
        checklist("Observer checklist", [
          "Read with fluent phrasing",
          "Handled multisyllabic words",
          "Used textual evidence in answers",
        ]),
      ],
      "7-8": [
        shortPassage(
          "The Decision",
          "The offer was on the table: full scholarship, but three thousand miles from home. Amara read the letter for the fourth time as if the words might rearrange themselves into something easier. Her mother had said only, \"It's your life, mija.\" Her father had said nothing at all — which somehow said more. She looked out the window at the familiar street she had walked her whole life, and she understood, with a small ache, that leaving would be a kind of loss no matter how much she gained.",
          [
            { q: "Literal: What decision is Amara facing?", a: "Whether to accept a scholarship far from home" },
            { q: "Inferential: What does her father's silence communicate?", a: "That he does not want her to leave, but won't say it" },
            { q: "Analytical: What does the author mean by 'a kind of loss no matter how much she gained'?", a: "That growth and departure come with grief for what is left behind" },
          ]
        ),
        checklist("Observer checklist", [
          "Reads with mature phrasing and expression",
          "Interprets subtext (father's silence)",
          "Supports analysis with specific evidence",
        ]),
      ],
    },
  },

  // ============================================================
  // DAY 19 — Writing Connection Activity
  // ============================================================
  19: {
    day: 19,
    title: "Writing Connection Activity",
    category: "Writing",
    objective: "Respond to reading through a short, planned piece of writing.",
    estimatedMinutes: 25,
    warmUp: [
      "Talk before you write — say your idea out loud first.",
      "Remember: capital letter at the start, punctuation at the end.",
    ],
    instructions: [
      "Read the prompt.",
      "Fill in the planning organizer first.",
      "Then write your response on the lines below.",
      "Read it back aloud — does it make sense?",
    ],
    variantsByBand: {
      "1-2": [
        writingPrompt(
          "Story response",
          "Think of a story you loved this week. Draw the main character in the box, then write 2–3 sentences about why you liked them.",
          6
        ),
      ],
      "3-4": [
        reflection("Planning organizer", [
          "Character:",
          "Setting:",
          "Problem:",
          "How it's solved:",
        ]),
        writingPrompt(
          "Story continuation",
          "Choose a passage from this week and write what you think happens NEXT — at least 5 sentences.",
          10
        ),
      ],
      "5-6": [
        reflection("Planning organizer", [
          "Topic sentence (main idea):",
          "Detail 1 (evidence):",
          "Detail 2 (evidence):",
          "Closing sentence (wrap-up):",
        ]),
        writingPrompt(
          "Response paragraph",
          "Choose one passage from this week. Answer: What is the main message, and how does the author show it? Write one full paragraph (5–7 sentences).",
          12
        ),
      ],
      "7-8": [
        reflection("Planning organizer", [
          "Claim (what you want to argue):",
          "Evidence 1 (with quote or reference):",
          "Evidence 2 (with quote or reference):",
          "Reasoning (why the evidence proves the claim):",
          "Conclusion:",
        ]),
        writingPrompt(
          "Analytical response",
          "Pick one passage from this week. Write a 1-paragraph analytical response using the CER structure (Claim, Evidence, Reasoning). 8–12 sentences.",
          14
        ),
      ],
    },
    extension: "Read your writing to someone else and ask: 'Was that clear?'",
  },

  // ============================================================
  // DAY 20 — Final Practice & Preparation
  // ============================================================
  20: {
    day: 20,
    title: "Final Practice & Preparation",
    category: "Review",
    objective: "Warm up for the Post-Assessment and review the biggest wins.",
    estimatedMinutes: 25,
    warmUp: [
      "Deep breath. You've come 20 days — the last piece is easy.",
      "Skim through this workbook — pick your proudest activity.",
    ],
    instructions: [
      "Complete the mixed review below (light — this is a warm-up, not a test).",
      "Fill in the 'I'm ready because…' section at the end.",
      "Get a good night's sleep before Day 21.",
    ],
    variantsByBand: {
      "1-2": [
        wordList("Warm-up read", ["ship", "chin", "shop", "when", "flag", "trip", "hand", "the", "said", "have"], 5),
        shortPassage(
          "One More Read",
          "The cat sat by the door. She looked at the rain outside. She did not want to go out. She curled up on the mat and went to sleep.",
          [
            { q: "Where did the cat go?", a: "Onto the mat, to sleep" },
            { q: "Why didn't she go out?", a: "It was raining" },
          ]
        ),
        reflection("Ready-Check", [
          "One word I feel great about now:",
          "One thing I'm still working on:",
          "I'm ready for tomorrow because…",
        ]),
      ],
      "3-4": [
        wordList("Warm-up read", ["through", "brought", "friend", "special", "important", "picture", "problem", "reason"], 4),
        shortPassage(
          "The Big Day",
          "Kira laid out her clothes the night before, packed her bag, and set two alarms. She had done everything she could. Now all that was left was to sleep — and to remember, in the morning, that she had prepared for this.",
          [
            { q: "What did Kira do to get ready?", a: "Laid out clothes, packed bag, set alarms" },
            { q: "How does the author show she is calm?", a: "The steady list of actions; final line" },
          ]
        ),
        reflection("Ready-Check", [
          "A skill I've grown in:",
          "A word I no longer struggle with:",
          "I'm ready for tomorrow because…",
        ]),
      ],
      "5-6": [
        wordList("Warm-up read", ["analyze", "predict", "evidence", "significant", "conclude", "purpose", "context", "theme"], 4),
        shortPassage(
          "The Last Lap",
          "Coach clicked the stopwatch and nodded. Eli didn't need to see the number to know — his legs told him. He had trimmed almost a full second off his time. Not fast enough for first, maybe. But fast enough to know that all those early mornings had counted.",
          [
            { q: "What is Eli practicing for?", a: "A race" },
            { q: "What does the last sentence reveal about him?", a: "He values effort/growth over winning" },
          ]
        ),
        reflection("Ready-Check", [
          "One reading strategy that clicked for me:",
          "One area I've clearly grown in:",
          "I'm ready for the Post-Test because…",
        ]),
      ],
      "7-8": [
        wordList("Warm-up read", ["inference", "counterargument", "credibility", "juxtapose", "mitigate", "scrutinize", "plausible", "nuance"], 4),
        shortPassage(
          "The Application",
          "Sana closed the laptop and pressed her palms against her face for a long moment. The essay was as honest as she could make it, and the deadline was in three minutes. She could open the file again and second-guess every sentence, or she could hit submit and trust the work she had done. She reached for the mouse.",
          [
            { q: "Literal: What is Sana submitting?", a: "An application/essay" },
            { q: "Analytical: What choice does the final sentence imply she makes?", a: "She chooses to trust her work and submit" },
          ]
        ),
        reflection("Ready-Check", [
          "A comprehension move I now use automatically:",
          "A vocabulary shift I'm proud of:",
          "I'm ready for the Post-Test because…",
        ]),
      ],
    },
    extension:
      "Set a small reward for finishing Day 21 — you've earned it.",
  },
};

export const getActivity = (day: number): DayActivity | null => activities[day] ?? null;
