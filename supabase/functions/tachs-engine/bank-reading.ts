// Reading — 50 original items. Quotas: main_idea 12, inference 14, vocabulary_in_context 12, text_structure 12.
import type { BankQuestion } from "./bank-types.ts";

const P1 = {
  id: "p-lanterns",
  title: "The Lantern Walk",
  text: `Every November, the town of Millbrook holds a lantern walk along the river. It began forty years ago when a single teacher, Mrs. Okafor, wanted her students to notice how early the dark arrived in late autumn. She asked each child to build a paper lantern and carry it from the school to the footbridge.

The first walk drew only nineteen students and a few curious parents. Today, more than two thousand people take part, and the lanterns have grown elaborate: glowing fish, swans, and even a ten-foot dragon that requires six people to carry. Yet the rules have barely changed. Lanterns must be handmade, and the walk always ends with a moment of silence on the bridge.

Some newcomers grumble that the silence is old-fashioned. Longtime residents disagree. "The quiet is the point," says Daniel Reyes, who has walked every year since he was six. "For one minute, the whole town is looking at the same dark water, holding the same small light."`,
};

const P2 = {
  id: "p-bees",
  title: "Why Bees Dance",
  text: `When a honeybee discovers a rich patch of flowers, she does not keep the news to herself. Back in the hive, she performs a "waggle dance" on the honeycomb. The direction she waggles, measured against the vertical, tells other bees the angle of the flowers relative to the sun. The length of the waggle tells them how far to fly.

Scientists once doubted that an insect could share such precise information. In the 1940s, researcher Karl von Frisch tracked marked bees and confirmed that hive-mates flew almost directly to the food source after watching the dance. Later experiments with mechanical bees, which could be programmed to dance, showed that the movement itself—not scent alone—carried the message.

The waggle dance is not perfect. Bees dancing on a windy day may send followers slightly off course. Still, for a creature with a brain the size of a sesame seed, it is a remarkable achievement in communication.`,
};

const P3 = {
  id: "p-lastrow",
  title: "The Last Row",
  text: `Nadia had played the viola for three years and had sat in the last row for all of them. From there she could see everything: the conductor's shoulders tightening before a hard passage, the first-chair violinist flipping pages a beat early, the clarinets whispering when they thought no one was watching.

Her mother called the last row "the waiting room." Nadia did not see it that way. In the last row you had to listen harder, because you could not hear yourself over everyone else. You learned the shape of the whole piece instead of your own small line inside it.

At the spring audition, Mr. Abara asked her to sight-read a passage none of the students had seen. Nadia's fingers were not the fastest in the room, but she had heard that kind of rhythm hundreds of times from the back, riding underneath the melody. She played it cleanly, and when she finished, the room was quiet in a way that had nothing to do with waiting.

Mr. Abara looked up from his clipboard. "Third chair," he said. Nadia nodded, gathered her music, and felt, strangely, a small pang for the view she was leaving behind.`,
};

const P4 = {
  id: "p-subway",
  title: "The Map That Is Not a Map",
  text: `A subway map lies, and riders are grateful for it. On a true geographic map of most large cities, downtown stations cluster so tightly that their names would overlap into a smear of ink, while outlying stops would stretch far off the page.

In 1931, an engineering draftsman named Harry Beck redrew London's tangled network as a diagram of straight lines meeting at angles of forty-five and ninety degrees, with stations spaced evenly regardless of true distance. Transit officials hesitated; passengers did not. The design was reprinted within months and copied by cities around the world.

Beck's insight was that an underground rider does not need to know direction or distance. A rider needs to know one thing: which line to take, and where to change. By discarding accuracy, the diagram delivered clarity.

The trade-off still causes trouble. Tourists sometimes ride two stops between stations that stand three minutes apart on foot, because on the diagram those stations look far away. Several cities now print walking times beside the diagram—an admission that a useful distortion is still a distortion.`,
};

const P5 = {
  id: "p-starttimes",
  title: "Paired Texts: Should the School Day Start Later?",
  text: `Text A

Our district should move the middle school bell from 7:40 a.m. to 8:40 a.m. Adolescent sleep cycles shift later during puberty; asking a thirteen-year-old to be alert at seven in the morning is like asking an adult to think clearly at four. Districts that have delayed start times report better attendance, fewer tardy arrivals, and calmer classrooms. The change costs nothing to the curriculum. It simply moves the clock to match the students we actually have.

Text B

I do not dispute the sleep research; I dispute the arithmetic. Our buses run three routes each morning. Moving the middle school bell one hour pushes the elementary route to 6:30 a.m., which means seven-year-olds wait in the dark. Afternoon athletics would end after sunset in November, and roughly one in five of our students leaves practice to work or to care for younger siblings. A later start is not free. It is paid for by families who have the least room to absorb the cost.`,
};

