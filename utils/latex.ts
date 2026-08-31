/**
 * Clean and format LaTeX strings for proper rendering with KaTeX
 */
export const cleanLatex = (text: string): string => {
  if (!text) return '';
  
  let cleaned = text;
  
  // 🚨 Step 1 & 2: Backslash တွေကို စနစ်တကျ ပြန်လည်ပြင်ဆင်ခြင်း
  cleaned = cleaned.replace(/\\\\/g, '\\');
  cleaned = cleaned.replace(/\\\\\\\\/g, '\\');
  
  // 🚨 Step 3: Display Math Formulas ($$ wrapper)
  const displayMathPatterns = [
    /\\lim_/g,
    /\\int_/g,
    /\\sum_/g,
    /\\prod_/g,
    /\\frac\{/g,
    /\\sqrt\[/g,
  ];
  
  const hasDisplayMath = displayMathPatterns.some(pattern => pattern.test(cleaned));
  const hasDollarWrapper = /\$\$[\s\S]*?\$\$/.test(cleaned) || /\$[^$]+\$/.test(cleaned);
  
  if (hasDisplayMath && !hasDollarWrapper) {
    // 🚨 FIXED: $ သင်္ကေတကို string အဖြစ် ပေါင်းစပ်ခြင်း
    cleaned = "$$" + cleaned + "$$";
  }
  
  // 🚨 Step 4: Inline math fix
  cleaned = cleaned.replace(
    /(?<!\$)([A-Za-z]\s*=\s*[A-Za-z0-9]+(?:\s*[+\-*/]\s*[A-Za-z0-9]+)*)(?!\$)/g,
    (match) => {
      if (/[=^_]/.test(match) && !/\$/.test(match)) {
        // 🚨 FIXED: Template literal အမှားကို ပြင်ဆင်ခြင်း
        return "$" + match + "$";
      }
      return match;
    }
  );
  
  return cleaned;
};

/**
 * Process chat message text
 */
export const processChatText = (text: string): string => {
  if (!text) return '';
  
  let processed = text;
  
  try {
    if (processed.includes('\\\\frac') || processed.includes('\\\\lim')) {
      processed = processed.replace(/\\\\/g, '\\');
    }
  } catch (e) {
    console.error("LaTeX processing error", e);
  }
  
  const hasLatexCommands = /\\[a-zA-Z]+/.test(processed);
  const hasWrapper = /\$[^$]+\$/.test(processed) || /\$\$[\s\S]*?\$\$/.test(processed);
  
  if (hasLatexCommands && !hasWrapper) {
    // 🚨 FIXED: Template literal အမှားကို ပြင်ဆင်ခြင်း
    processed = "$$" + processed + "$$";
  }
  
  return processed;
};
