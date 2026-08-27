const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || "admin";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "123456";

const sessions = new Set();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.use(
  express.static(
    path.join(__dirname, "..", "public")
  )
);

const db = new sqlite3.Database(
  path.join(__dirname, "..", "orders.db")
);

/* =========================
   DATABASE
========================= */

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      address TEXT,
      product TEXT,
      size TEXT,
      color TEXT,
      quantity INTEGER,
      status TEXT DEFAULT 'new'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product TEXT NOT NULL,
      size TEXT NOT NULL,
      color TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      UNIQUE(product, size, color)
    )
  `);

});

/* =========================
   COOKIES
========================= */

function parseCookies(req) {

  const cookies = {};

  const header =
    req.headers.cookie || "";

  header
    .split(";")
    .forEach((part) => {

      const index =
        part.indexOf("=");

      if (index === -1) {
        return;
      }

      const key =
        part
          .slice(0, index)
          .trim();

      const value =
        part
          .slice(index + 1)
          .trim();

      if (key) {
        cookies[key] =
          decodeURIComponent(value);
      }

    });

  return cookies;
}

/* =========================
   AUTH
========================= */

function isAuthenticated(req) {

  const cookies =
    parseCookies(req);

  return Boolean(
    cookies.fashion_admin_session &&
    sessions.has(
      cookies.fashion_admin_session
    )
  );
}

function requireAdmin(
  req,
  res,
  next
) {

  if (!isAuthenticated(req)) {

    if (
      req.path === "/dashboard"
    ) {
      return res.redirect(
        "/login"
      );
    }

    return res.status(401).json({
      success: false,
      message: "Non autorisÃ©."
    });

  }

  next();
}

/* =========================
   LOGIN PAGE
========================= */

app.get("/login", (req, res) => {

  res.send(`
<!doctype html>

<html lang="fr">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
/>

<title>SAERA AI â€” Login</title>

<style>

* {
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.box {
  width: min(420px, 92%);
  background: white;
  padding: 35px;
  border-radius: 18px;
  box-shadow:
    0 10px 40px rgba(0,0,0,.10);
}

h1 {
  text-align: center;
  margin: 0 0 8px;
}

.sub {
  text-align: center;
  color: #777;
  margin-bottom: 25px;
}

label {
  display: block;
  font-weight: bold;
  margin: 15px 0 7px;
}

input {
  width: 100%;
  padding: 14px;
  border: 1px solid #ddd;
  border-radius: 9px;
  font-size: 16px;
}

button {
  width: 100%;
  padding: 14px;
  margin-top: 22px;
  border: 0;
  border-radius: 9px;
  background: #111;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  background: #333;
}

#error {
  display: none;
  margin-top: 15px;
  padding: 12px;
  border-radius: 8px;
  background: #ffe0e0;
  color: #a00000;
  font-weight: bold;
}

/* ===== SAERA AI PROFESSIONAL UI ===== */

body{
  font-family:Inter,Arial,sans-serif;
  background:#f3f4f6;
  margin:0;
  padding:32px;
  color:#111827;
}

h1{
  font-size:32px;
  margin-bottom:35px;
  letter-spacing:-1px;
}

h2{
  font-size:24px;
  margin-bottom:22px;
}

.section{
  background:#ffffff;
  padding:28px;
  margin-bottom:28px;
  border-radius:18px;
  box-shadow:0 4px 18px rgba(0,0,0,.06);
  border:1px solid #e5e7eb;
}

table{
  width:100%;
  border-collapse:separate;
  border-spacing:0;
  overflow:hidden;
  border-radius:12px;
}

th{
  background:#111827;
  color:#fff;
  padding:15px 12px;
  font-size:14px;
  font-weight:600;
}

td{
  padding:15px 12px;
  border-bottom:1px solid #e5e7eb;
  background:#fff;
}

tr:last-child td{
  border-bottom:none;
}

tr:hover td{
  background:#f9fafb;
}

input,select{
  padding:11px 13px;
  border-radius:9px;
  border:1px solid #d1d5db;
  background:#fff;
  font-size:14px;
  outline:none;
}

