/* ==================================================
   Feedback - Analytics Dashboard Logic
   File: js/analytics.js

   Responsibilities:
   1. Load employees, departments and tasks
   2. Filter report data by period and department
   3. Calculate analytics KPIs
   4. Render task status distribution
   5. Compare department completion rates
   6. Generate employee workload reports
   7. Support shared navbar search
   ================================================== */


/* 1. IMPORT STORAGE FUNCTIONS */

import {
    getEmployees,
    getDepartments,
    getTasks
} from "./storage.js";


/* 2. IMPORT SHARED UTILITIES */

import {
    normalizeText,
    getDepartmentName,
    isTaskOverdue,
    getLocalDateString,
    formatDate,
    searchEmployees,
    initializeCommonUI
} from "./common.js";


/* 3. SELECT FILTER ELEMENTS */

const filterForm = document.getElementById(
    "analytics-filter-form"
);

const periodFilter = document.getElementById(
    "analytics-period"
);

const departmentFilter = document.getElementById(
    "analytics-department"
);


/* 4. SELECT KPI ELEMENTS */

const kpiElements = {
    totalEmployees: document.getElementById(
        "analytics-total-employees"
    ),

    totalTasks: document.getElementById(
        "analytics-total-tasks"
    ),

    completionRate: document.getElementById(
        "analytics-completion-rate"
    ),

    onTimeRate: document.getElementById(
        "analytics-on-time-rate"
    ),

    inProgress: document.getElementById(
        "analytics-in-progress"
    ),

    overdue: document.getElementById(
        "analytics-overdue"
    )
};


/* 5. SELECT CHART AND TABLE ELEMENTS */

const statusChart = document.getElementById(
    "task-status-chart"
);

const departmentChart = document.getElementById(
    "department-performance-chart"
);

const workloadTableBody = document.getElementById(
    "employee-workload-body"
);


/* 6. SELECT SHARED NAVBAR SEARCH ELEMENTS */

const headerSearchForm = document.getElementById(
    "employee-search-form"
);

const headerSearchInput = document.getElementById(
    "employee-search"
);

const headerSearchResults = document.getElementById(
    "employee-search-results"
);


/* ==================================================
   7. GET CURRENT DATA
   ================================================== */

function getCurrentEmployees() {
    return getEmployees();
}

function getCurrentDepartments() {
    return getDepartments();
}

function getCurrentTasks() {
    return getTasks();
}


/* ==================================================
   8. SHARED DOM HELPERS
   ================================================== */

function createTextElement(tagName, className, text) {

    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    element.textContent = String(text ?? "");

    return element;

}


function showEmptyState(container, message) {

    if (!container) {
        return;
    }

    container.replaceChildren();

    const paragraph = createTextElement(
        "p",
        "empty-state",
        message
    );

    container.append(paragraph);

}


function formatPercentage(numerator, denominator) {

    if (denominator === 0) {
        return "—";
    }

    const percentage = (numerator / denominator) * 100;

    return `${percentage.toFixed(1)}%`;

}


/* ==================================================
   9. POPULATE DEPARTMENT FILTER
   ================================================== */

function populateDepartmentFilter() {

    if (!departmentFilter) {
        return;
    }

    const selectedValue = departmentFilter.value;

    departmentFilter.replaceChildren();


    const allOption = document.createElement("option");

    allOption.value = "";
    allOption.textContent = "All Departments";

    departmentFilter.append(allOption);


    getCurrentDepartments()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(department => {

            const option = document.createElement("option");

            option.value = department.id;
            option.textContent = department.name;

            departmentFilter.append(option);

        });


    const selectionExists = Array.from(
        departmentFilter.options
    ).some(option => option.value === selectedValue);

    if (selectionExists) {
        departmentFilter.value = selectedValue;
    }

}


/* ==================================================
   10. FILTER TASKS BY REPORTING PERIOD
   ================================================== */

/*
   The selected period is based on task creation date.

   All Tasks = all task records.
   Last 7 Days = tasks created today or in the previous
   six calendar days, using the browser's local date.

   Tasks missing createdAt cannot be included in a
   limited-period report because their date is unknown.
*/