const P6 = {
  id: "p-repair",
  title: "The Case for Repair Cafés",
  text: `Last year Americans discarded millions of small appliances that had one broken part. A toaster with a loose wire is not garbage; it is a toaster with a loose wire. Yet repair has become the harder choice. Replacement is cheap, manuals are rare, and many devices are sealed with screws that ordinary tools cannot turn.

A repair café offers a stubborn alternative. Volunteers with soldering irons and sewing machines gather in a library or church hall, and neighbors bring in lamps, jackets, bicycles, and blenders. Nothing is guaranteed. Roughly two of every three items leave working.

Critics call the movement sentimental, a hobby dressed up as policy. The charge misses the point. The repaired blender matters less than what the owner learns while watching it be repaired: that objects have insides, that failure is usually local, and that a consumer can also be a fixer. A town cannot recycle its way out of a throwaway habit, but it can teach its way out—one stubborn toaster at a time.`,
};

const P7 = {
  id: "p-tharp",
  title: "Drawing the Bottom of the Sea",
  text: `In the middle of the twentieth century, the ocean floor was mostly imagination. Ships could measure depth at single points by timing an echo, but no one had turned those thousands of scattered numbers into a picture.

Marie Tharp did. Trained in geology at a time when women were barred from most research vessels, she worked on land, converting columns of sounding data into careful profiles of the seabed. As the profiles accumulated, a feature appeared again and again in the North Atlantic: a long mountain range split down the center by a deep valley.

Tharp argued that the valley was a rift where the seafloor was pulling apart. Her colleague dismissed the idea at first as "girl talk," because it supported continental drift, then an unfashionable theory. When earthquake locations were plotted on the same chart, they fell almost exactly along the rift Tharp had drawn.

Her maps did not settle the argument by themselves. They did something harder: they made an invisible landscape visible enough to argue about.`,
};

const P8 = {
  id: "p-octopus",
  title: "Tasting by Touch",
  text: `An octopus does not need to see its dinner to identify it. Each of its eight arms is lined with suckers, and the rim of every sucker carries receptor cells that respond to chemicals in the water and on surfaces. In effect, the animal tastes whatever it touches.

Consider what this makes possible. An octopus can push an arm into a dark crevice it cannot see into, brush a crab, and know instantly whether the object is prey, a rock, or something to avoid. Researchers have found that individual arms can carry out this search while the animal's central brain attends to something else entirely; much of the processing happens in nerve clusters within the arms themselves.

This arrangement is unlike the tightly centralized nervous system of a mammal. It resembles a committee more than a chain of command. Biologists studying it have had to set aside a familiar assumption—that intelligence must be gathered in one place—and consider that a mind might be distributed across a body.`,
};