input:focus,select:focus{
  border-color:#111827;
  box-shadow:0 0 0 3px rgba(17,24,39,.08);
}

button{
  padding:10px 14px;
  border-radius:9px;
  border:0;
  background:#111827;
  color:#fff;
  cursor:pointer;
  font-weight:600;
  transition:.2s;
}

button:hover{
  background:#374151;
  transform:translateY(-1px);
}

#addStockButton{
  padding:11px 18px;
}

#stock td:last-child{
  white-space:nowrap;
}

#stock td:last-child button{
  margin:2px;
  min-width:34px;
}

@media(max-width:900px){
  body{
    padding:15px;
  }

  .section{
    padding:18px;
    overflow-x:auto;
  }

  table{
    min-width:850px;
  }
}
</style>

</head>

<body>

<div class="box">

<h1>SAERA AI</h1>

<div class="sub">
Administration
</div>

<form id="loginForm">

<label>
Nom d'utilisateur
</label>

<input
  id="username"
  autocomplete="username"
  required
/>

<label>
Mot de passe
</label>

<input
  id="password"
  type="password"
  autocomplete="current-password"
  required
/>

<button type="submit">
Se connecter
</button>

<div id="error"></div>

</form>

</div>

<script>

document
  .getElementById("loginForm")
  .addEventListener(
    "submit",
    async function(e) {

      e.preventDefault();

      const error =
        document.getElementById(
          "error"
        );

      error.style.display =
        "none";

      const username =
        document
          .getElementById(
            "username"
          )
          .value
          .trim();

      const password =
        document
          .getElementById(
            "password"
          )
          .value;

      try {

        const response =
          await fetch(
            "/login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              credentials:
                "same-origin",

              body:
                JSON.stringify({
                  username,
                  password
                })
            }
          );

        const data =
          await response.json();

        if (data.success) {

          window.location.href =
            "/dashboard";

          return;
        }

        error.textContent =
          "âŒ " +
          (
            data.message ||
            "Identifiants incorrects."
          );

        error.style.display =
          "block";

      } catch (err) {

        error.textContent =
          "âŒ Serveur non disponible.";

        error.style.display =
          "block";

      }

    }
  );

</script>

<script>
</script>
</body>

