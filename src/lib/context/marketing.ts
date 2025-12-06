/**
 * Marketing Context
 * Brand voice, tone, and messaging guidelines
 */

export interface MarketingContext {
    brandName: string;
    brandVoice: string[];
    brandTone: string;
    targetAudience: string;
    valueProposition: string;
    keyMessages: string[];
    brandDonts?: string[];
    contentDonts: string[];
    competitorDifferentiators: string[];
}

/**
 * Example marketing context for testing
 */
export const EVERREACH_MARKETING_CONTEXT: MarketingContext = {
    brandName: 'Everreach',
    brandVoice: ['Direct', 'Confident', 'Helpful'],
    brandTone: 'Professional yet approachable',
    targetAudience: 'Sales teams and revenue leaders at mid-market B2B companies',
    valueProposition: 'AI-powered CRM that helps sales teams close more deals faster',
    keyMessages: [
        'AI that works for you, not against you',
        'Close deals faster with intelligent automation',
        'Data-driven insights that actually matter'
    ],
    contentDonts: [
        'Don\'t use buzzwords like "revolutionary" or "game-changing"',
        'Don\'t make unsubstantiated claims',
        'Don\'t use passive voice excessively',
        'Don\'t be overly salesy or pushy'
    ],
    competitorDifferentiators: [
        'Native AI integration vs bolt-on solutions',
        'Built for mid-market vs enterprise-only or SMB-focused',
        'Actionable insights vs raw data dumps'
    ]
};

/**
 * Create a custom marketing context
 */
export function createMarketingContext(
    brandName: string,
    options: Partial<MarketingContext> = {}
): MarketingContext {
    return {
        brandName,
        brandVoice: options.brandVoice || ['Professional', 'Clear', 'Helpful'],
        brandTone: options.brandTone || 'Professional',
        targetAudience: options.targetAudience || 'Business professionals',
        valueProposition: options.valueProposition || `${brandName} helps businesses succeed`,
        keyMessages: options.keyMessages || [],
        contentDonts: options.contentDonts || [],
        competitorDifferentiators: options.competitorDifferentiators || []
    };
}
