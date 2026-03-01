/**
 * Natural Language Date Parser — Phase 31
 *
 * Parses human-friendly date/time strings into structured dates and recurrence rules.
 * Inspired by Todoist and Remember the Milk NL input.
 *
 * @domain domain-tasks (UI integration layer)
 * @kcs Supported phrases documented in docs/kcs/nl-date-parser.md
 */

export interface NLDateResult {
  /** Resolved absolute date, or null if only recurrence was parsed */
  dueDate: string | null;
  /** RRULE string if a recurring pattern was detected */
  recurrenceRule: string | null;
  /** The portion of the input that was recognized as a date expression */
  matchedText: string;
  /** Human-friendly description of what was parsed */
  description: string;
}

const DAY_NAMES: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const DAY_ABBREVS: Record<number, string> = {
  0: "SU", 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR", 6: "SA",
};

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0] ?? "";
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

/**
 * Parse a natural language string into a date result.
 *
 * Supported patterns:
 * - "today", "tomorrow", "yesterday"
 * - "next monday", "next friday"
 * - "in 3 days", "in 2 weeks", "in 1 month"
 * - "every day", "every week", "every monday"
 * - "every 2 weeks", "every 3 months"
 * - "every weekday", "every workday"
 * - Dates: "2026-03-15", "march 15", "mar 15"
 */
