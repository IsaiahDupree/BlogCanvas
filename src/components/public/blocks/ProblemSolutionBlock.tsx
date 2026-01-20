import type { ProblemSolutionBlock as ProblemSolutionBlockType } from '@/types/offer-page';

interface ProblemSolutionBlockProps {
  data: ProblemSolutionBlockType['data'];
  preview?: boolean;
}

export default function ProblemSolutionBlock({ data, preview }: ProblemSolutionBlockProps) {
  return (
    <section className="py-16 px-6 md:px-12 lg:px-20 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Problem */}
          <div className="bg-red-50 p-8 rounded-lg border border-red-200">
            <h3 className="text-2xl font-bold text-red-900 mb-4">
              {data.problemHeadline || 'The Problem'}
            </h3>
            <p className="text-red-800 text-lg">
              {data.problemDescription || 'Describe the problem...'}
            </p>
          </div>

          {/* Solution */}
          <div className="bg-green-50 p-8 rounded-lg border border-green-200">
            <h3 className="text-2xl font-bold text-green-900 mb-4">
              {data.solutionHeadline || 'The Solution'}
            </h3>
            <p className="text-green-800 text-lg">
              {data.solutionDescription || 'Describe the solution...'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