</html>
`);

});
/* =========================
   LOGIN API
========================= */

app.post("/login", (req, res) => {

  const username =
    String(
      req.body?.username || ""
    ).trim();

  const password =
    String(
      req.body?.password || ""
    );

  if (
    username !==
      ADMIN_USERNAME ||
    password !==
      ADMIN_PASSWORD
  ) {

    return res.status(401).json({
      success: false,
      message:
        "Nom d'utilisateur ou mot de passe incorrect."
    });

  }

  const token =
    crypto
      .randomBytes(32)
      .toString("hex");

  sessions.add(token);

  res.setHeader(
    "Set-Cookie",
    "fashion_admin_session=" +
      encodeURIComponent(token) +
      "; HttpOnly; Path=/; SameSite=Lax"
  );

  res.json({
    success: true
  });

});

/* =========================
   LOGOUT
========================= */

app.post(
  "/logout",
  requireAdmin,
  (req, res) => {

    const cookies =
      parseCookies(req);

    const token =
      cookies.fashion_admin_session;

    if (token) {

      sessions.delete(token);

    }

    res.setHeader(
      "Set-Cookie",
      "fashion_admin_session=;" +
      " HttpOnly;" +
      " Path=/;" +
      " Max-Age=0;" +
      " SameSite=Lax"
    );

    res.json({
      success: true
    });

  }
);

/* =========================
   CHECK STOCK
========================= */

app.get(
  "/stock",
  (req, res) => {

    const product =
      String(
        req.query.product || ""
      ).trim();

    const size =
      String(
        req.query.size || ""
      ).trim();

    const color =
      String(
        req.query.color || ""
      ).trim();

    if (
      !product ||
      !size ||
      !color
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Product, size and color are required."
      });

    }

    db.get(
      `
      SELECT quantity
      FROM stock

      WHERE lower(trim(product))
        = lower(trim(?))

      AND lower(trim(size))
        = lower(trim(?))

      AND lower(trim(color))
        = lower(trim(?))
      `,
      [
        product,
        size,
        color
      ],
      (err, row) => {

        if (err) {

          return res.status(500).json({
            success: false,
            message: err.message
          });

        }

        const quantity =
          row
            ? Number(row.quantity)
            : 0;

        res.json({
          success: true,
          quantity,
          available:
            quantity > 0
        });

      }
    );

  }
);

/* =========================
   ADMIN STOCK
========================= */

app.get(
  "/api/stock",
  requireAdmin,
  (req, res) => {

    db.all(
      `
      SELECT
        id,
        product,
        size,
        color,
        quantity
      FROM stock
      ORDER BY id DESC
      `,
      [],
      (err, rows) => {

        if (err) {

          return res.status(500).json({
            success: false,
            message: err.message
          });

        }

        res.json({
          success: true,
          stock: rows
        });

      }
    );

  }
);
/* =========================
   ALL STOCK
========================= */

app.get(
  "/all-stock",
  requireAdmin,
  (req, res) => {

    db.all(
      `
      SELECT *
      FROM stock
      ORDER BY product, size, color
      `,
      [],
      (err, rows) => {

        if (err) {

          return res.status(500).json({
            success: false,
            message: err.message
          });

        }

        res.json({
          success: true,
          stock: rows
        });

      }
    );

  }
);

/* =========================
   ADMIN STOCK
========================= */

app.get(
  "/admin/stock",
  requireAdmin,
  (req, res) => {

    db.all(
      `
      SELECT *
      FROM stock
      ORDER BY id DESC
      `,
      [],
      (err, rows) => {

        if (err) {

          return res.status(500).json({
            success: false,
            message: err.message
          });

        }

        res.json({
          success: true,
          stock: rows
        });

      }
    );

  }
);

/* =========================
   CREATE / UPDATE STOCK
========================= */

app.post(
  "/stock",
  requireAdmin,
  (req, res) => {

    const product =
      String(
        req.body?.product || ""
      ).trim();

    const size =
      String(
        req.body?.size || ""
      ).trim();

    const color =
      String(
        req.body?.color || ""
      ).trim();

    const quantity =
      Number(
        req.body?.quantity
      );

    if (
      !product ||
      !size ||
      !color ||
      !Number.isInteger(
        quantity
      ) ||
      quantity < 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          "DonnÃ©es stock invalides."
      });

    }

    db.run(
      `
      INSERT INTO stock
      (
        product,
        size,
        color,
        quantity
      )

      VALUES (?, ?, ?, ?)

      ON CONFLICT(product, size, color)

      DO UPDATE SET
        quantity = excluded.quantity
      `,
      [
        product,
        size,
        color,
        quantity
      ],
      (err) => {

        if (err) {

          return res.status(500).json({
            success: false,
            message: err.message
          });

        }

        res.json({
          success: true,
          message:
            "Stock enregistrÃ©."
        });

      }
    );

  }
);


/* =========================
   ADJUST STOCK QUANTITY
========================= */

app.patch(
  "/stock/:id/quantity",
  requireAdmin,
  (req, res) => {

    const id = Number(req.params.id);
    const change = Number(req.body?.change);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !Number.isInteger(change) ||
      change === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Données invalides."
      });
    }

    db.run(
      `
      UPDATE stock
      SET quantity = quantity + ?
      WHERE id = ?
      AND quantity + ? >= 0
      `,
      [change, id, change],
      function (err) {

        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message
          });
        }

        if (this.changes === 0) {
          return res.status(400).json({
            success: false,
            message:
              "Stock introuvable ou quantité insuffisante."
          });
        }

        db.get(
          `
          SELECT
            id,
            product,
            size,
            color,
            quantity
          FROM stock
          WHERE id = ?
          `,
          [id],
          (selectErr, row) => {

            if (selectErr) {
              return res.status(500).json({
                success: false,
                message: selectErr.message
              });
            }

            res.json({
              success: true,
              message: "Stock mis à jour.",
              stock: row
            });

          }
        );

      }
    );

  }
);

/* =========================
   EDIT STOCK
========================= */

app.put(
  "/stock/:id",
  requireAdmin,
  (req, res) => {

    const id = Number(req.params.id);

    const product =
      String(req.body?.product || "").trim();

    const size =
      String(req.body?.size || "").trim();

    const color =
      String(req.body?.color || "").trim();

    const quantity =
      Number(req.body?.quantity);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !product ||
      !size ||
      !color ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Données invalides."
      });
    }

    db.run(
      `
      UPDATE stock
      SET
        product = ?,
        size = ?,
        color = ?,
        quantity = ?
      WHERE id = ?
      `,
      [
        product,
        size,
        color,
        quantity,
        id
      ],
      function (err) {

        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "Stock introuvable."
          });
        }

        res.json({
          success: true,
          message: "Stock modifié."
        });

      }
    );

  }
);


/* =========================
   DELETE STOCK
========================= */

app.delete(
  "/stock/:id",
  requireAdmin,
  (req, res) => {

    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "ID invalide."
      });
    }

    db.run(
      `
      DELETE FROM stock
      WHERE id = ?
      `,
      [id],
      function (err) {

        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "Stock introuvable."
          });
        }

        res.json({
          success: true,
          message: "Stock supprimé."
        });

      }
    );

  }
);

/* =========================
   CREATE ORDER
========================= */

app.post(
  "/orders",
  (req, res) => {

    const {
      name,
      phone,
      address,
      product,
      size,
      color,
      quantity
    } = req.body || {};

    const q =
      Number(quantity);

    if (
      !name ||
      !phone ||
      !address ||
      !product ||
      !size ||
      !color ||
      !Number.isInteger(q) ||
      q < 1
    ) {

      return res.status(400).json({
        success: false,
        message:
          "DonnÃ©es commande invalides."
      });

    }

    db.get(
      `
      SELECT id, quantity
      FROM stock

      WHERE lower(trim(product))
        = lower(trim(?))

      AND lower(trim(size))
        = lower(trim(?))

      AND lower(trim(color))
        = lower(trim(?))
      `,
      [
        product,
        size,
        color
      ],
      (err, row) => {

        if (err) {

          return res.status(500).json({
            success: false,
            message: err.message
          });

        }

        if (
          !row ||
          Number(row.quantity) < q
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Stock insuffisant."
          });

        }

        db.run(
          `
          INSERT INTO orders
          (
            name,
            phone,
            address,
            product,
            size,
            color,
            quantity,
            status,
            created_at
          )

          VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)
          `,
          [
            String(name).trim(),
            String(phone).trim(),
            String(address).trim(),
            String(product).trim(),
            String(size).trim(),
            String(color).trim(),
            q,
            new Date().toISOString()
          ],
                    function (insertErr) {

            if (insertErr) {

              return res.status(500).json({
                success: false,
                message:
                  insertErr.message
              });

            }

            db.run(
              `
              UPDATE stock

              SET quantity =
                quantity - ?

              WHERE id = ?
              `,
              [
                q,
                row.id
              ],
              (stockErr) => {

                if (stockErr) {

                  return res.status(500).json({
                    success: false,
                    message:
                      stockErr.message
                  });

                }

                res.json({
                  success: true,
                  message:
                    "Commande enregistrÃ©e.",
                  orderId: this.lastID
                });

              }
            );

          }
        );

      }
    );

  }
);
/* =========================
   START SERVER
========================= */


/* =========================
   GET ORDERS — DASHBOARD
========================= */

app.get("/orders", requireAdmin, (req, res) => {

  db.all(
    `
    SELECT
      id,
      name,
      phone,
      address,
      product,
      size,
      color,
      quantity,
      status,
      created_at
    FROM orders
    ORDER BY id DESC
    `,
    [],
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }

      res.json({
        success: true,
        orders: rows
      });

    }
  );

});


/* =========================
   UPDATE ORDER STATUS
========================= */

app.put("/orders/:id/status", requireAdmin, (req, res) => {

  const id = Number(req.params.id);

  const allowedStatuses = [
    "new",
    "confirmed",
    "preparing",
    "shipped",
    "delivered",
    "cancelled"
  ];

  const status =
    String(req.body?.status || "")
      .trim()
      .toLowerCase();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "ID commande invalide."
    });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Statut invalide."
    });
  }

  db.run(
    `
    UPDATE orders
    SET status = ?
    WHERE id = ?
    `,
    [status, id],
    function (err) {

      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Commande introuvable."
        });
      }

      res.json({
        success: true,
        message: "Statut mis à jour.",
        orderId: id,
        status: status
      });

    }
  );

});

app.get("/dashboard", requireAdmin, (req, res) => {
  res.send(`