export function parseNLDate(input: string, now?: Date): NLDateResult | null {
  const text = input.trim().toLowerCase();
  const today = now ?? new Date();

  // --- Exact keywords ---
  if (text === "today") {
    return {
      dueDate: toISODate(today),
      recurrenceRule: null,
      matchedText: text,
      description: "Today",
    };
  }

  if (text === "tomorrow") {
    return {
      dueDate: toISODate(addDays(today, 1)),
      recurrenceRule: null,
      matchedText: text,
      description: "Tomorrow",
    };
  }

  if (text === "yesterday") {
    return {
      dueDate: toISODate(addDays(today, -1)),
      recurrenceRule: null,
      matchedText: text,
      description: "Yesterday",
    };
  }

  // --- "in N days/weeks/months" ---
  const inMatch = text.match(
    /^in\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)$/,
  );
  if (inMatch && inMatch[1] && inMatch[2]) {
    const n = parseInt(inMatch[1], 10);
    const unit = inMatch[2].replace(/s$/, "");
    const target = new Date(today);

    switch (unit) {
      case "day":
        target.setDate(target.getDate() + n);
        break;
      case "week":
        target.setDate(target.getDate() + n * 7);
        break;
      case "month":
        target.setMonth(target.getMonth() + n);
        break;
      case "year":
        target.setFullYear(target.getFullYear() + n);
        break;
    }

    return {
      dueDate: toISODate(target),
      recurrenceRule: null,
      matchedText: text,
      description: `In ${n} ${unit}${n !== 1 ? "s" : ""}`,
    };
  }

  // --- "next <dayname>" ---
  const nextDayMatch = text.match(/^next\s+(\w+)$/);
  if (nextDayMatch && nextDayMatch[1]) {
    const nextWord = nextDayMatch[1];
    const dayNum = DAY_NAMES[nextWord];
    if (dayNum !== undefined) {
      const currentDay = today.getDay();
      let daysAhead = dayNum - currentDay;
      if (daysAhead <= 0) daysAhead += 7;
      const target = addDays(today, daysAhead);
      return {
        dueDate: toISODate(target),
        recurrenceRule: null,
        matchedText: text,
        description: `Next ${Object.keys(DAY_NAMES).find((k) => DAY_NAMES[k] === dayNum && k.length > 3) ?? nextWord}`,
      };
    }

    // "next week" / "next month"
    if (nextWord === "week") {
      return {
        dueDate: toISODate(addDays(today, 7)),
        recurrenceRule: null,
        matchedText: text,
        description: "Next week",
      };
    }
    if (nextWord === "month") {
      const target = new Date(today);
      target.setMonth(target.getMonth() + 1);
      return {
        dueDate: toISODate(target),
        recurrenceRule: null,
        matchedText: text,
        description: "Next month",
      };
    }
  }

  // --- Recurring: "every day/week/month/year" ---
  const everySimple = text.match(
    /^every\s+(day|week|month|year)$/,
  );
  if (everySimple && everySimple[1]) {
    const freqMap: Record<string, string> = {
      day: "DAILY",
      week: "WEEKLY",
      month: "MONTHLY",
      year: "YEARLY",
    };
    const freq = freqMap[everySimple[1]];
    return {
      dueDate: toISODate(today),
      recurrenceRule: `FREQ=${freq}`,
      matchedText: text,
      description: `Every ${everySimple[1]}`,
    };
  }

  // --- Recurring: "every N days/weeks/months/years" ---
  const everyN = text.match(
    /^every\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)$/,
  );
  if (everyN && everyN[1] && everyN[2]) {
    const n = parseInt(everyN[1], 10);
    const unit = everyN[2].replace(/s$/, "");
    const freqMap: Record<string, string> = {
      day: "DAILY",
      week: "WEEKLY",
      month: "MONTHLY",
      year: "YEARLY",
    };
    const freq = freqMap[unit];
    return {
      dueDate: toISODate(today),
      recurrenceRule: `FREQ=${freq};INTERVAL=${n}`,
      matchedText: text,
      description: `Every ${n} ${unit}${n !== 1 ? "s" : ""}`,
    };
  }

  // --- Recurring: "every <dayname>" e.g. "every monday" ---
  const everyDay = text.match(/^every\s+(\w+)$/);
  if (everyDay && everyDay[1]) {
    const everyWord = everyDay[1];
    const dayNum = DAY_NAMES[everyWord];
    if (dayNum !== undefined) {
      const dayAbbrev = DAY_ABBREVS[dayNum];
      // Set due date to next occurrence of that day
      const currentDay = today.getDay();
      let daysAhead = dayNum - currentDay;
      if (daysAhead <= 0) daysAhead += 7;
      return {
        dueDate: toISODate(addDays(today, daysAhead)),
        recurrenceRule: `FREQ=WEEKLY;BYDAY=${dayAbbrev}`,
        matchedText: text,
        description: `Every ${Object.keys(DAY_NAMES).find((k) => DAY_NAMES[k] === dayNum && k.length > 3) ?? everyWord}`,
      };
    }

    // "every weekday" / "every workday"
    if (everyWord === "weekday" || everyWord === "workday") {
      return {
        dueDate: toISODate(addDays(today, 1)),
        recurrenceRule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
        matchedText: text,
        description: "Every weekday",
      };
    }
  }

  // --- ISO date "2026-03-15" ---
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return {
      dueDate: text,
      recurrenceRule: null,
      matchedText: text,
      description: text,
    };
  }

  // --- Month day: "march 15", "mar 15" ---
  const MONTHS: Record<string, number> = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11,
  };

  const monthDayMatch = text.match(/^(\w+)\s+(\d{1,2})$/);
  if (monthDayMatch && monthDayMatch[1] && monthDayMatch[2]) {
    const monthNum = MONTHS[monthDayMatch[1]];
    if (monthNum !== undefined) {
      const day = parseInt(monthDayMatch[2], 10);
      const target = new Date(today.getFullYear(), monthNum, day);
      // If the date has passed this year, use next year
      if (target < today) {
        target.setFullYear(target.getFullYear() + 1);
      }
      return {
        dueDate: toISODate(target),
        recurrenceRule: null,
        matchedText: text,
        description: target.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      };
    }
  }

  return null;
}

/**
 * Try to extract a date expression from a longer string.
 * Returns the result and the remaining text with the date expression removed.
 */
export function extractDateFromText(
  input: string,
  now?: Date,
): { result: NLDateResult; remainingText: string } | null {
  // Try the whole string first
  const full = parseNLDate(input, now);
  if (full) {
    return { result: full, remainingText: "" };
  }

  // Try common suffixes: "Buy milk tomorrow", "Meeting next friday"
  const suffixPatterns = [
    /\b(today|tomorrow|yesterday)$/i,
    /\b(next\s+\w+)$/i,
    /\b(in\s+\d+\s+\w+)$/i,
    /\b(every\s+\d*\s*\w+)$/i,
    /\b(\d{4}-\d{2}-\d{2})$/i,
  ];

  for (const pattern of suffixPatterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      const dateText = match[1];
      const result = parseNLDate(dateText, now);
      if (result) {
        const remaining = input.slice(0, match.index).trim();
        return { result, remainingText: remaining };
      }
    }
  }

  return null;
}
