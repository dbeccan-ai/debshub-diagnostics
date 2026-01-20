// Reading Recovery Diagnostic Content - VERBATIM from source document
// DO NOT modify the text content - these are exact copies from the diagnostic

export interface Question {
  id: string;
  number: number;
  level: 'literal' | 'inferential' | 'analytical';
  text: string;
}

export interface DecodingChecklist {
  accuracyLevels: {
    strong: string;
    needsSupport: string;
    significantGap: string;
  };
  strategies?: string[];
  multiSyllabicWords?: string[];
  readingBehaviors?: string[];
  prosody?: string[];
  complexVocabulary?: string[];
}

export interface ScoringThresholds {
  literal: { questions: string; total: number; gapThreshold: string };
  inferential: { questions: string; total: number; gapThreshold: string };
  analytical: { questions: string; total: number; gapThreshold: string };
  totalQuestions: number;
}

export interface Passage {
  gradeBand: '1-2' | '3-4' | '5-6' | '7-8';
  version: 'A' | 'B' | 'C';
  versionLabel: string;
  title: string;
  metadata: {
    wordCount: number;
    lexile: string;
    focus: string;
  };
  text: string;
  questions: Question[];
  decodingChecklist: DecodingChecklist;
  scoringThresholds: ScoringThresholds;
  breakdownPoints: string[];
}

