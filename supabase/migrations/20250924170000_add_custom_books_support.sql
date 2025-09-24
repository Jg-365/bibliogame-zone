-- Add is_custom column to books table to identify custom books

ALTER TABLE books ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- Create an index for better performance when filtering custom books
CREATE INDEX IF NOT EXISTS idx_books_is_custom ON books(is_custom);