<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SAERA AI — Dashboard</title>
<style>
body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:30px;color:#111}
h1{margin-bottom:30px}
.section{background:#fff;padding:25px;margin-bottom:25px;border-radius:12px}
table{width:100%;border-collapse:collapse}
th,td{padding:12px;border-bottom:1px solid #ddd;text-align:center}
th{background:#111;color:#fff}
input,select,button{padding:8px;border-radius:6px;border:1px solid #ccc}
button{background:#111;color:#fff;cursor:pointer}
/* ===== SAERA AI PROFESSIONAL UI ===== */

body{
  font-family:Inter,Arial,sans-serif;
  background:#f3f4f6;
  margin:0;
  padding:32px;
  color:#111827;
}

h1{
  font-size:32px;
  margin-bottom:35px;
  letter-spacing:-1px;
}

h2{
  font-size:24px;
  margin-bottom:22px;
}

.section{
  background:#ffffff;
  padding:28px;
  margin-bottom:28px;
  border-radius:18px;
  box-shadow:0 4px 18px rgba(0,0,0,.06);
  border:1px solid #e5e7eb;
}

table{
  width:100%;
  border-collapse:separate;
  border-spacing:0;
  overflow:hidden;
  border-radius:12px;
}

th{
  background:#111827;
  color:#fff;
  padding:15px 12px;
  font-size:14px;
  font-weight:600;
}

td{
  padding:15px 12px;
  border-bottom:1px solid #e5e7eb;
  background:#fff;
}

tr:last-child td{
  border-bottom:none;
}

tr:hover td{
  background:#f9fafb;
}

input,select{
  padding:11px 13px;
  border-radius:9px;
  border:1px solid #d1d5db;
  background:#fff;
  font-size:14px;
  outline:none;
}

input:focus,select:focus{
  border-color:#111827;
  box-shadow:0 0 0 3px rgba(17,24,39,.08);
}

button{
  padding:10px 14px;
  border-radius:9px;
  border:0;
  background:#111827;
  color:#fff;
  cursor:pointer;
  font-weight:600;
  transition:.2s;
}

button:hover{
  background:#374151;
  transform:translateY(-1px);
}

#addStockButton{
  padding:11px 18px;
}

#stock td:last-child{
  white-space:nowrap;
}

#stock td:last-child button{
  margin:2px;
  min-width:34px;
}

@media(max-width:900px){
  body{
    padding:15px;
  }

  .section{
    padding:18px;
    overflow-x:auto;
  }

  table{
    min-width:850px;
  }
}
</style>
</head>

<body>

<h1>📦 SAERA AI — Dashboard</h1>

<div class="section">
<h2>Commandes</h2>
<table>
<thead>
<tr>
<th>ID</th>
<th>Nom</th>
<th>Téléphone</th>
<th>Produit</th>
<th>Taille</th>
<th>Couleur</th>
<th>Quantité</th>
<th>Statut</th>
</tr>
</thead>
<tbody id="orders"></tbody>
</table>
</div>

<div class="section">
<h2>📦 Stock</h2>

<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
  <input id="newProduct" placeholder="Produit">
  <input id="newSize" placeholder="Taille">
  <input id="newColor" placeholder="Couleur">
  <input id="newQuantity" type="number" min="0" placeholder="Quantité">
  <button type="button" id="addStockButton" onclick="addStock()">+ Ajouter Stock</button>
</div>


<table>
<thead>
<tr>
<th>ID</th>
<th>Produit</th>
<th>Taille</th>
<th>Couleur</th>
<th>Stock</th><th>Actions</th>
</tr>
</thead>
<tbody id="stock"></tbody>
</table>
</div>

<script>

async function loadOrders(){

  const response = await fetch("/orders");
  const data = await response.json();

  const container =
    document.getElementById("orders");

  container.innerHTML = "";

  if(!data.success){
    container.innerHTML =
      "<tr><td colspan='8'>Erreur</td></tr>";
    return;
  }

  data.orders.forEach(order => {

    const row =
      document.createElement("tr");

    const statuses = [
      "new",
      "confirmed",
      "preparing",
      "shipped",
      "delivered",
      "cancelled"
    ];

    const select = document.createElement("select");

    statuses.forEach(status => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      option.selected = status === (order.status || "new");
      select.appendChild(option);
    });

    select.addEventListener("change", async () => {

      try {

        const response = await fetch(
          "/orders/" + order.id + "/status",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              status: select.value
            })
          }
        );

        const result = await response.json();

        if(!result.success){
          alert(result.message || "Erreur");
          select.value = order.status || "new";
          return;
        }

        order.status = result.status;

      } catch(error) {

        alert("Erreur de connexion au serveur.");
        select.value = order.status || "new";

      }

    });

    row.innerHTML =
      "<td>"+order.id+"</td>"+
      "<td>"+(order.name||"")+"</td>"+
      "<td>"+(order.phone||"")+"</td>"+
      "<td>"+(order.product||"")+"</td>"+
      "<td>"+(order.size||"")+"</td>"+
      "<td>"+(order.color||"")+"</td>"+
      "<td>"+(order.quantity||0)+"</td>"+
      "<td></td>";

    row.lastElementChild.appendChild(select);

    container.appendChild(row);

  });

}


