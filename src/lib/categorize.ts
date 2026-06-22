import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./transactions";

const RULES: { category: string; patterns: RegExp[] }[] = [
  { category: "Food", patterns: [/restaurant|cafe|coffee|starbucks|mcdonald|kfc|pizza|burger|swiggy|zomato|uber\s*eats|doordash|grocery|supermarket|walmart|whole\s*foods|trader\s*joe/i] },
  { category: "Travel", patterns: [/uber|lyft|ola|taxi|airline|flight|hotel|airbnb|booking\.com|expedia|train|metro|gas|fuel|shell|chevron|exxon/i] },
  { category: "Shopping", patterns: [/amazon|ebay|target|costco|ikea|nike|adidas|zara|h&m|flipkart|myntra|mall|store/i] },
  { category: "Bills", patterns: [/electric|water|gas\s*bill|internet|wifi|comcast|verizon|at&t|t-mobile|rent|mortgage|insurance|utility|phone\s*bill/i] },
  { category: "Entertainment", patterns: [/netflix|spotify|hulu|disney|prime\s*video|cinema|movie|theatre|concert|game|steam|playstation|xbox/i] },
  { category: "Health", patterns: [/pharmacy|hospital|clinic|doctor|medical|cvs|walgreens|dental|gym|fitness/i] },
  { category: "Education", patterns: [/university|college|tuition|udemy|coursera|book|library|school/i] },
];

const INCOME_RULES: { category: string; patterns: RegExp[] }[] = [
  { category: "Salary", patterns: [/salary|payroll|wages|direct\s*deposit/i] },
  { category: "Freelance", patterns: [/freelance|upwork|fiverr|contract/i] },
  { category: "Business", patterns: [/sales|invoice|business|client/i] },
  { category: "Bonus", patterns: [/bonus|reward|cashback|refund|interest|dividend/i] },
];

export function categorize(description: string, type: "income" | "expense"): string {
  const rules = type === "income" ? INCOME_RULES : RULES;
  for (const r of rules) {
    if (r.patterns.some((p) => p.test(description))) return r.category;
  }
  return type === "income" ? "Other" : "Other";
}

export { EXPENSE_CATEGORIES, INCOME_CATEGORIES };
