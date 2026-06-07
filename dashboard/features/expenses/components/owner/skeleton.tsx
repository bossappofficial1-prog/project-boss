"use client";

export function ExpensesSkeleton() {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
			<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
			<div className="space-y-2">
				{Array.from({ length: 6 }).map((_, idx) => (
					<div key={idx} className="h-10 bg-gray-100 dark:bg-gray-700 rounded"></div>
				))}
			</div>
		</div>
	);
}

export default ExpensesSkeleton;

