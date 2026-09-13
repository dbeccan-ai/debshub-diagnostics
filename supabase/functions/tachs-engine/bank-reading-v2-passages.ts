// Reading v2 — ten original passages (300–450 words) written for the D.E.Bs pilot.
// Literary (3), historical/biographical with fictional figures (2), informational (3), argumentative (1), paired (1).
export interface ReadingPassage { id: string; title: string; kind: "literary" | "historical" | "informational" | "argumentative" | "paired"; text: string }

export const R2_P1: ReadingPassage = {
  id: "r2-orchard", title: "The Orchard Ledger", kind: "literary",
  text: `When my grandmother finally agreed to sell the orchard, she insisted on one condition: the ledger stayed with the family. It was an unremarkable object, a cloth-bound book swollen with decades of damp, its spine mended so many times that the tape had become a kind of second binding. Inside, in four different hands, were the harvests of seventy-one years, recorded not in pounds or bushels but in the private units my great-grandfather had invented: "a fair morning," "two wagons and a grievance," "enough."

The buyer, a polite man from a company that grew apples the way other companies grew spreadsheets, examined the ledger with the tolerant expression adults reserve for children's drawings. He asked, ostensibly out of curiosity, whether the family had kept any actual yield data. My grandmother said that she had just shown it to him.

I was seventeen and impatient with both of them. I wanted the sale finished, the trucks gone, the long silences at dinner replaced with something—anything—that resembled a future. Yet that night, unable to sleep, I took the ledger down and read it the way one reads a letter not addressed to oneself, guiltily and all at once.

What struck me was not the sentiment but the precision. "Two wagons and a grievance" appeared in 1954, the year, my mother later confirmed, that a neighbor had disputed the property line. "Enough" recurred in every year that a child was born. My great-grandfather had not been vague; he had been recording what the orchard was for. The trees were the means. The ledger was the harvest.

In the morning my grandmother found me asleep at the kitchen table, the book open beneath my arm. She did not scold me. She poured two cups of coffee, sat down across from me, and asked which year I had gotten to. When I told her, she nodded as though I had passed some examination whose existence she had been too scrupulous to mention, and began to explain, page by page, what the trees had meant.`,
};

export const R2_P2: ReadingPassage = {
  id: "r2-relay", title: "The Fourth Leg", kind: "literary",
  text: `Coach Ferreira never announced the relay order until the morning of a meet, a policy she defended as tactical and everyone else understood as theatrical. So when she posted the sheet outside the locker room and Devi saw her own name beside the anchor leg, her first reaction was not pride but a swift, cold inventory of everyone faster than she was.

There were three of them. Two were injured. The third, Marisol, had run the anchor for two seasons and was standing beside Devi reading the same sheet with an expression Devi could not decode—not anger exactly, but a kind of careful blankness, the face of someone deciding what to feel.

"She wants you to learn the exchange under pressure," Marisol said finally. "It's not about who's fastest. It never was." Devi wanted to believe this was generosity. It was equally possible that it was a diagnosis.

The exchange was the problem. On a straight sprint Devi could hold her own; it was the eleven meters of the passing zone that undid her, the moment when she had to accelerate blind, trusting a teammate she could not see to arrive with the baton before the zone ran out. In practice she started too early and left her teammate stranded, or too late and lost the entire margin the first three legs had built. "You keep looking back," Ferreira told her. "Looking back is a way of running the other person's leg. Run yours."

At the meet, waiting in the zone, Devi heard the crowd rise as the third leg came off the curve. Every instinct told her to turn. Instead she fixed her eyes on the mark she had chalked on the track, counted the footfalls the way Marisol had shown her, and went. For one terrible stride her hand closed on nothing. Then the baton struck her palm with a slap that stung all the way to the elbow, and she was gone.

They finished second. In the stands, she would learn later, Marisol had been on her feet before the exchange was complete—not cheering, exactly, but counting, her lips moving in time with Devi's steps.`,
};