function isTaskWithinPeriod(task, period) {

    if (period === "all") {
        return true;
    }

    const days = Number(period);

    if (![7, 30, 90].includes(days)) {
        return true;
    }

    if (
        !task.createdAt ||
        !/^\d{4}-\d{2}-\d{2}$/.test(task.createdAt)
    ) {
        return false;
    }

    const today = getLocalDateString();

    const cutoff = new Date(`${today}T00:00:00`);

    cutoff.setDate(cutoff.getDate() - days + 1);

    const cutoffString = [
        cutoff.getFullYear(),
        String(cutoff.getMonth() + 1).padStart(2, "0"),
        String(cutoff.getDate()).padStart(2, "0")
    ].join("-");

    return (
        task.createdAt >= cutoffString &&
        task.createdAt <= today
    );

}


/* ==================================================
   11. GET FILTERED REPORT DATA
   ================================================== */

function getReportData() {

    const employees = getCurrentEmployees();

    const departments = getCurrentDepartments();

    const allTasks = getCurrentTasks();

    const period = periodFilter?.value || "all";

    const selectedDepartment =
        departmentFilter?.value || "";


    /*
       Apply the reporting period first.
       A department filter then selects tasks belonging
       to employees in that department.
    */

    const tasksInPeriod = allTasks.filter(task =>
        isTaskWithinPeriod(task, period)
    );


    const matchingTasks = tasksInPeriod.filter(task => {

        if (!selectedDepartment) {
            return true;
        }

        const employee = employees.find(
            item => item.id === task.employeeId
        );

        return (
            employee &&
            employee.departmentId === selectedDepartment
        );

    });


    /*
       Cancelled tasks are excluded from the completion-rate
       denominator, but remain visible in task distribution.
    */

    const eligibleTasks = matchingTasks.filter(
        task => task.status !== "cancelled"
    );


    const completedTasks = eligibleTasks.filter(
        task => task.status === "completed"
    );


    const tasksWithKnownCompletionDate = completedTasks.filter(
        task => {

            const completionDate =
                task.completedAt || task.updatedAt || "";

            return (
                /^\d{4}-\d{2}-\d{2}$/.test(completionDate) &&
                Boolean(task.dueDate)
            );

        }
    );


    const onTimeTasks = tasksWithKnownCompletionDate.filter(task => {

        const completionDate =
            task.completedAt || task.updatedAt;

        return completionDate <= task.dueDate;

    });


    /*
       Under department filtering, display employees from
       that department. Period filters affect task counts,
       not the employee directory itself.
    */

    const visibleEmployees = employees.filter(employee =>
        !selectedDepartment ||
        employee.departmentId === selectedDepartment
    );


    return {
        employees,
        departments,
        matchingTasks,
        eligibleTasks,
        completedTasks,
        tasksWithKnownCompletionDate,
        onTimeTasks,
        visibleEmployees,
        period,
        selectedDepartment
    };

}


/* ==================================================
   12. RENDER KPI CARDS
   ================================================== */

function renderKPIs(report) {

    const {
        employees,
        matchingTasks,
        eligibleTasks,
        completedTasks,
        tasksWithKnownCompletionDate,
        onTimeTasks
    } = report;


    const inProgressTasks = matchingTasks.filter(
        task => task.status === "in-progress"
    );


    const overdueTasks = matchingTasks.filter(
        task => isTaskOverdue(task)
    );


    /*
       Completion rate:
       Completed tasks / eligible tasks * 100.

       Cancelled tasks are excluded.
    */

    const completionRate = formatPercentage(
        completedTasks.length,
        eligibleTasks.length
    );


    /*
       On-time completion rate:
       Completed tasks finished by deadline / completed tasks
       with a recorded completion date and a deadline.

       The initial demo data does not provide completedAt for
       all completed tasks, so report only when evidence exists.
    */

    const onTimeRate = formatPercentage(
        onTimeTasks.length,
        tasksWithKnownCompletionDate.length
    );


    const values = {
        totalEmployees: String(employees.length),

        totalTasks: String(matchingTasks.length),

        completionRate,

        onTimeRate,

        inProgress: String(inProgressTasks.length),

        overdue: String(overdueTasks.length)
    };


    Object.entries(kpiElements).forEach(([key, element]) => {

        if (element) {
            element.textContent = values[key];
        }

    });


    /* Explain missing completion timestamps */

    const onTimeDescription = document.querySelector(
        "#analytics-on-time-rate + .analytics-kpi-description"
    );

    if (onTimeDescription) {

        if (tasksWithKnownCompletionDate.length === 0) {

            onTimeDescription.textContent =
                "Unavailable until completed-task dates are recorded.";

        } else {

            onTimeDescription.textContent =
                `${tasksWithKnownCompletionDate.length} completed task(s) with recorded completion dates.`;

        }

    }

}


