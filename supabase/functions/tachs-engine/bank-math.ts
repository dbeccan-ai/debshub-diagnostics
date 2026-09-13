// Mathematics — 50 original items.
// Quotas: number_operations 12, fractions_decimals_percent 10, algebra_patterns 10,
// geometry_measurement 10, data_probability 8. Plain text / Unicode notation only.
import type { BankQuestion } from "./bank-types.ts";

const m = (
  code: string, difficulty: 1 | 2 | 3, skill: string, stem: string,
  opts: [string, string, string, string], correct: string, rationale: string,
): BankQuestion => ({
  code, section_key: "mathematics", skill, difficulty, stem,
  choices: [{ key: "A", text: opts[0] }, { key: "B", text: opts[1] }, { key: "C", text: opts[2] }, { key: "D", text: opts[3] }],
  correct_key: correct, rationale,
});

export const MATH: BankQuestion[] = [
  // ===== number_operations (12) =====
  m("MA-01", 1, "number_operations", "What is 4,806 − 2,957?", ["1,849", "1,949", "2,149", "1,859"], "A", "4,806 − 2,957 = 1,849."),
  m("MA-02", 1, "number_operations", "What is 36 × 24?", ["744", "854", "864", "964"], "C", "36 × 24 = 36 × 20 + 36 × 4 = 720 + 144 = 864."),
  m("MA-03", 2, "number_operations", "What is 7,128 ÷ 8?", ["881", "891", "901", "911"], "B", "8 × 891 = 7,128."),
  m("MA-04", 3, "number_operations", "What is the greatest common factor of 84 and 126?", ["14", "21", "42", "63"], "C", "84 = 2 × 42 and 126 = 3 × 42, so 42 is the largest shared factor."),
  m("MA-05", 2, "number_operations", "What is the least common multiple of 12 and 18?", ["24", "36", "54", "72"], "B", "Multiples of 18 are 18, 36, ...; 36 is the first that 12 also divides."),
  m("MA-06", 2, "number_operations", "What is −7 + 12 − 5?", ["−10", "0", "10", "24"], "B", "−7 + 12 = 5, and 5 − 5 = 0."),
  m("MA-07", 3, "number_operations", "What is the value of 2⁵ × 2²?", ["64", "128", "256", "1,024"], "B", "2⁵ × 2² = 2⁷ = 128."),
  m("MA-08", 1, "number_operations", "What is 48,752 rounded to the nearest thousand?", ["48,000", "48,700", "49,000", "50,000"], "C", "The hundreds digit is 7, so round up to 49,000."),
  m("MA-09", 3, "number_operations", "What is the value of 5 + 3 × (8 − 2)² ÷ 9?", ["13", "17", "21", "29"], "B", "(8 − 2)² = 36; 3 × 36 = 108; 108 ÷ 9 = 12; 5 + 12 = 17."),
  m("MA-10", 2, "number_operations", "Which is the best estimate of 612 × 39?", ["18,000", "24,000", "30,000", "36,000"], "B", "600 × 40 = 24,000, which is close to the exact product 23,868."),
  m("MA-11", 2, "number_operations", "Which shows the prime factorization of 180?", ["2 × 3 × 5 × 6", "2² × 3² × 5", "2³ × 3 × 5", "2² × 3 × 15"], "B", "180 = 4 × 45 = 2² × 3² × 5, and every factor is prime."),
  m("MA-12", 2, "number_operations", "What is |−9| + (−4)?", ["−13", "−5", "5", "13"], "C", "|−9| = 9, and 9 + (−4) = 5."),

  // ===== fractions_decimals_percent (10) =====
  m("MA-13", 2, "fractions_decimals_percent", "A jacket that costs $80 is on sale for 35% off. What is the sale price?", ["$28", "$45", "$52", "$65"], "C", "35% of 80 is 28, and 80 − 28 = 52."),
  m("MA-14", 2, "fractions_decimals_percent", "What is 2/3 + 3/4?", ["5/7", "1 1/12", "1 5/12", "1 1/2"], "C", "2/3 = 8/12 and 3/4 = 9/12; 8/12 + 9/12 = 17/12 = 1 5/12."),
  m("MA-15", 3, "fractions_decimals_percent", "Which value is greatest?", ["0.58", "5/9", "57%", "4/7"], "A", "5/9 ≈ 0.556, 57% = 0.57, 4/7 ≈ 0.571, so 0.58 is greatest."),
  m("MA-16", 1, "fractions_decimals_percent", "What is 3/8 written as a decimal?", ["0.325", "0.375", "0.38", "0.625"], "B", "3 ÷ 8 = 0.375."),
  m("MA-17", 3, "fractions_decimals_percent", "What is 5/6 ÷ 2/3?", ["5/9", "10/18", "1 1/4", "1 2/3"], "C", "5/6 × 3/2 = 15/12 = 1 1/4."),
  m("MA-18", 2, "fractions_decimals_percent", "18 is what percent of 45?", ["25%", "36%", "40%", "45%"], "C", "18 ÷ 45 = 0.4, which is 40%."),
  m("MA-19", 1, "fractions_decimals_percent", "What is 0.4 × 2.5?", ["0.1", "1", "10", "0.01"], "B", "0.4 × 2.5 = 1."),
  m("MA-20", 3, "fractions_decimals_percent", "A ticket price rises from $40 to $46. What is the percent increase?", ["6%", "13%", "15%", "20%"], "C", "The increase is 6; 6 ÷ 40 = 0.15, which is 15%."),
  m("MA-21", 2, "fractions_decimals_percent", "What is 2 1/4 − 5/8?", ["1 3/8", "1 5/8", "1 7/8", "2 1/8"], "B", "2 1/4 = 18/8; 18/8 − 5/8 = 13/8 = 1 5/8."),
  m("MA-22", 1, "fractions_decimals_percent", "Which fraction is equal to 0.6?", ["1/6", "3/5", "6/10 of 1/2", "2/3"], "B", "3 ÷ 5 = 0.6."),

  // ===== algebra_patterns (10) =====
  m("MA-23", 2, "algebra_patterns", "If 3x + 7 = 25, what is the value of x?", ["4", "6", "8", "18"], "B", "3x = 18, so x = 6."),
  m("MA-24", 1, "algebra_patterns", "What is the next number in the pattern 2, 6, 18, 54, ...?", ["108", "144", "162", "216"], "C", "Each term is multiplied by 3, and 54 × 3 = 162."),
  m("MA-25", 2, "algebra_patterns", "If 5(x − 2) = 35, what is x?", ["5", "7", "9", "12"], "C", "x − 2 = 7, so x = 9."),
  m("MA-26", 3, "algebra_patterns", "What is the value of 2a² − 3b when a = 3 and b = 4?", ["6", "12", "18", "24"], "A", "2(9) = 18 and 3(4) = 12; 18 − 12 = 6."),
  m("MA-27", 2, "algebra_patterns", "If x/4 + 3 = 11, what is x?", ["8", "24", "32", "44"], "C", "x/4 = 8, so x = 32."),
  m("MA-28", 3, "algebra_patterns", "The pattern begins 3, 7, 11, 15, ... What is the 10th term?", ["35", "39", "43", "47"], "B", "The pattern adds 4 each time: 3 + 9 × 4 = 39."),
  m("MA-29", 3, "algebra_patterns", "If 4x − 9 = 2x + 7, what is x?", ["4", "6", "8", "16"], "C", "2x = 16, so x = 8."),
  m("MA-30", 1, "algebra_patterns", "Which expression represents \"5 less than three times a number n\"?", ["5 − 3n", "3n − 5", "3(n − 5)", "5n − 3"], "B", "Three times n is 3n, and 5 less than that is 3n − 5."),
  m("MA-31", 2, "algebra_patterns", "Which values of x make 2x + 1 > 9 true?", ["x > 4", "x < 4", "x > 5", "x < 5"], "A", "2x > 8, so x > 4."),
  m("MA-32", 1, "algebra_patterns", "A phone plan costs $15 per month plus $0.10 for each minute. Which expression gives the cost for m minutes?", ["15m + 0.10", "0.10m − 15", "15 + 0.10m", "15 × 0.10m"], "C", "The fixed $15 is added to $0.10 times the minutes."),

  // ===== geometry_measurement (10) =====
  m("MA-33", 2, "geometry_measurement", "A rectangle has a perimeter of 36 cm and a width of 7 cm. What is its area?", ["77 cm²", "98 cm²", "126 cm²", "203 cm²"], "A", "Length = (36 − 14) ÷ 2 = 11, so the area is 11 × 7 = 77."),
  m("MA-34", 2, "geometry_measurement", "Two angles of a triangle measure 48° and 67°. What is the third angle?", ["55°", "65°", "75°", "115°"], "B", "180 − 48 − 67 = 65."),
  m("MA-35", 2, "geometry_measurement", "A circle has a radius of 5 cm. Using 3.14 for pi, what is its circumference?", ["15.7 cm", "31.4 cm", "78.5 cm", "62.8 cm"], "B", "C = 2 × 3.14 × 5 = 31.4."),
  m("MA-36", 1, "geometry_measurement", "What is the volume of a rectangular prism that is 4 cm by 3 cm by 6 cm?", ["13 cm³", "36 cm³", "72 cm³", "84 cm³"], "C", "4 × 3 × 6 = 72."),
  m("MA-37", 1, "geometry_measurement", "A triangle has a base of 14 in. and a height of 9 in. What is its area?", ["23 in²", "63 in²", "126 in²", "252 in²"], "B", "Area = 1/2 × 14 × 9 = 63."),
  m("MA-38", 1, "geometry_measurement", "How many meters are in 3.5 kilometers?", ["35 m", "350 m", "3,500 m", "35,000 m"], "C", "1 km = 1,000 m, so 3.5 km = 3,500 m."),
  m("MA-39", 3, "geometry_measurement", "Using 3.14 for pi, what is the area of a circle with a radius of 6 cm, to the nearest tenth?", ["18.8 cm²", "37.7 cm²", "113.0 cm²", "452.2 cm²"], "C", "A = 3.14 × 6² = 3.14 × 36 = 113.04, which rounds to 113.0."),
  m("MA-40", 2, "geometry_measurement", "What is the measure of the complement of a 37° angle?", ["43°", "53°", "63°", "143°"], "B", "Complementary angles sum to 90°, and 90 − 37 = 53."),
  m("MA-41", 3, "geometry_measurement", "If both side lengths of a rectangle are doubled, the new area is", ["the same", "twice the original", "four times the original", "eight times the original"], "C", "(2l)(2w) = 4lw, so the area is multiplied by 4."),
  m("MA-42", 2, "geometry_measurement", "What is the total surface area of a cube with an edge of 5 cm?", ["25 cm²", "125 cm²", "150 cm²", "180 cm²"], "C", "Each face is 25 cm², and 6 × 25 = 150."),

  // ===== data_probability (8) =====
  m("MA-43", 1, "data_probability", "A bag holds 3 red, 5 blue, and 2 green marbles. If one marble is drawn at random, what is the probability that it is blue?", ["1/5", "3/10", "1/2", "5/12"], "C", "5 blue out of 10 marbles equals 1/2."),
  m("MA-44", 2, "data_probability", "Ana's quiz scores are 82, 90, 76, and 92. What score does she need on a fifth quiz for a mean of 86?", ["86", "88", "90", "94"], "C", "5 × 86 = 430, and 430 − 340 = 90."),
  m("MA-45", 2, "data_probability", "What is the median of 4, 9, 12, 15, 21, 22?", ["12", "13.5", "14", "15"], "B", "With six values, the median is the mean of 12 and 15, which is 13.5."),
  m("MA-46", 1, "data_probability", "A spinner has 8 equal sections and 3 of them are red. What is the probability of landing on red?", ["3/8", "1/3", "5/8", "3/5"], "A", "3 favorable sections out of 8 equal sections."),
  m("MA-47", 2, "data_probability", "Two fair coins are tossed. What is the probability that both land heads up?", ["1/2", "1/3", "1/4", "3/4"], "C", "There are 4 equally likely outcomes, and only one is heads-heads."),
  m("MA-48", 1, "data_probability", "What is the mode of 3, 7, 7, 9, 12?", ["3", "7", "7.6", "9"], "B", "7 appears more often than any other value."),
  m("MA-49", 2, "data_probability", "What is the range of 14, 22, 9, and 31?", ["9", "17", "22", "31"], "C", "31 − 9 = 22."),
  m("MA-50", 3, "data_probability", "A bag holds 3 red, 5 blue, and 2 green marbles. What is the probability that a marble drawn at random is NOT green?", ["1/5", "3/5", "7/10", "4/5"], "D", "8 of the 10 marbles are not green, and 8/10 = 4/5."),
];
