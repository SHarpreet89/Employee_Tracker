const inquirer = require('inquirer');
const express = require('express');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3002;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

console.log('Setting up database connection...');

// Connect to database
const pool = new Pool({
  user: 'postgres',     // TODO: Enter your PostgreSQL username
  password: 'password', // TODO: Enter your PostgreSQL password
  host: 'localhost',
  database: 'employee_db',
});

pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database', err.stack);
  } else {
    console.log('Connected to the employee_tracker database.');
    startServer();
  }
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    mainMenu();
  });
};

// Add the new option to the main menu choices
const mainMenu = () => {
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      pageSize: 15,
      choices: [
        'View all employees',
        'View all departments',
        'View all roles',
        'View employees by department', 
        'View employees by manager',    
        'View department budget',
        'Add an employee',
        'Add a department',
        'Add a role',
        'Update an employee role',
        'Update employee manager',   
        'Delete data',
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
      case 'View employees by department':
        viewEmployeesByDepartment();
        break;
      case 'View employees by manager':
        viewEmployeesByManager();
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
      case 'Update employee manager':
        updateEmployeeManager();
        break;
      case 'Delete data':
        deleteData();
        break;
      case 'View department budget':
        viewDepartmentBudget();
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

const updateEmployeeManager = () => {
  pool.query('SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employees', (err, employeeResults) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const employees = employeeResults.rows.map(employee => ({ name: employee.name, value: employee.id }));

    pool.query('SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employees', (err, managerResults) => {
      if (err) {
        console.error(err.message);
        return;
      }

      const managers = managerResults.rows.map(manager => ({ name: manager.name, value: manager.id }));
      managers.unshift({ name: 'None', value: null });

      inquirer.prompt([
        {
          type: 'list',
          name: 'employeeId',
          message: 'Select the employee to update their manager:',
          choices: employees
        },
        {
          type: 'list',
          name: 'managerId',
          message: 'Select the new manager:',
          choices: managers
        }
      ]).then(answers => {
        const sql = `UPDATE employees SET manager_id = $1 WHERE id = $2`;
        const params = [answers.managerId, answers.employeeId];

        pool.query(sql, params, (err, result) => {
          if (err) {
            console.error(err.message);
            return;
          }
          console.log('Employee manager updated successfully.');
          mainMenu();
        });
      });
    });
  });
};

const viewEmployeesByManager = () => {
  pool.query('SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employees WHERE manager_id IS NULL', (err, results) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const managers = results.rows.map(manager => ({ name: manager.name, value: manager.id }));

    inquirer.prompt([
      {
        type: 'list',
        name: 'managerId',
        message: 'Select the manager to view their employees:',
        choices: managers
      }
    ]).then(answer => {
      const sql = `
        SELECT employees.id AS employee_id, employees.first_name, employees.last_name, roles.title AS job_title, 
               departments.name AS department_name, roles.salary, 
               CONCAT(manager.first_name, ' ', manager.last_name) AS manager_name
        FROM employees 
        LEFT JOIN roles ON employees.role_id = roles.id 
        LEFT JOIN departments ON roles.department_id = departments.id 
        LEFT JOIN employees manager ON employees.manager_id = manager.id
        WHERE employees.manager_id = $1
        ORDER BY employees.id
      `;
      const params = [answer.managerId];

      pool.query(sql, params, (err, result) => {
        if (err) {
          console.error(err.message);
          return;
        }
        console.table(result.rows);
        mainMenu();
      });
    });
  });
};

const viewEmployeesByDepartment = () => {
  pool.query('SELECT id, name FROM departments', (err, results) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const departments = results.rows.map(department => ({ name: department.name, value: department.id }));

    inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'Select the department to view its employees:',
        choices: departments
      }
    ]).then(answer => {
      const sql = `
        SELECT employees.id AS employee_id, employees.first_name, employees.last_name, roles.title AS job_title, 
               departments.name AS department_name, roles.salary, 
               CONCAT(manager.first_name, ' ', manager.last_name) AS manager_name
        FROM employees 
        LEFT JOIN roles ON employees.role_id = roles.id 
        LEFT JOIN departments ON roles.department_id = departments.id 
        LEFT JOIN employees manager ON employees.manager_id = manager.id
        WHERE departments.id = $1
        ORDER BY employees.id
      `;
      const params = [answer.departmentId];

      pool.query(sql, params, (err, result) => {
        if (err) {
          console.error(err.message);
          return;
        }
        console.table(result.rows);
        mainMenu();
      });
    });
  });
};

const viewDepartmentBudget = () => {
  pool.query('SELECT id, name FROM departments', (err, results) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const departments = results.rows.map(department => ({ name: department.name, value: department.id }));

    inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'Select the department to view its total utilized budget:',
        choices: departments
      }
    ]).then(answer => {
      const sql = `
        SELECT departments.name AS department_name, SUM(roles.salary) AS total_budget
        FROM employees
        JOIN roles ON employees.role_id = roles.id
        JOIN departments ON roles.department_id = departments.id
        WHERE departments.id = $1
        GROUP BY departments.name;
      `;
      const params = [answer.departmentId];

      pool.query(sql, params, (err, result) => {
        if (err) {
          console.error(err.message);
          return;
        }
        console.table(result.rows);
        mainMenu();
      });
    });
  });
};

const deleteDepartment = () => {
  pool.query('SELECT id, name FROM departments', (err, results) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const departments = results.rows.map(department => ({ name: department.name, value: department.id }));

    inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'Select the department to delete:',
        choices: departments
      }
    ]).then(answer => {
      const deleteSql = `DELETE FROM departments WHERE id = $1`;
      pool.query(deleteSql, [answer.departmentId], (err, result) => {
        if (err) {
          console.error(err.message);
          return;
        }
        console.log('Department deleted successfully.');
        mainMenu();
      });
    });
  });
};

const deleteRole = () => {
  pool.query('SELECT id, title FROM roles', (err, results) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const roles = results.rows.map(role => ({ name: role.title, value: role.id }));

    inquirer.prompt([
      {
        type: 'list',
        name: 'roleId',
        message: 'Select the role to delete:',
        choices: roles
      }
    ]).then(answer => {
      const deleteSql = `DELETE FROM roles WHERE id = $1`;
      pool.query(deleteSql, [answer.roleId], (err, result) => {
        if (err) {
          console.error(err.message);
          return;
        }
        console.log('Role deleted successfully.');
        mainMenu();
      });
    });
  });
};

const deleteEmployee = () => {
  pool.query('SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employees', (err, results) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const employees = results.rows.map(employee => ({ name: employee.name, value: employee.id }));

    inquirer.prompt([
      {
        type: 'list',
        name: 'employeeId',
        message: 'Select the employee to delete:',
        choices: employees
      }
    ]).then(answer => {
      const deleteSql = `DELETE FROM employees WHERE id = $1`;
      const params = [answer.employeeId];

      pool.query(deleteSql, params, (err, result) => {
        if (err) {
          console.error(err.message);
          return;
        }
        console.log('Employee deleted successfully.');
        mainMenu();
      });
    });
  });
};

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
    }).catch(err => {
      console.error('Error during add department prompt', err);
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
      }).catch(err => {
        console.error('Error during add role prompt', err);
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
        }).catch(err => {
          console.error('Error during add employee prompt', err);
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
      }).catch(err => {
        console.error('Error during update employee role prompt', err);
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
app.get('/', (req, res) => {
  res.send('Employee Tracker API is running');
});

