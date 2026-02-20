'use client';

import { useState, ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

export interface WizardStep {
    id: string;
    title: string;
    description?: string;
    content: ReactNode;
    validate?: () => boolean | Promise<boolean>;
}

interface FormWizardProps {
    steps: WizardStep[];
    onComplete: () => void | Promise<void>;
    onCancel?: () => void;
    className?: string;
    showStepNumbers?: boolean;
}

export function FormWizard({
    steps,
    onComplete,
    onCancel,
    className = '',
    showStepNumbers = true
}: FormWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [isValidating, setIsValidating] = useState(false);

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;
    const currentStepData = steps[currentStep];

    const handleNext = async () => {
        if (currentStepData.validate) {
            setIsValidating(true);
            try {
                const isValid = await currentStepData.validate();
                if (!isValid) {
                    setIsValidating(false);
                    return;
                }
            } catch (error) {
                console.error('Validation error:', error);
                setIsValidating(false);
                return;
            }
            setIsValidating(false);
        }

        setCompletedSteps(prev => new Set(prev).add(currentStep));

        if (isLastStep) {
            await onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleStepClick = (stepIndex: number) => {
        // Only allow clicking on completed steps or the current step
        if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
            setCurrentStep(stepIndex);
        }
    };

    const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
        if (completedSteps.has(stepIndex) && stepIndex !== currentStep) {
            return 'completed';
        }
        if (stepIndex === currentStep) {
            return 'current';
        }
        return 'upcoming';
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Step indicators */}
            <div className="mb-8">
                <nav aria-label="Progress">
                    <ol className="flex items-center">
                        {steps.map((step, index) => {
                            const status = getStepStatus(index);
                            const isClickable = index <= currentStep || completedSteps.has(index);

                            return (
                                <li
                                    key={step.id}
                                    className={`relative ${index !== steps.length - 1 ? 'flex-1 pr-8 sm:pr-20' : ''}`}
                                >
                                    {/* Connector line */}
                                    {index !== steps.length - 1 && (
                                        <div
                                            className="absolute top-4 left-0 right-0 h-0.5 -translate-y-1/2"
                                            aria-hidden="true"
                                        >
                                            <div
                                                className={`h-full ${
                                                    status === 'completed'
                                                        ? 'bg-blue-600'
                                                        : 'bg-gray-200'
                                                }`}
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleStepClick(index)}
                                        disabled={!isClickable}
                                        className={`
                                            relative flex items-center group
                                            ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                                        `}
                                    >
                                        <span className="flex items-center">
                                            <span
                                                className={`
                                                    flex h-8 w-8 items-center justify-center rounded-full
                                                    transition-colors
                                                    ${status === 'completed'
                                                        ? 'bg-blue-600 hover:bg-blue-700'
                                                        : status === 'current'
                                                            ? 'border-2 border-blue-600 bg-white'
                                                            : 'border-2 border-gray-300 bg-white'
                                                    }
                                                `}
                                            >
                                                {status === 'completed' ? (
                                                    <Check className="h-5 w-5 text-white" />
                                                ) : (
                                                    showStepNumbers && (
                                                        <span
                                                            className={`text-sm font-medium ${
                                                                status === 'current'
                                                                    ? 'text-blue-600'
                                                                    : 'text-gray-500'
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </span>
                                                    )
                                                )}
                                            </span>
                                        </span>
                                        <span className="ml-3 hidden sm:block">
                                            <span
                                                className={`text-sm font-medium ${
                                                    status === 'current'
                                                        ? 'text-blue-600'
                                                        : status === 'completed'
                                                            ? 'text-gray-900'
                                                            : 'text-gray-500'
                                                }`}
                                            >
                                                {step.title}
                                            </span>
                                            {step.description && (
                                                <p className="text-xs text-gray-500">
                                                    {step.description}
                                                </p>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </div>

            {/* Current step content */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:hidden">
                    {currentStepData.title}
                </h2>
                {currentStepData.description && (
                    <p className="text-sm text-gray-600 mb-4 sm:hidden">
                        {currentStepData.description}
                    </p>
                )}
                <div className="min-h-[300px]">
                    {currentStepData.content}
                </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div>
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    )}
                </div>

                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={isFirstStep}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>

                    <Button
                        type="button"
                        onClick={handleNext}
                        disabled={isValidating}
                    >
                        {isValidating ? (
                            'Validating...'
                        ) : isLastStep ? (
                            'Complete'
                        ) : (
                            <>
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default FormWizard;
