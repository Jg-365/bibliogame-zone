import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const PostSkeleton: React.FC = () => {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center space-x-4 mt-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const PostListSkeleton: React.FC<{
  count?: number;
}> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </div>
  );
};

export const CommentsLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 mt-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start space-x-3"
        >
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

interface ErrorStateProps {
  error: Error | null;
  onRetry?: () => void;
  message?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  message = "Algo deu errado ao carregar os posts",
}) => {
  return (
    <Card className="w-full">
      <CardContent className="p-6 text-center">
        <div className="space-y-4">
          <div className="text-red-500 font-medium">
            {message}
          </div>
          {error && (
            <div className="text-sm text-gray-500">
              {error.message}
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const EmptyState: React.FC<{ message?: string }> = ({
  message = "Nenhum post encontrado",
}) => {
  return (
    <Card className="w-full">
      <CardContent className="p-6 text-center">
        <div className="text-gray-500">{message}</div>
      </CardContent>
    </Card>
  );
};
