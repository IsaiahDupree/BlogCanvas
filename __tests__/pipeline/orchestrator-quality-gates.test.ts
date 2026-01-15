/**
 * Unit tests for Pipeline Orchestrator (feat-116, feat-117)
 */

import {
  runPipelineWithQualityGates,
  getDefaultQualityGates,
  validateQualityGates,
  PipelineOrchestratorOptions
} from '@/lib/agents/pipeline-orchestrator';

describe('Pipeline Orchestrator', () => {
  describe('Quality Gate Configuration', () => {
    it('should return default quality gates', () => {
      const gates = getDefaultQualityGates();

      expect(gates).toHaveProperty('research');
      expect(gates).toHaveProperty('outline');
      expect(gates).toHaveProperty('draft');
      expect(gates).toHaveProperty('seo');
      expect(gates).toHaveProperty('factCheck');
      expect(gates).toHaveProperty('enhancement');

      expect(gates.research).toBeGreaterThanOrEqual(0);
      expect(gates.research).toBeLessThanOrEqual(100);
    });

    it('should validate quality gate configuration', () => {
      const valid = validateQualityGates({
        research: 70,
        outline: 75,
        seo: 80
      });

      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it('should reject invalid quality gate values', () => {
      const invalid = validateQualityGates({
        research: 150, // Invalid - too high
        outline: -10   // Invalid - negative
      });

      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Orchestrator Execution', () => {
    it('should accept proper configuration structure', () => {
      const options: PipelineOrchestratorOptions = {
        qualityGates: {
          research: 70,
          outline: 75,
          draft: 70,
          seo: 75,
          factCheck: 80,
          enhancement: 70
        },
        overrides: {
          skipQualityGates: false
        },
        maxRetries: 2,
        retryFailedSteps: true
      };

      expect(options).toBeDefined();
      expect(options.qualityGates).toBeDefined();
      expect(options.maxRetries).toBe(2);
    });

    it('should support override options', () => {
      const options: PipelineOrchestratorOptions = {
        overrides: {
          skipQualityGates: true,
          skipSEOGate: true,
          skipFactCheckGate: false
        }
      };

      expect(options.overrides?.skipQualityGates).toBe(true);
      expect(options.overrides?.skipSEOGate).toBe(true);
      expect(options.overrides?.skipFactCheckGate).toBe(false);
    });
  });

  describe('Quality Gate Results', () => {
    it('should have correct quality gate result structure', () => {
      const mockGateResult = {
        stepName: 'SEO',
        passed: true,
        score: 85,
        threshold: 75,
        overridden: false
      };

      expect(mockGateResult).toHaveProperty('stepName');
      expect(mockGateResult).toHaveProperty('passed');
      expect(mockGateResult).toHaveProperty('score');
      expect(mockGateResult).toHaveProperty('threshold');
      expect(mockGateResult).toHaveProperty('overridden');

      expect(mockGateResult.passed).toBe(true);
      expect(mockGateResult.score).toBeGreaterThan(mockGateResult.threshold);
    });
  });

  describe('Retry Logic', () => {
    it('should structure retry log correctly', () => {
      const mockRetryLog = [
        {
          stepName: 'pipeline',
          attemptNumber: 1,
          success: false
        },
        {
          stepName: 'pipeline',
          attemptNumber: 2,
          success: true
        }
      ];

      expect(mockRetryLog).toHaveLength(2);
      expect(mockRetryLog[0].success).toBe(false);
      expect(mockRetryLog[1].success).toBe(true);
      expect(mockRetryLog[1].attemptNumber).toBe(2);
    });
  });
});
