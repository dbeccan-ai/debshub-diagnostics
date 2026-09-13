// Written Expression v2 — 80 original items (40 passage-based, 40 standalone).
// Skills: grammar_usage, punctuation_capitalization, sentence_structure,
//         spelling_word_usage, organization_coherence, revision_style.
// DO NOT modify v1 (bank-written.ts) — this is an additive, independent pool.
import type { BankQuestion, Choice } from "./bank-types.ts";

interface Passage { id: string; title: string; text: string }

const mkChoices = (opts: [string, string, string, string]): Choice[] => [
  { key: "A", text: opts[0] }, { key: "B", text: opts[1] }, { key: "C", text: opts[2] }, { key: "D", text: opts[3] },
];

/** Standalone item (no passage). */
const s = (
  code: string, difficulty: 1 | 2 | 3, skill: string, stem: string,
  opts: [string, string, string, string], correct: string, rationale: string,
): BankQuestion => ({
  code, section_key: "written_expression", skill, difficulty, stem,
  choices: mkChoices(opts), correct_key: correct, rationale,
});

/** Passage-based item. */
const p = (
  code: string, difficulty: 1 | 2 | 3, skill: string, passage: Passage, stem: string,
  opts: [string, string, string, string], correct: string, rationale: string,
): BankQuestion => ({
  code, section_key: "written_expression", skill, difficulty, stem,
  passage_id: passage.id, passage_title: passage.title, passage_text: passage.text,
  choices: mkChoices(opts), correct_key: correct, rationale,
});

// ================= PASSAGES =================

export const WRITTEN_V2_PASSAGES: Passage[] = [
  {
    id: "w2-01",
    title: "A Report on the Willow Pond Ecosystem",
    text:
      "(1) Last month our class studied the pond behind Willow Park to learn about local wildlife. " +
      "(2) Each team of students recorded three things the number of fish, frogs, and insects they observed near the shore. " +
      "(3) The report, along with photographs and water samples, were collected over three separate visits. " +
      "(4) On the first visit, we noticed that the water near the reeds were unusually cloudy. " +
      "(5) A group of geese was resting on the far bank, honking loudly at anyone who came near. " +
      "(6) Our teacher explained that pond ecosystems depend on a balance between plants, insects, and small animals. " +
      "(7) Frogs eat insects, insects pollinate plants, and plants provide oxygen for fish. " +
      "(8) This project taught us that even a small pond has a complicated web of life. " +
      "(9) By the third visit the cloudy water had cleared, we saw dozens of tiny fish darting near the surface. " +
      "(10) One student, who had brought a magnifying glass, spotted a dragonfly nymph clinging to a reed. " +
      "(11) We also learned about invasive species, harmful invaders that invade ecosystems in harmful ways. " +
      "(12) Overall the study showed us why protecting even small habitats like Willow Pond matters.",
  },
  {
    id: "w2-02",
    title: "My First Day at Riverside Animal Shelter",
    text:
      "(1) I had wanted to volunteer at Riverside Animal Shelter since sixth grade, and last Saturday I finally got the chance to volunteer there. " +
      "(2) My moms car pulled up at seven in the morning, before the shelter even opened. " +
      "(3) The volunteer coordinator, whose name is Mr. Alvarez, met me at the front desk and handed me a checklist. " +
      "(4) Walking into the kennel area, the smell of disinfectant and dog food hit me immediately. " +
      "(5) Each of the dogs need fresh water and a short walk before breakfast. " +
      "(6) I was nervous at first, however I calmed down once a small terrier licked my hand. " +
      "(7) By ten o'clock, I had walked six dogs, refilled twelve water bowls, and cleaning three kennels. " +
      "(8) One elderly cat named Biscuit refused to leave her blanket, so I sat with her instead. " +
      "(9) My favorite moment was when a family adopted a shy beagle who had been at the shelter for months. " +
      "(10) After lunch, Mr. Alvarez asked me to help sort donated blankets and toys, which took almost an hour. " +
      "(11) The shelter posted my photo on their website, which made my parents proud. " +
      "(12) I can't wait to go back next Saturday and see how Biscuit and the beagle's new family are doing.",
  },
  {
    id: "w2-03",
    title: "A Letter About Library Hours",
    text:
      "(1) Dear Principal Ortiz, (2) I am writing to ask that the school library stay open until five o'clock on weekdays instead of closing at three. " +
      "(3) Many students, including me, stays at school for clubs and sports until after the current closing time. " +
      "(4) Because the library closes so early many of us have nowhere quiet to study before practice starts. " +
      "(5) A longer library schedule would help students who don't have internet access at home. " +
      "(6) Last year, the debate team used the library every day, it became our unofficial meeting room. " +
      "(7) The library also has the schools only laminator, which several clubs need for posters. " +
      "(8) I surveyed thirty classmates, and twenty-six said they would use the library more often if it stayed open later. " +
      "(9) Some teachers worry about staffing, this concern is reasonable and should be discussed. " +
      "(10) A student volunteer program, similar to the one at the front office, could help cover the extra hours. " +
      "(11) Extending the hours would cost very little money and would help many, many students a great deal. " +
      "(12) I hope you will consider this request, and I would be glad to discuss it further at your convenience.",
  },
  {
    id: "w2-04",
    title: "The Transcontinental Railroad",
    text:
      "(1) In 1863, two companies began the process of building and constructing a railroad that would eventually connect the eastern and western United States. " +
      "(2) The Central Pacific Railroad started in Sacramento, and the Union Pacific Railroad started in Omaha. " +
      "(3) Thousands of workers, many of them Chinese and Irish immigrants, laid the tracks across mountains, deserts, and plains. " +
      "(4) Building through the Sierra Nevada mountains were especially dangerous work. " +
      "(5) Crews blasted tunnels through solid rock, and avalanches sometimes buried entire work camps. " +
      "(6) Meanwhile, the Union Pacific crews laid track quickly across the flat plains of Nebraska. " +
      "(7) On May 10, 1869, the two lines finally met at Promontory Summit, Utah. " +
      "(8) A ceremonial golden spike were driven into the final rail to celebrate the achievement. " +
      "(9) The completed railroad, cut travel time across the country from months to about a week. " +
      "(10) Which meant goods, mail, and passengers could now cross the continent faster than ever before. " +
      "(11) The railroad also displaced Native American communities it changed the land they had lived on for generations. " +
      "(12) Historians still study the transcontinental railroad today because it changed transportation, the economy, and westward settlement all at once.",
  },
  {
    id: "w2-05",
    title: "How to Build a Simple Birdhouse",
    text:
      "(1) Building a simple birdhouse is a fun weekend project that only takes basic tools and a few pieces of wood. " +
      "(2) First, gather a saw, a hammer, wood glue, nails, and a piece of pine board about six feet long. " +
      "(3) Next, measure and cut the board into six pieces two side panels, a front, a back, a floor, and a roof. " +
      "(4) Once the box is square, nail the roof on at a slight angle so rain will run off. " +
      "(5) Before assembling the pieces, drill a two-inch hole near the top of the front panel for the bird's entrance. " +
      "(6) Sand each cut edge to a soft finish, splinters can hurt curious hands and small birds alike. " +
      "(7) My uncle built a much bigger birdhouse for owls a few years ago. " +
      "(8) Glue and nail the floor to the two side panels first to create a stable, sturdy, and stable base. " +
      "(9) Attach the front and back panels next, checking that the corners form right angles. " +
      "(10) Paint the birdhouse if you like, but avoid painting the inside, since fresh paint fumes can bother birds. " +
      "(11) Hang the finished birdhouse on a tree branch or a pole at least five feet off the ground, facing the entrance hole away from strong winds and direct afternoon sun. " +
      "(12) In just one afternoon, you and me can build a birdhouse that a family of wrens might use for years. " +
      "(13) It is a project that does not take a lot of time to do and is also very simple to complete for beginners.",
  },
];