export const R2_P3: ReadingPassage = {
  id: "r2-clockmaker", title: "The Clockmaker's Apprentice", kind: "literary",
  text: `The clockmaker, Mr. Adeyemi, did not believe in explaining. He believed in watching, and he expected his apprentice to believe in it too. For the first month Tomas was permitted to do nothing but observe: the way the old man's hands moved over a disassembled movement as if greeting each gear individually, the way he tilted his head at a ticking escapement like a doctor listening to a chest.

Tomas found this maddening. He had read the manuals. He knew the names of the parts and the ratios of the trains. He could have reassembled the carriage clock on the bench in half the time it took Mr. Adeyemi, who paused, endlessly, over decisions that Tomas considered self-evident.

In the second month the old man handed him a mantel clock that ran fast—eleven minutes a day, its owner complained—and said, "Tell me why." Tomas adjusted the regulator, as the manuals prescribed, and the clock ran nine minutes fast. He cleaned the movement. Eight. He replaced the mainspring, which was, he was certain, tired. Eight and a half.

By the third week his certainty had thinned into something more tenuous. He began, without quite deciding to, to watch the clock rather than to fix it. He noticed that it gained most in the afternoon, when sunlight through the shop window fell across the bench. He noticed that the pendulum's suspension spring had been replaced once before, with a slightly thicker piece than the original. He noticed that the case, when the shop warmed, gave a faint creak.

When he finally brought the clock to Mr. Adeyemi, he did not bring a repair. He brought a list. The old man read it slowly, his eyebrows lifting a fraction at the note about the sunlight.

"And so?" he said.

"And so I don't know yet," Tomas admitted. "But I know where to look."

Mr. Adeyemi set the list down and, for the first time since Tomas had entered the shop, pulled a second stool up to the bench. "Good," he said. "Now we can begin."`,
};

export const R2_P4: ReadingPassage = {
  id: "r2-bridge", title: "The Bridge at Harrow Ford", kind: "historical",
  text: `In the spring of 1889 the town council of Harrow Ford, a river settlement of some four thousand people, faced a decision that would define it for a century. The wooden bridge that connected the mill district to the market square had been condemned. Two proposals lay before the council: a conventional timber replacement, which could be built in a single season by local carpenters, or an iron truss bridge designed by a young engineer named Cordelia Vance, who had never before overseen a project of such scale.

Vance's design was, by the standards of the day, audacious. It called for a single span of one hundred and forty feet, eliminating the mid-river pier that had trapped ice floes every winter and, on three occasions, sent the old bridge's timbers downstream. It also cost nearly three times as much. The minutes of the council meetings, preserved in the town archive, record the debate in unusually candid language. One member called the design "an ornament we cannot afford." Another replied that the town had already paid for three bridges and might reasonably prefer to pay for one.

What tipped the decision, according to the minutes, was neither engineering nor economy but a letter. A mill owner named Josiah Penhallow, whose warehouses had flooded twice when ice dammed against the old pier, wrote to the council offering to guarantee a loan for the difference. His motive was not entirely civic; he stood to save more in damages than he risked in interest. But the offer reframed the question. The iron bridge was no longer an indulgence. It was insurance.

Construction took nineteen months rather than the promised twelve, and Vance's correspondence from the period reveals a woman under extraordinary pressure. Suppliers delayed shipments. A foreman quit. A local newspaper published a caricature of the half-finished span sagging into the river. Vance's reply, printed the following week, consisted of a single sentence: the drawing, she observed, had placed the sag in the wrong location.

The bridge opened in November 1890. It carried traffic, including, eventually, automobiles for which it had never been designed, until 1987, when it was retired to pedestrian use. It stands today, painted the same iron-oxide red Vance specified, and the mid-river pier it replaced has never been rebuilt.`,
};

export const R2_P5: ReadingPassage = {
  id: "r2-cartographer", title: "Mapping the Unseen Coast", kind: "historical",
  text: `The surveyor Elias Marrow spent eleven years charting a coastline that, by the time he finished, had partly ceased to exist. Between 1846 and 1857 he mapped the estuaries and barrier islands of a low, shifting shore where storms regularly opened new inlets and closed old ones. His superiors in the coastal survey considered the assignment a form of exile. Marrow, judging from his journals, considered it the most interesting problem he had ever been given.

The difficulty was not measurement. Marrow was a meticulous observer, and his triangulation was, by later assessment, accurate to within a few yards. The difficulty was that accuracy and usefulness had come apart. A chart that faithfully recorded the inlets of 1848 might guide a captain onto a sandbar in 1851. Marrow's predecessors had responded by publishing charts anyway and appending warnings. Marrow refused.

Instead he devised a system that his colleagues found eccentric and that modern cartographers regard as prescient. Rather than drawing a single coastline, he drew several, layered in different inks, each dated. Where an inlet had migrated, the chart showed its path as a series of ghostly outlines, so that a navigator could see not only where the channel was but where it was going. He annotated the margins with the rate of change he had observed—"east, roughly forty yards each year"—and with frank admissions of uncertainty.

The survey office initially declined to publish the charts, objecting that they were "confusing to the ordinary mariner." Marrow's response, preserved in the office's files, is worth quoting for its restraint. The ordinary mariner, he wrote, was already confused; the question was whether the chart would admit it. After two shipwrecks on a bar that the official chart showed as open water, the office relented.

Marrow's charts were used for three decades. What is more remarkable is their afterlife. In the twentieth century, geologists studying shoreline migration found in his layered outlines a record of coastal change more detailed than any other source for the period. He had set out to make a map that would remain useful. He had, almost incidentally, made a history.`,
};