async function loadStock(){

  try {

    const response = await fetch("/api/stock");
    const data = await response.json();

    const container = document.getElementById("stock");

    container.innerHTML = "";

    if(!data.success){
      container.innerHTML = "<tr><td colspan='6'>Erreur</td></tr>";
      return;
    }

    data.stock.forEach(item => {

      const row = document.createElement("tr");

      row.innerHTML =
        "<td>"+item.id+"</td>"+
        "<td>"+item.product+"</td>"+
        "<td>"+item.size+"</td>"+
        "<td>"+item.color+"</td>"+
        "<td>"+item.quantity+"</td>";

      const actions = document.createElement("td");

      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.onclick = function(){
        changeStock(item.id, 1);
      };

      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      minus.onclick = function(){
        changeStock(item.id, -1);
      };

      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "✏️";
      edit.onclick = function(){
        editStock(
          item.id,
          item.product,
          item.size,
          item.color,
          item.quantity
        );
      };

      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "🗑️";
      del.onclick = function(){
        deleteStock(item.id);
      };

      actions.appendChild(plus);
      actions.appendChild(document.createTextNode(" "));
      actions.appendChild(minus);
      actions.appendChild(document.createTextNode(" "));
      actions.appendChild(edit);
      actions.appendChild(document.createTextNode(" "));
      actions.appendChild(del);

      row.appendChild(actions);
      container.appendChild(row);

    });

  } catch(error) {

    console.error("LOAD STOCK ERROR:", error);
    alert("Erreur lors du chargement du stock.");

  }

}

