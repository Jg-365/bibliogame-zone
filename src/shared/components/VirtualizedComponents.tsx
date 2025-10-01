import React from "react";
import { useInView } from "react-intersection-observer";

// Simple component loader for now
const ComponentLoader: React.FC<{ message?: string }> = ({ message = "Carregando..." }) => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
    <span className="text-sm text-muted-foreground">{message}</span>
  </div>
);

// =============================================================================
// SIMPLE VIRTUALIZED LIST (WITHOUT react-window FOR NOW)
// =============================================================================

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (props: { item: T; index: number }) => React.ReactNode;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  itemsPerPage?: number;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  className = "",
  loading = false,
  emptyMessage = "Nenhum item encontrado",
  itemsPerPage = 20,
  onLoadMore,
  hasNextPage = false,
  isLoadingMore = false,
}: VirtualizedListProps<T>) {
  const [visibleItems, setVisibleItems] = React.useState(itemsPerPage);

  const loadMoreItems = React.useCallback(() => {
    setVisibleItems(prev => prev + itemsPerPage);
  }, [itemsPerPage]);

  const displayedItems = items.slice(0, visibleItems);
  const hasMoreLocal = visibleItems < items.length;

  if (loading) {
    return (
      <div className={`virtualized-list-loading ${className}`}>
        <ComponentLoader message="Carregando lista..." />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`virtualized-list-empty ${className}`}>
        <div className="flex items-center justify-center h-full text-muted-foreground py-8">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`virtualized-list ${className}`}>
      <div className="space-y-2">
        {displayedItems.map((item, index) => (
          <div key={index}>{renderItem({ item, index })}</div>
        ))}
      </div>

      {(hasMoreLocal || hasNextPage) && (
        <InfiniteLoader
          onLoadMore={hasMoreLocal ? loadMoreItems : onLoadMore}
          isLoading={isLoadingMore}
          hasMore={hasMoreLocal || hasNextPage}
        />
      )}
    </div>
  );
}

// =============================================================================
// SIMPLE GRID COMPONENT
// =============================================================================

interface VirtualizedGridProps<T> {
  items: T[];
  columnCount: number;
  renderItem: (props: { item: T; index: number }) => React.ReactNode;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  gap?: number;
}

export function VirtualizedGrid<T>({
  items,
  columnCount,
  renderItem,
  className = "",
  loading = false,
  emptyMessage = "Nenhum item encontrado",
  gap = 16,
}: VirtualizedGridProps<T>) {
  if (loading) {
    return (
      <div className={`virtualized-grid-loading ${className}`}>
        <ComponentLoader message="Carregando grade..." />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`virtualized-grid-empty ${className}`}>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-${gap / 4} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {items.map((item, index) => (
        <div key={index}>{renderItem({ item, index })}</div>
      ))}
    </div>
  );
}

// =============================================================================
// INFINITE LOADING COMPONENT
// =============================================================================

interface InfiniteLoaderProps {
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  threshold?: number;
  loadingMessage?: string;
  endMessage?: string;
}

export const InfiniteLoader: React.FC<InfiniteLoaderProps> = ({
  onLoadMore,
  isLoading = false,
  hasMore = true,
  threshold = 0.1,
  loadingMessage = "Carregando mais itens...",
  endMessage = "Todos os itens foram carregados",
}) => {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: false,
  });

  React.useEffect(() => {
    if (inView && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoading, onLoadMore]);

  return (
    <div ref={ref} className="infinite-loader py-4 text-center">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          <span className="text-sm text-muted-foreground">{loadingMessage}</span>
        </div>
      ) : hasMore ? (
        <div className="text-sm text-muted-foreground">Role para carregar mais</div>
      ) : (
        <div className="text-sm text-muted-foreground">{endMessage}</div>
      )}
    </div>
  );
};

// =============================================================================
// BOOK LIST VIRTUALIZED COMPONENT
// =============================================================================

