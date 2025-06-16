import { CheckIcon } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  steps: { label: string; completed: boolean }[];
}

export default function StepIndicator({
  currentStep,
  steps,
}: StepIndicatorProps) {
  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center relative">
            {/* Line connector */}
            {i > 0 && (
              <div
                className={`absolute top-4 w-full h-0.5 -left-1/2 ${
                  i <= currentStep ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
            
            {/* Circle */}
            <div
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 
                ${
                  i < currentStep
                    ? 'bg-primary border-primary text-white'
                    : i === currentStep
                    ? 'bg-white border-primary text-primary'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
            >
              {step.completed ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">{i + 1}</span>
              )}
            </div>
            
            {/* Label */}
            <span
              className={`mt-2 text-xs text-center
                ${
                  i <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 