async function addStock(){
  console.log("ADD STOCK CLICKED");

  const product =
    document.getElementById("newProduct").value.trim();

  const size =
    document.getElementById("newSize").value.trim();

  const color =
    document.getElementById("newColor").value.trim();

  const quantity =
    Number(document.getElementById("newQuantity").value);

  if(!product || !size || !color || !Number.isInteger(quantity) || quantity < 0){
    alert("Remplissez correctement les données.");
    return;
  }

  try {

    const response = await fetch("/stock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product,
        size,
        color,
        quantity
      })
    });

    const result = await response.json();

    if(!result.success){
      alert(result.message || "Erreur");
      return;
    }

    document.getElementById("newProduct").value = "";
    document.getElementById("newSize").value = "";
    document.getElementById("newColor").value = "";
    document.getElementById("newQuantity").value = "";

    await loadStock();

  } catch(error) {

    alert("Erreur de connexion au serveur.");

  }

}


async function changeStock(id, change){

  try {

    const response = await fetch(
      "/stock/" + id + "/quantity",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          change
        })
      }
    );

    const result = await response.json();

    if(!result.success){
      alert(result.message || "Erreur");
      return;
    }

    await loadStock();

  } catch(error) {

    alert("Erreur de connexion au serveur.");

  }

}


async function editStock(id, product, size, color, quantity){

  product = decodeURIComponent(product);
  size = decodeURIComponent(size);
  color = decodeURIComponent(color);

  const newProduct =
    prompt("Produit :", product);

  if(newProduct === null) return;

  const newSize =
    prompt("Taille :", size);

  if(newSize === null) return;

  const newColor =
    prompt("Couleur :", color);

  if(newColor === null) return;

  const newQuantity =
    Number(prompt("Quantité :", quantity));

  if(!Number.isInteger(newQuantity) || newQuantity < 0){
    alert("Quantité invalide.");
    return;
  }

  try {

    const response = await fetch(
      "/stock/" + id,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product: newProduct.trim(),
          size: newSize.trim(),
          color: newColor.trim(),
          quantity: newQuantity
        })
      }
    );

    const result = await response.json();

    if(!result.success){
      alert(result.message || "Erreur");
      return;
    }

    await loadStock();

  } catch(error) {

    alert("Erreur de connexion au serveur.");

  }

}


