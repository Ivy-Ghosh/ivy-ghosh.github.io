// Demo data: courses, topics and practice problems.
// Everything here is invented for the demo. Kept apart from app logic so a real
// course list (or a backend) can replace it later without touching the UI.

window.QC_DATA = {
  courses: [
    {
      id: "stats",
      name: "Intro Statistics",
      topics: [
        { id: "mean", name: "Mean and variance" },
        { id: "ev", name: "Expected value" },
        { id: "reg", name: "Regression prediction" }
      ]
    },
    {
      id: "micro",
      name: "Intermediate Microeconomics",
      topics: [
        { id: "elas", name: "Price elasticity" },
        { id: "mc", name: "Marginal cost" }
      ]
    },
    {
      id: "math",
      name: "Business Calculus",
      topics: [{ id: "lin", name: "Linear equations" }]
    }
  ],

  // Each problem:
  //   start      the correct setup; line 1 is checked against it
  //   finalForm  "solved" (ends as x = number), "number" (ends as a plain number) or "any"
  //   sample     a typical wrong attempt, so the checker can be tried in seconds
  //   mistakes   known slips: if the first wrong line matches `match`, its hand-written
  //              note is shown instead of the generic one
  //   solution   worked steps, shown only after the student has tried and asked twice
  problems: [
    {
      id: "lin-1",
      course: "math",
      topic: "lin",
      title: "Solve a linear equation",
      prompt: "Solve for x:  3(x − 4) = 2x + 5",
      start: "3(x - 4) = 2x + 5",
      finalForm: "solved",
      sample: ["3x - 4 = 2x + 5", "x - 4 = 5", "x = 9"],
      mistakes: [
        {
          match: "3x - 4 = 2x + 5",
          what: "The 3 multiplied the x but not the 4.",
          why: "3(x − 4) means 3 times everything inside the brackets, so the −4 becomes −12.",
          next: "Rewrite the left side as 3·x − 3·4 and carry on from there.",
          deeper: "Test it with a number. If x = 5, then 3(5 − 4) = 3, but 3·5 − 4 = 11. They should match, and they don't."
        },
        {
          match: "x = -7",
          what: "The −12 crossed the = sign without changing sign.",
          why: "Starting from x − 12 = 5, adding 12 to both sides gives x = 5 + 12.",
          next: "Add 12 to both sides and write that as your next line.",
          deeper: "Check your answer in the original: with x = −7, 3(x − 4) = −33 but 2x + 5 = −9. Not equal, so −7 can't be right."
        }
      ],
      solution: ["3x − 12 = 2x + 5", "x − 12 = 5", "x = 17"]
    },
    {
      id: "ev-1",
      course: "stats",
      topic: "ev",
      title: "Expected payout of a raffle ticket",
      prompt: "A raffle ticket pays $50 with probability 0.2, $10 with probability 0.5, and $0 with probability 0.3. What is the expected payout?",
      start: "0.2*50 + 0.5*10 + 0.3*0",
      finalForm: "number",
      sample: ["(50 + 10 + 0)/3", "20"],
      mistakes: [
        {
          match: "(50 + 10 + 0)/3",
          what: "This is the plain average of the payouts, not the expected value.",
          why: "The payouts are not equally likely. Expected value weights each payout by its probability.",
          next: "Multiply each payout by its probability, then add: 0.2·50 + 0.5·10 + 0.3·0.",
          deeper: "The $10 outcome happens half the time (0.5), so it should count for more than the $50, which happens only 0.2 of the time."
        }
      ],
      solution: ["0.2·50 + 0.5·10 + 0.3·0", "10 + 5 + 0", "15   (an expected payout of $15)"]
    },
    {
      id: "var-1",
      course: "stats",
      topic: "mean",
      title: "Sample variance of four numbers",
      prompt: "Find the sample variance of 2, 4, 4, 6. (Their mean is 4.)",
      start: "((2-4)^2 + (4-4)^2 + (4-4)^2 + (6-4)^2)/3",
      finalForm: "number",
      sample: ["(4 + 0 + 0 + 4)/4", "2"],
      mistakes: [
        {
          match: "8/4",
          what: "You divided by 4 (n), but sample variance divides by 3 (n − 1).",
          why: "For a sample, the sum of squared deviations is divided by n − 1. Here n = 4, so divide by 3.",
          next: "Keep your top part and divide it by 3 instead of 4.",
          deeper: "Your top part, (−2)² + 0² + 0² + 2² = 8, is already right. Only the bottom changes."
        },
        {
          match: "0",
          what: "The deviations were added without squaring, so they cancelled out to 0.",
          why: "Deviations from the mean always add up to 0. Squaring makes each one positive before you add.",
          next: "Square each deviation first: (−2)², 0², 0², 2².",
          deeper: "A variance of 0 would mean all four numbers are the same. They aren't, so 0 can't be right."
        }
      ],
      solution: ["((2−4)² + (4−4)² + (4−4)² + (6−4)²) / 3", "(4 + 0 + 0 + 4) / 3", "8/3 ≈ 2.67"]
    },
    {
      id: "reg-1",
      course: "stats",
      topic: "reg",
      title: "Predict from a fitted line",
      prompt: "A fitted line is: predicted price = 1.5 + 0.04 × size (size in ounces). Predict the price of a 20-ounce drink.",
      start: "1.5 + 0.04*20",
      finalForm: "number",
      sample: ["(1.5 + 0.04)*20", "30.8"],
      mistakes: [
        {
          match: "(1.5 + 0.04)*20",
          what: "The intercept got multiplied by the size as well.",
          why: "Only the slope (0.04) is multiplied by size. The intercept 1.5 is added once, whatever the size.",
          next: "Work out 0.04 × 20 first, then add 1.5.",
          deeper: "0.04 × 20 = 0.8. A $30.80 drink should also feel wrong: a quick sense check catches slips like this."
        },
        {
          match: "1.5*0.04*20",
          what: "The intercept and the slope were multiplied together.",
          why: "The line adds the intercept: 1.5 + (0.04 × size). Nothing multiplies 1.5.",
          next: "Write it as 1.5 + 0.04·20.",
          deeper: "0.04 × 20 = 0.8. Now add that to 1.5."
        }
      ],
      solution: ["1.5 + 0.04·20", "1.5 + 0.8", "2.3   (a predicted price of $2.30)"]
    },
    {
      id: "elas-1",
      course: "micro",
      topic: "elas",
      title: "Midpoint price elasticity",
      prompt: "A coffee's price rises from $4 to $5 and the cups sold fall from 100 to 80. Use the midpoint method to find the price elasticity of demand.",
      start: "((80-100)/((100+80)/2)) / ((5-4)/((4+5)/2))",
      finalForm: "number",
      sample: ["(-20/100)/(1/4)", "-0.8"],
      mistakes: [
        {
          match: "(-20/100)/(1/4)",
          what: "You divided by the starting values (100 cups and $4), not the midpoints.",
          why: "The midpoint method divides each change by the average of the old and new values, so the answer is the same whether the price goes up or down.",
          next: "Use (100 + 80)/2 = 90 for quantity and (4 + 5)/2 = 4.5 for price.",
          deeper: "The change in quantity is −20/90 ≈ −0.222. Find the change in price the same way, then divide the first by the second."
        }
      ],
      solution: ["(−20 / 90) / (1 / 4.5)", "−0.2222 / 0.2222", "−1   (unit elastic)"]
    },
    {
      id: "mc-1",
      course: "micro",
      topic: "mc",
      title: "Marginal cost from a cost function",
      prompt: "A firm's cost is C(q) = 2q² + 5q + 100. Find marginal cost, MC(q).",
      start: "4q + 5",
      finalForm: "any",
      sample: ["MC = 4q + 5 + 100", "MC = 4q + 105"],
      mistakes: [
        {
          match: "4q + 105",
          what: "The fixed cost of 100 stayed in.",
          why: "Marginal cost is how much cost changes when q goes up a little. The 100 doesn't change with q, so it drops out.",
          next: "Take the derivative one term at a time: 2q² becomes 4q, 5q becomes 5, and 100 becomes 0.",
          deeper: "Compare C(11) − C(10) = 397 − 350 = 47. That's close to 4·10 + 5 = 45, and nowhere near 145."
        },
        {
          match: "2q + 5",
          what: "2q² became 2q instead of 4q.",
          why: "For q², the power 2 comes down and multiplies what's already there: 2 · 2q = 4q.",
          next: "Redo the first term: bring the 2 down and multiply it by the 2 in front.",
          deeper: "Write it out: 2 · (2 · q¹) = 4q."
        }
      ],
      solution: ["C(q) = 2q² + 5q + 100", "MC(q) = 2·2q + 5 + 0", "MC(q) = 4q + 5"]
    }
  ],

  // Invented nicknames for the profile, so no real name is ever needed.
  aliasWords: ["Night Owl", "Pond Walker", "Last Bus", "Margin Reader", "Scratch Paper", "Blue Book"]
};