/* ==================================================
   13. RENDER TASK STATUS DISTRIBUTION
   ================================================== */

function renderTaskStatusChart(tasks) {

    if (!statusChart) {
        return;
    }

    statusChart.replaceChildren();


    if (tasks.length === 0) {

        showEmptyState(
            statusChart,
            "No tasks match the selected report filters."
        );

        return;

    }


    const statusDefinitions = [
        { value: "assigned", label: "Assigned" },
        { value: "in-progress", label: "In Progress" },
        { value: "review", label: "Awaiting Review" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" }
    ];


    const chart = document.createElement("div");

    chart.className = "task-status-chart";


    statusDefinitions.forEach(status => {

        const count = tasks.filter(
            task => task.status === status.value
        ).length;

        const percentage = (count / tasks.length) * 100;


        const item = document.createElement("div");

        item.className = "task-status-item";


        const header = document.createElement("div");

        header.className = "task-status-item-header";


        const label = createTextElement(
            "span",
            "task-status-label",
            status.label
        );


        const value = createTextElement(
            "span",
            "task-status-value",
            `${count} (${percentage.toFixed(1)}%)`
        );


        header.append(label, value);


        const track = document.createElement("div");

        track.className = "task-status-track";

        track.setAttribute("role", "progressbar");

        track.setAttribute(
            "aria-label",
            `${status.label}: ${count} tasks`
        );

        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");

        track.setAttribute(
            "aria-valuenow",
            String(Number(percentage.toFixed(1)))
        );


        const fill = document.createElement("span");

        fill.className = "task-status-fill";

        fill.style.width = `${percentage}%`;


        track.append(fill);

        item.append(header, track);

        chart.append(item);

    });


    statusChart.append(chart);

}


/* ==================================================
   14. CALCULATE DEPARTMENT METRICS
   ================================================== */

function getDepartmentMetrics(report) {

    const {
        departments,
        employees,
        matchingTasks
    } = report;


    const metrics = departments
        .filter(department =>
            !report.selectedDepartment ||
            department.id === report.selectedDepartment
        )
        .map(department => {

            const departmentEmployees = employees.filter(
                employee =>
                    employee.departmentId === department.id
            );


            const employeeIds = new Set(
                departmentEmployees.map(employee => employee.id)
            );


            const departmentTasks = matchingTasks.filter(
                task => employeeIds.has(task.employeeId)
            );


            const eligibleTasks = departmentTasks.filter(
                task => task.status !== "cancelled"
            );


            const completedTasks = eligibleTasks.filter(
                task => task.status === "completed"
            );


            const completionRate = eligibleTasks.length > 0
                ? (completedTasks.length / eligibleTasks.length) * 100
                : null;


            return {
                id: department.id,

                name: department.name,

                employeeCount: departmentEmployees.length,

                totalTasks: departmentTasks.length,

                eligibleTasks: eligibleTasks.length,

                completedTasks: completedTasks.length,

                completionRate

            };

        });


    return metrics.sort((a, b) => {

        const rateA = a.completionRate ?? -1;

        const rateB = b.completionRate ?? -1;

        return (
            rateB - rateA ||
            a.name.localeCompare(b.name)
        );

    });

}


/* ==================================================
   15. RENDER DEPARTMENT PERFORMANCE
   ================================================== */

function renderDepartmentChart(report) {

    if (!departmentChart) {
        return;
    }

    departmentChart.replaceChildren();


    const metrics = getDepartmentMetrics(report);


    if (metrics.length === 0) {

        showEmptyState(
            departmentChart,
            "No departments are available."
        );

        return;

    }


    const chart = document.createElement("div");

    chart.className = "department-chart";


    metrics.forEach(metric => {

        const item = document.createElement("div");

        item.className = "department-chart-item";


        const header = document.createElement("div");

        header.className = "department-chart-header";


        const departmentName = createTextElement(
            "span",
            "department-chart-name",
            metric.name
        );


        const completionLabel = createTextElement(
            "span",
            "department-chart-rate",
            metric.completionRate === null
                ? "N/A"
                : `${metric.completionRate.toFixed(1)}%`
        );


        header.append(departmentName, completionLabel);


        const track = document.createElement("div");

        track.className = "department-chart-track";


        const fill = document.createElement("span");

        fill.className = "department-chart-fill";


        const rate = metric.completionRate ?? 0;

        fill.style.width = `${rate}%`;


        track.setAttribute("role", "progressbar");

        track.setAttribute(
            "aria-label",
            `${metric.name} task completion rate`
        );

        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");

        track.setAttribute("aria-valuenow", String(rate));


        track.append(fill);


        const caption = createTextElement(
            "p",
            "department-chart-caption",
            `${metric.employeeCount} employee(s) · ${metric.totalTasks} task(s) · ${metric.completedTasks} completed`
        );


        item.append(header, track, caption);

        chart.append(item);

    });


    departmentChart.append(chart);

}


/* ==================================================
   16. RENDER EMPLOYEE WORKLOAD TABLE
   ================================================== */

function renderEmployeeWorkload(report) {

    if (!workloadTableBody) {
        return;
    }

    workloadTableBody.replaceChildren();


    if (report.visibleEmployees.length === 0) {

        const row = document.createElement("tr");

        row.className = "empty-row";

        const cell = document.createElement("td");

        cell.colSpan = 6;

        cell.textContent = "No employees found.";

        row.append(cell);

        workloadTableBody.append(row);

        return;

    }


    const sortedEmployees = [...report.visibleEmployees]
        .sort((a, b) => a.name.localeCompare(b.name));


    const fragment = document.createDocumentFragment();


    sortedEmployees.forEach(employee => {

        const employeeTasks = report.matchingTasks.filter(
            task => task.employeeId === employee.id
        );


        const nonCancelledTasks = employeeTasks.filter(
            task => task.status !== "cancelled"
        );


        const completedTasks = nonCancelledTasks.filter(
            task => task.status === "completed"
        );


        const inProgressTasks = nonCancelledTasks.filter(
            task => task.status === "in-progress"
        );


        const overdueTasks = employeeTasks.filter(
            task => isTaskOverdue(task)
        );


        const row = document.createElement("tr");


        row.append(
            createTextElement(
                "td",
                "analytics-employee-name",
                employee.name
            )
        );


        row.append(
            createTextElement(
                "td",
                "analytics-department-name",
                getDepartmentName(employee.departmentId)
            )
        );


        row.append(
            createTextElement(
                "td",
                "analytics-number-cell",
                String(nonCancelledTasks.length)
            )
        );


        row.append(
            createTextElement(
                "td",
                "analytics-number-cell",
                String(completedTasks.length)
            )
        );


        row.append(
            createTextElement(
                "td",
                "analytics-number-cell",
                String(inProgressTasks.length)
            )
        );


        row.append(
            createTextElement(
                "td",
                "analytics-number-cell",
                String(overdueTasks.length)
            )
        );


        fragment.append(row);

    });


    workloadTableBody.append(fragment);

}


/* ==================================================
   17. RENDER THE COMPLETE REPORT
   ================================================== */

function renderAnalytics() {

    const report = getReportData();


    renderKPIs(report);

    renderTaskStatusChart(report.matchingTasks);

    renderDepartmentChart(report);

    renderEmployeeWorkload(report);

}


/* ==================================================
   18. INITIALIZE FILTERS
   ================================================== */

function initializeAnalyticsFilters() {

    if (!filterForm) {
        return;
    }


    filterForm.addEventListener("submit", event => {

        event.preventDefault();

        renderAnalytics();

    });


    departmentFilter?.addEventListener("change", () => {

        renderAnalytics();

    });


    periodFilter?.addEventListener("change", () => {

        renderAnalytics();

    });


    const resetButton = document.getElementById(
        "reset-analytics-filters"
    );


    resetButton?.addEventListener("click", event => {

        event.preventDefault();

        filterForm.reset();

        renderAnalytics();

    });

}


/* ==================================================
   19. SHARED NAVBAR SEARCH
   ================================================== */

function hideHeaderSearchResults() {

    if (!headerSearchResults) {
        return;
    }

    headerSearchResults.hidden = true;

    headerSearchResults.replaceChildren();

}


function createSearchHeading(text) {

    return createTextElement(
        "p",
        "search-result-heading",
        text
    );

}


function renderHeaderSearchResults(query) {

    if (!headerSearchResults) {
        return;
    }

    const searchTerm = query.trim();

    if (!searchTerm) {

        hideHeaderSearchResults();

        return;

    }


    const employeeMatches = searchEmployees(searchTerm);

    const normalizedQuery = normalizeText(searchTerm);

    const departmentMatches = getCurrentDepartments().filter(
        department => {

            return (
                normalizeText(department.name).includes(normalizedQuery) ||
                normalizeText(department.id).includes(normalizedQuery)
            );

        }
    );


    headerSearchResults.replaceChildren();


    if (departmentMatches.length > 0) {

        headerSearchResults.append(
            createSearchHeading("Departments")
        );


        departmentMatches.slice(0, 4).forEach(department => {

            const link = document.createElement("a");

            link.className = "search-result-item";

            link.href =
                `all-employees.html?q=${encodeURIComponent(department.name)}`;

            link.textContent = department.name;

            headerSearchResults.append(link);

        });

    }


    if (employeeMatches.length > 0) {

        headerSearchResults.append(
            createSearchHeading("Employees")
        );


        employeeMatches.slice(0, 5).forEach(employee => {

            const link = document.createElement("a");

            link.className = "search-result-item";

            link.href =
                `employee-profile.html?id=${encodeURIComponent(employee.id)}`;

            link.textContent =
                `${employee.name} — ${employee.designation}`;

            headerSearchResults.append(link);

        });

    }


    if (
        employeeMatches.length === 0 &&
        departmentMatches.length === 0
    ) {

        headerSearchResults.append(
            createTextElement(
                "p",
                "search-result-empty",
                "No employees or departments found."
            )
        );

    }


    headerSearchResults.hidden = false;

}


function initializeHeaderSearch() {

    if (!headerSearchForm || !headerSearchInput) {
        return;
    }


    headerSearchInput.addEventListener("input", () => {

        renderHeaderSearchResults(
            headerSearchInput.value
        );

    });


    headerSearchForm.addEventListener("submit", event => {

        event.preventDefault();

        const query = normalizeText(
            headerSearchInput.value
        );


        if (!query) {

            window.location.href = "../index.html";

            return;

        }


        const employeeMatches = searchEmployees(query);


        const exactEmployee = employeeMatches.find(employee => {

            return (
                normalizeText(employee.name) === query ||
                normalizeText(employee.id) === query
            );

        });


        if (exactEmployee) {

            window.location.href =
                `employee-profile.html?id=${encodeURIComponent(exactEmployee.id)}`;

            return;

        }


        const exactDepartment = getCurrentDepartments().find(
            department => {

                return (
                    normalizeText(department.name) === query ||
                    normalizeText(department.id) === query
                );

            }
        );


        if (exactDepartment) {

            window.location.href =
                `all-employees.html?q=${encodeURIComponent(exactDepartment.name)}`;

            return;

        }


        if (employeeMatches.length === 1) {

            window.location.href =
                `employee-profile.html?id=${encodeURIComponent(employeeMatches[0].id)}`;

            return;

        }


        window.location.href =
            `all-employees.html?q=${encodeURIComponent(query)}`;

    });


    document.addEventListener("click", event => {

        if (!headerSearchForm.contains(event.target)) {
            hideHeaderSearchResults();
        }

    });


    headerSearchInput.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            hideHeaderSearchResults();

            headerSearchInput.blur();

        }

    });

}


/* ==================================================
   20. INITIALIZE ANALYTICS PAGE
   ================================================== */

function initializeAnalytics() {

    initializeCommonUI();

    populateDepartmentFilter();

    initializeAnalyticsFilters();

    initializeHeaderSearch();


    renderAnalytics();


    /*
       Refresh analytics if the storage service reports
       a same-tab update from another module.
    */

    window.addEventListener(
        "feedback:storage-updated",
        renderAnalytics
    );

}


/* ==================================================
   21. START WHEN THE DOCUMENT IS READY
   ================================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAnalytics,
        { once: true }
    );

} else {

    initializeAnalytics();

}