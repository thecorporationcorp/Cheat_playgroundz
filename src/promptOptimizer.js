/**
 * Smart Prompt Optimizer
 * Handles ANY input - even nonsense
 * Tier-based optimization with educational fallbacks
 */

export class PromptOptimizer {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Analyze input and determine optimization strategy
   */
  analyze(input) {
    const cleaned = String(input).trim();

    // Empty input
    if (!cleaned || cleaned.length === 0) {
      return {
        type: 'empty',
        quality: 0,
        suggestion: 'Start by describing what you want to accomplish'
      };
    }

    // Too short (likely nonsense or incomplete)
    if (cleaned.length < 10) {
      return {
        type: 'too_short',
        quality: 1,
        suggestion: 'Add more detail about your goal'
      };
    }

    // Nonsense detection (no vowels, random characters, etc.)
    const hasVowels = /[aeiou]/i.test(cleaned);
    const wordCount = cleaned.split(/\s+/).length;
    const avgWordLength = cleaned.replace(/\s/g, '').length / Math.max(wordCount, 1);

    if (!hasVowels || avgWordLength > 15 || wordCount === 1 && cleaned.length > 20) {
      return {
        type: 'nonsense',
        quality: 0,
        suggestion: 'Try describing your task in plain English'
      };
    }

    // Good input - determine quality level
    const hasQuestion = /\?/.test(cleaned);
    const hasAction = /(create|make|write|generate|analyze|explain|summarize|rewrite)/i.test(cleaned);
    const hasContext = wordCount > 15;

    let quality = 0;
    if (hasAction) quality += 3;
    if (hasQuestion) quality += 2;
    if (hasContext) quality += 3;
    if (wordCount > 5) quality += 2;

    return {
      type: 'valid',
      quality: Math.min(quality, 10),
      hasAction,
      hasContext,
      wordCount
    };
  }

  /**
   * Optimize prompt based on tier and input quality
   */
  optimize(input, tier = 'free') {
    const analysis = this.analyze(input);

    // Handle bad input with education
    if (analysis.type === 'empty') {
      return {
        success: false,
        original: input,
        optimized: null,
        message: '🤔 Your prompt is empty. Try something like: "Write a professional email about project status"',
        suggestion: analysis.suggestion,
        tier: 'free'
      };
    }

    if (analysis.type === 'nonsense' || analysis.type === 'too_short') {
      return {
        success: false,
        original: input,
        optimized: null,
        message: `🎯 Let's improve that prompt! ${analysis.suggestion}`,
        example: 'Good prompt: "Analyze this code for security vulnerabilities and suggest fixes"',
        tier: 'free'
      };
    }

    // Valid input - optimize based on tier
    switch (tier) {
      case 'free':
        return this.optimizeFree(input, analysis);

      case 'tier1':
        return this.optimizeTier1(input, analysis);

      case 'tier2':
        return this.optimizeTier2(input, analysis);

      case 'tier3':
        return this.optimizeTier3(input, analysis);

      default:
        return this.optimizeFree(input, analysis);
    }
  }

  /**
   * Free tier - basic cleanup and structure
   */
  optimizeFree(input, analysis) {
    const cleaned = input.trim();
    const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    const withPeriod = capitalized.endsWith('.') ? capitalized : `${capitalized}.`;

    return {
      success: true,
      original: input,
      optimized: withPeriod,
      improvements: ['Cleaned formatting', 'Added proper punctuation'],
      tier: 'free',
      quality: analysis.quality,
      upgradeSuggestion: analysis.quality < 7
        ? 'Upgrade to Tier 1 for context-aware refinement'
        : null
    };
  }

  /**
   * Tier 1 - Refined clarity + context awareness
   */
  optimizeTier1(input, analysis) {
    const free = this.optimizeFree(input, analysis);

    // Add behavioral context
    const enhanced = `${free.optimized} Provide a clear, well-structured response.`;

    return {
      ...free,
      optimized: enhanced,
      improvements: [
        ...free.improvements,
        'Added clarity instructions',
        'Enhanced response quality'
      ],
      tier: 'tier1',
      price: 0.99
    };
  }

  /**
   * Tier 2 - Structured logic + behavioral control
   */
  optimizeTier2(input, analysis) {
    const tier1 = this.optimizeTier1(input, analysis);

    const structured = {
      instruction: tier1.optimized,
      scenarios: {
        explicit: 'Execute with precision',
        vague: 'Ask clarifying questions',
        incomplete: 'Suggest next steps'
      },
      output_format: 'structured',
      tone: 'professional'
    };

    return {
      ...tier1,
      optimized: JSON.stringify(structured, null, 2),
      improvements: [
        ...tier1.improvements,
        'Added scenario handling',
        'Structured output format',
        'Behavioral constraints'
      ],
      tier: 'tier2',
      price: 2.99
    };
  }

  /**
   * Tier 3 - Full system prompt (your signature optimization)
   */
  optimizeTier3(input, analysis) {
    const system = {
      _exec: {
        dominance: 'high',
        instruction: input.toUpperCase()
      },
      scenarios: {
        explicit: 'Execute logic with zero-entropy precision',
        vague: 'Synthesize intent and establish architectural bounds',
        empty: 'Demonstrate intelligence via high-fidelity exemplar',
        conflict: 'Prioritize logical consistency and execution dominance'
      },
      behavioral_constraints: [
        'No meta-narration',
        'No conversational filler',
        'Strict behavioral control enforced'
      ],
      defaults: {
        mode: 'advanced',
        exemplar: 'Logic determines outcome'
      },
      context_profile: {
        no_context: 'demonstrate intelligence',
        light_context: 'organize & clarify',
        rich_context: 'amplify internal logic'
      }
    };

    return {
      success: true,
      original: input,
      optimized: JSON.stringify(system, null, 2),
      improvements: [
        'Full behavioral control',
        'Scenario-based execution',
        'Context-aware adaptation',
        'Zero-entropy precision',
        'Signature optimization'
      ],
      tier: 'tier3',
      price: 4.99,
      quality: 10
    };
  }
}

/**
 * Example usage
 */
export function testOptimizer() {
  const optimizer = new PromptOptimizer();

  // Test cases
  const tests = [
    '',
    'caca doo doo pants',
    'write email',
    'Write a professional email about project status',
    'Analyze this Python script for security vulnerabilities and suggest specific fixes with code examples'
  ];

  tests.forEach(test => {
    console.log('\n---');
    console.log('Input:', test);
    console.log('Free:', optimizer.optimize(test, 'free'));
  });
}
