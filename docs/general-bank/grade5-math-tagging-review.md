# Actual Grade 5 Math bank — canonical tagging review

**Status:** deterministic audit completed; proposed tags await owner/content approval. No production changes.

The database bank used by the reviewed Math attempt has **30 items, q1–q30**. The local JSON Grade 5 bank has **10 different items, g5-s1-q1–q10**. They are not interchangeable. The snapshot contains assessment content only (no student data); original text, options and answer keys are unchanged.

Scores aggregate once under each item's primary skill and domain. Secondary skills are retained for teaching and staff review, not additional scored buckets. Historical reports continue reading their existing bank metadata, not this proposed overlay.

| Item | Actual stem | Domain | Primary skill | Secondary skills | Internal author review |
|---|---|---|---|---|---|
| q1 | What is 7,206 rounded to the nearest hundred? | Number & Base Ten | Round whole numbers to the nearest hundred | — | — |
| q2 | What is 345 × 6? | Number & Base Ten | Multiply multi-digit whole numbers | Multiplication facts | — |
| q3 | What is 1,824 ÷ 12? | Number & Base Ten | Divide whole numbers by two-digit divisors | Multiplication facts | — |
| q4 | Which fraction is equivalent to 2/4? | Fraction Operations | Recognize equivalent fractions | Simplify fractions | Multiple equivalent choices (3/6 and 1/2); preserve key, flag for separate author review. |
| q5 | What is 1/4 + 3/4? | Fraction Operations | Add fractions with like denominators | Recognize a whole | Multiple equivalent choices (4/4 and 1); preserve key, flag for separate author review. |
| q6 | What is 2/3 × 3/5? | Fraction Operations | Multiply fractions | Simplify fractions | — |
| q7 | In 3.47, what digit is in the hundredths place? | Number & Base Ten | Identify decimal place value | — | — |
| q8 | Which is greater: 0.56 or 0.65? | Number & Base Ten | Compare decimals | Decimal place value | — |
| q9 | What is the volume of a box that is 5 cm long, 2 cm wide, and 3 cm high? | Measurement & Data | Find volume of rectangular prisms | Multiply whole numbers | — |
| q10 | What is the next number in this pattern: 5, 10, 15, ___? | Operations & Algebraic Thinking | Extend additive number patterns | — | — |
| q11 | What does the tallest bar in a bar graph represent? | Measurement & Data | Interpret bar-graph frequency | — | — |
| q12 | Which angle is a right angle? | Geometry | Identify right angles | — | — |
| q13 | What is the area of a square with side 6 cm? | Measurement & Data | Find the area of a square | Multiply whole numbers | — |
| q14 | How many minutes are in 3 hours? | Measurement & Data | Convert hours to minutes | Multiply whole numbers | — |
| q15 | If you buy 2 pens for $1.25 each, how much do you spend? | Number & Base Ten | Solve decimal multiplication money problems | Money arithmetic | — |
| q16 | Each box has 8 toys. How many toys in 6 boxes? | Operations & Algebraic Thinking | Solve equal-group multiplication problems | Multiplication facts | — |
| q17 | What is 12 + 8 × 2? | Operations & Algebraic Thinking | Evaluate expressions using order of operations | Multiply whole numbers, Add whole numbers | — |
| q18 | Maria ate 2/8 of a pizza and John ate 3/8. How much did they eat together? | Fraction Operations | Solve like-denominator fraction addition problems | Add fractions with like denominators | — |
| q19 | How many centimeters are in a meter? | Measurement & Data | Convert meters to centimeters | — | — |
| q20 | You have 24 apples and want to put 6 in each basket. How many baskets can you fill? | Operations & Algebraic Thinking | Solve equal-group division problems | Division facts | — |
| q21 | Jenna buys 3 packs of stickers. Each pack contains 12 stickers. She gives 10 stickers to her friend. How many does she have left? | Operations & Algebraic Thinking | Solve multiply-then-subtract word problems | Multiply whole numbers, Subtract whole numbers | — |
| q22 | A car travels 60 miles in one hour. How far does it travel in 3 hours, and then how much farther does it go in the next 2 hours? | Operations & Algebraic Thinking | Solve constant-rate multi-step distance problems | Multiply whole numbers, Add distances | Wording requests successive distances; stored key 300 totals both. Preserve key; clarify only in separately approved new content. |
| q23 | Sam buys 2 books for $7 each and a notebook for $3. How much does he spend in total? | Operations & Algebraic Thinking | Solve multiply-then-add money problems | Multiply whole numbers, Add money amounts | — |
| q24 | A baker makes 4 batches of cookies. Each batch has 18 cookies. He sells 50 cookies. How many are left? | Operations & Algebraic Thinking | Solve multiply-then-subtract word problems | Multiply whole numbers, Subtract whole numbers | — |
| q25 | Mia saves $5 each week. After 4 weeks, she gets an extra $10 from her grandma. How much money does she have in total? | Operations & Algebraic Thinking | Solve multiply-then-add money problems | Multiply whole numbers, Add money amounts | — |
| q26 | A classroom has 6 rows with 5 desks in each. If each desk has 2 students, how many students are there? Then, 6 students leave. How many are left? | Operations & Algebraic Thinking | Solve multi-step equal-group problems with subtraction | Multiply three factors, Subtract whole numbers | — |
| q27 | Lisa runs 2 miles every day for 5 days. She then rests for 2 days and runs 3 more miles. What is the total distance she runs? | Operations & Algebraic Thinking | Solve multi-step distance problems | Multiply whole numbers, Add distances, Select relevant information | — |
| q28 | A box contains 4 pens, 3 pencils, and 2 erasers. If you buy 3 such boxes, how many items do you have in total? | Operations & Algebraic Thinking | Solve add-then-multiply equal-group problems | Add whole numbers, Multiply whole numbers | — |
| q29 | A toy costs $15. You have $40. After buying the toy, you also buy 2 comic books for $6 each. How much money do you have left? | Operations & Algebraic Thinking | Solve multi-step spending and change problems | Multiply whole numbers, Subtract money amounts | — |
| q30 | A farmer has 4 fields. Each field has 12 rows of corn. Each row has 15 corn plants. How many total corn plants does the farmer have? | Operations & Algebraic Thinking | Solve multiplicative multi-level grouping problems | Multiply three factors | — |

## Future configuration and release procedure (not applied)

1. Review all 30 proposed tags and the q4/q5 equivalent-choice and q22 wording flags; tagging does not alter or resolve those content/key issues.
2. Use the pure `prepareFutureBank` helper with this reviewed configuration and the **exact** original snapshot. It requires an explicit approval argument and rejects content or key drift. It produces a new in-memory bank only; it never writes records.
3. Create a separate versioned assessment record for future starts through the existing administrator release process, preserving every question, option, key and ID. Do not UPDATE the existing assessment. Bind new attempts only to the approved new version; leave historical and in-progress attempts on the original record.
4. Retain current ELA explicit tags. The schema accepts explicit subject/domain/granular primary plus secondary skills on new items; untouched banks keep legacy fallback. Tag remaining general banks only after per-bank review.
5. Backend deployment, new-bank insertion/start routing and owner approval are pending. No migration is applied by this configuration or tests.

## Parent program description

Tier 3 reports describe a **15-week program** with separate afterschool support and Saturday intensive sessions; formal retests stay Weeks 5, 10 and 15. Attendance is individualized. The reviewed student's separate schedule is **45 afterschool visits plus 15 two-hour Saturday sessions**, never 60 one-to-one sessions and never a default for all students.
