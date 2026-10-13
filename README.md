# Feedback — Employee Management & Performance Tracking System

**Feedback** is a frontend-based employee management and performance tracking platform designed to help company administrators organize employee information, assign tasks, monitor work progress, and view performance summaries from a centralized dashboard.

The project is being developed incrementally using HTML, CSS, and JavaScript. It currently uses mock data and browser `localStorage` for prototyping, with the intention of integrating a backend and database in a future phase.

## Project Overview

Companies with multiple departments and employees often find it difficult to monitor task assignments, deadlines, workloads, and progress from one place.

Feedback aims to provide a centralized platform where administrators can explore employee profiles, assign responsibilities, track task updates, and review operational metrics.

The project takes inspiration from employee directory interfaces, including the BUBT CSE faculty directory, and is intended for a company-oriented workflow.

## Objectives

- Centralize employee and department information.
- Provide a searchable employee directory and individual profile pages.
- Enable administrators to assign tasks with descriptions, priorities, and deadlines.
- Track task status and progress.
- Identify overdue tasks and outstanding work.
- Provide a foundation for future performance analytics.
- Build a maintainable frontend that can later integrate with a backend and database.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic page structure and accessible content |
| CSS3 | Responsive layout and visual design |
| JavaScript (ES Modules) | Application logic and interactive functionality |
| Browser localStorage | Prototype data persistence |
| Google Fonts — Inter | Typography |
| VS Code + Live Server | Local development and testing |

No frontend framework is currently required. The project uses vanilla HTML, CSS, and JavaScript.

## Features

### 1. Admin Dashboard

- Dashboard introduction and navigation.
- Employee portfolio cards generated from JavaScript data.
- Overview metrics for employees, departments, and tasks.
- Shared employee and department search.
- Company information and contact sections in the page layout.

### 2. Employee Directory

- Display employee information in a structured table.
- Search by employee name, employee ID, designation, or department.
- Filter by department and employment status.
- Sort by employee name, department, and joining date.
- Paginate directory results.
- Navigate to individual employee profiles.

### 3. Employee Profiles

- Display basic and professional information.
- Show employee ID, designation, department, joining date, and work email.
- Display professional summaries and skills.
- View assigned tasks, deadlines, priorities, statuses, and progress.
- Summarize task workload and overdue tasks.
- Show recorded work updates and task feedback when available.

### 4. Task Management

- Assign tasks to active employees.
- Enter task title, description, deadline, priority, and an optional project reference.
- Generate task IDs automatically.
- Store newly created tasks using browser localStorage.
- Search and filter tasks by title, employee, status, and priority.
- Sort tasks by deadline, priority, and title.
- Update task status and progress.
- Display task summary metrics and overdue indicators.
- Paginate task records.

### 5. Data Persistence

- Use JavaScript mock data as the initial dataset.
- Store employee, department, and task collections in localStorage.
- Provide reusable functions for reading, saving, and updating records.
- Validate basic data structures and handle common storage errors.
- Preserve supported changes after a page refresh in the same browser origin.

### 6. User Interface and Accessibility

- Primary colour: `#083D91`.
- White background with neutral grey for secondary UI elements.
- Centralized CSS design tokens using `:root`.
- Shared styling for navigation, buttons, containers, and footer components.
- Responsive layouts for desktop, tablet, and mobile screens.
- Semantic HTML structure, accessible form labels, keyboard focus indicators, and empty states.


## Current Limitations

- The project is a frontend prototype and does not have a backend database.
- There is no real authentication or server-enforced role-based authorization.
- localStorage data is limited to the current browser origin and does not synchronize across users or devices.
- Employee images and the company logo must be added to the `images/` directory.
- Employee information currently comes from mock data.
- Analytics and company information pages remain planned work.
- Task and profile changes are prototype operations and are not suitable for production use with confidential company data.


## Future Development

The frontend is being organized into reusable modules so that mock data services can later be replaced by API-based services.

The planned backend integration will support shared employee records, persistent task updates, secure authentication, role-based access, and company-wide analytics.

## Disclaimer

Feedback is currently a development prototype. Employee names, email addresses, department information, and task records used in the initial dataset are illustrative demo data and do not represent verified company records.
