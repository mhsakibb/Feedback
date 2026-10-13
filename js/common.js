/* ==================================================
   Feedback - Shared JavaScript Utilities
   File: js/common.js

   Purpose:
   1. Search employees using saved data
   2. Look up employee and department information
   3. Retrieve employee tasks
   4. Calculate dashboard metrics
   5. Initialize shared UI behavior
   ================================================== */


/* 1. IMPORT STORAGE SERVICE */

import {
    getEmployees,
    getDepartments,
    getTasks
} from "./storage.js";


/* 2. TEXT NORMALIZATION */

export function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase();
}


/* 3. DEPARTMENT LOOKUP */

export function getDepartmentById(departmentId) {
    return getDepartments().find(
        department => department.id === departmentId
    ) ?? null;
}


export function getDepartmentName(departmentId) {
    const department = getDepartmentById(departmentId);

    return department
        ? department.name
        : "Unassigned Department";
}


/* 4. EMPLOYEE LOOKUP */

export function getEmployeeById(employeeId) {
    return getEmployees().find(
        employee => employee.id === employeeId
    ) ?? null;
}


/* 5. FILTER EMPLOYEES BY DEPARTMENT */

export function getEmployeesByDepartment(departmentId) {
    return getEmployees().filter(
        employee => employee.departmentId === departmentId
    );
}


/* 6. SEARCH EMPLOYEES */

export function searchEmployees(query) {
    const searchTerm = normalizeText(query);

    if (!searchTerm) {
        return [];
    }

    const employeeList = getEmployees();

    return employeeList.filter(employee => {
        const departmentName = getDepartmentName(
            employee.departmentId
        );

        const fields = [
            employee.name,
            employee.id,
            employee.designation,
            departmentName
        ];

        return fields.some(field =>
            normalizeText(field).includes(searchTerm)
        );
    });
}


/* 7. GET AN EMPLOYEE'S TASKS */

export function getTasksForEmployee(employeeId) {
    return getTasks().filter(
        task => task.employeeId === employeeId
    );
}


/* 8. LOCAL DATE HELPER */

export function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1)
        .padStart(2, "0");

    const day = String(date.getDate())
        .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* 9. CHECK TASK DEADLINES */

export function isTaskOverdue(
    task,
    referenceDate = getLocalDateString()
) {
    if (!task || !task.dueDate) {
        return false;
    }

    const finalStatuses = [
        "completed",
        "cancelled"
    ];

    if (finalStatuses.includes(task.status)) {
        return false;
    }

    return task.dueDate < referenceDate;
}


/* 10. CALCULATE DASHBOARD METRICS */

export function getDashboardMetrics(
    referenceDate = getLocalDateString()
) {
    const employeeList = getEmployees();
    const departmentList = getDepartments();
    const taskList = getTasks();

    return {
        totalEmployees: employeeList.length,

        totalDepartments: departmentList.length,

        activeTasks: taskList.filter(
            task => task.status === "in-progress"
        ).length,

        overdueTasks: taskList.filter(
            task => isTaskOverdue(task, referenceDate)
        ).length
    };
}


/* 11. FORMAT DATES */

export function formatDate(dateString) {
    if (!dateString) {
        return "Not set";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


/* 12. INITIALIZE SHARED UI */

let commonUIInitialized = false;

export function initializeCommonUI() {
    if (commonUIInitialized) {
        return;
    }

    commonUIInitialized = true;


    /* Update copyright year */

    const copyrightYear = document.getElementById(
        "copyright-year"
    );

    if (copyrightYear) {
        copyrightYear.textContent = String(
            new Date().getFullYear()
        );
    }


    /* Close About dropdown after an outside click */

    const dropdowns = document.querySelectorAll(
        ".nav-dropdown"
    );

    document.addEventListener("click", event => {
        const target = event.target;

        const clickedDropdown =
            target instanceof Element
                ? target.closest(".nav-dropdown")
                : null;

        dropdowns.forEach(dropdown => {
            if (dropdown !== clickedDropdown) {
                dropdown.open = false;
            }
        });
    });


    /* Close About dropdown with Escape */

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            dropdowns.forEach(dropdown => {
                dropdown.open = false;
            });
        }
    });
}