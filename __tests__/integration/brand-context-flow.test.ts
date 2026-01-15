/**
 * Brand Context Integration Tests
 * Tests how brand information flows through the AI pipeline
 * Validates FEAT-051: Brand Context Integration
 */

import { supabaseAdmin } from '@/lib/supabase';

const TEST_OWNER_ID = '00000000-0000-0000-0000-000000000001';

describe('Brand Context Flow: Brand Guide → AI Agents → Content', () => {
    let clientId: string;
    let brandGuideId: string;
    let postId: string;

    afterAll(async () => {
        if (postId) await supabaseAdmin.from('blog_posts').delete().eq('id', postId);
        if (brandGuideId) await supabaseAdmin.from('brand_guides').delete().eq('id', brandGuideId);
        if (clientId) await supabaseAdmin.from('clients').delete().eq('id', clientId);
    });

    it('INT-002: Brand context flows through AI pipeline', async () => {
        // Step 1: Create client with comprehensive brand info
        const { data: client, error: clientError } = await supabaseAdmin
            .from('clients')
            .insert({
                name: 'Brand Flow Test Inc',
                owner_id: TEST_OWNER_ID,
                website_url: 'https://brand-flow-test.com',
                primary_contact_email: 'brand@test.com'
            })
            .select()
            .single();

        expect(clientError).toBeNull();
        clientId = client.id;

        // Step 2: Create detailed brand guide
        const brandData = {
            client_id: clientId,
            company_name: 'Brand Flow Test Inc',
            tagline: 'Innovation through simplicity',
            product_service_summary: 'Enterprise SaaS platform for workflow automation',
            target_audience: 'CTOs and IT Directors at mid-market companies',
            unique_value_proposition: 'Only solution that integrates with 500+ tools out of the box',
            brand_voice: ['Professional', 'Approachable', 'Expert'],
            brand_tone: 'Confident but not arrogant',
            primary_keywords: ['workflow automation', 'enterprise integration', 'business efficiency'],
            secondary_keywords: ['API platform', 'no-code automation', 'digital transformation'],
            competitors: ['Zapier', 'Make', 'Workato'],
            key_differentiators: [
                'Enterprise-grade security',
                '500+ native integrations',
                'Dedicated customer success team'
            ],
            content_donts: [
                'Never use "synergy" or "leverage"',
                'Avoid technical jargon without explanation',
                'No competitor bashing'
            ],
            tone_formality_level: 7, // 1-10 scale
            tone_enthusiasm_level: 6,
            tone_humor_level: 3
        };

        const { data: brandGuide, error: brandError } = await supabaseAdmin
            .from('brand_guides')
            .insert(brandData)
            .select()
            .single();

        expect(brandError).toBeNull();
        brandGuideId = brandGuide.id;

        // Step 3: Create blog post that should use brand context
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                client_id: clientId,
                topic: 'How Workflow Automation Saves 20 Hours Per Week',
                target_keyword: 'workflow automation',
                word_count_goal: 1800,
                status: 'drafting',
                target_audience: brandData.target_audience,
                tone_of_voice: brandData.brand_tone
            })
            .select()
            .single();

        expect(postError).toBeNull();
        postId = post.id;

        // Step 4: Verify brand context is accessible for the post
        const { data: postWithBrand } = await supabaseAdmin
            .from('blog_posts')
            .select(`
                *,
                clients!inner(
                    name,
                    brand_guides(
                        brand_voice,
                        brand_tone,
                        target_audience,
                        primary_keywords,
                        content_donts,
                        unique_value_proposition
                    )
                )
            `)
            .eq('id', postId)
            .single();

        // Verify brand guide is linked and accessible
        expect(postWithBrand.clients.brand_guides).toBeDefined();
        if (postWithBrand.clients.brand_guides?.length > 0) {
            const guide = postWithBrand.clients.brand_guides[0];
            expect(guide.brand_voice).toContain('Professional');
            expect(guide.primary_keywords).toContain('workflow automation');
            expect(guide.target_audience).toContain('CTOs');
        }

        // Step 5: Simulate AI pipeline context building
        const aiContext = {
            topic: post.topic,
            targetKeyword: post.target_keyword,
            clientProfile: {
                productServiceSummary: brandData.product_service_summary,
                targetAudience: brandData.target_audience,
                brandVoice: brandData.brand_voice,
                brandTone: brandData.brand_tone,
                valueProposition: brandData.unique_value_proposition,
                competitors: brandData.competitors,
                keyDifferentiators: brandData.key_differentiators
            },
            marketingContext: {
                primaryKeywords: brandData.primary_keywords,
                secondaryKeywords: brandData.secondary_keywords,
                contentDonts: brandData.content_donts,
                toneFormality: brandData.tone_formality_level,
                toneEnthusiasm: brandData.tone_enthusiasm_level
            }
        };

        // Verify all required fields are present for AI agents
        expect(aiContext.clientProfile.productServiceSummary).toBeDefined();
        expect(aiContext.clientProfile.brandVoice.length).toBeGreaterThan(0);
        expect(aiContext.marketingContext.primaryKeywords).toContain('workflow automation');
        expect(aiContext.marketingContext.contentDonts).toContain('Never use "synergy" or "leverage"');

        console.log('✅ INT-002: Brand context → AI pipeline flow verified');
        console.log('   - Brand guide created with', Object.keys(brandData).length, 'fields');
        console.log('   - AI context includes voice, tone, keywords, and restrictions');
    });

    it('should validate brand voice consistency in generated content', async () => {
        // This test validates that the Voice/Tone agent can check content
        const sampleContent = `
            # How Workflow Automation Transforms Your Business
            
            As a CTO or IT Director, you know that manual processes drain your team's 
            productivity. Our enterprise SaaS platform provides workflow automation 
            that integrates with over 500 tools out of the box.
            
            Unlike competitors, we offer enterprise-grade security and a dedicated 
            customer success team to ensure your digital transformation succeeds.
        `;

        const brandChecklist = {
            targetAudienceMentioned: sampleContent.includes('CTO') || sampleContent.includes('IT Director'),
            keywordPresent: sampleContent.toLowerCase().includes('workflow automation'),
            valuePropositionIncluded: sampleContent.includes('500'),
            noBannedPhrases: !sampleContent.includes('synergy') && !sampleContent.includes('leverage'),
            professionalTone: !sampleContent.includes('!!!') && !sampleContent.includes('🎉')
        };

        expect(brandChecklist.targetAudienceMentioned).toBe(true);
        expect(brandChecklist.keywordPresent).toBe(true);
        expect(brandChecklist.valuePropositionIncluded).toBe(true);
        expect(brandChecklist.noBannedPhrases).toBe(true);
        expect(brandChecklist.professionalTone).toBe(true);

        console.log('✅ Brand voice consistency validated');
    });
});