// Grade 1-2 Passages
const grade12VersionA: Passage = {
  gradeBand: '1-2',
  version: 'A',
  versionLabel: 'Pre-Assessment (Day 0/1)',
  title: "Max's New Friend",
  metadata: {
    wordCount: 88,
    lexile: '200L',
    focus: 'CVC and sight word focus'
  },
  text: `Max had a new dog. The dog was big and brown. His name was Chip.

Max and Chip liked to run and play. They ran in the yard every day. Chip could jump very high. He could catch a red ball.

One day, it was raining. Max was sad. He could not go outside to play with Chip.

Then Max had an idea. He got Chip's ball. They played inside the house. Mom said, "Good thinking, Max!"

Now Max and Chip were happy.`,
  questions: [
    { id: '1-2-A-1', number: 1, level: 'literal', text: 'What color was Max\'s dog?' },
    { id: '1-2-A-2', number: 2, level: 'literal', text: 'What was the dog\'s name?' },
    { id: '1-2-A-3', number: 3, level: 'literal', text: 'What could Chip catch?' },
    { id: '1-2-A-4', number: 4, level: 'inferential', text: 'Why was Max sad when it was raining?' },
    { id: '1-2-A-5', number: 5, level: 'inferential', text: 'How do you think Chip felt when Max brought the ball inside?' },
    { id: '1-2-A-6', number: 6, level: 'analytical', text: 'Was Max\'s idea to play inside a good idea or a bad idea? Why?' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-3 errors (90%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 4-7 errors (needs decoding support)',
      significantGap: 'Read with 8+ errors (significant decoding gaps)'
    },
    strategies: [
      'Sounded out unfamiliar words successfully',
      'Attempted to sound out but needed help',
      'Guessed at words based on pictures/first letter',
      'Skipped difficult words entirely'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-3', total: 3, gapThreshold: '0-1 correct = LITERAL GAP' },
    inferential: { questions: 'Q4-5', total: 2, gapThreshold: '0 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q6', total: 1, gapThreshold: '0 correct = ANALYTICAL GAP' },
    totalQuestions: 6
  },
  breakdownPoints: [
    'Decoding (8+ errors or struggled significantly)',
    'Literal Comprehension (0-1 correct on Q1-3)',
    'Inferential Comprehension (0 correct on Q4-5)',
    'Analytical Comprehension (0 correct on Q6)'
  ]
};

const grade12VersionB: Passage = {
  gradeBand: '1-2',
  version: 'B',
  versionLabel: 'Mid-Point Check (Day 10-11)',
  title: "Lily's Birthday Surprise",
  metadata: {
    wordCount: 91,
    lexile: '200L',
    focus: 'CVC and sight word focus'
  },
  text: `Today was Lily's birthday. She was seven years old. Mom said there was a surprise.

After lunch, the doorbell rang. Lily opened the door. It was her friend Sam! He had a big box with a bow.

"Open it!" said Sam.

Lily opened the box. Inside was a fluffy white kitten! The kitten had blue eyes and a pink nose.

"I love her!" Lily said. "I will name her Snowball."

Snowball purred and licked Lily's hand. It was the best birthday ever.`,
  questions: [
    { id: '1-2-B-1', number: 1, level: 'literal', text: 'How old is Lily?' },
    { id: '1-2-B-2', number: 2, level: 'literal', text: 'What was inside the box?' },
    { id: '1-2-B-3', number: 3, level: 'literal', text: 'What did Lily name the kitten?' },
    { id: '1-2-B-4', number: 4, level: 'inferential', text: 'Why do you think Lily said "I love her!" when she saw the kitten?' },
    { id: '1-2-B-5', number: 5, level: 'inferential', text: 'How do you think Sam felt when Lily was happy about the gift?' },
    { id: '1-2-B-6', number: 6, level: 'analytical', text: 'Why do you think Lily named the kitten "Snowball"?' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-3 errors (90%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 4-7 errors (needs decoding support)',
      significantGap: 'Read with 8+ errors (significant decoding gaps)'
    },
    strategies: [
      'Sounded out unfamiliar words successfully',
      'Attempted to sound out but needed help',
      'Guessed at words based on pictures/first letter',
      'Skipped difficult words entirely'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-3', total: 3, gapThreshold: '0-1 correct = LITERAL GAP' },
    inferential: { questions: 'Q4-5', total: 2, gapThreshold: '0 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q6', total: 1, gapThreshold: '0 correct = ANALYTICAL GAP' },
    totalQuestions: 6
  },
  breakdownPoints: [
    'Decoding (8+ errors or struggled significantly)',
    'Literal Comprehension (0-1 correct on Q1-3)',
    'Inferential Comprehension (0 correct on Q4-5)',
    'Analytical Comprehension (0 correct on Q6)'
  ]
};

const grade12VersionC: Passage = {
  gradeBand: '1-2',
  version: 'C',
  versionLabel: 'Post-Assessment (Day 21)',
  title: "Ben Learns to Swim",
  metadata: {
    wordCount: 89,
    lexile: '200L',
    focus: 'CVC and sight word focus'
  },
  text: `Ben wanted to swim like his big sister. But he was scared of the water.

"I will help you," said his sister Kate. "Let's start in the shallow end."

Ben put his feet in the pool. The water was cold! Kate held his hand.

"Now try to float," Kate said.

Ben lay back in the water. Kate's hands were under him. He did it! He was floating!

"I'm not scared anymore!" Ben said with a big smile.

Kate was proud of her little brother.`,
  questions: [
    { id: '1-2-C-1', number: 1, level: 'literal', text: 'What did Ben want to learn?' },
    { id: '1-2-C-2', number: 2, level: 'literal', text: 'Who helped Ben?' },
    { id: '1-2-C-3', number: 3, level: 'literal', text: 'Where did they start?' },
    { id: '1-2-C-4', number: 4, level: 'inferential', text: 'Why do you think Ben said "I\'m not scared anymore"?' },
    { id: '1-2-C-5', number: 5, level: 'inferential', text: 'How did Kate feel at the end? How do you know?' },
    { id: '1-2-C-6', number: 6, level: 'analytical', text: 'Do you think Kate is a good sister? Why or why not?' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-3 errors (90%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 4-7 errors (needs decoding support)',
      significantGap: 'Read with 8+ errors (significant decoding gaps)'
    },
    strategies: [
      'Sounded out unfamiliar words successfully',
      'Attempted to sound out but needed help',
      'Guessed at words based on pictures/first letter',
      'Skipped difficult words entirely'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-3', total: 3, gapThreshold: '0-1 correct = LITERAL GAP' },
    inferential: { questions: 'Q4-5', total: 2, gapThreshold: '0 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q6', total: 1, gapThreshold: '0 correct = ANALYTICAL GAP' },
    totalQuestions: 6
  },
  breakdownPoints: [
    'Decoding (8+ errors or struggled significantly)',
    'Literal Comprehension (0-1 correct on Q1-3)',
    'Inferential Comprehension (0 correct on Q4-5)',
    'Analytical Comprehension (0 correct on Q6)'
  ]
};

// Grade 3-4 Passages
const grade34VersionA: Passage = {
  gradeBand: '3-4',
  version: 'A',
  versionLabel: 'Pre-Assessment (Day 0/1)',
  title: "The Secret Garden Discovery",
  metadata: {
    wordCount: 198,
    lexile: '450L',
    focus: 'Includes multi-syllabic words, blends, digraphs'
  },
  text: `Maya loved exploring her grandmother's old house. Every room held treasures from the past—dusty books, faded photographs, and mysterious boxes.

One rainy Saturday afternoon, Maya discovered something unusual in the attic. Behind a tall wooden cabinet, she found a small door she had never noticed before. The brass doorknob was covered in cobwebs, but it still turned.

Maya pushed the door open and gasped. Sunlight streamed through a dusty window, revealing a hidden room filled with gardening tools, seed packets, and journals. She carefully opened one of the journals. The pages were yellowed with age, but she could still read her grandmother's neat handwriting.

"My Secret Garden Plans - 1965" the first page read.

Maya's eyes widened as she flipped through sketches of flowers, vegetables, and a beautiful fountain. Her grandmother had dreamed of creating a magical garden but never told anyone about it.

Maya raced downstairs, journal in hand. She couldn't wait to share this discovery with her grandmother. Perhaps together, they could finally bring those fifty-year-old dreams to life.`,
  questions: [
    { id: '3-4-A-1', number: 1, level: 'literal', text: 'Where did Maya find the small door?' },
    { id: '3-4-A-2', number: 2, level: 'literal', text: 'What three things were in the hidden room?' },
    { id: '3-4-A-3', number: 3, level: 'literal', text: 'What year was written on the first page of the journal?' },
    { id: '3-4-A-4', number: 4, level: 'inferential', text: 'Why do you think the doorknob was covered in cobwebs?' },
    { id: '3-4-A-5', number: 5, level: 'inferential', text: 'How did Maya feel when she found the journal? How do you know?' },
    { id: '3-4-A-6', number: 6, level: 'inferential', text: 'Why do you think Grandmother never created the garden?' },
    { id: '3-4-A-7', number: 7, level: 'analytical', text: 'The story says the journal pages were "yellowed with age." What does this tell you about how long ago the journal was written?' },
    { id: '3-4-A-8', number: 8, level: 'analytical', text: 'Do you think Maya and her grandmother will create the garden? Why or why not?' },
    { id: '3-4-A-9', number: 9, level: 'analytical', text: 'What does this story teach us about old things or the past?' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-5 errors (95%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 6-12 errors (needs fluency support)',
      significantGap: 'Read with 13+ errors (decoding gaps present)'
    },
    multiSyllabicWords: ['exploring', 'discovering', 'mysterious', 'photographs', 'unusual', 'cabinet'],
    readingBehaviors: [
      'Self-corrected errors while reading',
      'Read with appropriate phrasing (not word-by-word)',
      'Adjusted speed based on content',
      'Showed expression when reading dialogue'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-3', total: 3, gapThreshold: '0-1 correct = LITERAL GAP' },
    inferential: { questions: 'Q4-6', total: 3, gapThreshold: '0-1 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q7-9', total: 3, gapThreshold: '0-1 correct = ANALYTICAL GAP' },
    totalQuestions: 9
  },
  breakdownPoints: [
    'Decoding (13+ errors or struggled with multi-syllabic words)',
    'Fluency (accurate but very slow, word-by-word reading)',
    'Literal Comprehension (0-1 correct on Q1-3)',
    'Inferential Comprehension (0-1 correct on Q4-6)',
    'Analytical Comprehension (0-1 correct on Q7-9)'
  ]
};

const grade34VersionB: Passage = {
  gradeBand: '3-4',
  version: 'B',
  versionLabel: 'Mid-Point Check (Day 10-11)',
  title: "The Science Fair Surprise",
  metadata: {
    wordCount: 201,
    lexile: '450L',
    focus: 'Includes multi-syllabic words, blends, digraphs'
  },
  text: `Jordan stared at the empty poster board on his desk. The science fair was in three days, and everyone else in his class seemed to have amazing projects. Mia was building a volcano. Carlos had a robot that sorted recycling. Jordan had nothing.

"What if I'm just not good at science?" Jordan mumbled, slumping in his chair.

His older brother Dante walked by and paused. "What are you working on?"

"Nothing. I can't think of any ideas," Jordan admitted.

Dante sat down beside him. "What do you wonder about? What questions do you ask yourself?"

Jordan thought for a moment. "Well, I always wonder why my skateboard wheels wear out faster on one side than the other."

Dante's face lit up. "That's perfect! That's friction and weight distribution. You could test it—try different surfaces, different speeds, measure the wear patterns."

Jordan's eyes widened. "That's actually science?"

"The best science starts with real questions," Dante explained. "You don't need fancy equipment. You need curiosity."

By the end of the evening, Jordan had sketched out his entire experiment. His poster board wasn't empty anymore—it was filled with hypotheses, diagrams, and observations about something he genuinely cared about.

Maybe he was better at science than he thought.`,
  questions: [
    { id: '3-4-B-1', number: 1, level: 'literal', text: 'What was Jordan\'s problem at the beginning of the story?' },
    { id: '3-4-B-2', number: 2, level: 'literal', text: 'Name one project another student was working on.' },
    { id: '3-4-B-3', number: 3, level: 'literal', text: 'What question did Jordan wonder about?' },
    { id: '3-4-B-4', number: 4, level: 'inferential', text: 'Why did Jordan think he wasn\'t good at science?' },
    { id: '3-4-B-5', number: 5, level: 'inferential', text: 'What does Dante mean when he says "The best science starts with real questions"?' },
    { id: '3-4-B-6', number: 6, level: 'inferential', text: 'How did Jordan\'s feelings change from the beginning to the end of the story? Give evidence.' },
    { id: '3-4-B-7', number: 7, level: 'analytical', text: 'What lesson or message does this story teach about doing science projects?' },
    { id: '3-4-B-8', number: 8, level: 'analytical', text: 'Why did the author include the details about Mia\'s volcano and Carlos\'s robot?' },
    { id: '3-4-B-9', number: 9, level: 'analytical', text: 'Do you think Jordan will do well at the science fair? Why or why not?' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-5 errors (95%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 6-12 errors (needs fluency support)',
      significantGap: 'Read with 13+ errors (decoding gaps present)'
    },
    multiSyllabicWords: ['amazing', 'recycling', 'admitted', 'curiosity', 'hypotheses', 'observations'],
    readingBehaviors: [
      'Self-corrected errors while reading',
      'Read with appropriate phrasing (not word-by-word)',
      'Adjusted speed based on content',
      'Showed expression when reading dialogue'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-3', total: 3, gapThreshold: '0-1 correct = LITERAL GAP' },
    inferential: { questions: 'Q4-6', total: 3, gapThreshold: '0-1 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q7-9', total: 3, gapThreshold: '0-1 correct = ANALYTICAL GAP' },
    totalQuestions: 9
  },
  breakdownPoints: [
    'Decoding (13+ errors or struggled with multi-syllabic words)',
    'Fluency (accurate but very slow, word-by-word reading)',
    'Literal Comprehension (0-1 correct on Q1-3)',
    'Inferential Comprehension (0-1 correct on Q4-6)',
    'Analytical Comprehension (0-1 correct on Q7-9)'
  ]
};

const grade34VersionC: Passage = {
  gradeBand: '3-4',
  version: 'C',
  versionLabel: 'Post-Assessment (Day 21)',
  title: "The Library Card",
  metadata: {
    wordCount: 195,
    lexile: '450L',
    focus: 'Includes multi-syllabic words, blends, digraphs'
  },
  text: `Rosa clutched her brand-new library card like it was made of gold. For weeks, she'd saved her allowance to pay the lost book fee from two years ago. Now, finally, she could check out books again.

The librarian, Mrs. Chen, smiled warmly. "Welcome back, Rosa. We've missed you."

Rosa felt her cheeks flush. She'd been too embarrassed to come to the library after losing that book, even though she loved reading more than almost anything.

"I'm sorry it took so long to pay the fee," Rosa said quietly.

Mrs. Chen leaned forward. "You know what impressed me? You came back. Many people would have given up on the library entirely. But you valued it enough to make it right."

Rosa hadn't thought about it that way. She'd just felt guilty.

"Now," Mrs. Chen continued, sliding three thick books across the counter, "I set these aside for you. They're the new fantasy series everyone's been requesting. I had a feeling you'd be back."

Rosa's eyes went wide. Someone had believed she would return—had saved books just for her.

She tucked her library card safely in her pocket. She would never lose it again.`,
  questions: [
    { id: '3-4-C-1', number: 1, level: 'literal', text: 'Why couldn\'t Rosa check out books before?' },
    { id: '3-4-C-2', number: 2, level: 'literal', text: 'How did Rosa get the money to pay the fee?' },
    { id: '3-4-C-3', number: 3, level: 'literal', text: 'What kind of books did Mrs. Chen save for Rosa?' },
    { id: '3-4-C-4', number: 4, level: 'inferential', text: 'Why was Rosa too embarrassed to come to the library after losing the book?' },
    { id: '3-4-C-5', number: 5, level: 'inferential', text: 'What does Mrs. Chen mean when she says, "You valued it enough to make it right"?' },
    { id: '3-4-C-6', number: 6, level: 'inferential', text: 'Why did Mrs. Chen save books for Rosa?' },
    { id: '3-4-C-7', number: 7, level: 'analytical', text: 'How does Rosa\'s view of herself change during this story?' },
    { id: '3-4-C-8', number: 8, level: 'analytical', text: 'What does Rosa mean when she thinks "She would never lose it again"?' },
    { id: '3-4-C-9', number: 9, level: 'analytical', text: 'What is the main theme or lesson of this story?' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-5 errors (95%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 6-12 errors (needs fluency support)',
      significantGap: 'Read with 13+ errors (decoding gaps present)'
    },
    multiSyllabicWords: ['allowance', 'embarrassed', 'impressed', 'entirely', 'continued', 'requesting'],
    readingBehaviors: [
      'Self-corrected errors while reading',
      'Read with appropriate phrasing (not word-by-word)',
      'Adjusted speed based on content',
      'Showed expression when reading dialogue'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-3', total: 3, gapThreshold: '0-1 correct = LITERAL GAP' },
    inferential: { questions: 'Q4-6', total: 3, gapThreshold: '0-1 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q7-9', total: 3, gapThreshold: '0-1 correct = ANALYTICAL GAP' },
    totalQuestions: 9
  },
  breakdownPoints: [
    'Decoding (13+ errors or struggled with multi-syllabic words)',
    'Fluency (accurate but very slow, word-by-word reading)',
    'Literal Comprehension (0-1 correct on Q1-3)',
    'Inferential Comprehension (0-1 correct on Q4-6)',
    'Analytical Comprehension (0-1 correct on Q7-9)'
  ]
};

// Grade 5-6 Passages
const grade56VersionA: Passage = {
  gradeBand: '5-6',
  version: 'A',
  versionLabel: 'Pre-Assessment (Day 0/1)',
  title: "The Truth About Lightning",
  metadata: {
    wordCount: 312,
    lexile: '650L',
    focus: 'Informational text with complex vocabulary'
  },
  text: `Most people believe that lightning strikes from the sky down to the ground. However, scientists have discovered that lightning actually works in both directions at once—a process that happens so quickly the human eye cannot detect it.

When storm clouds form, ice particles collide inside the cloud, creating an electrical charge. The bottom of the cloud becomes negatively charged, while the top becomes positively charged. This separation of charges creates tension, like stretching a rubber band until it must snap.

Here's where it gets fascinating: The negative charge at the cloud's base causes a positive charge to build up on the ground below. This positive charge follows the cloud like a shadow, concentrating on tall objects such as trees, buildings, and even people.

When the electrical tension becomes too great, a stepped leader—a channel of negative charge—zigzags down from the cloud. It moves in steps, pausing and branching as it searches for the best path. The stepped leader is invisible to our eyes.

Meanwhile, positive streamers reach up from the ground, trying to connect with the descending leader. When they finally meet, usually about 300 feet above the ground, an electrical circuit completes. At this moment, a brilliant flash of light travels up through the established channel—this return stroke is what we actually see as lightning. The return stroke carries massive amounts of electricity and heats the air to 54,000 degrees Fahrenheit, five times hotter than the sun's surface.

So when someone says, "Lightning struck that tree," they're only half right. The lightning both came down from the cloud and went up from the tree simultaneously. The spectacular flash we see is actually the upward movement of electricity, not the downward strike.

Understanding how lightning works helps scientists predict strikes and develop better safety measures, potentially saving thousands of lives each year.`,
  questions: [
    { id: '5-6-A-1', number: 1, level: 'literal', text: 'What causes the electrical charge in storm clouds?' },
    { id: '5-6-A-2', number: 2, level: 'literal', text: 'According to the passage, which part of the cloud becomes negatively charged?' },
    { id: '5-6-A-3', number: 3, level: 'literal', text: 'How hot does the return stroke heat the air?' },
    { id: '5-6-A-4', number: 4, level: 'literal', text: 'What is the "stepped leader"?' },
    { id: '5-6-A-5', number: 5, level: 'inferential', text: 'Why does the author compare the electrical tension to "stretching a rubber band until it must snap"?' },
    { id: '5-6-A-6', number: 6, level: 'inferential', text: 'Why do positive streamers concentrate in tall objects like trees and buildings?' },
    { id: '5-6-A-7', number: 7, level: 'inferential', text: 'Based on the passage, why can\'t humans see the stepped leader?' },
    { id: '5-6-A-8', number: 8, level: 'analytical', text: 'The author states that most people believe lightning strikes from sky to ground. Why does the author open with this common misconception?' },
    { id: '5-6-A-9', number: 9, level: 'analytical', text: 'The passage says understanding lightning helps scientists "develop better safety measures, potentially saving thousands of lives." What evidence in the passage supports the idea that lightning is dangerous?' },
    { id: '5-6-A-10', number: 10, level: 'analytical', text: 'This passage is informational/expository text. How is the author\'s purpose different from a fictional story about a lightning storm?' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-6 errors (98%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 7-15 errors (needs support)',
      significantGap: 'Read with 16+ errors (significant gap)'
    },
    complexVocabulary: ['negatively', 'separation', 'concentrating', 'simultaneously', 'spectacular', 'potentially'],
    prosody: [
      'Read at appropriate pace (not too slow, not rushed)',
      'Used proper phrasing and pausing at punctuation',
      'Adjusted tone for informational text',
      'Self-corrected errors when meaning broke down'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-4', total: 4, gapThreshold: '0-2 correct = LITERAL GAP' },
    inferential: { questions: 'Q5-7', total: 3, gapThreshold: '0-1 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q8-10', total: 3, gapThreshold: '0-1 correct = ANALYTICAL GAP' },
    totalQuestions: 10
  },
  breakdownPoints: [
    'Decoding (16+ errors or struggled with complex vocabulary)',
    'Fluency (accurate but very slow or choppy)',
    'Literal Comprehension (0-2 correct on Q1-4)',
    'Inferential Comprehension (0-1 correct on Q5-7)',
    'Analytical Comprehension (0-1 correct on Q8-10)',
    'Vocabulary (struggled with domain-specific/academic words)'
  ]
};

const grade56VersionB: Passage = {
  gradeBand: '5-6',
  version: 'B',
  versionLabel: 'Mid-Point Check (Day 10-11)',
  title: "Why Leaves Change Color",
  metadata: {
    wordCount: 318,
    lexile: '650L',
    focus: 'Informational text with complex vocabulary'
  },
  text: `Every autumn, trees put on a spectacular show. Leaves transform from green to brilliant shades of yellow, orange, red, and purple. Many people assume that cold temperatures cause this change, but the real explanation involves chemistry, sunlight, and survival strategies.

During spring and summer, leaves are green because they contain chlorophyll, a molecule that captures sunlight for photosynthesis—the process plants use to make food. Chlorophyll is so abundant and vibrant that it masks other pigments present in the leaf.

However, as days grow shorter in autumn, trees receive a critical signal: winter is approaching. Deciduous trees—those that shed their leaves—begin preparing for the harsh season ahead. Since leaves require significant resources to maintain and would be damaged by freezing temperatures anyway, trees start to shut them down.

First, trees form a barrier layer of cells at the base of each leaf stem, blocking the flow of nutrients and water. Without these supplies, chlorophyll production stops. As existing chlorophyll breaks down and isn't replaced, it gradually disappears from the leaf.

Here's where the color show begins: With the green chlorophyll gone, other pigments that were always present become visible. Carotenoids, which produce yellow and orange hues, were in the leaf all along. The brilliant yellows of birch and aspen trees and the oranges of sugar maples come from these unmasked pigments.

Red and purple colors have a different origin. Some trees produce anthocyanins in autumn—pigments that weren't present during summer. Scientists believe anthocyanins may protect leaves from sun damage during the breakdown process, or they might help trees reabsorb maximum nutrients before the leaves fall.

The exact timing and intensity of fall colors depend on weather conditions. Warm, sunny days and cool (but not freezing) nights produce the most vibrant displays. Drought or early frost can dull the colors or cause leaves to drop before reaching peak brilliance.

Understanding leaf color change reveals that autumn beauty isn't just decoration—it's a tree's sophisticated survival mechanism in action.`,
  questions: [
    { id: '5-6-B-1', number: 1, level: 'literal', text: 'What molecule makes leaves green?' },
    { id: '5-6-B-2', number: 2, level: 'literal', text: 'What are deciduous trees?' },
    { id: '5-6-B-3', number: 3, level: 'literal', text: 'What pigments produce yellow and orange colors?' },
    { id: '5-6-B-4', number: 4, level: 'literal', text: 'According to the passage, what weather conditions produce the most vibrant fall colors?' },
    { id: '5-6-B-5', number: 5, level: 'inferential', text: 'Why does chlorophyll "mask" other pigments during spring and summer?' },
    { id: '5-6-B-6', number: 6, level: 'inferential', text: 'Why do trees form a barrier layer at the base of each leaf stem in autumn?' },
    { id: '5-6-B-7', number: 7, level: 'inferential', text: 'Based on the passage, why might a drought cause leaves to be less colorful?' },
    { id: '5-6-B-8', number: 8, level: 'analytical', text: 'The passage says autumn leaf colors are "a tree\'s sophisticated survival mechanism." How does changing leaf color help a tree survive?' },
    { id: '5-6-B-9', number: 9, level: 'analytical', text: 'Why does the author contrast what "many people assume" with "the real explanation" in the first paragraph?' },
    { id: '5-6-B-10', number: 10, level: 'analytical', text: 'This passage explains a natural phenomenon scientifically. How would this passage be different if it were written as a narrative story?' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-6 errors (98%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 7-15 errors (needs support)',
      significantGap: 'Read with 16+ errors (significant gap)'
    },
    complexVocabulary: ['chlorophyll', 'photosynthesis', 'deciduous', 'carotenoids', 'anthocyanins', 'mechanism'],
    prosody: [
      'Read at appropriate pace (not too slow, not rushed)',
      'Used proper phrasing and pausing at punctuation',
      'Adjusted tone for informational text',
      'Self-corrected errors when meaning broke down'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-4', total: 4, gapThreshold: '0-2 correct = LITERAL GAP' },
    inferential: { questions: 'Q5-7', total: 3, gapThreshold: '0-1 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q8-10', total: 3, gapThreshold: '0-1 correct = ANALYTICAL GAP' },
    totalQuestions: 10
  },
  breakdownPoints: [
    'Decoding (16+ errors or struggled with complex vocabulary)',
    'Fluency (accurate but very slow or choppy)',
    'Literal Comprehension (0-2 correct on Q1-4)',
    'Inferential Comprehension (0-1 correct on Q5-7)',
    'Analytical Comprehension (0-1 correct on Q8-10)',
    'Vocabulary (struggled with domain-specific/academic words)'
  ]
};

const grade56VersionC: Passage = {
  gradeBand: '5-6',
  version: 'C',
  versionLabel: 'Post-Assessment (Day 21)',
  title: "The Secret Language of Bees",
  metadata: {
    wordCount: 315,
    lexile: '650L',
    focus: 'Informational text with complex vocabulary'
  },
  text: `When a honeybee discovers a rich source of nectar, she faces a communication challenge: how can she tell thousands of other bees the exact location of flowers that might be miles away? Unlike humans, bees cannot draw maps or speak directions. Instead, they perform an elaborate dance.

Austrian scientist Karl von Frisch spent decades studying bee behavior and discovered that honeybees use two distinct dance patterns to communicate distance and direction. For his groundbreaking research, he won the Nobel Prize in 1973.

The "round dance" signals that food is nearby—within about 50 meters of the hive. The bee moves in tight circles, alternating between clockwise and counterclockwise rotations. Other bees crowd around, touching the dancer with their antennae to learn the scent of the flowers. This simple dance says, "Food is close! Go out and search!"

The "waggle dance" conveys more sophisticated information for distant food sources. The bee performs a figure-eight pattern with a waggle run down the middle. The angle of the waggle run relative to vertical represents the direction of the food source relative to the sun's position. If the bee waggles straight up, the flowers are toward the sun. If she wiggles 40 degrees to the right of the vertical, other bees know to fly 40 degrees to the right of the sun's position.

Distance is encoded in the duration of the waggle run. A longer waggle means a farther destination. Bees can communicate locations up to six miles away with remarkable accuracy.

This dance language is even more impressive because bees must constantly recalculate. As the sun moves across the sky, the dance angle must adjust accordingly. A bee who discovers food at 9:00 AM and returns at noon to recruit help must modify her dance to account for the sun's changed position.

The waggle dance represents one of nature's most sophisticated examples of symbolic communication outside of human language.`,
  questions: [
    { id: '5-6-C-1', number: 1, level: 'literal', text: 'Who discovered and studied the bee dance language?' },
    { id: '5-6-C-2', number: 2, level: 'literal', text: 'What does the "round dance" communicate to other bees?' },
    { id: '5-6-C-3', number: 3, level: 'literal', text: 'In the waggle dance, what does the angle of the waggle run represent?' },
    { id: '5-6-C-4', number: 4, level: 'literal', text: 'How far away can bees communicate locations?' },
    { id: '5-6-C-5', number: 5, level: 'inferential', text: 'Why do other bees touch the dancer with their antennae?' },
    { id: '5-6-C-6', number: 6, level: 'inferential', text: 'Why must bees constantly recalculate their dance as time passes?' },
    { id: '5-6-C-7', number: 7, level: 'inferential', text: 'Based on the passage, what would happen if a bee performed a waggle dance straight down (toward the floor of the hive)?' },
    { id: '5-6-C-8', number: 8, level: 'analytical', text: 'Why does the author call the waggle dance "sophisticated" and "symbolic communication"?' },
    { id: '5-6-C-9', number: 9, level: 'analytical', text: 'The author mentions Karl von Frisch won the Nobel Prize. Why is this detail important to include?' },
    { id: '5-6-C-10', number: 10, level: 'analytical', text: 'How is bee communication similar to and different from human language? Use evidence from the passage.' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-6 errors (98%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 7-15 errors (needs support)',
      significantGap: 'Read with 16+ errors (significant gap)'
    },
    complexVocabulary: ['elaborate', 'counterclockwise', 'sophisticated', 'encoded', 'recalculate', 'symbolic'],
    prosody: [
      'Read at appropriate pace (not too slow, not rushed)',
      'Used proper phrasing and pausing at punctuation',
      'Adjusted tone for informational text',
      'Self-corrected errors when meaning broke down'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-4', total: 4, gapThreshold: '0-2 correct = LITERAL GAP' },
    inferential: { questions: 'Q5-7', total: 3, gapThreshold: '0-1 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q8-10', total: 3, gapThreshold: '0-1 correct = ANALYTICAL GAP' },
    totalQuestions: 10
  },
  breakdownPoints: [
    'Decoding (16+ errors or struggled with complex vocabulary)',
    'Fluency (accurate but very slow or choppy)',
    'Literal Comprehension (0-2 correct on Q1-4)',
    'Inferential Comprehension (0-1 correct on Q5-7)',
    'Analytical Comprehension (0-1 correct on Q8-10)',
    'Vocabulary (struggled with domain-specific/academic words)'
  ]
};

// Grade 7-8 Passages
const grade78VersionA: Passage = {
  gradeBand: '7-8',
  version: 'A',
  versionLabel: 'Pre-Assessment (Day 0/1)',
  title: "The Invisible Barrier",
  metadata: {
    wordCount: 428,
    lexile: '850L',
    focus: 'Narrative with complex themes'
  },
  text: `Kenji pressed his face against the cool glass of the bus window, watching his old neighborhood fade into the distance. Six months ago, his family had moved from Little Tokyo to the suburbs—a "better opportunity," his parents called it. Better schools. Safer streets. A fresh start.

But Kenji didn't feel fresh. He felt erased.

At his new school, Lincoln Middle, Kenji was one of only three Asian students. During lunch, he sat alone, methodically eating the bento box his grandmother had prepared. He noticed other kids staring at his food—octopus balls, pickled vegetables, rice shaped like cartoon characters. Their cafeteria trays held pizza and chicken nuggets.

"What is that?" a voice asked. Kenji looked up to see Marcus, a boy from his English class, gesturing at his lunch.

"Um, it's Japanese food. My grandma makes it," Kenji replied carefully, bracing himself for mockery.

But Marcus surprised him. "That's actually cool. My mom never has time to make anything—we just eat whatever's fastest." He paused, then added, "Can I sit here?"

Kenji nodded, and Marcus dropped his tray onto the table.

"So, you just moved here, right?" Marcus continued. "Must be weird."

"Yeah," Kenji admitted. "Everything's different. At my old school, lots of kids brought homemade lunches. Here, everyone stares like I'm from another planet."

Marcus laughed, but not unkindly. "I get it. I moved here three years ago from Detroit. Back there, I was just... normal. Here, people see me and assume things. They're not always bad assumptions, but they're not really about me, you know?"

Kenji did know. He'd spent six months feeling defined by his difference rather than his personality—as if his ethnicity was the most interesting thing about him, when really, he cared more about basketball and graphic novels.

"Do you play any sports?" Marcus asked, as if reading his mind.

"Basketball," Kenji said. "Not great, but I like it."

"Me too! Tryouts are next week. We should go together."

For the first time since moving, Kenji felt the invisible barrier around him begin to crack. It wasn't completely gone—he still felt the weight of being "different" in ways his old neighbors never had. But Marcus's simple act of sitting down, of asking questions rather than making assumptions, had created a small opening.

As the lunch period ended, Kenji carefully packed his bento box, feeling lighter. Maybe this fresh start wasn't about erasing who he was. Maybe it was about finding people who saw past the surface to discover who he actually was underneath.`,
  questions: [
    { id: '7-8-A-1', number: 1, level: 'literal', text: 'Where did Kenji\'s family move from, and where did they move to?' },
    { id: '7-8-A-2', number: 2, level: 'literal', text: 'How many Asian students were at Lincoln Middle School?' },
    { id: '7-8-A-3', number: 3, level: 'literal', text: 'What two things does Kenji care about more than his ethnicity?' },
    { id: '7-8-A-4', number: 4, level: 'literal', text: 'How long ago did Marcus move from Detroit?' },
    { id: '7-8-A-5', number: 5, level: 'inferential', text: 'Why did Kenji brace himself for mockery when Marcus asked about his food?' },
    { id: '7-8-A-6', number: 6, level: 'inferential', text: 'What does Marcus mean when he says people "see me and assume things"?' },
    { id: '7-8-A-7', number: 7, level: 'inferential', text: 'The passage says Kenji felt "erased" after moving. What evidence supports this feeling throughout the story?' },
    { id: '7-8-A-8', number: 8, level: 'inferential', text: 'Why does the author describe Kenji feeling "lighter" at the end?' },
    { id: '7-8-A-9', number: 9, level: 'analytical', text: 'What is the "invisible barrier" mentioned in the title and at the end of the story?' },
    { id: '7-8-A-10', number: 10, level: 'analytical', text: 'How does the author use Marcus as a character to develop the story\'s theme?' },
    { id: '7-8-A-11', number: 11, level: 'analytical', text: 'The story ends with Kenji realizing the fresh start "wasn\'t about erasing who he was" but "finding people who saw past the surface." Do you agree with this message? Explain your reasoning.' },
    { id: '7-8-A-12', number: 12, level: 'analytical', text: 'How does the author\'s choice to show Kenji\'s experience through his lunch scene (rather than just telling us he felt different) strengthen the story?' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-8 errors (98%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 9-20 errors (needs fluency support)',
      significantGap: 'Read with 21+ errors (decoding gaps present)'
    },
    complexVocabulary: ['methodically', 'bracing', 'mockery', 'ethnicity', 'assumptions', 'stereotype'],
    prosody: [
      'Varied tone to match narrative and dialogue',
      'Read with appropriate pacing (not monotone or rushed)',
      'Used expression during character dialogue',
      'Paused appropriately at punctuation'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-4', total: 4, gapThreshold: '0-2 correct = LITERAL GAP' },
    inferential: { questions: 'Q5-8', total: 4, gapThreshold: '0-2 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q9-12', total: 4, gapThreshold: '0-2 correct = ANALYTICAL GAP' },
    totalQuestions: 12
  },
  breakdownPoints: [
    'Fluency (accurate but slow/choppy reading)',
    'Vocabulary (struggled with academic/complex words)',
    'Literal Comprehension (0-2 correct on Q1-4)',
    'Inferential Comprehension (0-2 correct on Q5-8)',
    'Analytical Comprehension (0-2 correct on Q9-12)'
  ]
};

const grade78VersionB: Passage = {
  gradeBand: '7-8',
  version: 'B',
  versionLabel: 'Mid-Point Check (Day 10-11)',
  title: "The Choice",
  metadata: {
    wordCount: 425,
    lexile: '850L',
    focus: 'Narrative with ethical complexity'
  },
  text: `The acceptance letter lay on Aisha's desk like an accusation. Riverside Academy—the elite private school across town—wanted her. Full scholarship. State-of-the-art science labs. College counselors. A 98% graduation rate.

It should have been the easiest decision of her life.

"You're going, right?" her best friend Janelle asked during lunch, eyes wide with excitement. "This is huge, Aisha. My cousin went there and got into Stanford."

Aisha forced a smile. "Yeah, probably."

But that night at dinner, when she showed her parents the letter, her mother's expression was complicated—pride mixed with something else. Something that looked like worry.

"That's wonderful, baby," her mom said carefully. "But you know Riverside is forty-five minutes away. I'd have to adjust my shifts, and..."

She didn't finish, but Aisha understood. Her mother worked two jobs. Her younger brother needed supervision after school. The carefully balanced system that kept their household functioning would collapse under the weight of this opportunity.

"I could take the bus," Aisha offered, though she'd already researched it. Two transfers. Ninety minutes each way.

Her father put down his fork. "You've worked hard for this. We'll figure something out."

But Aisha had seen the bills stacked on the counter. She'd heard her parents' whispered conversations about overtime and budgets. She thought about Mr. Washington, her science teacher at King High, who stayed late twice a week to help her with AP Chemistry. She thought about Janelle, who'd been her partner on every group project since sixth grade. She thought about the community garden project she'd started last year, teaching elementary kids about urban farming.

Riverside Academy had resources King High couldn't dream of. But King High had Mr. Washington, who believed in her. It had Janelle, who made her laugh during difficult days. It had students who needed someone to prove that excellence could emerge from their hallways too.

The realization hit Aisha like a wave: she didn't want to leave.

Not because she was afraid. Not because she couldn't succeed at Riverside. But because success wasn't just about personal achievement—it was about what you contributed to your community.

"I'm staying at King," Aisha said suddenly, surprising even herself.

Her parents exchanged glances.

"Are you sure?" her mother asked. "We don't want you to limit yourself—"

"I'm not limiting myself," Aisha interrupted gently. "I'm choosing where I can make the biggest difference. And that's here."

The acceptance letter still sat on her desk that night. But instead of an accusation, it felt like validation: she was good enough for Riverside. She just chose something else.`,
  questions: [
    { id: '7-8-B-1', number: 1, level: 'literal', text: 'What school accepted Aisha?' },
    { id: '7-8-B-2', number: 2, level: 'literal', text: 'What type of scholarship was Aisha offered?' },
    { id: '7-8-B-3', number: 3, level: 'literal', text: 'What subject does Mr. Washington teach?' },
    { id: '7-8-B-4', number: 4, level: 'literal', text: 'What project did Aisha start last year?' },
    { id: '7-8-B-5', number: 5, level: 'inferential', text: 'What does the author mean by calling the acceptance letter "an accusation" at the beginning?' },
    { id: '7-8-B-6', number: 6, level: 'inferential', text: 'Why did Aisha\'s mother\'s expression show "pride mixed with something else"?' },
    { id: '7-8-B-7', number: 7, level: 'inferential', text: 'What evidence suggests that Aisha\'s decision to stay at King High wasn\'t made out of fear?' },
    { id: '7-8-B-8', number: 8, level: 'inferential', text: 'How does Aisha\'s view of "success" differ from Janelle\'s view?' },
    { id: '7-8-B-9', number: 9, level: 'analytical', text: 'The author ends by saying the letter changed from "an accusation" to "validation." What does this shift reveal about Aisha\'s character growth?' },
    { id: '7-8-B-10', number: 10, level: 'analytical', text: 'What is the central conflict in this story? (Hint: It\'s not just about choosing schools)' },
    { id: '7-8-B-11', number: 11, level: 'analytical', text: 'Do you think Aisha made the right choice? Defend your answer using evidence from the text and your own reasoning.' },
    { id: '7-8-B-12', number: 12, level: 'analytical', text: 'How does the author use specific details (Mr. Washington, Janelle, the garden project, the bills on the counter) to build the story\'s themes?' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-8 errors (98%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 9-20 errors (needs fluency support)',
      significantGap: 'Read with 21+ errors (decoding gaps present)'
    },
    complexVocabulary: ['accusation', 'adjust', 'complicated', 'validation', 'emerge', 'intentionality'],
    prosody: [
      'Varied tone to match narrative and dialogue',
      'Read with appropriate pacing (not monotone or rushed)',
      'Used expression during character dialogue',
      'Paused appropriately at punctuation'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-4', total: 4, gapThreshold: '0-2 correct = LITERAL GAP' },
    inferential: { questions: 'Q5-8', total: 4, gapThreshold: '0-2 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q9-12', total: 4, gapThreshold: '0-2 correct = ANALYTICAL GAP' },
    totalQuestions: 12
  },
  breakdownPoints: [
    'Fluency (accurate but slow/choppy reading)',
    'Vocabulary (struggled with academic/complex words)',
    'Literal Comprehension (0-2 correct on Q1-4)',
    'Inferential Comprehension (0-2 correct on Q5-8)',
    'Analytical Comprehension (0-2 correct on Q9-12)'
  ]
};

const grade78VersionC: Passage = {
  gradeBand: '7-8',
  version: 'C',
  versionLabel: 'Post-Assessment (Day 21)',
  title: "Breaking the Algorithm",
  metadata: {
    wordCount: 432,
    lexile: '850L',
    focus: 'Narrative with contemporary themes'
  },
  text: `Mira had become predictable. Not in real life—but to the algorithm.

Every morning, her phone's recommendation engine served up the same content: videos about skateboarding, indie music playlists, climate activism posts. The algorithm had analyzed her clicks, her pauses, her likes. It knew her patterns better than she knew herself. And increasingly, Mira realized she'd stopped discovering anything new.

"You ever feel like your feed just shows you the same stuff?" Mira asked her friend Devon as they walked home from school.

Devon shrugged. "That's kind of the point. It learns what you like."

"But what if I don't know what else I might like?" Mira countered. "What if I'm missing entire categories of interesting things because I've never clicked on them?"

Devon looked confused. "So... click on different things?"

That night, Mira conducted an experiment. She called it "Breaking the Algorithm."

First, she watched a documentary about marine biology—something completely outside her usual interests. Then she listened to classical music. She read articles about architecture, searched for recipes from countries she'd never heard of, and watched tutorials on woodworking.

At first, her feed resisted. It kept trying to pull her back to familiar content, like a current dragging her toward shore. But after three days of intentional exploration, something shifted.

Her recommendations became chaotic—a glorious, disorganized mess of ideas. A video essay about Gothic cathedrals appeared next to a skateboarding clip. A Japanese jazz playlist preceded a documentary on urban planning. The algorithm was confused, scrambling to categorize her, trying to find new patterns.

And in that confusion, Mira found freedom.

She discovered she loved watching time-lapse videos of storms. She learned about biomimicry—designing technology inspired by nature. She found poets she'd never encountered, musicians who blended genres she didn't know could mix, and ideas that challenged her assumptions.

"My feed is completely weird now," Mira told Devon a week later, showing him the eclectic mix.

"Looks broken," Devon said.

"Exactly," Mira grinned. "I broke it on purpose."

Devon scrolled through her recommendations, pausing occasionally. "That architecture video actually looks cool," he admitted.

Mira realized something important: algorithms optimized for engagement, not growth. They showed you what you already liked, creating an echo chamber of familiar thoughts. But real learning—real discovery—required discomfort. It required being willing to encounter ideas that didn't fit your existing patterns.

"I'm keeping it broken," Mira decided. "The algorithm can guess all it wants. I'm going to stay unpredictable."

In a world designed to know her completely, Mira had found power in remaining unknown—even to herself.`,
  questions: [
    { id: '7-8-C-1', number: 1, level: 'literal', text: 'What three types of content did Mira\'s feed usually show her?' },
    { id: '7-8-C-2', number: 2, level: 'literal', text: 'What did Mira call her experiment?' },
    { id: '7-8-C-3', number: 3, level: 'literal', text: 'Name two topics Mira explored during her experiment that were outside her usual interests.' },
    { id: '7-8-C-4', number: 4, level: 'literal', text: 'What is biomimicry?' },
    { id: '7-8-C-5', number: 5, level: 'inferential', text: 'What does Mira mean when she says "the algorithm knew her patterns better than she knew herself"?' },
    { id: '7-8-C-6', number: 6, level: 'inferential', text: 'Why did Mira\'s feed "resist" at first when she started watching different content?' },
    { id: '7-8-C-7', number: 7, level: 'inferential', text: 'The author uses the metaphor of "a current dragging her toward shore." What does this reveal about Mira\'s relationship with the algorithm?' },
    { id: '7-8-C-8', number: 8, level: 'inferential', text: 'Why did Devon initially think Mira\'s new feed "looked broken"?' },
    { id: '7-8-C-9', number: 9, level: 'analytical', text: 'What does Mira mean when she says "algorithms optimized for engagement, not growth"?' },
    { id: '7-8-C-10', number: 10, level: 'analytical', text: 'The story ends with "Mira had found power in remaining unknown—even to herself." What kind of power is the author referring to?' },
    { id: '7-8-C-11', number: 11, level: 'analytical', text: 'How does this story critique modern technology and social media? What message is the author sending?' },
    { id: '7-8-C-12', number: 12, level: 'analytical', text: 'Do you think Mira\'s experiment is realistic or practical for most people? Why or why not? Use evidence from the text and your own experience.' },
  ],
  decodingChecklist: {
    accuracyLevels: {
      strong: 'Read with 0-8 errors (98%+ accuracy) ✓ STRONG',
      needsSupport: 'Read with 9-20 errors (needs fluency support)',
      significantGap: 'Read with 21+ errors (decoding gaps present)'
    },
    complexVocabulary: ['algorithm', 'chaotic', 'eclectic', 'optimized', 'engagement', 'intentional'],
    prosody: [
      'Varied tone to match narrative and dialogue',
      'Read with appropriate pacing (not monotone or rushed)',
      'Used expression during character dialogue',
      'Paused appropriately at punctuation'
    ]
  },
  scoringThresholds: {
    literal: { questions: 'Q1-4', total: 4, gapThreshold: '0-2 correct = LITERAL GAP' },
    inferential: { questions: 'Q5-8', total: 4, gapThreshold: '0-2 correct = INFERENTIAL GAP' },
    analytical: { questions: 'Q9-12', total: 4, gapThreshold: '0-2 correct = ANALYTICAL GAP' },
    totalQuestions: 12
  },
  breakdownPoints: [
    'Fluency (accurate but slow/choppy reading)',
    'Vocabulary (struggled with academic/complex words)',
    'Literal Comprehension (0-2 correct on Q1-4)',
    'Inferential Comprehension (0-2 correct on Q5-8)',
    'Analytical Comprehension (0-2 correct on Q9-12)'
  ]
};

// Export all passages organized by grade band
export const passages: Record<string, Passage[]> = {
  '1-2': [grade12VersionA, grade12VersionB, grade12VersionC],
  '3-4': [grade34VersionA, grade34VersionB, grade34VersionC],
  '5-6': [grade56VersionA, grade56VersionB, grade56VersionC],
  '7-8': [grade78VersionA, grade78VersionB, grade78VersionC],
};

export const getPassage = (gradeBand: string, version: 'A' | 'B' | 'C'): Passage | undefined => {
  return passages[gradeBand]?.find(p => p.version === version);
};

export const gradeBands = [
  { value: '1-2', label: 'Grades 1-2', description: 'CVC and sight word focus' },
  { value: '3-4', label: 'Grades 3-4', description: 'Multi-syllabic words, blends, digraphs' },
  { value: '5-6', label: 'Grades 5-6', description: 'Informational text with complex vocabulary' },
  { value: '7-8', label: 'Grades 7-8', description: 'Narrative with complex themes' },
];

export const versions = [
  { value: 'A', label: 'Version A', description: 'Pre-Assessment (Day 0/1)' },
  { value: 'B', label: 'Version B', description: 'Mid-Point Check (Day 10-11)' },
  { value: 'C', label: 'Version C', description: 'Post-Assessment (Day 21)' },
];

// Interpretation Guide - VERBATIM from source document
export const interpretationGuide = {
  decoding: {
    title: 'IF PRIMARY GAP = DECODING',
    characteristics: [
      'Made 8+ errors in elementary passages OR 16+ errors in middle school passages',
      'Struggled with multi-syllabic words',
      'Guessed at unfamiliar words',
      'Skipped difficult words'
    ],
    focus: {
      title: '21-Day Focus:',
      days: [
        'DAYS 1-14: Intensive work on Section 3 (Decode) and Section 4 (Fluency)',
        'DAYS 15-21: Section 5 (Comprehension) with continued decoding support',
        'May need to extend to 30 days total'
      ]
    }
  },
  literal: {
    title: 'IF PRIMARY GAP = LITERAL COMPREHENSION',
    characteristics: [
      'Could read accurately but missed basic "who/what/where/when" questions',
      'Couldn\'t recall specific details from text',
      'Struggled to answer questions about explicitly stated information'
    ],
    focus: {
      title: '21-Day Focus:',
      days: [
        'DAYS 1-7: Quick decoding review (Section 3)',
        'DAYS 8-21: Heavy focus on Section 5 (Comprehension) with emphasis on:',
        '- Close reading strategies',
        '- Note-taking while reading',
        '- Highlighting key facts',
        '- Summarizing after each paragraph'
      ]
    }
  },
  inferential: {
    title: 'IF PRIMARY GAP = INFERENTIAL COMPREHENSION',
    characteristics: [
      'Answered literal questions correctly',
      'Struggled with "why" and "how" questions',
      'Couldn\'t make predictions or explain character motivations',
      'Missed implicit meanings and connections'
    ],
    focus: {
      title: '21-Day Focus:',
      days: [
        'DAYS 1-10: Moderate pace through Sections 3-4',
        'DAYS 11-21: Deep work on Section 5 with emphasis on:',
        '- "Think aloud" strategies',
        '- Making predictions',
        '- Using context clues',
        '- Drawing conclusions from evidence'
      ]
    }
  },
  analytical: {
    title: 'IF PRIMARY GAP = ANALYTICAL COMPREHENSION',
    characteristics: [
      'Answered literal AND inferential questions correctly',
      'Struggled with theme, author\'s purpose, text evaluation',
      'Couldn\'t explain "how" or "why" author made choices',
      'Had difficulty forming and defending opinions about text'
    ],
    focus: {
      title: '21-Day Focus:',
      days: [
        'DAYS 1-10: Accelerated pace through Sections 3-4',
        'DAYS 11-21: Advanced comprehension work with emphasis on:',
        '- Author\'s craft and purpose',
        '- Theme identification',
        '- Critical analysis',
        '- Text-to-world connections',
        '- Evaluating arguments and evidence'
      ]
    }
  },
  multipleGaps: {
    title: 'IF MULTIPLE GAPS = Present',
    recommendation: 'Follow the Blueprint in order (Decode → Fluency → Comprehension) but expect 6-8 weeks of work rather than 21 days. Build foundational skills first before moving to higher-level comprehension.'
  }
};

// Celebration Milestones - VERBATIM from source document
export const celebrationMilestones = [
  'Decoding Milestone: Reduced reading errors by 50% or more',
  'Literal Comprehension Milestone: Achieved 80%+ on literal questions',
  'Inferential Comprehension Milestone: Achieved 70%+ on inferential questions',
  'Analytical Comprehension Milestone: Achieved 70%+ on analytical questions',
  'Overall Comprehension Milestone: Achieved 75%+ on total comprehension',
  'Reading Confidence Milestone: Student voluntarily reads for pleasure'
];

// Parent Administration Guidelines - VERBATIM from source document
export const parentGuidelines = {
  doList: [
    'Choose a quiet, comfortable time (not when child is tired or hungry)',
    'Frame it positively: "I want to see what you can do so I can help you best!"',
    'Allow child to read silently first, then aloud',
    'Give wait time (10-15 seconds) before prompting on comprehension questions',
    'Mark errors discreetly (don\'t interrupt reading to correct)'
  ],
  dontList: [
    'Say "This is a test" or create pressure',
    'Interrupt while child is reading',
    'Show frustration if child struggles',
    'Compare to siblings or other children',
    'Rush through—this is diagnostic, not timed'
  ],
  steps: [
    {
      step: 1,
      title: 'Set the Stage',
      time: '2 minutes',
      script: '"I\'m going to have you read a short passage, and then I\'ll ask you some questions about it. This helps me figure out exactly how to help you become an even stronger reader. Ready?"'
    },
    {
      step: 2,
      title: 'Silent Reading First',
      time: '3-5 minutes',
      script: 'Hand child the passage. "First, read this silently to yourself. Take your time."'
    },
    {
      step: 3,
      title: 'Oral Reading',
      time: '3-5 minutes',
      script: '"Now, please read it out loud to me." Mark errors on your copy as the child reads.'
    },
    {
      step: 4,
      title: 'Comprehension Questions',
      time: '10-15 minutes',
      script: 'Ask questions one at a time. Allow the child to look back at the text. Mark answers on the scoring sheet.'
    },
    {
      step: 5,
      title: 'Review & Encouragement',
      time: '2 minutes',
      script: '"Great job! You worked really hard on that. I learned a lot about how to help you."'
    }
  ]
};