const [P1, P2, P3, P4, P5] = WRITTEN_V2_PASSAGES;

export const WRITTEN_V2: BankQuestion[] = [
  // ============ PASSAGE 1 — science report (8) ============
  p("WE2-01", 3, "grammar_usage", P1, "Which revision of sentence 3 corrects the error?",
    ["The report, along with photographs and water samples, were collected over three separate visits.",
     "The report, along with photographs and water samples, was collected over three separate visits.",
     "The reports, along with photographs and water samples, was collected over three separate visits.",
     "The report, along with photographs and water samples, have been collected over three separate visits."],
    "B", "The subject 'report' is singular; 'along with photographs and water samples' is a parenthetical modifier, not part of a compound subject, so it does not change agreement. The verb must be 'was.' Choice A keeps the error, C wrongly makes the subject plural, and D shifts to present-perfect tense, breaking the past-tense narrative."),
  p("WE2-02", 2, "grammar_usage", P1, "Which revision of sentence 4 corrects the error?",
    ["On the first visit, we noticed that the water near the reeds were unusually cloudy.",
     "On the first visit, we noticed that the water near the reeds was unusually cloudy.",
     "On the first visit, we noticed that the waters near the reeds was unusually cloudy.",
     "On the first visit, we noticed that the water near the reeds being unusually cloudy."],
    "B", "The subject of the clause is the singular noun 'water'; the phrase 'near the reeds' sits between the subject and verb but does not change the required singular verb 'was.'"),
  p("WE2-03", 2, "punctuation_capitalization", P1, "Which revision of sentence 2 is punctuated correctly?",
    ["Each team of students recorded three things, the number of fish, frogs, and insects they observed near the shore.",
     "Each team of students recorded three things; the number of fish, frogs, and insects they observed near the shore.",
     "Each team of students recorded three things: the number of fish, frogs, and insects they observed near the shore.",
     "Each team of students recorded, three things the number of fish, frogs, and insects they observed near the shore."],
    "C", "A colon follows a complete independent clause to introduce a list. A comma (A) and semicolon (B) cannot introduce a list this way, and D places a comma in the wrong spot."),
  p("WE2-04", 1, "punctuation_capitalization", P1, "Which revision of sentence 12 is punctuated correctly?",
    ["Overall the study showed us why protecting even small habitats like Willow Pond matters.",
     "Overall, the study showed us why protecting even small habitats like Willow Pond matters.",
     "Overall the study, showed us why protecting even small habitats like Willow Pond, matters.",
     "Overall; the study showed us why protecting even small habitats like Willow Pond matters."],
    "B", "An introductory word like 'Overall' is set off from the main clause with a comma."),
  p("WE2-05", 2, "sentence_structure", P1, "Which revision of sentence 9 corrects the error?",
    ["By the third visit the cloudy water had cleared, we saw dozens of tiny fish darting near the surface.",
     "By the third visit the cloudy water had cleared; and we saw dozens of tiny fish darting near the surface.",
     "By the third visit, the cloudy water had cleared, and we saw dozens of tiny fish darting near the surface.",
     "By the third visit the cloudy water had cleared we saw dozens of tiny fish darting near the surface."],
    "C", "A comma splice joins two independent clauses with only a comma. Adding the coordinating conjunction 'and' after the comma correctly joins the clauses. Choice B misuses a semicolon with 'and,' and D removes punctuation, creating a run-on."),
  p("WE2-06", 2, "organization_coherence", P1, "Which sentence should be removed because it does not support the paragraph's focus on the pond study?",
    ["Sentence 5", "Sentence 6", "Sentence 8", "Sentence 10"],
    "A", "Sentence 5 describes geese resting on the bank, a detail unrelated to the class's data collection or the lesson about the ecosystem; the other sentences all support that focus."),
  p("WE2-07", 3, "organization_coherence", P1, "The writer wants to add this sentence: \"As a result, scientists consider even small ponds important indicators of environmental health.\" Where should it best be placed?",
    ["Before sentence 1", "After sentence 8", "After sentence 2", "After sentence 4"],
    "B", "Sentence 8 states the lesson that a small pond has a complicated web of life; the new sentence extends that idea with a broader consequence, so it fits immediately after sentence 8."),
  p("WE2-08", 2, "revision_style", P1, "Which revision of sentence 11 removes the redundancy?",
    ["We also learned about invasive species, harmful invaders that invade ecosystems in harmful ways.",
     "We also learned about invasive species, harmful organisms that disrupt ecosystems.",
     "We also learned about invasive species, which are invaders that harmfully invade in a harmful way.",
     "We also learned about invasive species, harmful invasive invaders that are harmful to ecosystems."],
    "B", "The original repeats the idea of harm three times ('harmful,' 'invade,' 'harmful ways'). Choice B states the same idea once, concisely."),

  // ============ PASSAGE 2 — personal narrative (8) ============
  p("WE2-09", 2, "grammar_usage", P2, "Which revision of sentence 5 corrects the error?",
    ["Each of the dogs need fresh water and a short walk before breakfast.",
     "Each of the dogs needs fresh water and a short walk before breakfast.",
     "Each of the dogs needed fresh water and a short walk before breakfast, later.",
     "Each of the dogs are needing fresh water and a short walk before breakfast."],
    "B", "'Each' is a singular indefinite pronoun and takes the singular verb 'needs,' regardless of the plural noun 'dogs' in the prepositional phrase."),
  p("WE2-10", 3, "grammar_usage", P2, "Which revision of sentence 11 corrects the error?",
    ["The shelter posted my photo on their website, which made my parents proud.",
     "The shelter posted my photo on its website, which made my parents proud.",
     "The shelter posted my photo on it's website, which made my parents proud.",
     "The shelter posted my photo on his website, which made my parents proud."],
    "B", "'Shelter' is a singular collective noun, so the possessive pronoun that refers to it must also be singular: 'its.' 'Their' is plural, and 'it's' is a contraction of 'it is,' not a possessive."),
  p("WE2-11", 1, "punctuation_capitalization", P2, "Which revision of sentence 2 is punctuated correctly?",
    ["My moms car pulled up at seven in the morning, before the shelter even opened.",
     "My mom's car pulled up at seven in the morning, before the shelter even opened.",
     "My moms' car pulled up at seven in the morning, before the shelter even opened.",
     "My mom's car pulled up, at seven in the morning before the shelter even opened."],
    "B", "The singular possessive of 'mom' requires an apostrophe before the s: 'mom's.'"),
  p("WE2-12", 2, "punctuation_capitalization", P2, "Which revision of sentence 6 is punctuated correctly?",
    ["I was nervous at first, however I calmed down once a small terrier licked my hand.",
     "I was nervous at first; however, I calmed down once a small terrier licked my hand.",
     "I was nervous at first however, I calmed down once a small terrier licked my hand.",
     "I was nervous at first, however, I calmed down once a small terrier licked my hand."],
    "B", "A conjunctive adverb like 'however' joining two independent clauses needs a semicolon before it and a comma after it; a comma alone (A, D) creates a comma splice."),
  p("WE2-13", 3, "sentence_structure", P2, "Which revision of sentence 4 corrects the dangling modifier?",
    ["Walking into the kennel area, the smell of disinfectant and dog food hit me immediately.",
     "Walking into the kennel area, I immediately noticed the smell of disinfectant and dog food.",
     "The smell of disinfectant and dog food, walking into the kennel area, hit me immediately.",
     "Walking into the kennel area hit me immediately with the smell of disinfectant and dog food."],
    "B", "The introductory phrase 'Walking into the kennel area' must describe the person doing the walking. Only B supplies 'I' right after the comma as the logical subject; the others leave the smell or the phrase itself illogically doing the walking."),
  p("WE2-14", 2, "sentence_structure", P2, "Which revision of sentence 7 corrects the error in parallel structure?",
    ["By ten o'clock, I had walked six dogs, refilled twelve water bowls, and cleaning three kennels.",
     "By ten o'clock, I had walked six dogs, refilled twelve water bowls, and cleaned three kennels.",
     "By ten o'clock, I had walked six dogs, refilling twelve water bowls, and cleaned three kennels.",
     "By ten o'clock, I had walked six dogs, to refill twelve water bowls, and cleaning three kennels."],
    "B", "All three items in the series must use the same past-tense verb form ('walked,' 'refilled,' 'cleaned')."),
  p("WE2-15", 2, "organization_coherence", P2, "Which sentence best functions as the narrative's concluding thought?",
    ["Sentence 8", "Sentence 9", "Sentence 11", "Sentence 12"],
    "D", "Sentence 12 wraps up the day by looking ahead to returning, giving the narrative a natural close; the other sentences describe events in the middle of the day."),
  p("WE2-16", 2, "revision_style", P2, "Which revision of sentence 1 removes the redundancy?",
    ["I had wanted to volunteer at Riverside Animal Shelter since sixth grade, and last Saturday I finally got the chance to volunteer there.",
     "I had wanted to volunteer at Riverside Animal Shelter since sixth grade, and last Saturday I finally got my chance.",
     "I had wanted to volunteer at Riverside Animal Shelter since sixth grade, and last Saturday I finally got the chance to go there and volunteer.",
     "Since sixth grade, I had wanted to volunteer at Riverside Animal Shelter to volunteer, and last Saturday I got my chance."],
    "B", "The original repeats the idea of volunteering ('volunteer... to volunteer there'). Choice B states the idea once and stays clear."),

  // ============ PASSAGE 3 — persuasive letter (8) ============
  p("WE2-17", 2, "grammar_usage", P3, "Which revision of sentence 3 corrects the error?",
    ["Many students, including me, stays at school for clubs and sports until after the current closing time.",
     "Many students, including me, stay at school for clubs and sports until after the current closing time.",
     "Many student, including me, stay at school for clubs and sports until after the current closing time.",
     "Many students, including me, staying at school for clubs and sports until after the current closing time."],
    "B", "The subject 'students' is plural and takes the plural verb 'stay.' The phrase 'including me' does not change the subject's number."),
  p("WE2-18", 1, "punctuation_capitalization", P3, "Which revision of sentence 4 is punctuated correctly?",
    ["Because the library closes so early many of us have nowhere quiet to study before practice starts.",
     "Because the library closes so early, many of us have nowhere quiet to study before practice starts.",
     "Because, the library closes so early many of us have nowhere quiet to study before practice starts.",
     "Because the library closes so early; many of us have nowhere quiet to study before practice starts."],
    "B", "An introductory dependent clause is followed by a comma before the main clause begins."),
  p("WE2-19", 2, "punctuation_capitalization", P3, "Which revision of sentence 7 is punctuated correctly?",
    ["The library also has the schools only laminator, which several clubs need for posters.",
     "The library also has the school's only laminator, which several clubs need for posters.",
     "The library also has the schools' only laminator, which several clubs need for posters.",
     "The library also has the school only laminator's, which several clubs need for posters."],
    "B", "The singular possessive of 'school' requires an apostrophe before the s."),
  p("WE2-20", 2, "sentence_structure", P3, "Which revision of sentence 6 corrects the error?",
    ["Last year, the debate team used the library every day, it became our unofficial meeting room.",
     "Last year, the debate team used the library every day; it became our unofficial meeting room.",
     "Last year, the debate team used the library every day it became our unofficial meeting room.",
     "Last year, the debate team used the library every day, and became our unofficial meeting room."],
    "B", "A comma splice joins two independent clauses with only a comma; a semicolon correctly joins two closely related independent clauses without a conjunction."),
  p("WE2-21", 3, "sentence_structure", P3, "Which revision of sentence 9 corrects the error?",
    ["Some teachers worry about staffing, this concern is reasonable and should be discussed.",
     "Some teachers worry about staffing, however this concern is reasonable and should be discussed.",
     "Some teachers worry about staffing; this concern is reasonable and should be discussed.",
     "Some teachers worry about staffing this concern is reasonable and should be discussed."],
    "C", "A comma splice joins two independent clauses with only a comma. A semicolon correctly separates the two closely related independent clauses. Choice B still uses only a comma before the conjunctive adverb 'however,' which is also incorrect."),
  p("WE2-22", 2, "organization_coherence", P3, "Which transition best begins sentence 5?",
    ["In addition, a longer library schedule would help students who don't have internet access at home.",
     "However, a longer library schedule would help students who don't have internet access at home.",
     "For instance, a longer library schedule would help students who don't have internet access at home.",
     "Instead, a longer library schedule would help students who don't have internet access at home."],
    "A", "Sentence 5 adds another reason to support the request made in sentence 4, so a transition that signals addition ('In addition') fits best."),
  p("WE2-23", 3, "organization_coherence", P3, "The writer wants to add this sentence: \"In fact, three neighboring schools already keep their libraries open until five o'clock.\" Where should it be placed?",
    ["After sentence 2", "After sentence 5", "After sentence 9", "After sentence 11"],
    "B", "The new sentence gives an outside example that supports the case made in sentences 4 and 5 for a longer schedule, so it fits best right after sentence 5, before the letter shifts to new points."),
  p("WE2-24", 2, "revision_style", P3, "Which revision of sentence 11 removes the redundancy?",
    ["Extending the hours would cost very little money and would help many, many students a great deal.",
     "Extending the hours would cost very little money and would help many students a great deal.",
     "Extending the hours would cost very little, little money and would help many students greatly a great deal.",
     "Extending the hours would cost very little money and help students who are many in number a great deal."],
    "B", "The original repeats 'many' unnecessarily. Choice B states the idea once, clearly and concisely."),

  // ============ PASSAGE 4 — history summary (8) ============
  p("WE2-25", 3, "grammar_usage", P4, "Which revision of sentence 4 corrects the error?",
    ["Building through the Sierra Nevada mountains were especially dangerous work.",
     "Building through the Sierra Nevada mountains was especially dangerous work.",
     "Building through the Sierra Nevada mountains being especially dangerous work.",
     "Build through the Sierra Nevada mountains were especially dangerous work."],
    "B", "The subject of the sentence is the singular gerund phrase 'Building through the Sierra Nevada mountains,' which takes the singular verb 'was,' not 'were.'"),
  p("WE2-26", 2, "grammar_usage", P4, "Which revision of sentence 8 corrects the error?",
    ["A ceremonial golden spike were driven into the final rail to celebrate the achievement.",
     "A ceremonial golden spike was driven into the final rail to celebrate the achievement.",
     "A ceremonial golden spike were drove into the final rail to celebrate the achievement.",
     "Ceremonial golden spikes was driven into the final rail to celebrate the achievement."],
    "B", "The singular subject 'spike' requires the singular verb 'was.'"),
  p("WE2-27", 2, "punctuation_capitalization", P4, "Which revision of sentence 9 is punctuated correctly?",
    ["The completed railroad, cut travel time across the country from months to about a week.",
     "The completed railroad cut travel time across the country from months to about a week.",
     "The completed railroad cut, travel time across the country from months to about a week.",
     "The completed, railroad cut travel time across the country, from months to about a week."],
    "B", "A comma should not separate a subject from its verb; 'The completed railroad' is the subject and 'cut' is the verb, so no comma belongs between them."),
  p("WE2-28", 2, "sentence_structure", P4, "Which revision corrects the fragment in sentence 10 by joining it to sentence 9?",
    ["The completed railroad cut travel time across the country from months to about a week. Which meant goods, mail, and passengers could now cross the continent faster than ever before.",
     "The completed railroad cut travel time across the country from months to about a week, which meant goods, mail, and passengers could now cross the continent faster than ever before.",
     "The completed railroad cut travel time across the country from months to about a week. Meant goods, mail, and passengers could now cross the continent faster than ever before.",
     "The completed railroad cut travel time across the country from months to about a week, meaning, goods, mail, and passengers could now cross the continent faster than ever before."],
    "B", "'Which meant...' is a dependent clause with no independent clause of its own, making it a fragment. Attaching it to the previous sentence with a comma creates one complete sentence."),
  p("WE2-29", 3, "sentence_structure", P4, "Which revision corrects the run-on in sentence 11?",
    ["The railroad also displaced Native American communities it changed the land they had lived on for generations.",
     "The railroad also displaced Native American communities, changed the land they had lived on for generations.",
     "The railroad also displaced Native American communities and changed the land they had lived on for generations.",
     "The railroad also displaced Native American communities, it changed the land they had lived on for generations."],
    "C", "Two independent clauses need a coordinating conjunction (and a comma, if the clauses are long) or other correct joining method. Choice C joins them correctly with 'and'; D is still a comma splice, and B removes the needed conjunction."),
  p("WE2-30", 2, "organization_coherence", P4, "Which sentence, if inserted after sentence 5, would best support the paragraph's description of the danger of mountain construction?",
    ["Freezing temperatures and thin air made the high-altitude work even riskier.",
     "Sacramento is the capital of California.",
     "The railroad used steel rails imported from England.",
     "Some workers played cards during breaks to pass the time."],
    "A", "This sentence adds another concrete danger of mountain construction, directly supporting the point already made about blasting and avalanches."),
  p("WE2-31", 3, "organization_coherence", P4, "Which sentence, if added after sentence 8, would best help transition to the effects of the railroad described starting in sentence 9?",
    ["News of the golden spike ceremony spread quickly across the country by telegraph.",
     "Sacramento and Omaha are both located in the western half of the country.",
     "Many workers were paid by the number of miles of track they laid.",
     "The two railroad companies used slightly different types of rail cars."],
    "A", "This sentence bridges the completion ceremony (sentence 8) with the railroad's nationwide effects (sentence 9) by showing how quickly the news, and later the benefits, reached the country."),
  p("WE2-32", 2, "revision_style", P4, "Which revision of sentence 1 removes the redundancy?",
    ["In 1863, two companies began the process of building and constructing a railroad that would eventually connect the eastern and western United States.",
     "In 1863, two companies began building a railroad that would eventually connect the eastern and western United States.",
     "In 1863, two companies began the process of the building and construction of a railroad that would eventually connect the eastern and western United States.",
     "In 1863, two companies began a process to build and to construct a railroad that would eventually connect the eastern and western United States."],
    "B", "'Building' and 'constructing' mean the same thing; stating the idea once, as in B, is clear and concise."),

  // ============ PASSAGE 5 — how-to piece (8) ============
  p("WE2-33", 2, "grammar_usage", P5, "Which revision of sentence 12 corrects the error?",
    ["In just one afternoon, you and me can build a birdhouse that a family of wrens might use for years.",
     "In just one afternoon, you and I can build a birdhouse that a family of wrens might use for years.",
     "In just one afternoon, me and you can build a birdhouse that a family of wrens might use for years.",
     "In just one afternoon, us can build a birdhouse that a family of wrens might use for years."],
    "B", "The pronoun is part of the compound subject of 'can build,' so the subject form 'I' is required, not the object form 'me.'"),
  p("WE2-34", 2, "punctuation_capitalization", P5, "Which revision of sentence 3 is punctuated correctly?",
    ["Next, measure and cut the board into six pieces two side panels, a front, a back, a floor, and a roof.",
     "Next, measure and cut the board into six pieces: two side panels, a front, a back, a floor, and a roof.",
     "Next, measure and cut the board into six pieces; two side panels, a front, a back, a floor, and a roof.",
     "Next, measure and cut the board, into six pieces two side panels, a front, a back, a floor, and a roof."],
    "B", "A colon follows the complete independent clause 'measure and cut the board into six pieces' to introduce the list that names the pieces."),
  p("WE2-35", 2, "sentence_structure", P5, "Which revision of sentence 6 corrects the comma splice?",
    ["Sand each cut edge to a soft finish, splinters can hurt curious hands and small birds alike.",
     "Sand each cut edge to a soft finish, because splinters can hurt curious hands and small birds alike.",
     "Sand each cut edge to a soft finish splinters can hurt curious hands and small birds alike.",
     "Sand each cut edge to a soft finish; and splinters can hurt curious hands and small birds alike."],
    "B", "Adding the subordinating conjunction 'because' correctly joins the two clauses and shows why sanding matters; the original comma alone creates a splice."),
  p("WE2-36", 1, "organization_coherence", P5, "Which sentence should be removed because it does not belong in this set of instructions?",
    ["Sentence 4", "Sentence 6", "Sentence 7", "Sentence 9"],
    "C", "Sentence 7 is a personal aside about the writer's uncle that does not belong in a set of step-by-step building instructions."),
  p("WE2-37", 2, "organization_coherence", P5, "Sentence 4 interrupts the order of the building steps. Where should it be moved?",
    ["Before sentence 1", "After sentence 9", "After sentence 2", "It is already in the correct place"],
    "B", "The roof should be nailed on only after the box is assembled (drilling, sanding, gluing the floor, and attaching the panels), so sentence 4 belongs after sentence 9 and before painting."),
  p("WE2-38", 2, "organization_coherence", P5, "Which sentence, if added after sentence 2, would best help a reader who has never used a saw?",
    ["Wear safety glasses and ask an adult for help when cutting the wood.",
     "Pine board is sold at most hardware stores.",
     "Birdhouses come in many different shapes and sizes.",
     "Some people paint their birdhouses bright colors."],
    "A", "This sentence gives a safety tip directly relevant to the cutting step for a reader who is inexperienced with tools; the other options do not address the reader's safety or skill concern."),
  p("WE2-39", 2, "revision_style", P5, "Which revision of sentence 8 removes the redundancy?",
    ["Glue and nail the floor to the two side panels first to create a stable, sturdy, and stable base.",
     "Glue and nail the floor to the two side panels first to create a sturdy base.",
     "Glue and nail the floor to the two side panels first to create a stable base that is stable and sturdy.",
     "Glue and nail the floor, to the two side panels first, to create a stable, sturdy, stable base."],
    "B", "The original repeats the idea of stability twice ('stable... stable'). Choice B states the idea once, clearly."),
  p("WE2-40", 3, "revision_style", P5, "Which revision of sentence 13 is most concise without losing meaning?",
    ["It is a project that does not take a lot of time to do and is also very simple to complete for beginners.",
     "It is a quick, simple project for beginners.",
     "It is a project which does not take a great deal of time and which is also simple for beginners to do.",
     "It does not take a lot of time to do, and it is a project that is simple for beginners to complete."],
    "B", "Choice B states the same idea (quick, simple, for beginners) in far fewer words; the other options keep the wordy, repetitive phrasing."),

  // ============ STANDALONE — grammar_usage (8) ============
  s("WE2-41", 1, "grammar_usage", "Which sentence is written correctly?",
    ["The players was excited about the tournament.", "The players were excited about the tournament.", "The players is excited about the tournament.", "The players be excited about the tournament."],
    "B", "The plural subject 'players' requires the plural verb 'were.'"),
  s("WE2-42", 1, "grammar_usage", "Choose the sentence with the correct pronoun.",
    ["Her and Marco finished the mural first.", "She and Marco finished the mural first.", "Marco and her finished the mural first.", "Him and she finished the mural first."],
    "B", "Both pronouns act as the subject of 'finished,' so the subject form 'she' is required, not the object form 'her.'"),
  s("WE2-43", 2, "grammar_usage", "Which sentence keeps verb tense consistent?",
    ["Theo studied the map, then he plans a new route.", "Theo studies the map, then he planned a new route.", "Theo studied the map, then he planned a new route.", "Theo studying the map, then he plans a new route."],
    "C", "Both verbs are in the past tense, keeping the sentence consistent."),
  s("WE2-44", 2, "grammar_usage", "Which sentence uses the comparative correctly?\n\nOf the two runners in the final heat, Ana finished ____.",
    ["Of the two runners, Ana is the fastest.", "Of the two runners, Ana is faster.", "Of the two runners, Ana is more fast.", "Of the two runners, Ana is fastest."],
    "B", "With only two items being compared, the comparative form 'faster' is correct, not the superlative 'fastest.'"),
  s("WE2-45", 3, "grammar_usage", "Read the sentence.\n\nThe folder of applications submitted by the new interns, all of whom joined last week, ____ still on the director's desk.\n\nWhich word correctly completes the sentence?",
    ["is", "are", "were", "have been"],
    "A", "The subject of the sentence is the singular noun 'folder.' The long modifying phrase between the subject and the verb does not change the required singular verb 'is.'"),
  s("WE2-46", 3, "grammar_usage", "Choose the word that correctly completes the sentence.\n\nThe school board, along with several parent volunteers, is finalizing ____ plan for the new playground before Thursday's vote.",
    ["its", "their", "it's", "his"],
    "A", "'Board' is a singular collective noun acting as one unit, so it takes the singular possessive 'its,' not the plural 'their.'"),
  s("WE2-47", 3, "grammar_usage", "Choose the word that correctly completes the sentence.\n\nIf the museum ____ open on Mondays, more students could visit during field-trip season, but the current schedule makes that impossible.",
    ["was", "were", "is", "would be"],
    "B", "This is a contrary-to-fact condition (the museum is not open on Mondays), which requires the subjunctive 'were,' not 'was.'"),
  s("WE2-48", 3, "grammar_usage", "Read the sentence.\n\nThe committee reviewed each proposal carefully, and every recommendation was discussed before a decision was reached.\n\nWhich revision keeps the voice consistent throughout the sentence?",
    ["The committee reviewed each proposal carefully, and every recommendation was discussed before a decision was reached.",
     "The committee reviewed each proposal carefully and discussed every recommendation before reaching a decision.",
     "Each proposal was reviewed by the committee carefully, and every recommendation discussed before decision reached.",
     "The committee reviewing each proposal, every recommendation was discussed and decision reached."],
    "B", "The original mixes active voice ('reviewed') with passive voice ('was discussed,' 'was reached'). Choice B keeps the committee as the active subject of all three verbs."),

  // ============ STANDALONE — punctuation_capitalization (8) ============
  s("WE2-49", 1, "punctuation_capitalization", "Which sentence uses the apostrophe correctly?",
    ["The dogs leash was tangled in the fence.", "The dog's leash was tangled in the fence.", "The dogs' leash was tangled in the fence.", "The dog leashes' was tangled in the fence."],
    "B", "One dog's leash is described, so the singular possessive 'dog's' is correct."),
  s("WE2-50", 1, "punctuation_capitalization", "Which sentence uses the correct end punctuation?",
    ["Watch out for the wet paint", "Watch out for the wet paint.", "Watch out for the wet paint,", "Watch out for the wet paint;"],
    "B", "This is a statement (a command), so it correctly ends with a period."),
  s("WE2-51", 2, "punctuation_capitalization", "Which sentence is punctuated correctly?",
    ["After finishing her homework Maria called her grandmother.", "After finishing her homework, Maria called her grandmother.", "After finishing, her homework Maria called her grandmother.", "After finishing her homework Maria, called her grandmother."],
    "B", "A comma follows the introductory participial phrase 'After finishing her homework' before the main clause begins."),
  s("WE2-52", 2, "punctuation_capitalization", "Which sentence punctuates the quotation correctly?",
    ['"Where did you park the car"? asked Dad.', '"Where did you park the car?" asked Dad.', '"Where did you park the car," asked Dad?', '"Where did you park the car"? Asked Dad.'],
    "B", "The question mark belongs inside the closing quotation mark because the quoted words themselves form the question."),
  s("WE2-53", 3, "punctuation_capitalization", "Which sentence uses the semicolon correctly?",
    ["The trail was closed after the storm; hikers used the north entrance instead.",
     "The trail was closed after the storm: hikers used the north entrance instead.",
     "The trail was closed after the storm, hikers used the north entrance instead.",
     "The trail was closed after the storm; and hikers used the north entrance instead."],
    "A", "A semicolon correctly joins two closely related, equally weighted independent clauses. A colon (B) signals that the second clause explains or lists something from the first, which it does not here; C is a comma splice; D incorrectly pairs a semicolon with the conjunction 'and.'"),
  s("WE2-54", 3, "punctuation_capitalization", "Which sentence correctly separates the items in the list?",
    ["The relay team included Priya, the team captain, Devon, the fastest runner, and Marcus, the newest member.",
     "The relay team included Priya, the team captain; Devon, the fastest runner; and Marcus, the newest member.",
     "The relay team included: Priya, the team captain, Devon, the fastest runner, and Marcus, the newest member.",
     "The relay team included Priya, the team captain, Devon; the fastest runner, and Marcus, the newest member."],
    "B", "When list items already contain internal commas, semicolons separate the items so a reader can tell where each one ends. A colon (C) is also wrong here because 'The relay team included' is not a complete independent clause on its own without the list."),
  s("WE2-55", 3, "punctuation_capitalization", "Which sentence is capitalized correctly?",
    ["My aunt, a nurse at Riverside memorial hospital, is running in the boston marathon this spring.",
     "My aunt, a nurse at Riverside Memorial Hospital, is running in the Boston Marathon this spring.",
     "My Aunt, a nurse at riverside memorial hospital, is running in the Boston marathon this spring.",
     "My aunt, a Nurse at Riverside Memorial Hospital, is running in the boston Marathon this spring."],
    "B", "'Riverside Memorial Hospital' and 'Boston Marathon' are proper names and must be fully capitalized; 'aunt' and 'nurse' are common nouns here and stay lowercase."),
  s("WE2-56", 3, "punctuation_capitalization", "Which revision correctly punctuates the possessive?\n\nThe two teams equipment had been left out in the rain overnight, and the coaches were upset about the damage.",
    ["The two teams equipment had been left out in the rain overnight, and the coaches were upset about the damage.",
     "The two team's equipment had been left out in the rain overnight, and the coaches were upset about the damage.",
     "The two teams' equipment had been left out in the rain overnight, and the coaches were upset about the damage.",
     "The two teams's equipment had been left out in the rain overnight, and the coaches were upset about the damage."],
    "C", "Two teams jointly own the equipment, so the plural possessive places the apostrophe after the final s: 'teams'.' 'Team's' (B) would wrongly imply only one team."),

  // ============ STANDALONE — sentence_structure (8) ============
  s("WE2-57", 1, "sentence_structure", "Which group of words is a complete sentence?",
    ["Because the storm knocked out power across town.", "The generator hummed steadily in the garage.", "Running low on batteries and candles.", "Even though the lights flickered twice."],
    "B", "Only this option has a subject ('generator') and a main verb ('hummed') that form a complete independent clause."),
  s("WE2-58", 1, "sentence_structure", "Which sentence is a correctly punctuated compound sentence?",
    ["The play ended late, the audience applauded for minutes.", "The play ended late, and the audience applauded for minutes.", "The play ended late and, the audience applauded for minutes.", "The play ended late the audience applauded for minutes."],
    "B", "A comma followed by the coordinating conjunction 'and' correctly joins two independent clauses."),
  s("WE2-59", 2, "sentence_structure", "Which sentence corrects the run-on?\n\nThe printer jammed twice we finally switched to the backup machine.",
    ["The printer jammed twice we finally switched to the backup machine.", "The printer jammed twice, we finally switched to the backup machine.", "The printer jammed twice, so we finally switched to the backup machine.", "The printer, jammed twice we finally switched, to the backup machine."],
    "C", "Adding the coordinating conjunction 'so' after a comma correctly joins the two independent clauses and shows the cause-and-effect relationship."),
  s("WE2-60", 2, "sentence_structure", "Which sentence uses parallel structure correctly?",
    ["The recipe calls for chopping the onions, to mince the garlic, and grating the cheese.", "The recipe calls for chopping the onions, mincing the garlic, and grating the cheese.", "The recipe calls for chop the onions, mincing the garlic, and to grate the cheese.", "The recipe calls for chopping the onions, mince the garlic, and to grate the cheese."],
    "B", "All three items in the series use the same '-ing' verb form."),
  s("WE2-61", 3, "sentence_structure", "Read the sentence.\n\nAfter reviewing dozens of applications, the position was offered to a candidate with five years of experience.\n\nWhich revision corrects the dangling modifier?",
    ["After reviewing dozens of applications, the position was offered to a candidate with five years of experience.",
     "After reviewing dozens of applications, the hiring committee offered the position to a candidate with five years of experience.",
     "After reviewing dozens of applications, five years of experience made the candidate stand out.",
     "Reviewing dozens of applications, the candidate's five years of experience was noted by the position."],
    "B", "The introductory phrase 'After reviewing dozens of applications' must modify whoever did the reviewing. Only B places 'the hiring committee' right after the comma as that logical performer; in A, C, and D, the phrase illogically attaches to 'the position,' 'five years of experience,' or an unclear subject."),
  s("WE2-62", 3, "sentence_structure", "Which sentence is punctuated correctly?\n\nThe budget proposal covered new equipment and staff training however it left out funding for building repairs.",
    ["The budget proposal covered new equipment and staff training, however, it left out funding for building repairs.",
     "The budget proposal covered new equipment and staff training; however, it left out funding for building repairs.",
     "The budget proposal covered new equipment and staff training however, it left out funding for building repairs.",
     "The budget proposal covered new equipment and staff training, however it left out funding for building repairs."],
    "B", "A conjunctive adverb such as 'however' joining two independent clauses requires a semicolon before it and a comma after it. A comma alone before 'however' (A, D) creates a comma splice."),
  s("WE2-63", 3, "sentence_structure", "Which sentence uses parallel structure correctly?\n\nThe new policy states that employees must arrive on time, that they should dress professionally, and completing assignments by the deadline.",
    ["The new policy states that employees must arrive on time, that they should dress professionally, and completing assignments by the deadline.",
     "The new policy states that employees must arrive on time, that they should dress professionally, and that they must complete assignments by the deadline.",
     "The new policy states that employees must arrive on time, dressing professionally, and completing assignments by the deadline.",
     "The new policy states employees arriving on time, that they should dress professionally, and that assignments are completed by the deadline."],
    "B", "Each item in the series should use the same 'that + subject + verb' clause pattern. Choice B repeats that pattern consistently; the others mix clauses with phrases."),
  s("WE2-64", 3, "sentence_structure", "Which sentence is a compound-complex sentence?",
    ["Because the ferry was late, we waited at the dock.", "The ferry was late, and we waited at the dock.", "Because the ferry was late, we waited at the dock, and we missed the first tour.", "We waited at the dock because the ferry was late."],
    "C", "This sentence has one dependent clause ('Because the ferry was late') and two independent clauses joined by 'and,' making it compound-complex. The other sentences are either complex (one dependent, one independent clause) or compound (two independent clauses, no dependent clause)."),

  // ============ STANDALONE — spelling_word_usage (10) ============
  s("WE2-65", 1, "spelling_word_usage", "Choose the correct word.\n\n____ going to the fair after practice.",
    ["Their", "There", "They're", "Thier"], "C", "'They're' is the contraction of 'they are,' which fits the sentence; 'their' shows possession and 'there' shows place."),
  s("WE2-66", 1, "spelling_word_usage", "Choose the correct word.\n\nThe backpack was ____ heavy to carry up the hill.",
    ["to", "too", "two", "tu"], "B", "'Too' means 'excessively,' which fits here; 'to' is a preposition and 'two' is the number."),
  s("WE2-67", 1, "spelling_word_usage", "Choose the correct word.\n\n____ project is due on Friday.",
    ["Your", "You're", "Yore", "Ur"], "A", "'Your' shows possession, which fits here; 'you're' means 'you are.'"),
  s("WE2-68", 2, "spelling_word_usage", "Choose the correct word.\n\nEveryone attended the meeting ____ Jamal, who was out sick.",
    ["accept", "except", "excepted", "expect"], "B", "'Except' means 'excluding,' which fits here; 'accept' means 'to receive or agree to.'"),
  s("WE2-69", 2, "spelling_word_usage", "Choose the correct word.\n\nWe finished the project earlier ____ we expected.",
    ["then", "than", "that", "when"], "B", "'Than' is used for comparisons; 'then' refers to time."),
  s("WE2-70", 2, "spelling_word_usage", "Which word most precisely completes the sentence?\n\nThe scientist ____ the data before publishing the results.",
    ["looked at", "examined", "saw", "noticed"], "B", "'Examined' precisely conveys careful, deliberate scientific review; the other choices are vaguer or less exact."),
  s("WE2-71", 3, "spelling_word_usage", "Read the sentence.\n\nThe committee based its decision on a basic ____ of fairness rather than on any single rule.\n\nWhich word correctly completes the sentence?",
    ["principal", "principle", "principled", "principals"], "B", "'Principle' means a fundamental rule or belief, which fits the context; 'principal' refers to a school leader or a main/primary thing."),
  s("WE2-72", 3, "spelling_word_usage", "Choose the correct word.\n\nThe author ____ novel won the award will speak at the assembly next week.",
    ["who's", "whose", "who is", "whos"], "B", "'Whose' is the possessive form needed before 'novel'; 'who's' means 'who is,' which does not fit grammatically."),
  s("WE2-73", 3, "spelling_word_usage", "Choose the correct word.\n\nEvery afternoon after practice, the dog ____ on the porch until dinner.",
    ["lays", "lies", "lain", "laid"], "B", "'Lies' is the correct present-tense form of the intransitive verb 'lie' (to recline); 'lays' would require a direct object, as in 'lays a blanket down.'"),
  s("WE2-74", 3, "spelling_word_usage", "Choose the correct word.\n\nFrom the coach's silence, the players could ____ that practice had been canceled.",
    ["imply", "infer", "implied", "inferring"], "B", "The players are drawing a conclusion from evidence, which is 'inferring'; a speaker or evidence 'implies,' but a listener 'infers.'"),

  // ============ STANDALONE — organization_coherence (2) ============
  s("WE2-75", 1, "organization_coherence", "Which sentence would be the best topic sentence for a paragraph about the benefits of school gardens?",
    ["Some schools do not have much outdoor space.", "School gardens give students hands-on science lessons and fresh produce.", "Tomatoes need a lot of sunlight to grow.", "Our school garden was planted three years ago."],
    "B", "This sentence states the paragraph's main idea and previews the supporting details that would likely follow."),
  s("WE2-76", 3, "organization_coherence", "Which order presents the steps in the most logical sequence?\n\n(1) Once the dough has doubled in size, punch it down and shape it into a loaf. (2) Mix the flour, yeast, water, and salt into a shaggy dough. (3) Let the shaped loaf rise again for thirty minutes before baking. (4) Knead the dough for about ten minutes until it becomes smooth and elastic.",
    ["2, 4, 1, 3", "4, 2, 1, 3", "2, 1, 4, 3", "4, 1, 2, 3"],
    "A", "The ingredients must be mixed (2) before the dough can be kneaded (4); the dough then rises and is shaped (1) before its second, shorter rise (3) just before baking."),

  // ============ STANDALONE — revision_style (4) ============
  s("WE2-77", 1, "revision_style", "Which revision removes the redundancy?\n\nThe two twins shared a room their entire childhood.",
    ["The two twins shared a room their entire childhood.", "The twins shared a room their entire childhood.", "The two twin siblings shared a room together.", "The twins, who were two, shared a room."],
    "B", "'Twins' already means two, so 'two twins' is redundant; removing 'two' keeps the meaning and is concise."),
  s("WE2-78", 1, "revision_style", "Which revision replaces the vague word with a more precise one?\n\nThe storm was really bad and knocked down several trees.",
    ["The storm was really bad and knocked down several trees.", "The storm was severe and knocked down several trees.", "The storm was really really bad and knocked down several trees.", "The storm was bad, very bad, and knocked down several trees."],
    "B", "'Severe' is a precise, specific word choice; 'really bad' is vague and informal."),
  s("WE2-79", 2, "revision_style", "Which sentence best combines the two sentences?\n\nThe library added a new reading room. The reading room has large windows and comfortable chairs.",
    ["The library added a new reading room, it has large windows and comfortable chairs.", "The library added a new reading room with large windows and comfortable chairs.", "The library added a new reading room, and having large windows and comfortable chairs.", "The library added a new reading room, large windows and comfortable chairs it has."],
    "B", "This combines the two ideas smoothly into one clear sentence without a comma splice or awkward phrasing."),
  s("WE2-80", 3, "revision_style", "Which revision is most concise without losing meaning?\n\nIn spite of the fact that the weather forecast predicted heavy rain, the organizers made the decision to proceed with the outdoor ceremony as originally planned.",
    ["In spite of the fact that the weather forecast predicted heavy rain, the organizers made the decision to proceed with the outdoor ceremony as originally planned.",
     "Despite the forecast for heavy rain, the organizers proceeded with the outdoor ceremony as planned.",
     "Even though the weather forecast predicted heavy rain, a decision was made by the organizers to proceed with it.",
     "In spite of the rain forecast, the organizers made a decision that they would proceed with the ceremony outdoors."],
    "B", "This trims the wordy phrases 'in spite of the fact that' and 'made the decision to' down to 'despite' and 'proceeded,' keeping the same meaning in far fewer words."),
];

