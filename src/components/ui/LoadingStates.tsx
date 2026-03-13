import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Inbox } from "lucide-react";

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
        <div key={index} className="flex items-start space-x-3">
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
          <div className="font-medium text-destructive">{message}</div>
          <AlertCircle className="mx-auto h-8 w-8 text-destructive/70" />
          {error && <div className="text-sm text-muted-foreground">{error.message}</div>}
          {onRetry && (
            <Button onClick={onRetry} variant="destructive">
              Tentar novamente
            </Button>
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
        <Inbox className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <div className="text-muted-foreground">{message}</div>
      </CardContent>
    </Card>
  );
};
