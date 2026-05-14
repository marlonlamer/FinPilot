-- SQLite schema for savings transactions (if you prefer raw SQL)

CREATE TABLE IF NOT EXISTS savings_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  savings_id INTEGER NULL,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('deposit','withdraw')),
  note TEXT,
  date DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES User(id),
  FOREIGN KEY(savings_id) REFERENCES Savings(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user_id ON savings_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_savings_id ON savings_transactions(savings_id);

-- Example queries
-- Insert deposit
-- INSERT INTO savings_transactions (savings_id, user_id, amount, type, note) VALUES (1, 1, 100.0, 'deposit', 'Initial deposit');

-- Insert withdraw
-- INSERT INTO savings_transactions (savings_id, user_id, amount, type, note) VALUES (1, 1, -50.0, 'withdraw', 'Partial withdrawal');

-- Get balance for a savings account
-- SELECT COALESCE(SUM(amount), 0) as balance FROM savings_transactions WHERE user_id = ? AND savings_id = ?;

-- Get total savings balance for a user
-- SELECT COALESCE(SUM(amount), 0) as total_balance FROM savings_transactions WHERE user_id = ?;
