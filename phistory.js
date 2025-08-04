const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const port = process.env.port || 3000;

app.use(cors());
app.use(express.json());

// Create MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: "sql8.freesqldatabase.com",
  user: "sql8792916",
  password: "iEdb2pFif4",
  database: "sql8792916",
});

// Test DB connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("DB pool connection failed:", err);
  } else {
    console.log("Connected to MySQL DB via pool");
    connection.release(); // release connection back to pool
  }
});

// GET route to fetch players
app.get("/teamstats", (req, res) => {
  pool.query("SELECT * FROM team_stats", (err, results) => {
    if (err) {
      console.error("Error fetching players:", err);
      res.status(500).send("DB error");
    } else {
      res.json(results);
    }
  });
});

// GET route to fetch players
app.get("/filterbyname", (req, res) => {
  pool.query(
    "SELECT * FROM team_stats ORDER BY player_name ASC",
    (err, results) => {
      if (err) {
        console.error("Error fetching players:", err);
        res.status(500).send("DB error");
      } else {
        res.json(results);
      }
    }
  );
});

// GET route to fetch players
app.get("/filterbygames", (req, res) => {
  pool.query(
    "SELECT * FROM team_stats ORDER BY games_played DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching players:", err);
        res.status(500).send("DB error");
      } else {
        res.json(results);
      }
    }
  );
});

// GET route to fetch players
app.get("/filterbygoals", (req, res) => {
  pool.query("SELECT * FROM team_stats ORDER BY goals DESC", (err, results) => {
    if (err) {
      console.error("Error fetching players:", err);
      res.status(500).send("DB error");
    } else {
      res.json(results);
    }
  });
});

// GET route to fetch players
app.get("/filterbyassists", (req, res) => {
  pool.query(
    "SELECT * FROM team_stats ORDER BY assists DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching players:", err);
        res.status(500).send("DB error");
      } else {
        res.json(results);
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
