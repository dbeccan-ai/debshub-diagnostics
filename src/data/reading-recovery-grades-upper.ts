// Per-grade diagnostic passages: Grades 7, 9, 10, 11, 12.
// (Grades 2, 4, 6 and 8 come from the original passage set.)
// Every passage is written to END-OF-YEAR, ON-GRADE-LEVEL rigor.

import type { PassageDraft } from './reading-recovery-grade-builder';

export const upperGradeDrafts: PassageDraft[] = [
  // ------------------------------------------------------------------ 7
  {
    grade: '7', version: 'A', lexile: '1010L',
    focus: 'Argumentative nonfiction, evidence evaluation, discipline vocabulary',
    title: 'The Case Against the Eight A.M. Bell',
    targets: ['circadian', 'adolescent', 'implementation', 'correlation', 'logistical', 'mandate'],
    text: `Nearly every American high school opens its doors before eight in the morning, and nearly every sleep researcher who studies adolescents believes this is a mistake.

The argument rests on biology rather than discipline. During puberty, the human circadian rhythm shifts later by roughly two hours. A thirteen-year-old who fell asleep easily at nine the previous year now lies awake until eleven, not out of stubbornness but because the hormone that triggers sleep is released later in the evening. Waking that same student at six for a seven-forty bell removes hours of sleep the brain uses to consolidate memory.

The consequences show up in measurable ways. Districts that pushed start times to eight-thirty or later have reported attendance gains, fewer tardies, and, in several studies, a sharp decline in crashes involving teenage drivers. One frequently cited district in Wyoming saw teen crash rates fall by seventy percent in the two years following its change.

Critics of later start times rarely dispute the biology. Their objections are logistical. Bus fleets often run three staggered routes, and shifting the high school schedule pushes elementary students to earlier or darker pickups. Athletic practices collide with sunset. Working parents who rely on older siblings for afternoon childcare lose that arrangement entirely.

These are real costs, and districts that ignored them have faced justified backlash. But they are costs of implementation, not evidence that the underlying policy is wrong. A district that cannot afford additional buses is describing a budget problem, not a scientific one.

The relevant question is therefore not whether adolescents would learn better with more sleep. That is settled. The question is what a community is willing to rearrange in order to give them that sleep, and how honestly it is prepared to name the tradeoffs.`,
    questions: [
      ['literal', 'By approximately how much does the circadian rhythm shift during puberty?'],
      ['literal', 'What happened to teen crash rates in the Wyoming district cited?'],
      ['literal', 'Name two logistical objections raised by critics.'],
      ['inferential', 'Why does the author say the argument "rests on biology rather than discipline"?'],
      ['inferential', 'What does the author imply by calling a bus shortage "a budget problem, not a scientific one"?'],
      ['inferential', 'Why does the author acknowledge that the objections are "real costs"?'],
      ['inferential', 'What assumption must a reader accept for the author\'s conclusion to hold?'],
      ['analytical', 'Analyze how the author structures the argument. Why are the counterarguments placed where they are?'],
      ['analytical', 'Evaluate the strength of the evidence. Which claim is best supported, and which is weakest?'],
      ['analytical', 'The final paragraph reframes the debate. Explain what shift the author is making and why it is persuasive or not.'],
    ],
  },
  {
    grade: '7', version: 'B', lexile: '1010L',
    focus: 'Literary narrative, characterization, figurative language',
    title: 'What the River Kept',
    targets: ['silt', 'perpetual', 'submerged', 'inheritance', 'obstinate', 'sediment'],
    text: `Grandfather Okonjo had lived beside the river for sixty-one years, and he spoke about it the way other men spoke about a difficult relative: with exasperation, loyalty, and an unwillingness to leave.

"It took the north field in nineteen seventy-eight," he told Amara on her first morning back. "Took the fence, took the well cover, took a goat that had no business being down there. Gave the field back four years later. Better soil than before."

Amara had come from the city with a folder of paperwork and a plan she had rehearsed on the entire six-hour drive. The land was worth more than her grandfather could earn from it. A developer had offered a figure that would cover his medical costs for the rest of his life. She had numbers, projections, a page of arguments in a font small enough to look official.

She did not present any of it that first day. Instead she walked the property line with him, and he named things: the bend where his brother had drowned in 1962, the stand of trees his wife had planted the spring she was pregnant, the place where the bank had collapsed twice and been rebuilt three times.

By evening Amara understood that her folder answered a question nobody in the family had asked. Her grandfather knew exactly what the land was worth. He had simply never agreed that worth and price were the same word.

She stayed eleven days. When she finally drove back to the city, the folder was still in the trunk, unopened, its pages gone soft with river air.`,
    questions: [
      ['literal', 'How long has Grandfather Okonjo lived beside the river?'],
      ['literal', 'What offer did Amara bring with her?'],
      ['literal', 'What happened to the folder by the end of the story?'],
      ['inferential', 'Why does the author compare the river to "a difficult relative"?'],
      ['inferential', 'Why does Amara choose not to present her paperwork on the first day?'],
      ['inferential', 'What does the grandfather mean by distinguishing "worth" from "price"?'],
      ['inferential', 'Why does the author list the specific places the grandfather names?'],
      ['analytical', 'Analyze the final image of the pages "gone soft with river air." What does it convey?'],
      ['analytical', 'How does the author use the story of the north field in the second paragraph to prepare the reader for the ending?'],
      ['analytical', 'Whose perspective does the author want the reader to sympathize with, and what techniques create that effect?'],
    ],
  },
  {
    grade: '7', version: 'C', lexile: '1010L',
    focus: 'Scientific exposition, cause and effect, technical vocabulary',
    title: 'The Wolves and the Willows',
    targets: ['ecosystem', 'trophic', 'herbivore', 'regenerate', 'cascade', 'stabilize'],
    text: `When the last wolves were killed in Yellowstone National Park in 1926, the immediate result seemed straightforward: fewer predators meant more elk. What nobody predicted was that the disappearance of a single species would reshape the physical geography of the park.

Freed from the pressure of being hunted, elk stopped moving. Herds settled in river valleys, where the grazing was easy and the water was close, and they remained there season after season. Willow and aspen seedlings along the riverbanks were eaten before they could grow past knee height. Within decades, entire stretches of streambank stood bare.

Bare banks erode. Without root systems binding the soil, spring floods carved the channels wider and shallower. Water warmed in the sun, and cold-water fish declined. Beavers, which depend on willow both for food and for dam construction, nearly vanished from the northern range. Without beaver ponds, the water table dropped, and the wet meadows that had supported amphibians and songbirds dried out.

Wolves were reintroduced in 1995. Elk numbers fell, but the more important change was behavioral: elk no longer lingered in open valleys where they could be ambushed. They grazed and moved on.

Willows returned first, growing tall enough within a decade to shade the water again. Beavers followed the willows. Beaver dams slowed the current, rebuilt the water table, and recreated the ponds. Songbirds returned to the recovering thickets.

Ecologists call this pattern a trophic cascade: a change at the top of a food web that ripples downward through every level, eventually altering even the shape of the rivers. Yellowstone did not simply regain a predator. It regained a set of relationships that had been holding the landscape together all along.`,
    questions: [
      ['literal', 'In what year were wolves reintroduced to Yellowstone?'],
      ['literal', 'What two things do beavers need willow for?'],
      ['literal', 'What term do ecologists use for the pattern described?'],
      ['inferential', 'Why did the rivers become wider and shallower?'],
      ['inferential', 'Why does the author say the behavioral change in elk mattered more than the population change?'],
      ['inferential', 'Why did songbirds return only after the beavers did?'],
      ['inferential', 'What does the passage suggest about predicting the effects of removing a species?'],
      ['analytical', 'Explain how the author uses text structure to make a complex chain of causes understandable.'],
      ['analytical', 'The final sentence says the park "regained a set of relationships." Analyze why the author ends with that phrasing rather than simply saying wolves returned.'],
      ['analytical', 'Could this evidence be used to argue for predator reintroduction elsewhere? Identify what additional information a reader would need.'],
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    grade: '9', version: 'A', lexile: '1120L',
    focus: 'Argumentative text, rhetorical analysis, abstract reasoning',
    title: 'The Tyranny of the Measurable',
    targets: ['quantify', 'proxy', 'incentive', 'metric', 'distortion', 'accountability'],
    text: `In 1975, the British economist Charles Goodhart made an observation so durable that it now carries his name. When a measure becomes a target, he wrote, it ceases to be a good measure.

The logic is uncomfortable but difficult to escape. Institutions cannot manage what they cannot see, so they select indicators that stand in for the outcomes they actually care about. A hospital cannot directly measure health, so it measures readmission rates. A school cannot directly measure learning, so it measures test scores. A police department cannot measure public safety, so it counts reported crimes. Each of these numbers begins as a reasonable proxy.

The distortion arrives with the incentive. Once careers, budgets, and reputations attach to the indicator, the rational strategy is to improve the indicator rather than the underlying condition. Hospitals have been found delaying admissions past the window that would count as a readmission. Schools have narrowed instruction to tested subjects, quietly abandoning the arts. Departments have reclassified felonies as misdemeanors. In every case, the number improved while the reality it was meant to represent did not.

It would be convenient to conclude that measurement itself is the problem, and some critics do. That conclusion is too easy. Before standardized reporting, hospitals with catastrophic outcomes simply went unexamined, and schools that failed poor students did so invisibly. Measurement did not create these failures; it made them legible, and legibility is a precondition for reform.

The honest position is more demanding. Metrics are necessary and corruptible at the same time. An institution that takes this seriously does not abandon measurement, nor does it treat any single figure as the truth. It uses multiple indicators that are difficult to game simultaneously, it audits for manipulation, and it preserves human judgment as a check rather than surrendering to the authority of a number.

Goodhart did not argue that we should stop counting. He argued that we should stop believing our counts are innocent.`,
    questions: [
      ['literal', 'What is Goodhart\'s Law, as stated in the passage?'],
      ['literal', 'Give one example the author provides of an institution distorting its metric.'],
      ['literal', 'What three practices does the author recommend for institutions?'],
      ['literal', 'What does the author say measurement made possible before reform?'],
      ['inferential', 'Why does the author call each indicator "a reasonable proxy" at the outset?'],
      ['inferential', 'What does the author mean by saying measurement made failures "legible"?'],
      ['inferential', 'Why does the author reject the conclusion that measurement itself is the problem?'],
      ['inferential', 'What does the final sentence imply about the author\'s view of data?'],
      ['analytical', 'Analyze the author\'s use of parallel examples in paragraph two. What rhetorical effect does the repetition create?'],
      ['analytical', 'The author describes the honest position as "more demanding." Explain what makes it demanding and whether the passage justifies that claim.'],
      ['analytical', 'Identify a counterargument the author does not address and explain how it would weaken the argument.'],
      ['analytical', 'Evaluate the effectiveness of opening and closing with Goodhart. How does this framing shape the reader\'s response?'],
    ],
  },
  {
    grade: '9', version: 'B', lexile: '1120L',
    focus: 'Literary fiction, symbolism, narrative perspective',
    title: 'Inventory',
    targets: ['meticulous', 'obsolete', 'liquidation', 'provisional', 'irreconcilable', 'austerity'],
    text: `The hardware store had been closing for eleven months, which Teodoro considered a respectable pace for something that had taken forty years to build.

His father had opened it in 1981 with a loan from a man who never asked for collateral. The inventory system had been the same since: index cards in a wooden drawer, each one bearing a part number in his father's meticulous block capitals, updated in pencil so that decades of corrections layered over one another like sediment.

The liquidators wanted the cards digitized before the sale. Teodoro spent his evenings at the counter typing part numbers into a laptop, and it was slower than anyone had budgeted for, because he kept stopping to read.

Card 4417: a brass hinge, discontinued in 1994, last sold to the Mennonite school. Card 0982: galvanized nails, quantity adjusted eleven times in one year, which meant a construction crew had been in and out that summer. Card 6103, in handwriting that was not his father's but his own at fifteen, wobbling and too large.

There was no story on any card. That was, he decided, precisely the point. The cards recorded what had been needed and by whom, and forty years of that record amounted to something no narrative would have captured: not what the town had said about itself, but what it had actually gone out and bought.

When the last card was entered, the file was 3.2 megabytes. Teodoro looked at the number for a long time. Then he took the wooden drawer, which the liquidators had listed as fixture number nine, and carried it out to his car.`,
    questions: [
      ['literal', 'How long had the store been in the process of closing?'],
      ['literal', 'What system did the store use to track inventory?'],
      ['literal', 'What does Teodoro take with him at the end?'],
      ['literal', 'Whose handwriting appears on card 6103?'],
      ['inferential', 'Why does Teodoro\'s digitizing work take longer than budgeted?'],
      ['inferential', 'What can be inferred about the town from card 0982?'],
      ['inferential', 'Why does the author mention the file size of 3.2 megabytes?'],
      ['inferential', 'What does the detail about the loan "without collateral" suggest about the era the store began in?'],
      ['analytical', 'Analyze the simile comparing pencil corrections to sediment. What does it contribute to the story\'s meaning?'],
      ['analytical', 'Explain the significance of Teodoro\'s claim that "there was no story on any card. That was precisely the point."'],
      ['analytical', 'The wooden drawer is listed as "fixture number nine." Analyze the effect of this detail on the story\'s conclusion.'],
      ['analytical', 'Identify the central theme and explain how the author develops it through the inventory cards rather than through dialogue or action.'],
    ],
  },
  {
    grade: '9', version: 'C', lexile: '1120L',
    focus: 'Scientific and ethical exposition, competing claims',
    title: 'The Consent of the Cells',
    targets: ['immortalized', 'proliferate', 'posthumous', 'commercialization', 'jurisdiction', 'precedent'],
    text: `Henrietta Lacks entered Johns Hopkins Hospital in 1951 with cervical cancer. A surgeon removed a tissue sample without telling her, which was standard practice at the time and legal in every jurisdiction in the United States. She died that October at thirty-one.

Her cells did not. Unlike every previous human cell sample, which died within days in a laboratory dish, the cells labeled HeLa continued to divide indefinitely. Researchers had spent decades searching for such a line. Within two years, HeLa cells were being shipped worldwide, and they were used to develop the polio vaccine, to study the effects of radiation, and eventually to test nearly every major pharmaceutical compound of the twentieth century.

The Lacks family learned of this in 1973, twenty-two years later, when a scientist called seeking blood samples to help distinguish HeLa contamination in other cell lines. Several family members at the time could not afford health insurance.

The ethical questions have never resolved cleanly. Henrietta Lacks did not consent, but no framework for such consent existed. The physicians violated no law and, by the standards of their profession in 1951, no rule. The commercial value that emerged came not from the tissue itself, which had no market price when it was taken, but from decades of subsequent laboratory work.

Against this stands a plainer fact. A Black woman in a segregated ward supplied the biological foundation for an industry, and her descendants spent generations unable to access the medicine that industry produced.

Modern consent requirements exist largely because of this case. In 2013, the National Institutes of Health granted the Lacks family a role in reviewing access to the HeLa genome, an arrangement without precedent. It resolved almost nothing about the preceding sixty years, and both the family and the agency have said so.`,
    questions: [
      ['literal', 'In what year was the tissue sample taken, and what was unusual about the cells?'],
      ['literal', 'How did the Lacks family first learn about HeLa cells?'],
      ['literal', 'What arrangement did the NIH make in 2013?'],
      ['literal', 'Name two scientific uses of HeLa cells listed in the passage.'],
      ['inferential', 'Why does the author emphasize that the physicians "violated no law"?'],
      ['inferential', 'What is the significance of the detail that family members could not afford health insurance?'],
      ['inferential', 'Why does the author note that the tissue "had no market price when it was taken"?'],
      ['inferential', 'What does the phrase "resolved almost nothing" suggest about the author\'s view of the 2013 agreement?'],
      ['analytical', 'Analyze the function of the paragraph beginning "Against this stands a plainer fact." How does its style differ from the paragraph before it, and why?'],
      ['analytical', 'The author presents both a legal defense and a moral indictment. Evaluate whether the passage treats them as equally weighted.'],
      ['analytical', 'Explain how the author uses chronology to build the reader\'s judgment across the passage.'],
      ['analytical', 'Argue whether the 2013 arrangement constitutes justice, using evidence from the text to support your position.'],
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    grade: '10', version: 'A', lexile: '1180L',
    focus: 'Philosophical argument, abstract reasoning, concession and rebuttal',
    title: 'The Paradox of the Restored Painting',
    targets: ['authenticity', 'intervention', 'provenance', 'reversible', 'aesthetic', 'ontological'],
    text: `When conservators removed three centuries of yellowed varnish from the Sistine Chapel ceiling in the 1980s, the colors underneath were so vivid that a number of art historians publicly accused them of destroying Michelangelo.

The accusation sounds absurd until one examines its logic. For three hundred years, artists had studied and imitated a ceiling of muted earth tones. Entire schools of painting had been built on the assumption that Michelangelo worked in subdued color. The darkened surface was not merely dirt on a masterpiece; it had itself become the object that generations of viewers had experienced, argued about, and been changed by.

The conservators' reply was straightforward. Varnish is not paint. Their intervention removed material Michelangelo never applied and revealed material he did. If authenticity means anything, it means the artist's own pigment.

Both positions rest on an unstated definition, and the disagreement cannot be settled without exposing it. The conservators define the artwork as a physical object with an original state that can be recovered. The critics define it as something that exists in reception, accumulating meaning as it is seen, and therefore possessing no privileged moment to return to.

Neither definition is obviously wrong, and each carries costs. The first invites endless intervention in pursuit of an original that no living person has witnessed and that documentary evidence describes only imperfectly. The second makes conservation nearly impossible to justify, since any change to a surface is a change to the object of reception, and decay itself becomes part of the work.

Practicing conservators have largely resolved this in the only way available: procedurally rather than philosophically. The governing principle in the field is reversibility. Do what can be undone. It is not an answer to the question of what a painting fundamentally is. It is an admission that the question remains open, and that the responsible response to an unresolved question is to avoid making choices that foreclose it for everyone who comes after.`,
    questions: [
      ['literal', 'What did conservators remove from the Sistine Chapel ceiling?'],
      ['literal', 'What was the conservators\' central argument in reply to critics?'],
      ['literal', 'What is the governing principle in the conservation field, according to the passage?'],
      ['literal', 'What cost does the author assign to the critics\' definition?'],
      ['inferential', 'Why does the author say the accusation "sounds absurd until one examines its logic"?'],
      ['inferential', 'What does the author mean by "an unstated definition"?'],
      ['inferential', 'Why would decay become "part of the work" under the second definition?'],
      ['inferential', 'What does the author imply by calling the resolution "procedural rather than philosophical"?'],
      ['analytical', 'Analyze the author\'s structural choice to present both definitions before evaluating either.'],
      ['analytical', 'Evaluate whether the principle of reversibility genuinely resolves the dispute or merely postpones it.'],
      ['analytical', 'Explain how the phrase "foreclose it for everyone who comes after" reframes conservation as an ethical rather than technical practice.'],
      ['analytical', 'Apply the author\'s framework to a different case, such as restoring a historic building, and identify where the analogy holds and where it breaks.'],
    ],
  },
  {
    grade: '10', version: 'B', lexile: '1180L',
    focus: 'Literary fiction, unreliable perspective, irony',
    title: 'The Reference',
    targets: ['discretion', 'equivocate', 'ostensibly', 'insinuation', 'candor', 'scrupulous'],
    text: `Dr. Vance had written four hundred letters of recommendation in her career and considered herself scrupulous about all of them. She did not exaggerate. She did not inflate. Where a student was ordinary, she wrote a letter that was, in its own quiet way, ordinary, and she believed that this served everyone.

The letter for Nadia Okafor presented a difficulty she had not encountered before.

Nadia had done the best independent work Vance had supervised in nineteen years. She had also, in the second semester, filed a formal complaint about the department's handling of a harassment case, and the complaint had named a colleague who now sat on the fellowship committee.

Vance drafted the letter in the way she always did, beginning with the work. Three paragraphs on Nadia's methodology. A paragraph on her seminar contributions. Then, in the final paragraph, she wrote that Nadia had "shown an admirable willingness to raise institutional concerns," deleted it, wrote that Nadia was "not afraid of difficult conversations," deleted that, and finally wrote nothing at all about the complaint.

She told herself this was discretion. The complaint was not academic work and had no business in an academic letter.

She was aware, in a region of her mind she did not visit often, that a letter praising Nadia's courage would be read by a specific person on a specific committee, and that a letter omitting it would be read by no one as an omission.

The letter she submitted was, sentence by sentence, entirely true. Vance reread it twice before sending, looking for something she could name as dishonest, and did not find it. This did not produce the relief she expected.`,
    questions: [
      ['literal', 'How many recommendation letters has Dr. Vance written?'],
      ['literal', 'What two things had Nadia done that semester?'],
      ['literal', 'What did Vance ultimately include about the complaint?'],
      ['literal', 'How does Vance react after rereading the letter?'],
      ['inferential', 'Why does Vance draft and delete two different sentences?'],
      ['inferential', 'What does "a region of her mind she did not visit often" reveal about her self-awareness?'],
      ['inferential', 'Why would a letter omitting the complaint be "read by no one as an omission"?'],
      ['inferential', 'What is the significance of the final sentence about relief?'],
      ['analytical', 'Analyze the irony in Vance considering herself "scrupulous."'],
      ['analytical', 'Explain how the author distinguishes between a text that is true and a text that is honest.'],
      ['analytical', 'Evaluate the narrative perspective. How does close third-person limit or expand what the reader understands about Vance?'],
      ['analytical', 'Argue whether Vance\'s decision is a failure of courage, a defensible professional judgment, or both, using textual evidence.'],
    ],
  },
  {
    grade: '10', version: 'C', lexile: '1180L',
    focus: 'Historical analysis, competing interpretations, causation',
    title: 'Why the Canal Failed First in Panama',
    targets: ['epidemiology', 'attrition', 'topography', 'catastrophic', 'entrenched', 'reconceived'],
    text: `The French attempt to build a canal across Panama between 1881 and 1889 is usually described as a failure of engineering. The more accurate description is a failure of assumption.

Ferdinand de Lesseps had built Suez, and Suez had taught him that a canal was a trench. At Suez his crews had cut through flat desert at sea level for one hundred and twenty miles, and the principal obstacles had been sand and financing. He arrived in Panama committed to the same design and resistant to every argument for locks, including arguments from his own engineers, who pointed out that the isthmus contained a mountain range and a river that rose forty feet in a single storm.

Sea-level excavation in that topography required removing volumes of earth that exceeded anything then attempted. Rain undid the work seasonally, sending mudslides back into cuts that had taken months to open.

Yet the engineering difficulty alone did not end the project. Disease did. Yellow fever and malaria killed an estimated twenty-two thousand workers. The mechanism of transmission was unknown, and hospital beds in Colón stood in pans of water to keep ants away, which made the wards efficient mosquito nurseries. Physicians were, without knowing it, accelerating the epidemic they were treating.

The American project that succeeded after 1904 differed in exactly the two respects that had destroyed the French one. Engineers abandoned the sea-level plan and reconceived the canal as a system of locks lifting ships over the terrain rather than cutting through it. Simultaneously, William Gorgas conducted a mosquito eradication campaign based on findings that had not existed in 1881.

The lesson historians draw is not that the French were incompetent. It is that de Lesseps had succeeded before, and success at Suez supplied him with a model so entrenched that contradicting evidence in Panama read to him as an obstacle rather than as information.`,
    questions: [
      ['literal', 'What design did de Lesseps insist on for the Panama canal?'],
      ['literal', 'Approximately how many workers died of disease?'],
      ['literal', 'What two changes did the American project make?'],
      ['literal', 'Why did hospital beds stand in pans of water?'],
      ['inferential', 'Why does the author call this "a failure of assumption" rather than engineering?'],
      ['inferential', 'What does the detail about hospital wards illustrate beyond the specific error?'],
      ['inferential', 'Why does the author mention that Suez required cutting through flat desert?'],
      ['inferential', 'What does the final sentence suggest about the danger of prior success?'],
      ['analytical', 'Analyze how the author uses the comparison between Suez and Panama to structure the entire argument.'],
      ['analytical', 'The author identifies two causes of failure. Evaluate whether the passage treats them as independent or connected.'],
      ['analytical', 'Explain the significance of the phrase "read to him as an obstacle rather than as information."'],
      ['analytical', 'Assess the historians\' lesson stated at the end. Does the evidence in the passage fully support it?'],
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    grade: '11', version: 'A', lexile: '1250L',
    focus: 'Dense argumentation, rhetorical structure, epistemology',
    title: 'The Replication Problem',
    targets: ['methodology', 'statistically significant', 'publication bias', 'falsifiable', 'systemic', 'incentive structure'],
    text: `Between 2011 and 2015, a series of large collaborative projects attempted something the sciences had rarely bothered to do: repeat published experiments to see whether the results held. In psychology, roughly forty percent of replicated studies produced results consistent with the originals. In preclinical cancer biology, one industrial laboratory reported successfully reproducing six of fifty-three landmark findings.

The immediate public interpretation was fraud, and this interpretation is almost entirely wrong. Deliberate fabrication exists, but it is rare and does not scale to numbers like these. What the replication projects exposed was not dishonesty but a set of ordinary practices, each individually defensible, whose combined effect was to fill the literature with findings that were never solid.

Consider the mechanics. A researcher collects data and finds no effect at the conventional threshold of statistical significance. She excludes two outlying subjects, which is a standard and often correct decision. She analyzes a subgroup, which is legitimate exploratory work. She adds twenty participants and reruns the test, which seems like diligence. Any one of these moves is defensible in isolation. Performed sequentially in pursuit of a threshold, they constitute a search through the space of possible analyses until one produces a publishable number.

Publication bias completes the mechanism. Journals have historically declined null results, so the studies that fail to find an effect never enter the record. A literature assembled from positive findings alone will appear to demonstrate an effect even when the underlying reality contains none.

Note that no individual in this chain behaves corruptly. The researcher wants tenure. The journal wants citations. The university wants grants. The incentive structure rewards novelty and penalizes the unglamorous work of confirmation, and each participant responds rationally to the incentives they face.

This is why proposed remedies focus on structure rather than character. Preregistration commits researchers to an analysis plan before seeing data. Registered reports secure publication based on methodology rather than outcome. Neither reform assumes scientists will become more virtuous. Both assume they will continue behaving as they always have, and change what that behavior produces.`,
    questions: [
      ['literal', 'What proportion of psychology studies replicated successfully?'],
      ['literal', 'Name the four analytic moves described in the third paragraph.'],
      ['literal', 'What are the two structural reforms named at the end?'],
      ['literal', 'What does publication bias do to the scientific record?'],
      ['inferential', 'Why does the author insist the fraud interpretation is "almost entirely wrong"?'],
      ['inferential', 'Why does the author stress that each analytic move is "defensible in isolation"?'],
      ['inferential', 'What does the author imply about the relationship between individual ethics and systemic outcomes?'],
      ['inferential', 'Why would reforms that do not assume virtue be more likely to succeed?'],
      ['analytical', 'Analyze the rhetorical purpose of walking the reader step by step through the researcher\'s decisions.'],
      ['analytical', 'Evaluate the claim that "no individual in this chain behaves corruptly." Does the passage fully establish it?'],
      ['analytical', 'Explain how the author uses the distinction between character and structure to organize the argument and to preempt objections.'],
      ['analytical', 'Assess what a reader would need to know to judge whether preregistration actually addresses the mechanism described.'],
    ],
  },
  {
    grade: '11', version: 'B', lexile: '1250L',
    focus: 'Literary analysis, voice, ambiguity, extended metaphor',
    title: 'Cartography',
    targets: ['fidelity', 'palimpsest', 'omission', 'delineate', 'ambiguity', 'ostensible'],
    text: `My mother drew maps for the state survey office for thirty-one years, and the first thing she taught me about maps is that they lie by necessity.

A map that reproduced every feature of the territory at full fidelity would be the same size as the territory and therefore useless. The cartographer's real work is subtraction: deciding which of the infinite available facts about a place deserve to appear, and then arranging those facts so that a stranger can find her way. Every map is an argument about what matters, printed in a form that conceals the arguing.

She showed me this once with two official maps of the same county, published eleven years apart. On the earlier sheet, a cluster of houses along the river was named. On the later one it was not. Nothing had burned down. The families had moved out when the plant closed, the post office had shut, and the state's naming criteria required a functioning postal address. The place still existed. It had simply fallen below the threshold at which the state was willing to say so.

I asked her whether that bothered her, and she said something I have thought about for twenty years. She said the criteria were reasonable, that some threshold was necessary, that no map can name everything, and that she had drawn the second sheet herself.

She did not say she regretted it and she did not say she did not.

I have her drafting table now. On the underside, where no client would ever look, she penciled the names of nine places the state had stopped recognizing, in her small even hand, with the dates. She never mentioned it to me. I found it while moving the table into a truck, upside down, reading a list that was never meant to correct any map and was never meant to be published, and that exists for no reason at all except that someone who knew better than anyone what a map leaves out could not quite leave them out.`,
    questions: [
      ['literal', 'What was the narrator\'s mother\'s profession?'],
      ['literal', 'Why did the river settlement lose its name on the later map?'],
      ['literal', 'What did the narrator find on the underside of the drafting table?'],
      ['literal', 'How does the mother respond when asked whether the omission bothered her?'],
      ['inferential', 'What does the claim that maps "lie by necessity" mean in context?'],
      ['inferential', 'Why does the author note that the mother "had drawn the second sheet herself"?'],
      ['inferential', 'What is the significance of the sentence "She did not say she regretted it and she did not say she did not"?'],
      ['inferential', 'Why does the narrator emphasize that the list "was never meant to be published"?'],
      ['analytical', 'Analyze the extended metaphor of cartography. What does the essay use maps to argue about beyond geography?'],
      ['analytical', 'Explain how the author uses ambiguity in the mother\'s characterization rather than resolving her position.'],
      ['analytical', 'Analyze the syntax of the final sentence. How does its length and construction serve the essay\'s meaning?'],
      ['analytical', 'Evaluate the claim that "every map is an argument about what matters, printed in a form that conceals the arguing," and apply it to another form of representation.'],
    ],
  },
  {
    grade: '11', version: 'C', lexile: '1250L',
    focus: 'Legal and civic reasoning, precedent, competing principles',
    title: 'The Standing Problem',
    targets: ['justiciable', 'redressability', 'adjudicate', 'diffuse', 'doctrine', 'plaintiff'],
    text: `American courts do not answer questions. They resolve disputes between parties, and the difference is more consequential than it appears.

To bring a case in federal court, a plaintiff must demonstrate standing: a concrete injury, traceable to the defendant's conduct, that a court can actually redress. The doctrine has a defensible foundation. Courts are not legislatures; a system permitting anyone to sue over any policy they disliked would convert judges into an unelected upper chamber and would flood the docket with grievances better addressed through voting.

The difficulty emerges when harm is real, severe, and widely distributed. Consider a pollutant that raises cancer risk marginally across ten million people. The aggregate harm is enormous. No single plaintiff, however, can demonstrate that her particular illness is traceable to that particular source rather than to the dozens of other exposures in an ordinary life. The injury is diffuse, and diffuseness is precisely what the standing doctrine screens out.

The result is a category of harm that is simultaneously the most significant and the least adjudicable. Climate litigation has repeatedly foundered on exactly this point: plaintiffs describe injuries that are certain in the aggregate and unprovable in the individual, and courts dismiss without ever reaching the merits.

Defenders of the doctrine make a serious response. A court that relaxed standing to accommodate diffuse harm would be selecting which diffuse harms merit attention, and it would be doing so without any principle for the selection and without electoral accountability for the choice. Congress can create statutory standing whenever it wishes. That it has often declined to do so is a political fact, and the judiciary is not the correct remedy for political failure.

This response is coherent, and it is also a description of a system in which certain categories of harm have no forum. Both statements can be true at once. Recognizing that they are is the beginning of serious argument about the doctrine rather than a conclusion to it.`,
    questions: [
      ['literal', 'What three elements must a plaintiff demonstrate to establish standing?'],
      ['literal', 'Why does the passage say a system without standing requirements would be problematic?'],
      ['literal', 'What example of diffuse harm does the author provide?'],
      ['literal', 'What alternative remedy do defenders of the doctrine point to?'],
      ['inferential', 'Why does the author open by distinguishing answering questions from resolving disputes?'],
      ['inferential', 'What does "unprovable in the individual" reveal about the mismatch between science and litigation?'],
      ['inferential', 'Why does the author call the defenders\' response "serious" rather than dismissing it?'],
      ['inferential', 'What does the author imply about congressional inaction?'],
      ['analytical', 'Analyze how the author constructs the argument so that neither side can be adopted wholesale.'],
      ['analytical', 'Evaluate the final paragraph. Is refusing to resolve the tension a strength or an evasion in an argumentative essay?'],
      ['analytical', 'Explain the significance of the phrase "the most significant and the least adjudicable" to the passage\'s central claim.'],
      ['analytical', 'Construct the strongest counterargument to the defenders\' position that the passage does not itself make.'],
    ],
  },

  // ------------------------------------------------------------------ 12
  {
    grade: '12', version: 'A', lexile: '1330L',
    focus: 'College-level exposition, theoretical abstraction, synthesis',
    title: 'The Limits of Translation',
    targets: ['semantic', 'untranslatable', 'connotation', 'equivalence', 'linguistic relativity', 'discursive'],
    text: `The claim that certain words are untranslatable is popular, sentimental, and mostly false. Any concept expressible in one language can be conveyed in another, given sufficient words. What cannot be preserved is compression.

The Portuguese saudade is routinely offered as an example of untranslatability. It is not. An English speaker can be told that saudade names a longing for something absent, colored by the awareness that its return is unlikely and by a certain pleasure taken in the longing itself. The explanation succeeds. What fails is economy: Portuguese does this in three syllables, and a three-syllable word is available for use in ordinary sentences in a way a forty-word gloss is not.

This distinction matters because compression is not a stylistic convenience. A concept that can be invoked in a single word can be thought quickly, deployed in argument, taught to children, and built upon. A concept requiring a paragraph is available in principle and unavailable in practice. Languages therefore do not differ in what they can express; they differ in what they make cheap to express, and cheapness governs use.

Benjamin Whorf's strong hypothesis, that language determines the boundaries of thought, has not survived experimental testing. Speakers of languages without dedicated number words above three can nonetheless reason about larger quantities when given tools. But the weaker version is difficult to dislodge. Russian marks light and dark blue with separate basic terms, and Russian speakers discriminate between those shades measurably faster than English speakers in timed tasks. The category does not create the perceptual capacity. It reduces the cost of accessing it.

The implication for translation is uncomfortable for anyone who wants a clean theory. A translator producing a faithful rendering has not failed when the target-language version is longer, but she has changed something structural: what was a single move in the original has become an argument in the translation, and arguments can be disputed in ways that words cannot.

Fidelity of meaning and fidelity of function are different objectives, and no translation achieves both.`,
    questions: [
      ['literal', 'What does the author say is actually lost in translation, if not meaning?'],
      ['literal', 'What example does the author give from Russian?'],
      ['literal', 'What is Whorf\'s strong hypothesis, and what is its status?'],
      ['literal', 'What two objectives does the author say cannot both be achieved?'],
      ['inferential', 'Why does the author call the untranslatability claim "sentimental"?'],
      ['inferential', 'What does the author mean by saying "cheapness governs use"?'],
      ['inferential', 'Why is a concept requiring a paragraph "available in principle and unavailable in practice"?'],
      ['inferential', 'What is the significance of the observation that arguments "can be disputed in ways that words cannot"?'],
      ['analytical', 'Analyze how the author uses the saudade example to reframe rather than refute the popular claim.'],
      ['analytical', 'Evaluate the author\'s handling of Whorf. Does distinguishing strong and weak versions strengthen or weaken the overall argument?'],
      ['analytical', 'Explain the theoretical work performed by the concept of "compression" throughout the passage.'],
      ['analytical', 'Assess the closing claim. Is it a conclusion supported by the preceding argument, or a broader assertion the passage has not fully earned?'],
    ],
  },
  {
    grade: '12', version: 'B', lexile: '1330L',
    focus: 'Literary fiction, structural irony, moral complexity',
    title: 'The Witness Room',
    targets: ['deposition', 'attenuate', 'culpability', 'exculpatory', 'inexorable', 'circumspect'],
    text: `The deposition ran nine hours, and for eight of them Adaeze Nwosu answered questions about a spreadsheet.

She had built it in 2019, in her second year at the firm, at the request of a director who wanted to model how a proposed fee change would affect customers across income brackets. The model was accurate. It showed, in a cell she had formatted in plain black text like every other cell, that the lowest bracket would absorb sixty-one percent of the increase.

The opposing counsel walked her through the file column by column. He established that she had built it, that she understood it, that she had sent it to four people, and that the fee change had proceeded eleven weeks later without modification.

Then he asked whether she had raised a concern.

She had. In a meeting, verbally, and she had been told the analysis was preliminary. She had not written it down, because writing it down would have created a document, and by her second year she understood without ever having been told that the firm's culture treated written objections as liabilities rather than as contributions.

On the record, she said: "I raised it verbally."

He asked whether there was any contemporaneous documentation of her having raised it.

There was not.

She watched him decide not to press further, and she understood the calculation exactly. An undocumented objection was worth less to his case than no objection at all, because it introduced a fact he would have to explain. He moved to the next exhibit.

Adaeze answered questions for another forty minutes. She had told the truth in every response, including that one, and she left the building at seven-forty with the clear sense of having participated in something, though she could not have said, then or later, precisely what.`,
    questions: [
      ['literal', 'What did the spreadsheet demonstrate?'],
      ['literal', 'How did Adaeze raise her concern, and what was the response?'],
      ['literal', 'Why did Adaeze not document her objection in writing?'],
      ['literal', 'Why does opposing counsel decline to press the point?'],
      ['inferential', 'What is the significance of the detail that the crucial figure was "formatted in plain black text like every other cell"?'],
      ['inferential', 'What does "without ever having been told" reveal about how the firm\'s norms operated?'],
      ['inferential', 'Why does the passage state that an undocumented objection "was worth less than no objection at all"?'],
      ['inferential', 'What does the final clause suggest about Adaeze\'s moral position?'],
      ['analytical', 'Analyze the irony that telling the truth produces no consequence in this scene.'],
      ['analytical', 'Explain how the author uses the mechanics of a legal deposition as a structural device for exploring complicity.'],
      ['analytical', 'Evaluate Adaeze\'s culpability using evidence from the text, addressing the strongest case both for and against her.'],
      ['analytical', 'Analyze the author\'s decision to end with an inability to name what occurred. What does this achieve that an explicit judgment would not?'],
    ],
  },
  {
    grade: '12', version: 'C', lexile: '1330L',
    focus: 'Interdisciplinary synthesis, statistical reasoning, policy critique',
    title: 'Base Rates and the Screening Trap',
    targets: ['prevalence', 'specificity', 'false positive', 'predictive value', 'stratified', 'intervention'],
    text: `Suppose a screening test for a condition is ninety-nine percent accurate, and suppose the condition affects one person in ten thousand. A patient tests positive. What is the probability that she has the condition?

The intuitive answer is ninety-nine percent. The correct answer is approximately one percent, and the gap between those figures has driven decades of costly policy error.

The arithmetic is not difficult. Screen a million people. One hundred of them have the condition, and the test correctly identifies ninety-nine. The remaining 999,900 do not, and the test wrongly flags one percent of them, which is 9,999 people. Among the 10,098 positive results, ninety-nine are accurate. The test's accuracy has not changed; what dominates the outcome is the rarity of the condition in the screened population.

This is not a curiosity. Universal screening programs for rare conditions reliably generate false positives outnumbering true ones by orders of magnitude, and false positives are not costless. They produce invasive confirmatory procedures with their own complication rates, treatment of conditions that would never have progressed, and psychological harm that persists in some patients after the all-clear. Mass screening for neuroblastoma in infants was discontinued in Japan and Germany after trials demonstrated it detected many tumors that would have regressed on their own while producing no reduction in mortality.

Advocates of universal screening are not innumerate, and their counterargument deserves engagement. The costs of false positives are distributed across many people in small amounts, while the cost of a missed case falls catastrophically on one. This is a genuine ethical asymmetry, not a mathematical error, and reasonable people weigh distributed harm against concentrated harm differently.

But the asymmetry argument does not license ignoring base rates; it requires incorporating them. The productive response is stratification: screen populations where prevalence is high enough that predictive value becomes meaningful, and forgo universal application. This satisfies neither the advocate who wants every person tested nor the critic who wants the program eliminated, which is generally what a defensible answer to a problem of this shape looks like.`,
    questions: [
      ['literal', 'What is the correct probability in the opening scenario?'],
      ['literal', 'How many false positives arise in the million-person example?'],
      ['literal', 'What happened with neuroblastoma screening in Japan and Germany?'],
      ['literal', 'What approach does the author ultimately recommend?'],
      ['inferential', 'Why does the rarity of the condition dominate the result more than the test\'s accuracy?'],
      ['inferential', 'Why does the author insist that advocates of screening "are not innumerate"?'],
      ['inferential', 'What distinguishes an ethical asymmetry from a mathematical error in this argument?'],
      ['inferential', 'What does the author suggest about answers that satisfy no one?'],
      ['analytical', 'Analyze the rhetorical effect of opening with a question and an incorrect intuitive answer.'],
      ['analytical', 'Evaluate whether the neuroblastoma example is sufficient evidence for the general claim about universal screening.'],
      ['analytical', 'Explain how the author integrates quantitative reasoning with ethical reasoning rather than treating them as separate arguments.'],
      ['analytical', 'Assess the concluding claim about what "a defensible answer to a problem of this shape looks like." Is this a principled standard or a rhetorical move?'],
    ],
  },
];