interface VirtualizedBookListProps {
  books: Array<{
    id: string;
    title: string;
    author: string;
    cover_url?: string;
    pages_read: number;
    total_pages: number;
    status: string;
  }>;
  onBookClick?: (bookId: string) => void;
  onBookAction?: (bookId: string, action: string) => void;
  height?: number;
  loading?: boolean;
}

export const VirtualizedBookList: React.FC<VirtualizedBookListProps> = ({
  books,
  onBookClick,
  onBookAction,
  height = 600,
  loading = false,
}) => {
  const renderBookItem = React.useCallback(
    ({ item: book, index, style }: any) => (
      <div
        style={style}
        className="flex items-center gap-4 p-4 border-b border-border hover:bg-muted/50 cursor-pointer"
        onClick={() => onBookClick?.(book.id)}
      >
        <div className="flex-shrink-0">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={`Capa de ${book.title}`}
              className="w-12 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
              <span className="text-xs text-muted-foreground">📚</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{book.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{book.author}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((book.pages_read / book.total_pages) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {book.pages_read}/{book.total_pages}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              book.status === "completed"
                ? "bg-green-100 text-green-700"
                : book.status === "reading"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {book.status === "completed"
              ? "Lido"
              : book.status === "reading"
              ? "Lendo"
              : "Não lido"}
          </span>

          <button
            onClick={e => {
              e.stopPropagation();
              onBookAction?.(book.id, "edit");
            }}
            className="p-1 hover:bg-muted rounded"
          >
            ✏️
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              onBookAction?.(book.id, "delete");
            }}
            className="p-1 hover:bg-muted rounded text-destructive"
          >
            🗑️
          </button>
        </div>
      </div>
    ),
    [onBookClick, onBookAction]
  );

  return (
    <VirtualizedList
      items={books}
      renderItem={renderBookItem}
      loading={loading}
      emptyMessage="Nenhum livro encontrado"
      className="border rounded-lg"
    />
  );
};

// =============================================================================
// ACHIEVEMENT GRID VIRTUALIZED COMPONENT
// =============================================================================

interface VirtualizedAchievementGridProps {
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    rarity: "common" | "rare" | "epic" | "legendary";
  }>;
  onAchievementClick?: (achievementId: string) => void;
  loading?: boolean;
}

export const VirtualizedAchievementGrid: React.FC<VirtualizedAchievementGridProps> = ({
  achievements,
  onAchievementClick,
  loading = false,
}) => {
  const renderAchievementItem = React.useCallback(
    ({ item: achievement, style }: any) => (
      <div
        style={style}
        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
          achievement.unlocked
            ? "bg-background border-primary shadow-sm"
            : "bg-muted/50 border-muted-foreground/20 opacity-60"
        } hover:scale-105`}
        onClick={() => onAchievementClick?.(achievement.id)}
      >
        <div className="text-center">
          <div className={`text-3xl mb-2 ${achievement.unlocked ? "" : "grayscale"}`}>
            {achievement.icon}
          </div>

          <h3
            className={`font-medium text-sm mb-1 ${
              achievement.unlocked ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {achievement.title}
          </h3>

          <p className="text-xs text-muted-foreground leading-tight">{achievement.description}</p>

          <div
            className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
              achievement.rarity === "legendary"
                ? "bg-yellow-100 text-yellow-700"
                : achievement.rarity === "epic"
                ? "bg-purple-100 text-purple-700"
                : achievement.rarity === "rare"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {achievement.rarity === "legendary"
              ? "Lendária"
              : achievement.rarity === "epic"
              ? "Épica"
              : achievement.rarity === "rare"
              ? "Rara"
              : "Comum"}
          </div>
        </div>
      </div>
    ),
    [onAchievementClick]
  );

  return (
    <VirtualizedGrid
      items={achievements}
      columnCount={3}
      renderItem={renderAchievementItem}
      loading={loading}
      emptyMessage="Nenhuma conquista encontrada"
      className="achievement-grid"
      gap={16}
    />
  );
};
