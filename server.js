const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const pool = new Pool({
  user: 'postgres',     // TODO: Enter your PostgreSQL username
  password: 'Singh89H', // TODO: Enter your PostgreSQL password
  host: 'localhost',
  database: 'employee_db',
});

// Function to run schema.sql
const runSchema = async () => {
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  try {
    await pool.query(schema);
    console.log('Database schema created successfully.');
  } catch (err) {
    console.error('Error creating database schema:', err);
  }
};

// Run the schema
runSchema();

// Routes

// View all departments
app.get('/api/departments', (req, res) => {
  const sql = `SELECT id AS department_id, name AS department_name FROM departments ORDER BY id`;

  pool.query(sql, (err, { rows }) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: rows
    });
  });
});

// View all roles
app.get('/api/roles', (req, res) => {
  const sql = `
    SELECT roles.id AS role_id, roles.title AS job_title, departments.name AS department_name, roles.salary 
    FROM roles 
    LEFT JOIN departments ON roles.department_id = departments.id 
    ORDER BY roles.id
  `;

  pool.query(sql, (err, { rows }) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: rows
    });
  });
});

// View all employees
app.get('/api/employees', (req, res) => {
  const sql = `
    SELECT employees.id AS employee_id, employees.first_name, employees.last_name, roles.title AS job_title, 
           departments.name AS department_name, roles.salary, 
           CONCAT(manager.first_name, ' ', manager.last_name) AS manager_name
    FROM employees 
    LEFT JOIN roles ON employees.role_id = roles.id 
    LEFT JOIN departments ON roles.department_id = departments.id 
    LEFT JOIN employees manager ON employees.manager_id = manager.id
    ORDER BY employees.id
  `;

  pool.query(sql, (err, { rows }) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: rows
    });
  });
});

// Add a department
app.post('/api/department', ({ body }, res) => {
  const sql = `INSERT INTO departments (name) VALUES ($1)`;
  const params = [body.name];

  pool.query(sql, params, (err, result) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: body
    });
  });
});

// Add a role
app.post('/api/role', ({ body }, res) => {
  const sql = `INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)`;
  const params = [body.title, body.salary, body.department_id];

  pool.query(sql, params, (err, result) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: body
    });
  });
});

// Add an employee
app.post('/api/employee', ({ body }, res) => {
  const sql = `INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)`;
  const params = [body.first_name, body.last_name, body.role_id, body.manager_id];

  pool.query(sql, params, (err, result) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: body
    });
  });
});

// Update an employee's role
app.put('/api/employee/:id', (req, res) => {
  const sql = `UPDATE employees SET role_id = $1 WHERE id = $2`;
  const params = [req.body.role_id, req.params.id];

  pool.query(sql, params, (err, result) => {
    if (err) {
      res.status(400).json({ error: err.message });
    } else if (!result.rowCount) {
      res.json({
        message: 'Employee not found'
      });
    } else {
      res.json({
        message: 'success',
        data: req.body,
        changes: result.rowCount
      });
    }
  });
});

// Default response for any other request (Not Found)
app.use((req, res) => {
  res.status(404).end();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});