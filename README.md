# Employee Tracker

## Description

This app runs on the Command Line Interface and uses Inquirer, letting users answer prompts to update and manage an employee management database.
The database backend itself is built on Postgresql.

## APP Walkthrough Video

The App walkthrough video can be accessed via this link - https://drive.google.com/file/d/1BCar8RYdZ0GVSY_Y0ilAN_KivYVwg7AI/view

## Installation Instructions

Install by typing NPM Install in project folder.
Inquirer, PG and Express Packages will then be installed in your project folder by NPM.

## Usage Information

Setup the Databases by typing "psql -U postgres" in your project folder.
The SQL Database can be created by typing "\i db/schema.sql"  and some sample data can be seeded by running "\i db/seeds.sql"
Run the app by typing NPM Start . The App will present several options in main menu, traverse and select the relevant functions to assist you manage the database.

## User Story

As a bussiness owner I want to be able to view and manager deparments, roles and employees in my company so that I can organize and plan my bussiness.

## Acceptance Criteria

- When I start the application, I am presented with the following options: view all departments, view all roles, view all employees, add a department, add a role, add an employee, and update an employee role.
- When I choose to view all departments, I am presented with a formatted table showing department names and department ids.
- When I choose to view all roles, I am presented with the job title, role id, the department that role belongs to, and the salary for that role.
- When I choose to view all employees, I am presented with a formatted table showing employee data, including employee ids, first names, last names, job titles, departments, salaries, and managers that the employees report to.
- When I choose to add a department, I am prompted to enter the name of the department and that department is added to the database.
- When I choose to add a role, I am prompted to enter the name, salary, and department for the role and that role is added to the database.
- When I choose to add an employee, I am prompted to enter the employee’s first name, last name, role, and manager, and that employee is added to the database.
- When I choose to update an employee role, I am prompted to select an employee to update and their new role, and this information is updated in the database.

## App Repository Link

https://github.com/SHarpreet89/Employee_Tracker

## Contact me

https://github.com/SHarpreet89

## Screenshot

![Alt text](./assets/images/App%20Image.png)