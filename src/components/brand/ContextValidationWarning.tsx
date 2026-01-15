'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

/**
 * Context Validation Warning Component
 *
 * @feat-173 PRD Brand: Context validation before generation
 *
 * Displays validation warnings, suggestions, and allows override
 * for content generation despite missing fields.
 */

interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  defaultValue?: any;
}

interface ValidationData {
  isValid: boolean;
  completeness: number;
  canProceed: boolean;
  message: string;
  issues: ValidationIssue[];
  missingFields: string[];
  suggestions: Record<string, any>;
}

interface Props {
  clientId: string;
  onValidationComplete?: (result: ValidationData) => void;
  showDetails?: boolean;
  allowOverride?: boolean;
}

export function ContextValidationWarning({
  clientId,
  onValidationComplete,
  showDetails = true,
  allowOverride = true
}: Props) {
  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [overridden, setOverridden] = useState(false);

  useEffect(() => {
    async function fetchValidation() {
      try {
        setLoading(true);
        const response = await fetch(`/api/brand/validate-context?clientId=${clientId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to validate context');
        }

        setValidation(result.validation);
        if (onValidationComplete) {
          onValidationComplete(result.validation);
        }
      } catch (err) {
        console.error('Validation error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (clientId) {
      fetchValidation();
    }
  }, [clientId, onValidationComplete]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>Validating brand context...</span>
        </div>
      </Card>
    );
  }

  if (!validation) {
    return null;
  }

  // If validation is perfect, show success message
  if (validation.isValid) {
    return (
      <Alert variant="default" className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">Brand Context Complete</AlertTitle>
        <AlertDescription className="text-green-700">
          {validation.message}
        </AlertDescription>
      </Alert>
    );
  }

  const errorCount = validation.issues.filter(i => i.severity === 'error').length;
  const warningCount = validation.issues.filter(i => i.severity === 'warning').length;
  const infoCount = validation.issues.filter(i => i.severity === 'info').length;

  const alertVariant = !validation.canProceed ? 'destructive' :
                       warningCount > 0 ? 'default' : 'default';

  const Icon = !validation.canProceed ? XCircle :
               warningCount > 0 ? AlertTriangle : Info;

  return (
    <div className="space-y-3">
      <Alert variant={alertVariant as any}>
        <Icon className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Brand Context Validation</span>
          <Badge variant="outline" className="ml-2">
            {validation.completeness}% Complete
          </Badge>
        </AlertTitle>
        <AlertDescription>
          <div className="mt-2">
            {validation.message}
          </div>

          {/* Issue Summary */}
          {validation.issues.length > 0 && (
            <div className="mt-3 flex items-center gap-4 text-sm">
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-3 w-3" />
                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <AlertTriangle className="h-3 w-3" />
                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
              {infoCount > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Info className="h-3 w-3" />
                  {infoCount} info
                </span>
              )}
            </div>
          )}

          {/* Show Details Toggle */}
          {showDetails && validation.issues.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-3 h-auto p-0 text-sm hover:bg-transparent"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show details ({validation.issues.length})
                </>
              )}
            </Button>
          )}

          {/* Override Button */}
          {allowOverride && !validation.canProceed && !overridden && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800 mb-2">
                Critical fields are missing. Content quality may be poor.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOverridden(true)}
                className="bg-white"
              >
                Proceed Anyway
              </Button>
            </div>
          )}

          {overridden && (
            <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
              ⚠ Proceeding with incomplete brand context. Defaults will be used for missing fields.
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Detailed Issues */}
      {expanded && (
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-3">Validation Details</h4>
          <div className="space-y-3">
            {validation.issues.map((issue, index) => {
              const IssueIcon = issue.severity === 'error' ? XCircle :
                               issue.severity === 'warning' ? AlertTriangle : Info;
              const iconColor = issue.severity === 'error' ? 'text-red-600' :
                               issue.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600';

              return (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <IssueIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">{issue.field}</div>
                    <div className="text-sm text-gray-700 mt-1">{issue.message}</div>
                    {issue.suggestion && (
                      <div className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border">
                        💡 {issue.suggestion}
                      </div>
                    )}
                  </div>
                  <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                    {issue.severity}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