// ================= SELF-CHECK =================
if (import.meta.main) {
  const errors: string[] = [];
  const LETTERS = ["A", "B", "C", "D"];

  if (WRITTEN_V2.length !== 80) errors.push(`Expected 80 items, got ${WRITTEN_V2.length}`);

  const skillCounts: Record<string, number> = {};
  const difficultyCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  const skillDifficulty: Record<string, Set<number>> = {};
  const correctKeyCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  const passageCounts: Record<string, number> = {};
  const seenCodes = new Set<string>();

  for (const q of WRITTEN_V2) {
    if (seenCodes.has(q.code)) errors.push(`Duplicate code ${q.code}`);
    seenCodes.add(q.code);

    if (q.section_key !== "written_expression") errors.push(`${q.code}: wrong section_key`);

    skillCounts[q.skill] = (skillCounts[q.skill] ?? 0) + 1;
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] ?? 0) + 1;
    (skillDifficulty[q.skill] ??= new Set()).add(q.difficulty);

    if (q.choices.length !== 4) errors.push(`${q.code}: expected 4 choices, got ${q.choices.length}`);
    const keys = q.choices.map((c) => c.key);
    if (JSON.stringify(keys) !== JSON.stringify(LETTERS)) errors.push(`${q.code}: choice keys must be A,B,C,D in order`);
    const texts = q.choices.map((c) => (c.text ?? "").trim());
    if (new Set(texts).size !== 4) errors.push(`${q.code}: choices are not all distinct`);
    if (!LETTERS.includes(q.correct_key)) errors.push(`${q.code}: correct_key '${q.correct_key}' not in A-D`);
    else correctKeyCounts[q.correct_key]++;

    if (!q.rationale || q.rationale.length < 20) errors.push(`${q.code}: rationale too short`);

    if (q.passage_id) {
      passageCounts[q.passage_id] = (passageCounts[q.passage_id] ?? 0) + 1;
      if (!q.passage_title || !q.passage_text) errors.push(`${q.code}: missing passage_title/passage_text`);
    }
  }

  const expectedSkillTotals: Record<string, number> = {
    grammar_usage: 16, punctuation_capitalization: 16, sentence_structure: 16,
    spelling_word_usage: 10, organization_coherence: 12, revision_style: 10,
  };
  for (const [skill, expected] of Object.entries(expectedSkillTotals)) {
    if (skillCounts[skill] !== expected) errors.push(`Skill ${skill}: expected ${expected}, got ${skillCounts[skill] ?? 0}`);
  }
  for (const [skill, levels] of Object.entries(skillDifficulty)) {
    if (levels.size < 2) errors.push(`Skill ${skill}: only ${levels.size} difficulty level(s) present, need >= 2`);
  }

  if (WRITTEN_V2_PASSAGES.length !== 5) errors.push(`Expected 5 passages, got ${WRITTEN_V2_PASSAGES.length}`);
  for (const passage of WRITTEN_V2_PASSAGES) {
    const wc = passage.text.trim().split(/\s+/).length;
    if (wc < 120 || wc > 200) errors.push(`Passage ${passage.id}: word count ${wc} out of 120-200 range`);
    if ((passageCounts[passage.id] ?? 0) !== 8) errors.push(`Passage ${passage.id}: expected 8 items, got ${passageCounts[passage.id] ?? 0}`);
  }

  const passageItemCount = WRITTEN_V2.filter((q) => q.passage_id).length;
  const standaloneItemCount = WRITTEN_V2.length - passageItemCount;
  if (passageItemCount !== 40) errors.push(`Expected 40 passage-based items, got ${passageItemCount}`);
  if (standaloneItemCount !== 40) errors.push(`Expected 40 standalone items, got ${standaloneItemCount}`);

  console.log("=== WRITTEN_V2 self-check ===");
  console.log("Total items:", WRITTEN_V2.length, "| passage-based:", passageItemCount, "| standalone:", standaloneItemCount);
  console.log("Skill counts:", skillCounts);
  console.log("Difficulty counts (target ~16/36/28):", difficultyCounts);
  console.log("Correct-key distribution:", correctKeyCounts);
  console.log("Passage item counts:", passageCounts);
  console.log("Passages:", WRITTEN_V2_PASSAGES.map((pp) => `${pp.id}: ${pp.title}`));

  if (errors.length) {
    console.error("\nFAILED with", errors.length, "error(s):");
    for (const e of errors) console.error(" -", e);
    (globalThis as any).process?.exit?.(1);
  } else {
    console.log("\nAll checks passed.");
  }
}