export const READING: BankQuestion[] = [
  // ---- P1 The Lantern Walk: main_idea x2, inference x2, vocab x1, structure x1
  { code: "RD-01", section_key: "reading", skill: "main_idea", difficulty: 1, passage_id: P1.id, passage_title: P1.title, passage_text: P1.text,
    stem: "What is the passage mostly about?",
    choices: [{ key: "A", text: "How to build a paper lantern" }, { key: "B", text: "A town tradition and why it has lasted" }, { key: "C", text: "Why autumn nights grow dark so early" }, { key: "D", text: "A dragon lantern that needs six people" }],
    correct_key: "B", rationale: "The passage traces the walk from its beginning to today and explains why residents still value it." },
  { code: "RD-02", section_key: "reading", skill: "main_idea", difficulty: 2, passage_id: P1.id, passage_title: P1.title, passage_text: P1.text,
    stem: "Which sentence best states the main idea of paragraph 2?",
    choices: [{ key: "A", text: "The event has grown much larger while its core rules stayed the same." }, { key: "B", text: "Lanterns are difficult to build without help." }, { key: "C", text: "Parents were curious about the first walk." }, { key: "D", text: "The footbridge is the best place to watch the river." }],
    correct_key: "A", rationale: "Paragraph 2 contrasts growth in size and design with rules that 'have barely changed.'" },
  { code: "RD-03", section_key: "reading", skill: "inference", difficulty: 2, passage_id: P1.id, passage_title: P1.title, passage_text: P1.text,
    stem: "Based on the passage, Daniel Reyes would most likely believe that",
    choices: [{ key: "A", text: "the walk should end at the school instead of the bridge" }, { key: "B", text: "elaborate lanterns have ruined the event" }, { key: "C", text: "the shared silence matters more than the lanterns" }, { key: "D", text: "newcomers should not be allowed to join" }],
    correct_key: "C", rationale: "He says 'the quiet is the point' and describes the whole town sharing one moment." },
  { code: "RD-04", section_key: "reading", skill: "inference", difficulty: 3, passage_id: P1.id, passage_title: P1.title, passage_text: P1.text,
    stem: "The detail that lanterns 'must be handmade' suggests that organizers value",
    choices: [{ key: "A", text: "saving money on supplies" }, { key: "B", text: "personal effort over polished results" }, { key: "C", text: "attracting tourists from other towns" }, { key: "D", text: "keeping the walk short" }],
    correct_key: "B", rationale: "Requiring handmade lanterns preserves the participants' own work rather than a purchased product." },
  { code: "RD-05", section_key: "reading", skill: "vocabulary_in_context", difficulty: 2, passage_id: P1.id, passage_title: P1.title, passage_text: P1.text,
    stem: "In paragraph 2, the word \"elaborate\" most nearly means",
    choices: [{ key: "A", text: "simple" }, { key: "B", text: "detailed and complex" }, { key: "C", text: "expensive" }, { key: "D", text: "heavy" }],
    correct_key: "B", rationale: "The examples—fish, swans, a ten-foot dragon—show the lanterns have become complex." },
  { code: "RD-06", section_key: "reading", skill: "text_structure", difficulty: 3, passage_id: P1.id, passage_title: P1.title, passage_text: P1.text,
    stem: "How does the third paragraph relate to the second?",
    choices: [{ key: "A", text: "It presents a disagreement about a rule described in the second paragraph." }, { key: "B", text: "It lists more examples of lantern designs." }, { key: "C", text: "It explains how the walk was first organized." }, { key: "D", text: "It describes a different town's tradition." }],
    correct_key: "A", rationale: "Paragraph 2 states the silence rule; paragraph 3 shows newcomers and residents disagreeing about it." },

  // ---- P2 Why Bees Dance: main_idea 1, inference 2, vocab 2, structure 1
  { code: "RD-07", section_key: "reading", skill: "main_idea", difficulty: 2, passage_id: P2.id, passage_title: P2.title, passage_text: P2.text,
    stem: "Which sentence best states the central idea of the passage?",
    choices: [{ key: "A", text: "Machines can be programmed to imitate insects." }, { key: "B", text: "Honeybees communicate the location of food through a precise dance." }, { key: "C", text: "Wind makes it difficult for bees to find flowers." }, { key: "D", text: "Karl von Frisch was a famous researcher." }],
    correct_key: "B", rationale: "Every paragraph develops how the waggle dance communicates direction and distance." },
  { code: "RD-08", section_key: "reading", skill: "inference", difficulty: 3, passage_id: P2.id, passage_title: P2.title, passage_text: P2.text,
    stem: "The experiments with mechanical bees were important because they showed that",
    choices: [{ key: "A", text: "bees prefer machines to real dancers" }, { key: "B", text: "scent is the only signal bees use" }, { key: "C", text: "the dance movement itself carries information" }, { key: "D", text: "bees cannot fly on windy days" }],
    correct_key: "C", rationale: "The passage says the mechanical bees proved 'the movement itself—not scent alone—carried the message.'" },
  { code: "RD-09", section_key: "reading", skill: "inference", difficulty: 2, passage_id: P2.id, passage_title: P2.title, passage_text: P2.text,
    stem: "Why did scientists once doubt the waggle dance?",
    choices: [{ key: "A", text: "They could not see bees inside the hive." }, { key: "B", text: "They did not expect an insect to share such exact information." }, { key: "C", text: "Bees rarely returned to the hive after feeding." }, { key: "D", text: "Von Frisch refused to publish his results." }],
    correct_key: "B", rationale: "The passage says scientists 'doubted that an insect could share such precise information.'" },
  { code: "RD-10", section_key: "reading", skill: "vocabulary_in_context", difficulty: 1, passage_id: P2.id, passage_title: P2.title, passage_text: P2.text,
    stem: "As used in paragraph 1, \"rich\" most nearly means",
    choices: [{ key: "A", text: "wealthy" }, { key: "B", text: "full of nectar" }, { key: "C", text: "colorful" }, { key: "D", text: "far away" }],
    correct_key: "B", rationale: "A 'rich patch of flowers' is one offering plenty of food." },
  { code: "RD-11", section_key: "reading", skill: "vocabulary_in_context", difficulty: 2, passage_id: P2.id, passage_title: P2.title, passage_text: P2.text,
    stem: "In the last paragraph, \"remarkable\" most nearly means",
    choices: [{ key: "A", text: "worth noticing and unusual" }, { key: "B", text: "easily explained" }, { key: "C", text: "accidental" }, { key: "D", text: "traditional" }],
    correct_key: "A", rationale: "The author contrasts the bee's tiny brain with an achievement that stands out." },
  { code: "RD-12", section_key: "reading", skill: "text_structure", difficulty: 2, passage_id: P2.id, passage_title: P2.title, passage_text: P2.text,
    stem: "The author begins the final paragraph with \"The waggle dance is not perfect\" in order to",
    choices: [{ key: "A", text: "acknowledge a limitation before praising the dance" }, { key: "B", text: "argue that the research was wrong" }, { key: "C", text: "introduce a different kind of dance" }, { key: "D", text: "explain how hives are built" }],
    correct_key: "A", rationale: "The paragraph admits a weakness and then calls the dance 'a remarkable achievement.'" },

  // ---- P3 The Last Row: main_idea 1, inference 2, vocab 2, structure 1
  { code: "RD-13", section_key: "reading", skill: "main_idea", difficulty: 2, passage_id: P3.id, passage_title: P3.title, passage_text: P3.text,
    stem: "What is the central idea of the story?",
    choices: [{ key: "A", text: "Nadia's position in the back of the orchestra taught her something valuable." }, { key: "B", text: "Auditions are unfair to slower players." }, { key: "C", text: "Nadia's mother wanted her to quit the viola." }, { key: "D", text: "Sight-reading is the hardest part of orchestra." }],
    correct_key: "A", rationale: "The story shows how listening from the last row gave Nadia an understanding that helped her succeed." },
  { code: "RD-14", section_key: "reading", skill: "inference", difficulty: 2, passage_id: P3.id, passage_title: P3.title, passage_text: P3.text,
    stem: "Nadia most likely succeeded at the sight-reading because she",
    choices: [{ key: "A", text: "had secretly seen the music before" }, { key: "B", text: "had the fastest fingers in the room" }, { key: "C", text: "knew the rhythm from hearing it under the melody for years" }, { key: "D", text: "was sitting closest to the conductor" }],
    correct_key: "C", rationale: "The text says she 'had heard that kind of rhythm hundreds of times from the back.'" },
  { code: "RD-15", section_key: "reading", skill: "inference", difficulty: 3, passage_id: P3.id, passage_title: P3.title, passage_text: P3.text,
    stem: "Nadia's \"small pang\" at the end of the story suggests that she",
    choices: [{ key: "A", text: "regrets auditioning at all" }, { key: "B", text: "will miss something she valued even though she is moving up" }, { key: "C", text: "believes Mr. Abara made a mistake" }, { key: "D", text: "is angry at the first-chair violinist" }],
    correct_key: "B", rationale: "She feels a pang 'for the view she was leaving behind,' the perspective the last row gave her." },
  { code: "RD-16", section_key: "reading", skill: "vocabulary_in_context", difficulty: 2, passage_id: P3.id, passage_title: P3.title, passage_text: P3.text,
    stem: "Nadia's mother calls the last row \"the waiting room\" to suggest that it is",
    choices: [{ key: "A", text: "a comfortable place to rest" }, { key: "B", text: "a temporary spot before something better" }, { key: "C", text: "a place reserved for guests" }, { key: "D", text: "the loudest part of the orchestra" }],
    correct_key: "B", rationale: "A waiting room is where one waits for the real event, implying the last row is not the goal." },
  { code: "RD-17", section_key: "reading", skill: "vocabulary_in_context", difficulty: 3, passage_id: P3.id, passage_title: P3.title, passage_text: P3.text,
    stem: "In the final paragraph, \"quiet in a way that had nothing to do with waiting\" suggests a silence of",
    choices: [{ key: "A", text: "boredom" }, { key: "B", text: "confusion" }, { key: "C", text: "attention and respect" }, { key: "D", text: "disapproval" }],
    correct_key: "C", rationale: "The phrase contrasts the mother's 'waiting room' with a silence caused by a performance worth noticing." },
  { code: "RD-18", section_key: "reading", skill: "text_structure", difficulty: 2, passage_id: P3.id, passage_title: P3.title, passage_text: P3.text,
    stem: "The second paragraph mainly serves to",
    choices: [{ key: "A", text: "explain Nadia's view of the last row before the audition" }, { key: "B", text: "describe the conductor's teaching style" }, { key: "C", text: "give the history of the orchestra" }, { key: "D", text: "list the instruments in the group" }],
    correct_key: "A", rationale: "It sets up her reasoning about listening, which pays off in the audition scene." },

  // ---- P4 Subway map: main_idea 2, inference 2, vocab 1, structure 1
  { code: "RD-19", section_key: "reading", skill: "main_idea", difficulty: 2, passage_id: P4.id, passage_title: P4.title, passage_text: P4.text,
    stem: "What is the central idea of the passage?",
    choices: [{ key: "A", text: "London's subway is the oldest in the world." }, { key: "B", text: "A subway diagram gives up geographic accuracy in order to be clear." }, { key: "C", text: "Tourists should always walk instead of riding." }, { key: "D", text: "Engineering drafters make better designers than artists." }],
    correct_key: "B", rationale: "The passage explains the trade-off: 'By discarding accuracy, the diagram delivered clarity.'" },
  { code: "RD-20", section_key: "reading", skill: "main_idea", difficulty: 3, passage_id: P4.id, passage_title: P4.title, passage_text: P4.text,
    stem: "Which statement best summarizes the last paragraph?",
    choices: [{ key: "A", text: "Walking times have replaced subway diagrams in most cities." }, { key: "B", text: "The diagram's distortion is useful but still creates real problems." }, { key: "C", text: "Tourists dislike riding the subway." }, { key: "D", text: "Beck's design has never been changed." }],
    correct_key: "B", rationale: "It gives an example of riders misled by the diagram and cities correcting for it." },
  { code: "RD-21", section_key: "reading", skill: "inference", difficulty: 2, passage_id: P4.id, passage_title: P4.title, passage_text: P4.text,
    stem: "The statement that \"a subway map lies\" is best understood to mean that the map",
    choices: [{ key: "A", text: "contains printing errors" }, { key: "B", text: "shows stations at distances that are not true to the ground" }, { key: "C", text: "hides certain stations from riders" }, { key: "D", text: "was drawn by someone untrained" }],
    correct_key: "B", rationale: "The passage explains that stations are 'spaced evenly regardless of true distance.'" },
  { code: "RD-22", section_key: "reading", skill: "inference", difficulty: 3, passage_id: P4.id, passage_title: P4.title, passage_text: P4.text,
    stem: "Why did transit officials most likely hesitate before printing Beck's design?",
    choices: [{ key: "A", text: "It was too expensive to reproduce." }, { key: "B", text: "It did not look like the accurate maps they expected." }, { key: "C", text: "Riders had already rejected an earlier version." }, { key: "D", text: "Beck refused to let them use it." }],
    correct_key: "B", rationale: "The design broke with geographic accuracy, which officials expected a map to provide." },
  { code: "RD-23", section_key: "reading", skill: "vocabulary_in_context", difficulty: 2, passage_id: P4.id, passage_title: P4.title, passage_text: P4.text,
    stem: "As used in the passage, \"clarity\" most nearly means",
    choices: [{ key: "A", text: "brightness of color" }, { key: "B", text: "ease of understanding" }, { key: "C", text: "exact measurement" }, { key: "D", text: "official approval" }],
    correct_key: "B", rationale: "The diagram makes the route easy to read, which is what clarity means here." },
  { code: "RD-24", section_key: "reading", skill: "text_structure", difficulty: 2, passage_id: P4.id, passage_title: P4.title, passage_text: P4.text,
    stem: "The passage is organized mainly by",
    choices: [{ key: "A", text: "presenting a problem, a solution, and its side effects" }, { key: "B", text: "comparing two cities point by point" }, { key: "C", text: "listing events in reverse order" }, { key: "D", text: "describing a place from the outside in" }],
    correct_key: "A", rationale: "It moves from the crowding problem, to Beck's diagram, to the trouble the distortion causes." },

  // ---- P5 Paired texts: main_idea 2, inference 2, vocab 2, structure 2
  { code: "RD-25", section_key: "reading", skill: "main_idea", difficulty: 2, passage_id: P5.id, passage_title: P5.title, passage_text: P5.text,
    stem: "What is the main claim of Text A?",
    choices: [{ key: "A", text: "Middle school students need more homework time." }, { key: "B", text: "The school day should begin an hour later to match adolescent sleep." }, { key: "C", text: "Bus routes should be reduced from three to two." }, { key: "D", text: "Attendance rules should be stricter." }],
    correct_key: "B", rationale: "Text A opens by proposing the 8:40 a.m. bell and defends it with sleep research." },
  { code: "RD-26", section_key: "reading", skill: "main_idea", difficulty: 3, passage_id: P5.id, passage_title: P5.title, passage_text: P5.text,
    stem: "Which statement best captures the disagreement between the two texts?",
    choices: [{ key: "A", text: "They disagree about whether adolescent sleep shifts later." }, { key: "B", text: "They disagree about who would bear the costs of the change." }, { key: "C", text: "They disagree about how many buses the district owns." }, { key: "D", text: "They disagree about whether attendance matters." }],
    correct_key: "B", rationale: "Text B accepts the sleep research but argues the schedule change shifts burdens onto certain families." },
  { code: "RD-27", section_key: "reading", skill: "inference", difficulty: 2, passage_id: P5.id, passage_title: P5.title, passage_text: P5.text,
    stem: "The writer of Text B would most likely respond to Text A's claim that the change \"costs nothing\" by saying that",
    choices: [{ key: "A", text: "the curriculum would have to be rewritten" }, { key: "B", text: "the cost appears in transportation and after-school schedules rather than in the curriculum" }, { key: "C", text: "the research on sleep is unreliable" }, { key: "D", text: "students would simply stay up later" }],
    correct_key: "B", rationale: "Text B accepts the academic argument and points to buses, darkness, and after-school obligations." },
  { code: "RD-28", section_key: "reading", skill: "inference", difficulty: 3, passage_id: P5.id, passage_title: P5.title, passage_text: P5.text,
    stem: "Text B's mention that some students work or care for siblings is included mainly to show that",
    choices: [{ key: "A", text: "those students are not interested in athletics" }, { key: "B", text: "a later dismissal would conflict with responsibilities some families cannot move" }, { key: "C", text: "the district should hire more coaches" }, { key: "D", text: "students should be excused from practice" }],
    correct_key: "B", rationale: "The detail supports the claim that the cost falls on families with the least flexibility." },
  { code: "RD-29", section_key: "reading", skill: "vocabulary_in_context", difficulty: 2, passage_id: P5.id, passage_title: P5.title, passage_text: P5.text,
    stem: "In Text B, \"I dispute the arithmetic\" means the writer questions",
    choices: [{ key: "A", text: "the math scores of the students" }, { key: "B", text: "how the schedule actually adds up in practice" }, { key: "C", text: "the cost of new textbooks" }, { key: "D", text: "the number of students in the district" }],
    correct_key: "B", rationale: "The writer then walks through the timing consequences of shifting the bell." },
  { code: "RD-30", section_key: "reading", skill: "vocabulary_in_context", difficulty: 3, passage_id: P5.id, passage_title: P5.title, passage_text: P5.text,
    stem: "In Text B, \"absorb\" most nearly means",
    choices: [{ key: "A", text: "soak up liquid" }, { key: "B", text: "take in and manage without harm" }, { key: "C", text: "ignore completely" }, { key: "D", text: "pay attention to" }],
    correct_key: "B", rationale: "Families with 'the least room to absorb the cost' are least able to take on the burden." },
  { code: "RD-31", section_key: "reading", skill: "text_structure", difficulty: 2, passage_id: P5.id, passage_title: P5.title, passage_text: P5.text,
    stem: "Text B is organized mainly by",
    choices: [{ key: "A", text: "conceding one point and then listing practical consequences" }, { key: "B", text: "telling a story in time order" }, { key: "C", text: "defining a term and giving examples" }, { key: "D", text: "comparing two historical periods" }],
    correct_key: "A", rationale: "It grants the sleep research, then details bus, daylight, and family-schedule effects." },
  { code: "RD-32", section_key: "reading", skill: "text_structure", difficulty: 3, passage_id: P5.id, passage_title: P5.title, passage_text: P5.text,
    stem: "Text A supports its claim mainly by",
    choices: [{ key: "A", text: "quoting students directly" }, { key: "B", text: "using an analogy and citing outcomes reported by other districts" }, { key: "C", text: "listing the district's budget in detail" }, { key: "D", text: "describing a single school day" }],
    correct_key: "B", rationale: "It compares a teen at 7 a.m. to an adult at 4 a.m. and cites attendance and tardiness results elsewhere." },

  // ---- P6 Repair cafés: main_idea 1, inference 2, vocab 2, structure 1
  { code: "RD-33", section_key: "reading", skill: "main_idea", difficulty: 2, passage_id: P6.id, passage_title: P6.title, passage_text: P6.text,
    stem: "What is the author's main point?",
    choices: [{ key: "A", text: "Repair cafés matter most for what they teach people, not only for what they fix." }, { key: "B", text: "Most household appliances cannot be repaired." }, { key: "C", text: "Recycling programs should be expanded immediately." }, { key: "D", text: "Volunteers should be paid for their repair work." }],
    correct_key: "A", rationale: "The final paragraph states the repaired item matters less than what the owner learns." },
  { code: "RD-34", section_key: "reading", skill: "inference", difficulty: 2, passage_id: P6.id, passage_title: P6.title, passage_text: P6.text,
    stem: "The detail that many devices are \"sealed with screws that ordinary tools cannot turn\" supports the idea that",
    choices: [{ key: "A", text: "repair has been made harder by design" }, { key: "B", text: "screws are more expensive than they used to be" }, { key: "C", text: "volunteers lack training" }, { key: "D", text: "most devices break within a year" }],
    correct_key: "A", rationale: "It is offered as one reason 'repair has become the harder choice.'" },
  { code: "RD-35", section_key: "reading", skill: "inference", difficulty: 3, passage_id: P6.id, passage_title: P6.title, passage_text: P6.text,
    stem: "By noting that only \"two of every three items leave working,\" the author most likely intends to",
    choices: [{ key: "A", text: "discourage readers from attending" }, { key: "B", text: "show honesty about limits while keeping the larger argument" }, { key: "C", text: "prove that repair is usually impossible" }, { key: "D", text: "criticize the volunteers' skills" }],
    correct_key: "B", rationale: "Admitting 'nothing is guaranteed' strengthens credibility before the closing claim." },
  { code: "RD-36", section_key: "reading", skill: "vocabulary_in_context", difficulty: 2, passage_id: P6.id, passage_title: P6.title, passage_text: P6.text,
    stem: "As used in the passage, \"sentimental\" most nearly means",
    choices: [{ key: "A", text: "based on feeling rather than practical value" }, { key: "B", text: "expensive and wasteful" }, { key: "C", text: "carefully planned" }, { key: "D", text: "scientific" }],
    correct_key: "A", rationale: "Critics call it 'a hobby dressed up as policy'—warm feeling without practical effect." },
  { code: "RD-37", section_key: "reading", skill: "vocabulary_in_context", difficulty: 3, passage_id: P6.id, passage_title: P6.title, passage_text: P6.text,
    stem: "In the last paragraph, \"failure is usually local\" means that when something breaks,",
    choices: [{ key: "A", text: "it happens near the owner's home" }, { key: "B", text: "one part is at fault rather than the whole device" }, { key: "C", text: "the manufacturer is responsible" }, { key: "D", text: "the damage spreads quickly" }],
    correct_key: "B", rationale: "The passage opens with a toaster that has only 'a loose wire.'" },
  { code: "RD-38", section_key: "reading", skill: "text_structure", difficulty: 2, passage_id: P6.id, passage_title: P6.title, passage_text: P6.text,
    stem: "The third paragraph functions mainly to",
    choices: [{ key: "A", text: "raise an objection and answer it" }, { key: "B", text: "describe a typical repair in detail" }, { key: "C", text: "provide statistics about recycling" }, { key: "D", text: "introduce a new problem unrelated to repair" }],
    correct_key: "A", rationale: "It states the critics' charge and then explains why 'the charge misses the point.'" },

  // ---- P7 Marie Tharp: main_idea 2, inference 1, vocab 1, structure 2
  { code: "RD-39", section_key: "reading", skill: "main_idea", difficulty: 2, passage_id: P7.id, passage_title: P7.title, passage_text: P7.text,
    stem: "What is the passage mainly about?",
    choices: [{ key: "A", text: "How echo sounding equipment works" }, { key: "B", text: "A scientist who turned scattered data into the first clear picture of the seafloor" }, { key: "C", text: "The history of earthquakes in the Atlantic" }, { key: "D", text: "Why research ships were difficult to operate" }],
    correct_key: "B", rationale: "The passage follows Tharp's work converting soundings into maps that revealed the rift." },
  { code: "RD-40", section_key: "reading", skill: "main_idea", difficulty: 3, passage_id: P7.id, passage_title: P7.title, passage_text: P7.text,
    stem: "The final paragraph suggests that the greatest value of Tharp's maps was that they",
    choices: [{ key: "A", text: "ended all scientific debate" }, { key: "B", text: "gave scientists something concrete to argue about" }, { key: "C", text: "were more beautiful than earlier charts" }, { key: "D", text: "proved that ships were unnecessary" }],
    correct_key: "B", rationale: "The text says the maps 'made an invisible landscape visible enough to argue about.'" },
  { code: "RD-41", section_key: "reading", skill: "inference", difficulty: 3, passage_id: P7.id, passage_title: P7.title, passage_text: P7.text,
    stem: "The plotting of earthquake locations mattered because it",
    choices: [{ key: "A", text: "showed that Tharp's rift matched an independent set of evidence" }, { key: "B", text: "proved that the ocean floor was flat" }, { key: "C", text: "explained why women were barred from ships" }, { key: "D", text: "replaced the need for sounding data" }],
    correct_key: "A", rationale: "Earthquakes falling along the rift confirmed the feature Tharp had drawn from different data." },
  { code: "RD-42", section_key: "reading", skill: "vocabulary_in_context", difficulty: 2, passage_id: P7.id, passage_title: P7.title, passage_text: P7.text,
    stem: "As used in the passage, \"unfashionable\" most nearly means",
    choices: [{ key: "A", text: "not currently accepted" }, { key: "B", text: "poorly written" }, { key: "C", text: "extremely old" }, { key: "D", text: "difficult to test" }],
    correct_key: "A", rationale: "Continental drift was then out of favor among scientists, which is why the idea was dismissed." },
  { code: "RD-43", section_key: "reading", skill: "text_structure", difficulty: 2, passage_id: P7.id, passage_title: P7.title, passage_text: P7.text,
    stem: "The first paragraph mainly serves to",
    choices: [{ key: "A", text: "establish the problem Tharp's work solved" }, { key: "B", text: "introduce Tharp's colleague" }, { key: "C", text: "describe the depth of the Atlantic" }, { key: "D", text: "explain how maps are printed" }],
    correct_key: "A", rationale: "It states that depth readings existed but no one had turned them into a picture." },
  { code: "RD-44", section_key: "reading", skill: "text_structure", difficulty: 3, passage_id: P7.id, passage_title: P7.title, passage_text: P7.text,
    stem: "The author includes the phrase \"girl talk\" in quotation marks in order to",
    choices: [{ key: "A", text: "report the dismissive words actually used and show the obstacle Tharp faced" }, { key: "B", text: "define an unfamiliar scientific term" }, { key: "C", text: "quote Tharp's own description of her work" }, { key: "D", text: "indicate an error in the original record" }],
    correct_key: "A", rationale: "The quoted dismissal illustrates the resistance she met, reinforced by her exclusion from ships." },

  // ---- P8 Octopus: main_idea 1, inference 1, vocab 1, structure 3
  { code: "RD-45", section_key: "reading", skill: "main_idea", difficulty: 2, passage_id: P8.id, passage_title: P8.title, passage_text: P8.text,
    stem: "Which sentence best states the central idea?",
    choices: [{ key: "A", text: "Octopuses hunt mainly at night." }, { key: "B", text: "An octopus senses chemically through its arms, which challenges ideas about how a mind is organized." }, { key: "C", text: "Crabs are the octopus's favorite food." }, { key: "D", text: "Mammals have the most efficient nervous systems." }],
    correct_key: "B", rationale: "The passage describes taste-by-touch and then draws the conclusion about distributed intelligence." },
  { code: "RD-46", section_key: "reading", skill: "inference", difficulty: 3, passage_id: P8.id, passage_title: P8.title, passage_text: P8.text,
    stem: "The passage suggests that an octopus searching a crevice",
    choices: [{ key: "A", text: "must first see the object to identify it" }, { key: "B", text: "can identify what it touches without the central brain directing the search" }, { key: "C", text: "loses control of the other seven arms" }, { key: "D", text: "relies mostly on hearing" }],
    correct_key: "B", rationale: "The text says arms can carry out the search while the central brain attends to something else." },
  { code: "RD-47", section_key: "reading", skill: "vocabulary_in_context", difficulty: 2, passage_id: P8.id, passage_title: P8.title, passage_text: P8.text,
    stem: "As used in the passage, \"distributed\" most nearly means",
    choices: [{ key: "A", text: "handed out as gifts" }, { key: "B", text: "spread across many parts" }, { key: "C", text: "hidden from view" }, { key: "D", text: "measured precisely" }],
    correct_key: "B", rationale: "The final sentence contrasts a mind in one place with one spread across a body." },
  { code: "RD-48", section_key: "reading", skill: "text_structure", difficulty: 1, passage_id: P8.id, passage_title: P8.title, passage_text: P8.text,
    stem: "The phrase \"Consider what this makes possible\" signals that the author is about to",
    choices: [{ key: "A", text: "explain the consequences of the fact just presented" }, { key: "B", text: "contradict the previous paragraph" }, { key: "C", text: "define a technical term" }, { key: "D", text: "quote a researcher" }],
    correct_key: "A", rationale: "The sentence introduces the abilities that follow from tasting by touch." },
  { code: "RD-49", section_key: "reading", skill: "text_structure", difficulty: 2, passage_id: P8.id, passage_title: P8.title, passage_text: P8.text,
    stem: "The comparison to \"a committee more than a chain of command\" is used to",
    choices: [{ key: "A", text: "criticize how octopuses behave" }, { key: "B", text: "make an unfamiliar nervous system easier to picture" }, { key: "C", text: "explain how researchers organize their labs" }, { key: "D", text: "show that octopuses work in groups" }],
    correct_key: "B", rationale: "The analogy translates decentralized processing into a familiar image." },
  { code: "RD-50", section_key: "reading", skill: "text_structure", difficulty: 3, passage_id: P8.id, passage_title: P8.title, passage_text: P8.text,
    stem: "How does the final paragraph differ from the first two?",
    choices: [{ key: "A", text: "It shifts from describing the animal to discussing what scientists must rethink." }, { key: "B", text: "It repeats the opening claim without change." }, { key: "C", text: "It tells a personal story about a researcher." }, { key: "D", text: "It gives step-by-step instructions." }],
    correct_key: "A", rationale: "The first paragraphs describe anatomy and ability; the last discusses an assumption biologists must set aside." },
];