export const R2_P6: ReadingPassage = {
  id: "r2-permafrost", title: "The Ground That Remembers", kind: "informational",
  text: `Permafrost is defined simply—ground that remains at or below freezing for at least two consecutive years—but the simplicity of the definition conceals an extraordinarily complex system. In the far north, permafrost can extend hundreds of meters below the surface and has, in places, remained frozen since the last ice age. Locked within it are the remains of ancient plants and animals, preserved not by any special chemistry but by cold, which slows the microbes that would otherwise decompose them.

That preservation is now a liability. As air temperatures in the Arctic rise, the upper layers of permafrost thaw for longer periods each summer, and the microbes resume work that was interrupted, in some cases, tens of thousands of years ago. As they consume the thawed organic matter, they release carbon dioxide and methane. Scientists estimate that northern permafrost holds roughly twice as much carbon as the atmosphere currently contains. Even a modest fraction of that, released over decades, would meaningfully accelerate warming, which would thaw more permafrost—a feedback loop that researchers describe with unusual bluntness as self-reinforcing.

The effects are not confined to the atmosphere. Permafrost is, for the communities built on it, foundation. When it thaws, the ground does not simply soften; it can slump, crack, and in some cases collapse into sinkholes known as thermokarst. Roads buckle. Pipelines shift. Buildings that stood level for fifty years develop tilts that no amount of shimming can correct. In several northern towns, engineers now cool the ground deliberately, installing passive devices called thermosiphons that draw heat out of the soil in winter and store the cold for summer.

Researchers are careful to distinguish between what they know and what they infer. The carbon inventory is well established. The rate at which it will be released is not, because it depends on variables—soil moisture, plant regrowth, the balance between carbon dioxide and the far more potent methane—that vary enormously from one valley to the next. What is not in dispute is the direction of change. The ground is remembering, and what it remembers is warmth.`,
};

export const R2_P7: ReadingPassage = {
  id: "r2-sleep", title: "Why the Brain Rehearses at Night", kind: "informational",
  text: `For most of the twentieth century, sleep was regarded by many scientists as a kind of biological idling—a period in which the brain, having exhausted its daytime resources, did little more than wait. That view has been thoroughly overturned. The sleeping brain, it turns out, is not idle but busy, and one of its principal tasks is replaying the day.

The evidence comes largely from recordings of individual neurons in the hippocampus, a structure deep in the brain that is essential for forming new memories. When a rat learns to navigate a maze, particular hippocampal cells fire in sequence as it passes particular locations. During sleep the same cells fire in the same order, but compressed, as though the brain were running the route at high speed. Researchers call this replay, and they have since observed analogous patterns in human studies using less direct methods.

Replay appears to serve at least two functions. The first is consolidation: by reactivating a fresh memory, the brain strengthens the connections that encode it and gradually transfers it from the hippocampus, which has limited capacity, to the cortex, which does not. Participants who sleep after learning a list of word pairs typically recall more of them the next day than participants who stay awake for the same interval, and the improvement correlates with the amount of deep, slow-wave sleep they obtain.

The second function is more surprising. Replay is not a faithful recording. The brain preferentially rehearses experiences that were rewarded, emotionally charged, or flagged as important, and it sometimes replays sequences in reverse or recombines fragments of separate experiences. Some researchers interpret this as a form of offline problem-solving, in which the brain explores connections it did not have time to examine while awake. The evidence for that interpretation is suggestive rather than conclusive, and the field remains appropriately cautious.

What is no longer in doubt is that sleep is part of learning rather than a pause from it. A student who studies until two in the morning and rises at six has not gained four hours; she has traded the rehearsal for the reading.`,
};

