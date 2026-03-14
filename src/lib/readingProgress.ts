type BookLike = {
  id: string;
  status?: string | null;
  date_completed?: string | null;
  updated_at?: string | null;
};

type SessionLike = {
  book_id?: string | null;
  session_date?: string | null;
};

export const isCompletedBookStatus = (status?: string | null) =>
  ["completed", "lido"].includes(String(status ?? "").toLowerCase());

const getTimestamp = (value?: string | null) => {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
};

export const getLatestSessionDateForBook = <TSession extends SessionLike>(
  bookId: string,
  sessions: TSession[] = [],
) => {
  let latest: string | null = null;
  let latestTs = Number.NaN;

  sessions.forEach((session) => {
    if (session.book_id !== bookId || !session.session_date) return;
    const ts = getTimestamp(session.session_date);
    if (Number.isNaN(ts)) return;
    if (Number.isNaN(latestTs) || ts > latestTs) {
      latestTs = ts;
      latest = session.session_date;
    }
  });

  return latest;
};

export const getBookCompletionReference = <TBook extends BookLike, TSession extends SessionLike>(
  book: TBook,
  sessions: TSession[] = [],
) => {
  if (!isCompletedBookStatus(book.status)) return null;
  return (
    book.date_completed || getLatestSessionDateForBook(book.id, sessions) || book.updated_at || null
  );
};

export const isBookCompletedInYear = <TBook extends BookLike, TSession extends SessionLike>(
  book: TBook,
  year: number,
  sessions: TSession[] = [],
) => {
  const reference = getBookCompletionReference(book, sessions);
  if (!reference) return false;
  const timestamp = getTimestamp(reference);
  if (Number.isNaN(timestamp)) return false;
  return new Date(timestamp).getFullYear() === year;
};
