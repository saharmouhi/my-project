const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "orders.db")
);

db.all(
  "SELECT id, product, created_at FROM orders ORDER BY id DESC LIMIT 5",
  (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      console.table(rows);
    }

    db.close();
  }
);