export const R2_P8: ReadingPassage = {
  id: "r2-glass", title: "The Ubiquitous Stranger", kind: "informational",
  text: `Glass is so pervasive that it has become nearly invisible. We look through it, drink from it, and carry it in our pockets, yet few people could say what it is—and the honest answer is that scientists have argued about it for a century. Glass is neither a conventional solid nor a liquid. It is an amorphous solid: rigid like a crystal, but with atoms arranged in the disordered jumble characteristic of a liquid, frozen in place before they could line up.

The persistent myth that old window panes are thicker at the bottom because glass "flows" over centuries illustrates how a plausible explanation can outlive its evidence. Medieval panes were uneven because the techniques for making flat glass were imperfect, and glaziers, sensibly, tended to install the heavy edge downward. Calculations of the actual flow rate of glass at room temperature yield times far longer than the age of the universe. The panes are not sagging. They were never level.

What makes glass useful is precisely its lack of internal structure. A crystal has planes along which it will cleave and grain boundaries that scatter light; glass has neither, which is why it can be transparent, why it can be drawn into fibers thinner than a hair, and why it can be shaped, while hot, into almost any form. The same disorder makes it brittle. Without an orderly lattice to redistribute stress, a tiny surface scratch can concentrate force until the material fails all at once.

Modern glassmakers exploit this understanding rather than fighting it. Tempered glass is cooled rapidly so that its surface is squeezed into compression, which must be overcome before any crack can open—and which is why, when it does break, it shatters into blunt fragments rather than shards. Chemically strengthened glass, the kind in most phone screens, achieves a similar compression by swapping small ions near the surface for larger ones that jam the structure tighter.

Glass, in other words, is a material we have learned to use far better than we have learned to define. That is not as unusual as it sounds. Much of engineering consists of being reliably right about things we cannot yet fully explain.`,
};

export const R2_P9: ReadingPassage = {
  id: "r2-homework", title: "The Case Against the Late Bell", kind: "argumentative",
  text: `Every few years a school board somewhere proposes moving the start of the high school day later, and every few years the proposal is defeated by the same coalition of bus schedules, athletic calendars, and adults who rose early in their youth and regard the experience as formative. It is time to stop treating this as a question of preference. The evidence is settled, and the cost of ignoring it falls on the people least able to object.

Adolescents are not merely reluctant to wake early; they are biologically disinclined to. During puberty the timing of the body's sleep signals shifts later by roughly two hours, so that a sixteen-year-old told to sleep at ten o'clock is in approximately the position of an adult told to sleep at eight. A seven-thirty first bell, which requires most students to wake before six-thirty, therefore guarantees that a majority of them arrive at school chronically short of sleep. This is not a matter of discipline. One cannot be disciplined into a different circadian rhythm any more than one can be disciplined into a different height.

The consequences are measurable. Districts that have moved start times to eight-thirty or later report higher attendance, fewer tardies, improved grades in first-period classes, and—most strikingly—reductions in teen car accidents on the order of fifteen to twenty percent. Opponents rarely dispute these figures. Instead they change the subject to logistics: buses would need to be rerouted, practices rescheduled, after-school jobs shifted. These are real difficulties. They are also, without exception, difficulties that other districts have solved.

The most revealing objection is the one made least often aloud: that a later start would coddle students who ought to be learning to cope. This argument mistakes a biological constraint for a character flaw. We do not ask students to cope with poorly lit classrooms or unheated buildings; we fix them. A schedule that systematically deprives teenagers of sleep is an environmental defect of the same kind, and the fact that it is invisible does not make it less damaging.

Move the bell. Solve the buses. The students will still have to get up; they will simply be awake when they do.`,
};

export const R2_P10: ReadingPassage = {
  id: "r2-paired-libraries", title: "Two Views of the Public Library", kind: "paired",
  text: `Text 1: From a city budget memorandum

The Central Library occupies 84,000 square feet of prime downtown real estate and consumed 4.1 percent of the municipal operating budget last year. Physical circulation has declined 38 percent over the past decade, while digital lending, which requires no building at all, has more than tripled. In light of these trends, this office recommends consolidating the Central branch's collection into three neighborhood libraries and repurposing the downtown site for mixed-use development. Projected savings over ten years exceed 22 million dollars, a sum that could fund expanded digital licenses, extended hours at the neighborhood branches, and a bookmobile program reaching areas currently more than two miles from any library. The Central building is a beloved landmark, and this office does not propose its demolition; the facade and reading room would be preserved under any redevelopment agreement. But sentiment is not a line item. The question before the council is not whether the city values libraries but how that value is most efficiently delivered.

Text 2: From a letter to the council by a branch librarian

I have read the memorandum, and I do not doubt its arithmetic. I doubt its accounting. Circulation measures books that leave the building. It does not measure the man who comes in every morning to read the newspaper because his apartment has no heat until noon, the students who occupy the third-floor tables from three until closing because they have nowhere quiet at home, the woman I helped last week to file for benefits online because the form defeated her phone. None of these people borrowed anything. All of them used the library. The memorandum proposes to preserve the reading room as a facade—a beautiful room, presumably, in a building full of apartments no one who uses that room could afford. I would ask the council to consider what a "landmark" is for. A library that is only a collection can be consolidated. A library that is a place cannot, and the people who need the place most are, almost by definition, the ones who do not appear in the data.`,
};

export const READING_V2_PASSAGES: ReadingPassage[] = [R2_P1, R2_P2, R2_P3, R2_P4, R2_P5, R2_P6, R2_P7, R2_P8, R2_P9, R2_P10];
