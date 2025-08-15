'use client';

export function QuestoesSemanaisSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="h-10 bg-gray-400 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-400 rounded w-3/4 mx-auto mb-6"></div>
            <div className="h-8 bg-gray-400 rounded w-1/3 mx-auto"></div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-400 rounded-lg p-4 animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Progresso skeleton */}
        <div className="bg-white rounded-lg p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-3 bg-gray-100 rounded-lg">
                <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Semana atual skeleton */}
        <div className="bg-white rounded-lg p-6 animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-16 bg-gray-200 rounded w-24"></div>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                
                <div className="space-y-2 mb-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-12 bg-gray-100 rounded-lg"></div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-3 bg-gray-100 rounded-lg">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
            
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </div>

        {/* Roadmap skeleton */}
        <div className="bg-white rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
