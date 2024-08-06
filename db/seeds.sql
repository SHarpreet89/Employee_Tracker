INSERT INTO departments (name) VALUES ('Engineering'), ('HR'), ('Sales');

INSERT INTO roles (title, salary, department_id) VALUES 
('Software Engineer', 80000, 1),
('Sales Manager', 70000, 3),
('HR Specialist', 60000, 2);

INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES 
('John', 'Doe', 1, NULL),
('Jane', 'Smith', 2, NULL),
('Emily', 'Jones', 3, NULL);
