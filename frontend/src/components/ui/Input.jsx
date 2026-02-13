import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Input = React.forwardRef(({ label, error, icon: Icon, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200",
            Icon && "pl-10",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;