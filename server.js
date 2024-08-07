const inquirer = require('inquirer');
const express = require('express');
const { Pool } = require('pg');

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
}, () => console.log(`Connected to the employee_tracker database.`));

pool.connect();

const mainMenu = () => {
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update an employee role',
        'Exit'
      ]
    }
  ]).then(answer => {
    switch (answer.action) {
      case 'View all departments':
        viewDepartments();
        break;
      case 'View all roles':
        viewRoles();
        break;
      case 'View all employees':
        viewEmployees();
        break;
      case 'Add a department':
        addDepartment();
        break;
      case 'Add a role':
        addRole();
        break;
      case 'Add an employee':
        addEmployee();
        break;
      case 'Update an employee role':
        updateEmployeeRole();
        break;
      case 'Exit':
        pool.end();
        break;
    }
  });
};

// Routes

const viewDepartments = (req, res) => {
  const sql = `SELECT id AS department_id, name AS department_name FROM departments ORDER BY id`;

  pool.query(sql, (err, { rows }) => {
    if (err) {
      if (res) res.status(500).json({ error: err.message });
      else console.error(err.message);
      return;
    }
    if (res) {
      res.json({
        message: 'success',
        data: rows
      });
    } else {
      console.table(rows);
      mainMenu();
    }
  });
};

const viewRoles = (req, res) => {
  const sql = `
    SELECT roles.id AS role_id, roles.title AS job_title, departments.name AS department_name, roles.salary 
    FROM roles 
    LEFT JOIN departments ON roles.department_id = departments.id 
    ORDER BY roles.id
  `;

  pool.query(sql, (err, { rows }) => {
    if (err) {
      if (res) res.status(500).json({ error: err.message });
      else console.error(err.message);
      return;
    }
    if (res) {
      res.json({
        message: 'success',
        data: rows
      });
    } else {
      console.table(rows);
      mainMenu();
    }
  });
};

const viewEmployees = (req, res) => {
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
      if (res) res.status(500).json({ error: err.message });
      else console.error(err.message);
      return;
    }
    if (res) {
      res.json({
        message: 'success',
        data: rows
      });
    } else {
      console.table(rows);
      mainMenu();
    }
  });
};

const addDepartment = (req, res) => {
  const sql = `INSERT INTO departments (name) VALUES ($1)`;
  const params = [req ? req.body.name : ''];

  pool.query(sql, params, (err, result) => {
    if (err) {
      if (res) res.status(400).json({ error: err.message });
      else console.error(err.message);
      return;
    }
    if (res) {
      res.json({
        message: 'success',
        data: req.body
      });
    } else {
      console.log('Department added successfully.');
      mainMenu();
    }
  });
};

const addRole = (req, res) => {
  const sql = `INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)`;
  const params = [req ? req.body.title : '', req ? req.body.salary : '', req ? req.body.department_id : ''];

  pool.query(sql, params, (err, result) => {
    if (err) {
      if (res) res.status(400).json({ error: err.message });
      else console.error(err.message);
      return;
    }
    if (res) {
      res.json({
        message: 'success',
        data: req.body
      });
    } else {
      console.log('Role added successfully.');
      mainMenu();
    }
  });
};

const addEmployee = (req, res) => {
  const sql = `INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)`;
  const params = [req ? req.body.first_name : '', req ? req.body.last_name : '', req ? req.body.role_id : '', req ? req.body.manager_id : ''];

  pool.query(sql, params, (err, result) => {
    if (err) {
      if (res) res.status(400).json({ error: err.message });
      else console.error(err.message);
      return;
    }
    if (res) {
      res.json({
        message: 'success',
        data: req.body
      });
    } else {
      console.log('Employee added successfully.');
      mainMenu();
    }
  });
};

const updateEmployeeRole = (req, res) => {
  const sql = `UPDATE employees SET role_id = $1 WHERE id = $2`;
  const params = [req ? req.body.role_id : '', req ? req.params.id : ''];

  pool.query(sql, params, (err, result) => {
    if (err) {
      if (res) res.status(400).json({ error: err.message });
      else console.error(err.message);
    } else if (!result.rowCount) {
      if (res) {
        res.json({
          message: 'Employee not found'
        });
      } else {
        console.log('Employee not found');
        mainMenu();
      }
    } else {
      if (res) {
        res.json({
          message: 'success',
          data: req.body,
          changes: result.rowCount
        });
      } else {
        console.log('Employee role updated successfully.');
        mainMenu();
      }
    }
  });
};

// Start the server and the main menu
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  mainMenu();
});