async function deleteStock(id){

  if(!confirm("Supprimer ce stock ?")){
    return;
  }

  try {

    const response = await fetch(
      "/stock/" + id,
      {
        method: "DELETE"
      }
    );

    const result = await response.json();

    if(!result.success){
      alert(result.message || "Erreur");
      return;
    }

    await loadStock();

  } catch(error) {

    alert("Erreur de connexion au serveur.");

  }

}

loadOrders();
loadStock();

</script>

<script>
</script>
<script>

</body>
</html>
  `);
});

/* ===== STORE STOCK API ===== */
app.get("/api/store-stock", (req, res) => {
  const product = String(req.query.product || "").trim();

  if (!product) {
    return res.status(400).json({
      success: false,
      message: "Produit requis."
    });
  }

  db.all(
    `SELECT id, product, size, color, quantity
     FROM stock
     WHERE lower(trim(product)) = lower(trim(?))
     ORDER BY size, color`,
    [product],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }

      res.json({
        success: true,
        stock: rows
      });
    }
  );
});

 /* ===== SHOPIFY WEBHOOK ===== */
app.post("/api/shopify/webhook", (req, res) => {

  try {

    const order = req.body || {};

    const name = String(order.name || order.customer_name || "").trim();
    const phone = String(order.phone || order.customer_phone || "").trim();
    const address = String(order.address || order.shipping_address || "").trim();
    const product = String(order.product || order.product_name || "").trim();
    const size = String(order.size || "").trim();
    const color = String(order.color || "").trim();
    const quantity = Number(order.quantity || 1);

    if (!name || !product || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Données de commande invalides."
      });
    }

    db.run(
      "INSERT INTO orders (name, phone, address, product, size, color, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'new')",
      [
        name,
        phone,
        address,
        product,
        size,
        color,
        quantity
      ],
      function(err) {

        if (err) {
          console.error("SHOPIFY ORDER SAVE ERROR:", err);

          return res.status(500).json({
            success: false,
            message: "Impossible d'enregistrer la commande."
          });
        }

        console.log("SHOPIFY ORDER SAVED:", this.lastID);

        res.status(200).json({
          success: true,
          message: "Shopify order saved.",
          orderId: this.lastID
        });

      }
    );

  } catch(error) {

    console.error("SHOPIFY WEBHOOK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Webhook error."
    });

  }

});app.listen(PORT, () => {
  console.log(
    "Server running on http://localhost:" + PORT
  );
});































