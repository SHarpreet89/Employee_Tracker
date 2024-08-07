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
  password: 'password', // TODO: Enter your PostgreSQL password
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
        pool.end(() => {
          console.log('Disconnected from the database.');
          process.exit(0);
        });
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
  if (!req) {
    inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the department name:',
        validate: input => input !== '' || 'Department name cannot be empty'
      }
    ]).then(answers => {
      const sql = `INSERT INTO departments (name) VALUES ($1)`;
      const params = [answers.name];

      pool.query(sql, params, (err, result) => {
        if (err) {
          console.error(err.message);
          return;
        }
        console.log('Department added successfully.');
        mainMenu();
      });
    });
  } else {
    const sql = `INSERT INTO departments (name) VALUES ($1)`;
    const params = [req.body.name];

    pool.query(sql, params, (err, result) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({
        message: 'success',
        data: req.body
      });
    });
  }
};

const addRole = (req, res) => {
  if (!req) {
    const validateInt = (input) => {
      const parsed = parseInt(input);
      return !isNaN(parsed) || 'Please enter a valid number';
    };

    pool.query('SELECT id, name FROM departments', (err, departmentResults) => {
      if (err) {
        console.error(err.message);
        return;
      }

      const departments = departmentResults.rows.map(department => ({ name: department.name, value: department.id }));

      inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter the role title:',
          validate: input => input !== '' || 'Title cannot be empty'
        },
        {
          type: 'input',
          name: 'salary',
          message: 'Enter the role salary:',
          validate: validateInt
        },
        {
          type: 'list',
          name: 'department_id',
          message: 'Select the department:',
          choices: departments
        }
      ]).then(answers => {
        const sql = `INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)`;
        const params = [answers.title, answers.salary, answers.department_id];

        pool.query(sql, params, (err, result) => {
          if (err) {
            console.error(err.message);
            return;
          }
          console.log('Role added successfully.');
          mainMenu();
        });
      });
    });
  } else {
    const sql = `INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)`;
    const params = [req.body.title, req.body.salary, req.body.department_id];

    pool.query(sql, params, (err, result) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({
        message: 'success',
        data: req.body
      });
    });
  }
};

const addEmployee = (req, res) => {
  if (!req) {
    const validateInt = (input) => {
      const parsed = parseInt(input);
      return !isNaN(parsed) || 'Please enter a valid number';
    };

    pool.query('SELECT id, title FROM roles', (err, roleResults) => {
      if (err) {
        console.error(err.message);
        return;
      }

      const roles = roleResults.rows.map(role => ({ name: role.title, value: role.id }));

      pool.query('SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employees', (err, managerResults) => {
        if (err) {
          console.error(err.message);
          return;
        }

        const managers = managerResults.rows.map(manager => ({ name: manager.name, value: manager.id }));
        managers.unshift({ name: 'None', value: null });

        inquirer.prompt([
          {
            type: 'input',
            name: 'first_name',
            message: 'Enter the employee\'s first name:',
            validate: input => input !== '' || 'First name cannot be empty'
          },
          {
            type: 'input',
            name: 'last_name',
            message: 'Enter the employee\'s last name:',
            validate: input => input !== '' || 'Last name cannot be empty'
          },
          {
            type: 'list',
            name: 'role_id',
            message: 'Select the employee\'s role:',
            choices: roles
          },
          {
            type: 'list',
            name: 'manager_id',
            message: 'Select the employee\'s manager (if any):',
            choices: managers
          }
        ]).then(answers => {
          const sql = `INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)`;
          const params = [answers.first_name, answers.last_name, answers.role_id, answers.manager_id];

          pool.query(sql, params, (err, result) => {
            if (err) {
              console.error(err.message);
              return;
            }
            console.log('Employee added successfully.');
            mainMenu();
          });
        });
      });
    });
  } else {
    const sql = `INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)`;
    const params = [req.body.first_name, req.body.last_name, req.body.role_id, req.body.manager_id];

    pool.query(sql, params, (err, result) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({
        message: 'success',
        data: req.body
      });
    });
  }
};

const updateEmployeeRole = (req, res) => {
  if (!req) {
    const validateInt = (input) => {
      const parsed = parseInt(input);
      return !isNaN(parsed) || 'Please enter a valid number';
    };

    pool.query('SELECT id, title FROM roles', (err, roleResults) => {
      if (err) {
        console.error(err.message);
        return;
      }

      const roles = roleResults.rows.map(role => ({ name: role.title, value: role.id }));

      inquirer.prompt([
        {
          type: 'input',
          name: 'employee_id',
          message: 'Enter the employee ID:',
          validate: validateInt
        },
        {
          type: 'list',
          name: 'role_id',
          message: 'Select the new role:',
          choices: roles
        }
      ]).then(answers => {
        const sql = `UPDATE employees SET role_id = $1 WHERE id = $2`;
        const params = [answers.role_id, answers.employee_id];

        pool.query(sql, params, (err, result) => {
          if (err) {
            console.error(err.message);
          } else if (!result.rowCount) {
            console.log('Employee not found');
          } else {
            console.log('Employee role updated successfully.');
          }
          mainMenu();
        });
      });
    });
  } else {
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
  }
};

// Start the server and the main menu
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  mainMenu();
});