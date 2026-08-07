// Per-grade diagnostic passages: Kindergarten, Grade 1, Grade 3, Grade 5.
// (Grades 2, 4, 6 and 8 are supplied by the original passage set in
// reading-recovery-content.ts, now keyed to their exact grade.)
// Every passage is written to END-OF-YEAR, ON-GRADE-LEVEL rigor.

import type { PassageDraft } from './reading-recovery-grade-builder';

export const lowerGradeDrafts: PassageDraft[] = [
  // ------------------------------------------------------------------ K
  {
    grade: 'K', version: 'A', lexile: 'BR100L',
    focus: 'Letter-sound knowledge, CVC blending, core sight words',
    title: 'The Red Cap',
    targets: ['cap', 'sat', 'hot', 'run', 'the', 'my', 'is', 'we'],
    text: `Sam has a red cap.

The cap is on his bed.

Sam can run. The sun is hot.

The cap is fun.`,
    questions: [
      ['literal', 'What color is the cap?'],
      ['literal', 'Where is the cap at the start?'],
      ['literal', 'Who has the cap?'],
      ['inferential', 'Why does Sam wear the cap when the sun is hot?'],
      ['inferential', 'How do you think Sam feels about his cap?'],
      ['analytical', 'Is a cap a good thing to wear on a hot day? Tell me why.'],
    ],
  },
  {
    grade: 'K', version: 'B', lexile: 'BR100L',
    focus: 'Letter-sound knowledge, CVC blending, core sight words',
    title: 'Pip the Pup',
    targets: ['pup', 'dig', 'big', 'wet', 'can', 'see', 'go', 'she'],
    text: `Pip is a pup.

Pip can dig. She digs in the mud.

The mud is wet. Pip is wet too!

Mom can see Pip. "Bath time, Pip!"`,
    questions: [
      ['literal', 'What is the name of the pup?'],
      ['literal', 'What does Pip dig in?'],
      ['literal', 'Who sees Pip?'],
      ['inferential', 'Why is Pip wet?'],
      ['inferential', 'Why does Mom say it is bath time?'],
      ['analytical', 'Do you think Pip likes to dig? How can you tell?'],
    ],
  },
  {
    grade: 'K', version: 'C', lexile: 'BR100L',
    focus: 'Letter-sound knowledge, CVC blending, core sight words',
    title: 'A Bug on the Rug',
    targets: ['bug', 'rug', 'hop', 'let', 'out', 'look', 'here', 'they'],
    text: `Look! A bug is on the rug.

The bug can hop. It hops up and up.

Meg gets a cup. She puts the bug in the cup.

Meg lets the bug go out.`,
    questions: [
      ['literal', 'Where is the bug at the start?'],
      ['literal', 'What can the bug do?'],
      ['literal', 'What does Meg get?'],
      ['inferential', 'Why does Meg use a cup?'],
      ['inferential', 'Why does Meg let the bug go outside?'],
      ['analytical', 'Was Meg kind to the bug? Tell me why you think so.'],
    ],
  },

  // ------------------------------------------------------------------ 1
  {
    grade: '1', version: 'A', lexile: '250L',
    focus: 'CVCe words, digraphs, blends, grade-1 sight words',
    title: 'The Lost Kite',
    targets: ['kite', 'branch', 'shook', 'string', 'thank', 'reached'],
    text: `Jack got a blue kite for his birthday. He took it to the park with his dad.

The wind was strong. The kite went up and up. Then the string slipped out of Jack's hand.

The kite got stuck in a tall tree. Jack could not reach it. He felt sad.

A girl named Rosa saw him. She had a long stick. Rosa shook the branch, and the kite came down.

"Thank you!" said Jack. "Do you want to fly it with me?"

Rosa smiled. They flew the kite together until the sun went down.`,
    questions: [
      ['literal', 'What did Jack get for his birthday?'],
      ['literal', 'Where did the kite get stuck?'],
      ['literal', 'What did Rosa use to help?'],
      ['inferential', 'Why did the kite slip out of Jack\'s hand?'],
      ['inferential', 'How did Jack feel after Rosa helped him? How do you know?'],
      ['analytical', 'Why do you think Jack asked Rosa to fly the kite with him?'],
    ],
  },
  {
    grade: '1', version: 'B', lexile: '250L',
    focus: 'CVCe words, digraphs, blends, grade-1 sight words',
    title: 'The Class Garden',
    targets: ['garden', 'seeds', 'shovel', 'watch', 'green', 'sprout'],
    text: `Ms. Chen's class planted a garden behind the school. Each child got three seeds and a small shovel.

Tia dug a hole and dropped her seeds in. She patted the dirt down flat. Every morning she gave the soil a drink of water.

For a whole week, nothing happened. Tia began to think her seeds were bad.

Then on Monday, Tia saw a tiny green sprout push up through the dirt. She ran to get Ms. Chen.

"You waited and you kept watering," said Ms. Chen. "That is how a garden grows."`,
    questions: [
      ['literal', 'Where did the class plant the garden?'],
      ['literal', 'How many seeds did each child get?'],
      ['literal', 'What did Tia see on Monday?'],
      ['inferential', 'Why did Tia think her seeds were bad?'],
      ['inferential', 'Why did Tia run to get Ms. Chen?'],
      ['analytical', 'What lesson does Ms. Chen want the class to learn?'],
    ],
  },
  {
    grade: '1', version: 'C', lexile: '250L',
    focus: 'CVCe words, digraphs, blends, grade-1 sight words',
    title: 'Rain on Game Day',
    targets: ['field', 'muddy', 'coach', 'cheered', 'splash', 'whistle'],
    text: `Omar woke up early. Today was the big soccer game. But when he looked outside, rain was falling hard.

At the field, the grass was wet and muddy. Some kids did not want to play.

Coach Bell blew her whistle. "Rain will not hurt us," she said. "Let's have fun."

The ball made a splash every time someone kicked it. Omar slipped twice, but he laughed and got back up.

His team did not win, but everyone cheered anyway. Omar told his mom it was the best game all year.`,
    questions: [
      ['literal', 'What was the weather like on game day?'],
      ['literal', 'Who blew the whistle?'],
      ['literal', 'Did Omar\'s team win?'],
      ['inferential', 'Why did some kids not want to play?'],
      ['inferential', 'Why did Omar say it was the best game all year?'],
      ['analytical', 'Was Coach Bell right to have the team play in the rain? Why or why not?'],
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    grade: '3', version: 'A', lexile: '620L',
    focus: 'Multi-syllabic words, prefixes and suffixes, chapter-length narrative',
    title: 'The Bridge Builders',
    targets: ['engineer', 'construction', 'suspended', 'unstable', 'measurement', 'carefully'],
    text: `The third graders in Room 12 had a problem to solve. Mr. Alvarez had placed two desks eighteen inches apart and set a small toy truck on the floor between them.

"Your job," he said, "is to build a bridge that connects these desks. It has to hold the truck. You get twenty straws, one roll of tape, and thirty minutes."

Nina's group started right away. They taped straws end to end until they had one long piece stretched across the gap. When they placed the truck on it, the straws bent and the truck crashed to the floor.

"We need something stronger," said Devon.

Nina remembered a photograph in their science book. It showed a bridge held up by triangles of steel. She sketched the shape on a piece of paper and showed her group.

"Triangles do not squash," she explained. "Squares fold over, but triangles hold their shape."

The group rebuilt their bridge, taping straws into a row of triangles along each side. This time when Devon set the truck down, the bridge held. It did not even bend.

Mr. Alvarez walked over and studied their design. "You did what real engineers do," he said. "You tested, you failed, and then you used what you knew to try again."`,
    questions: [
      ['literal', 'What materials was each group given?'],
      ['literal', 'What happened the first time Nina\'s group tested their bridge?'],
      ['literal', 'What shape did Nina use in the second design?'],
      ['inferential', 'Why did the first bridge fail?'],
      ['inferential', 'How did the science book help Nina solve the problem?'],
      ['inferential', 'Why does Mr. Alvarez say the group did what real engineers do?'],
      ['analytical', 'What is the main lesson the author wants readers to take from this story?'],
      ['analytical', 'Why do you think the author included the detail about the first bridge crashing?'],
    ],
  },
  {
    grade: '3', version: 'B', lexile: '620L',
    focus: 'Multi-syllabic words, prefixes and suffixes, informational text',
    title: 'How Honeybees Talk',
    targets: ['communicate', 'direction', 'nectar', 'colony', 'vibration', 'distance'],
    text: `Honeybees cannot speak, but they can tell each other exactly where to find food. They do it by dancing.

When a bee discovers a patch of flowers, she flies back to the hive and performs a movement scientists call the waggle dance. She walks in a straight line, shaking her body from side to side, then circles back and repeats the pattern.

Every part of the dance carries information. The direction of the straight walk tells the other bees which way to fly compared to the position of the sun. The length of the waggle tells them how far away the flowers are. A longer waggle means a longer journey.

Other bees crowd around the dancer in the dark hive. They cannot see her well, so they feel the vibrations of her body and smell the flower scent she carries on her legs.

Within minutes, dozens of bees leave the hive and fly straight to the flowers. They rarely get lost.

A single honeybee colony may send out thousands of workers each day. Without the waggle dance, each bee would have to search alone, wasting time and energy. Working together makes the whole colony stronger.`,
    questions: [
      ['literal', 'What do scientists call the honeybee\'s dance?'],
      ['literal', 'What does the length of the waggle tell other bees?'],
      ['literal', 'How do bees inside the dark hive follow the dance?'],
      ['inferential', 'Why is the position of the sun important to the dance?'],
      ['inferential', 'Why would a colony be weaker without the waggle dance?'],
      ['inferential', 'What can you tell about the author\'s opinion of honeybees?'],
      ['analytical', 'Why did the author organize the article by explaining one part of the dance at a time?'],
      ['analytical', 'Would the last paragraph make a good beginning for the article? Explain your thinking.'],
    ],
  },
  {
    grade: '3', version: 'C', lexile: '620L',
    focus: 'Multi-syllabic words, prefixes and suffixes, character-driven narrative',
    title: 'The Quietest Voice',
    targets: ['audition', 'nervous', 'announced', 'rehearsal', 'confidence', 'performance'],
    text: `Priya loved to sing, but only when nobody was listening. In the shower, in the back seat of the car, in her room with the door shut, her voice was strong and clear.

When Ms. Odom announced auditions for the spring show, Priya's best friend Kayla signed both their names on the list.

"You did what?" Priya whispered.

"You are the best singer I know," Kayla said. "Somebody besides me should hear you."

On audition day, Priya stood on the stage and looked at the empty seats. Her hands shook. When she opened her mouth, the sound that came out was so small that Ms. Odom asked her to start again.

Priya closed her eyes. She pretended she was in her room with the door shut. This time the notes came out full and steady, filling the whole auditorium. When she finished, Ms. Odom was smiling.

Priya did not get the lead part. She got a solo in the second act instead. At rehearsal, she still felt nervous, but a little less each week.

On performance night, she sang with her eyes open.`,
    questions: [
      ['literal', 'Where does Priya usually sing?'],
      ['literal', 'Who signed Priya up for the audition?'],
      ['literal', 'What part did Priya receive?'],
      ['inferential', 'Why was Priya\'s first attempt at the audition so quiet?'],
      ['inferential', 'Why did closing her eyes help Priya sing better?'],
      ['inferential', 'What does the last sentence tell you about how Priya changed?'],
      ['analytical', 'Why do you think the author titled the story "The Quietest Voice"?'],
      ['analytical', 'Was Kayla right to sign Priya up without asking? Use details from the story to support your answer.'],
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    grade: '5', version: 'A', lexile: '850L',
    focus: 'Academic vocabulary, informational text, author\'s reasoning',
    title: 'The City That Cooled Itself',
    targets: ['reflective', 'absorb', 'infrastructure', 'temperature', 'initiative', 'municipal'],
    text: `Every summer, cities grow noticeably hotter than the countryside surrounding them. Scientists call this the urban heat island effect. Dark asphalt roads and tar rooftops absorb sunlight all day and release that heat slowly through the night, so the city never fully cools down. On some evenings, downtown neighborhoods measure seven degrees warmer than farmland only a few miles away.

In 2010, officials in one large city decided to test an unusual solution. Instead of building more air conditioning, which consumes enormous amounts of electricity and pumps additional heat into the streets, they began painting rooftops white.

The reasoning was simple. A dark roof absorbs roughly eighty percent of the sunlight striking it. A white roof reflects most of that energy back into the sky before it ever becomes heat. Crews coated more than a million square feet of rooftop in the first two years, focusing on apartment buildings, schools, and warehouses in the hottest neighborhoods.

The results surprised even the researchers who designed the study. Rooftop surface temperatures on treated buildings dropped by as much as forty-three degrees on the hottest afternoons. Inside those buildings, residents reported that upper floors finally became livable in August. Electricity use for cooling fell measurably, which meant lower bills for families who could least afford them.

Critics pointed out that white roofs do nothing during winter, when a city might actually welcome absorbed heat. Others noted that painting rooftops does not address the far larger surfaces of streets and parking lots.

Both criticisms are fair. Still, the program cost a fraction of what new cooling infrastructure would have required, and it delivered relief within a single season. Cities from Los Angeles to Ahmedabad have since launched similar efforts, treating paint not as decoration but as public health equipment.`,
    questions: [
      ['literal', 'What do scientists call the effect described in the first paragraph?'],
      ['literal', 'Approximately how much sunlight does a dark roof absorb?'],
      ['literal', 'By how much did rooftop surface temperatures drop on treated buildings?'],
      ['inferential', 'Why does the author mention that air conditioning "pumps additional heat into the streets"?'],
      ['inferential', 'Why did crews focus on apartment buildings and schools first?'],
      ['inferential', 'What does the phrase "public health equipment" suggest about how cities now view paint?'],
      ['analytical', 'Why does the author include the criticisms of the program instead of leaving them out?'],
      ['analytical', 'Evaluate the author\'s argument. Does the evidence provided justify expanding the program to other cities? Explain.'],
    ],
  },
  {
    grade: '5', version: 'B', lexile: '850L',
    focus: 'Academic vocabulary, historical narrative, inference from evidence',
    title: 'The Letter in the Wall',
    targets: ['renovation', 'preserved', 'correspondence', 'archive', 'deteriorated', 'documentation'],
    text: `When the Bramwell family began tearing out the plaster in their 1890s farmhouse, they expected to find nothing but horsehair insulation and mouse nests. Instead, wedged behind a wall stud on the second floor, they found a folded sheet of paper wrapped in oilcloth.

The paper had yellowed, and the ink had faded to a rusty brown, but the handwriting remained legible. It was a letter, dated March 1902, written by a carpenter named Elias Ford to whoever might someday open the wall.

Ford described the work he had done that winter, the price of lumber, and the bitter cold that had cracked his tools. He mentioned his daughter, who brought him lunch each day and who had, he wrote, "a mind quicker than mine and no school worth the name to send her to."

Historians who later examined the letter found it valuable for reasons Ford could not have anticipated. Ordinary workers in 1902 rarely left written records. Newspapers documented the wealthy; census forms recorded names and occupations but nothing of a person's thinking. Ford's letter offered something almost impossible to obtain elsewhere: a tradesman's own account of his daily labor and his private worries.

The county historical society verified the letter against property records and located Ford's descendants three states away. His great-granddaughter had become a structural engineer.

The Bramwells donated the letter to the archive, where it is now stored flat in an acid-free folder, protected from the light that would finish what a century behind the plaster had already begun.`,
    questions: [
      ['literal', 'Where exactly was the letter found?'],
      ['literal', 'What was Elias Ford\'s occupation?'],
      ['literal', 'How is the letter stored now?'],
      ['inferential', 'Why did the oilcloth matter to the letter\'s survival?'],
      ['inferential', 'Why do historians consider a carpenter\'s letter more valuable than a newspaper from the same year?'],
      ['inferential', 'What does Ford\'s comment about his daughter reveal about opportunities in 1902?'],
      ['analytical', 'Why does the author end by mentioning that Ford\'s great-granddaughter became an engineer?'],
      ['analytical', 'The author calls the letter "valuable for reasons Ford could not have anticipated." Explain what those reasons are and why Ford would not have foreseen them.'],
    ],
  },
  {
    grade: '5', version: 'C', lexile: '850L',
    focus: 'Academic vocabulary, literary narrative, theme and author\'s craft',
    title: 'The Last Run',
    targets: ['relentless', 'anticipation', 'hesitation', 'deliberate', 'exhaustion', 'triumphant'],
    text: `The final race of the season fell on a gray Saturday in November, and Marisol had already decided she would not be running it.

Her shin had been aching since September, a dull complaint that sharpened into something worse whenever she pushed past two miles. The team doctor called it a stress reaction and told her the only cure was rest. Rest, at the end of a season she had trained eleven months for, sounded like a punishment rather than a treatment.

She came to the meet anyway, in jeans, carrying the water jugs. Her teammates lined up at the start without her. Coach Whitfield handed her a stopwatch and said nothing about it, which she appreciated more than sympathy.

For most of the race she stood at the two-mile marker calling out splits. She watched Deja fade on the hill and then, impossibly, find something in the last four hundred meters. She watched Anya trip over a root, get up with mud on both knees, and pass six runners before the finish.

Afterward, the team gathered around the results sheet. They had finished second, their best placement in nine years, and everyone was talking at once.

Marisol realized she was not thinking about her own missing name on the list. She was thinking about Anya's knees, and about how she wanted to be there next fall to see what Deja could do with a full season of hills.

It was not the ending she had spent eleven months imagining. It was, she thought, a reasonable place to start.`,
    questions: [
      ['literal', 'What injury kept Marisol from racing?'],
      ['literal', 'What job did Coach Whitfield give Marisol during the meet?'],
      ['literal', 'How did the team place in the race?'],
      ['inferential', 'Why did Marisol appreciate that Coach Whitfield said nothing?'],
      ['inferential', 'Why does the author describe Anya getting up "with mud on both knees"?'],
      ['inferential', 'What has changed in Marisol by the end of the story?'],
      ['analytical', 'Explain the meaning of the final sentence and how it connects to the theme of the story.'],
      ['analytical', 'The story is titled "The Last Run," yet Marisol never runs. Why might the author have chosen that title?'],
    ],
  },
];
