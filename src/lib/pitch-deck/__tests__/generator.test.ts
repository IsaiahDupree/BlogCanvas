/**
 * Pitch Deck Generator Tests
 */

import { 
  PitchDeckGenerator, 
  generatePitchDeckData,
  PitchDeckData 
} from '../generator';

describe('PitchDeckGenerator', () => {
  const mockPitchData: PitchDeckData = {
    clientName: 'Test Company',
    clientWebsite: 'https://testcompany.com',
    contactName: 'John Doe',
    currentSeoScore: 55,
    targetSeoScore: 80,
    pagesIndexed: 50,
    currentTopicCoverage: 40,
    topicGaps: [
      { cluster: 'Marketing', keyword: 'digital marketing', difficulty: 45, estimatedTraffic: 2000, priority: 'high' },
      { cluster: 'Sales', keyword: 'sales automation', difficulty: 60, estimatedTraffic: 1500, priority: 'medium' },
      { cluster: 'Support', keyword: 'customer support', difficulty: 30, estimatedTraffic: 3000, priority: 'high' }
    ],
    recommendedPosts: 36,
    timelineMonths: 6,
    postsPerMonth: 6,
    projectedTrafficIncrease: 45,
    projectedKeywordRankings: 25,
    vendorName: 'BlogCanvas Agency',
    csmName: 'Jane Smith',
    csmEmail: 'jane@blogcanvas.io',
    generatedDate: 'January 13, 2026'
  };

  describe('generate', () => {
    it('should generate a PDF blob', () => {
      const generator = new PitchDeckGenerator();
      const blob = generator.generate(mockPitchData);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('should generate a non-empty PDF', () => {
      const generator = new PitchDeckGenerator();
      const blob = generator.generate(mockPitchData);

      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle empty topic gaps', () => {
      const generator = new PitchDeckGenerator();
      const dataWithNoGaps = {
        ...mockPitchData,
        topicGaps: []
      };

      const blob = generator.generate(dataWithNoGaps);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('should handle many topic gaps (truncation)', () => {
      const generator = new PitchDeckGenerator();
      const manyGaps = Array(20).fill(null).map((_, i) => ({
        cluster: `Cluster ${i}`,
        keyword: `keyword ${i}`,
        difficulty: 50,
        estimatedTraffic: 1000,
        priority: 'medium' as const
      }));

      const dataWithManyGaps = {
        ...mockPitchData,
        topicGaps: manyGaps
      };

      const blob = generator.generate(dataWithManyGaps);
      expect(blob).toBeInstanceOf(Blob);
    });
  });
});

describe('generatePitchDeckData', () => {
  const mockClient = {
    name: 'Test Client',
    website_url: 'https://testclient.com'
  };

  const mockAudit = {
    baseline_score: 60,
    pages_indexed: 100
  };

  const mockTopicClusters = [
    { name: 'Topic 1', primary_keyword: 'keyword 1', difficulty: 40, estimated_traffic: 2000, currently_covered: false },
    { name: 'Topic 2', primary_keyword: 'keyword 2', difficulty: 70, estimated_traffic: 1000, currently_covered: true },
    { name: 'Topic 3', primary_keyword: 'keyword 3', difficulty: 30, estimated_traffic: 3000, currently_covered: false }
  ];

  const mockVendorInfo = {
    name: 'Test Agency',
    csmName: 'Test CSM',
    csmEmail: 'csm@test.com'
  };

  it('should generate pitch deck data with correct client info', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    expect(data.clientName).toBe('Test Client');
    expect(data.clientWebsite).toBe('https://testclient.com');
  });

  it('should use audit baseline score as current score', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    expect(data.currentSeoScore).toBe(60);
  });

  it('should calculate topic coverage percentage', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    // 1 out of 3 topics covered = 33%
    expect(data.currentTopicCoverage).toBe(33);
  });

  it('should filter uncovered topics as gaps', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    // 2 topics not covered
    expect(data.topicGaps).toHaveLength(2);
    expect(data.topicGaps.every(g => g.cluster !== 'Topic 2')).toBe(true);
  });

  it('should assign priority based on difficulty and traffic', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    // Low difficulty + high traffic = high priority
    const topic3Gap = data.topicGaps.find(g => g.cluster === 'Topic 3');
    expect(topic3Gap?.priority).toBe('high');
  });

  it('should use default target score of 80', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    expect(data.targetSeoScore).toBe(80);
  });

  it('should allow custom target score', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo, 90);

    expect(data.targetSeoScore).toBe(90);
  });

  it('should use default timeline of 6 months', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    expect(data.timelineMonths).toBe(6);
  });

  it('should allow custom timeline', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo, 80, 12);

    expect(data.timelineMonths).toBe(12);
  });

  it('should calculate recommended posts based on score difference', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    // Should recommend enough posts to close the gap
    expect(data.recommendedPosts).toBeGreaterThanOrEqual(data.topicGaps.length);
  });

  it('should calculate posts per month', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    expect(data.postsPerMonth).toBe(Math.ceil(data.recommendedPosts / data.timelineMonths));
  });

  it('should project traffic increase', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    expect(data.projectedTrafficIncrease).toBeGreaterThan(0);
  });

  it('should project keyword rankings (70% of posts)', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    expect(data.projectedKeywordRankings).toBe(Math.round(data.recommendedPosts * 0.7));
  });

  it('should include vendor info', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    expect(data.vendorName).toBe('Test Agency');
    expect(data.csmName).toBe('Test CSM');
    expect(data.csmEmail).toBe('csm@test.com');
  });

  it('should include generated date', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, mockTopicClusters, mockVendorInfo);

    expect(data.generatedDate).toBeDefined();
    expect(typeof data.generatedDate).toBe('string');
  });

  it('should handle empty topic clusters', () => {
    const data = generatePitchDeckData(mockClient, mockAudit, [], mockVendorInfo);

    expect(data.topicGaps).toHaveLength(0);
    expect(data.currentTopicCoverage).toBe(0);
  });

  it('should handle missing audit data', () => {
    const data = generatePitchDeckData(mockClient, {}, [], mockVendorInfo);

    expect(data.currentSeoScore).toBe(50); // Default
    expect(data.pagesIndexed).toBe(0);
  });
});