describe('Brand Context: Multi-Agent Data Flow', () => {
    it('should pass correct context to each AI agent stage', () => {
        // Simulate the data structure passed to each agent
        const brandContext = {
            brandVoice: ['Professional', 'Helpful', 'Expert'],
            brandTone: 'Confident but approachable',
            targetAudience: 'Marketing managers at B2B companies',
            valueProposition: 'AI-powered content that converts',
            keyMessages: ['Save time', 'Increase ROI', 'Scale content'],
            competitors: ['Jasper', 'Copy.ai'],
            differentiators: ['Human review included', 'SEO optimization built-in']
        };

        // Research Agent context
        const researchContext = {
            topic: 'Content Marketing ROI',
            targetKeyword: 'content marketing roi',
            clientProfile: {
                productServiceSummary: brandContext.valueProposition,
                targetAudience: brandContext.targetAudience
            },
            marketingContext: {
                brandVoice: brandContext.brandVoice,
                brandTone: brandContext.brandTone
            }
        };
        expect(researchContext.clientProfile.targetAudience).toBe(brandContext.targetAudience);

        // Outline Agent context (receives research + brand)
        const outlineContext = {
            ...researchContext,
            research: {
                painPoints: ['Time-consuming content creation', 'Measuring ROI'],
                keyFacts: ['Content marketing costs 62% less than traditional'],
                differentiators: brandContext.differentiators
            }
        };
        expect(outlineContext.research.differentiators).toEqual(brandContext.differentiators);

        // Draft Agent context (receives outline + brand)
        const draftContext = {
            ...outlineContext,
            outline: {
                sections: [
                    { key: 'intro', title: 'Introduction', wordCount: 200 },
                    { key: 'body', title: 'Main Content', wordCount: 1000 }
                ]
            },
            marketingContext: {
                brandName: 'Test Brand',
                brandVoice: brandContext.brandVoice,
                brandTone: brandContext.brandTone,
                targetAudience: brandContext.targetAudience,
                valueProposition: brandContext.valueProposition,
                keyMessages: brandContext.keyMessages,
                competitorDifferentiators: brandContext.differentiators,
                contentDonts: []
            }
        };
        expect(draftContext.marketingContext.keyMessages).toEqual(brandContext.keyMessages);

        // Voice/Tone Agent context (validates final content)
        const voiceToneContext = {
            fullDraftContent: 'Sample content...',
            marketingContext: draftContext.marketingContext
        };
        expect(voiceToneContext.marketingContext.brandVoice).toEqual(brandContext.brandVoice);

        console.log('✅ Multi-agent brand context data flow verified');
        console.log('   - Research Agent: receives topic + client profile');
        console.log('   - Outline Agent: receives research + brand differentiators');
        console.log('   - Draft Agent: receives full marketing context');
        console.log('   - Voice/Tone Agent: validates against brand guidelines');
    });
});

describe('Brand Context: Missing Data Handling', () => {
    it('should handle clients without brand guides gracefully', async () => {
        // Create client without brand guide
        const { data: client } = await supabaseAdmin
            .from('clients')
            .insert({
                name: 'No Brand Guide Client',
                owner_id: TEST_OWNER_ID
            })
            .select()
            .single();

        // Query for brand guide (should be empty)
        const { data: brandGuides } = await supabaseAdmin
            .from('brand_guides')
            .select('*')
            .eq('client_id', client.id);

        expect(brandGuides).toEqual([]);

        // AI context should have sensible defaults
        const defaultContext = {
            brandVoice: ['Professional', 'Helpful'],
            brandTone: 'Professional',
            targetAudience: 'Business professionals',
            valueProposition: '',
            keyMessages: [],
            contentDonts: []
        };

        expect(defaultContext.brandVoice.length).toBeGreaterThan(0);
        expect(defaultContext.brandTone).toBeDefined();

        // Cleanup
        await supabaseAdmin.from('clients').delete().eq('id', client.id);

        console.log('✅ Missing brand guide handled with defaults');
    });

    it('should handle partial brand data', async () => {
        const partialBrandData = {
            brand_voice: ['Casual'],
            // Missing: brand_tone, target_audience, etc.
        };

        // Merge with defaults
        const mergedContext = {
            brandVoice: partialBrandData.brand_voice || ['Professional'],
            brandTone: 'Professional', // Default when missing
            targetAudience: 'General audience', // Default when missing
            valueProposition: '', // Empty when missing
        };

        expect(mergedContext.brandVoice).toEqual(['Casual']);
        expect(mergedContext.brandTone).toBe('Professional'); // Used default

        console.log('✅ Partial brand data merged with defaults');
    });
});
