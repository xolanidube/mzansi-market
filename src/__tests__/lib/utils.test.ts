import {
  cn,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  truncate,
  getInitials,
  slugify,
  isValidEmail,
  generateRandomString,
  calculateAverageRating,
  formatPhoneNumber,
} from "@/lib/utils";

describe("cn (classnames)", () => {
  it("combines multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatCurrency", () => {
  it("formats number as ZAR currency", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1");
    expect(result).toContain("234");
  });

  it("handles string input", () => {
    const result = formatCurrency("99.99");
    expect(result).toContain("99");
  });

  it("handles zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });
});

describe("formatDate", () => {
  it("formats Date object", () => {
    const date = new Date("2024-01-15");
    const result = formatDate(date);
    expect(result).toContain("2024");
    expect(result).toContain("15");
  });

  it("formats string date", () => {
    const result = formatDate("2024-06-20");
    expect(result).toContain("2024");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'just now' for recent times", () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe("5 minutes ago");
  });

  it("returns hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe("2 hours ago");
  });

  it("returns days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe("3 days ago");
  });
});

describe("truncate", () => {
  it("truncates long text", () => {
    const text = "This is a very long text that needs to be truncated";
    expect(truncate(text, 20)).toBe("This is a very lo...");
  });

  it("does not truncate short text", () => {
    const text = "Short text";
    expect(truncate(text, 20)).toBe("Short text");
  });

  it("handles exact length", () => {
    const text = "Exact";
    expect(truncate(text, 5)).toBe("Exact");
  });
});

describe("getInitials", () => {
  it("returns initials for full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("handles single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("handles multiple names", () => {
    expect(getInitials("John Paul Smith")).toBe("JP");
  });

  it("returns uppercase", () => {
    expect(getInitials("jane doe")).toBe("JD");
  });
});

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(slugify("Hello    World")).toBe("hello-world");
  });

  it("handles existing hyphens", () => {
    expect(slugify("hello-world")).toBe("hello-world");
  });
});

describe("isValidEmail", () => {
  it("validates correct email", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
  });

  it("validates email with subdomain", () => {
    expect(isValidEmail("test@mail.example.com")).toBe(true);
  });

  it("rejects email without @", () => {
    expect(isValidEmail("testexample.com")).toBe(false);
  });

  it("rejects email without domain", () => {
    expect(isValidEmail("test@")).toBe(false);
  });

  it("rejects email with spaces", () => {
    expect(isValidEmail("test @example.com")).toBe(false);
  });
});

describe("generateRandomString", () => {
  it("generates string of correct length", () => {
    expect(generateRandomString(10)).toHaveLength(10);
    expect(generateRandomString(20)).toHaveLength(20);
  });

  it("generates different strings", () => {
    const str1 = generateRandomString(10);
    const str2 = generateRandomString(10);
    expect(str1).not.toBe(str2);
  });

  it("contains only alphanumeric characters", () => {
    const str = generateRandomString(100);
    expect(str).toMatch(/^[A-Za-z0-9]+$/);
  });
});

describe("calculateAverageRating", () => {
  it("calculates average correctly", () => {
    expect(calculateAverageRating([5, 4, 3, 4, 4])).toBe(4);
  });

  it("handles single rating", () => {
    expect(calculateAverageRating([5])).toBe(5);
  });

  it("returns 0 for empty array", () => {
    expect(calculateAverageRating([])).toBe(0);
  });

  it("rounds to one decimal", () => {
    expect(calculateAverageRating([5, 4, 4])).toBe(4.3);
  });
});

describe("formatPhoneNumber", () => {
  it("formats 10-digit SA number", () => {
    expect(formatPhoneNumber("0821234567")).toBe("082 123 4567");
  });

  it("formats number with country code", () => {
    expect(formatPhoneNumber("27821234567")).toBe("+27 82 123 4567");
  });

  it("returns original if format unknown", () => {
    expect(formatPhoneNumber("123456")).toBe("123456");
  });

  it("strips non-digit characters", () => {
    expect(formatPhoneNumber("082-123-4567")).toBe("082 123 4567");
  });
});
