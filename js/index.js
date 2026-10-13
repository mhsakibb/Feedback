/* ==================================================
   Feedback - Home Page Logic
   File: js/index.js

   Responsibilities:
   1. Render employee portfolio cards
   2. Display dashboard metrics
   3. Handle employee and department search
   4. Navigate to employee profiles
   5. Initialize shared UI behavior
   ================================================== */


/* 1. IMPORT DATA */

import {
    getEmployees,
    getDepartments
} from "./storage.js";

/* Load the saved data for this page */

const employees = getEmployees();
const departments = getDepartments();


/* 2. IMPORT SHARED FUNCTIONS */

import {
    normalizeText,
    getDepartmentName,
    searchEmployees,
    getDashboardMetrics,
    initializeCommonUI
} from "./common.js";


/* 3. SELECT HTML ELEMENTS */

const employeeGrid = document.getElementById("employee-grid");

const employeeSearchForm = document.getElementById(
    "employee-search-form"
);

const employeeSearchInput = document.getElementById(
    "employee-search"
);

const searchResultsContainer = document.getElementById(
    "employee-search-results"
);

const employeeSectionTitle = document.getElementById(
    "employees-title"
);

const employeeGridHelp = document.getElementById(
    "employee-grid-help"
);


/* 4. DASHBOARD METRICS */

function renderDashboardMetrics() {

    const metrics = getDashboardMetrics();

    const metricElements = {
        totalEmployees: document.getElementById("total-employees"),
        totalDepartments: document.getElementById("total-departments"),
        activeTasks: document.getElementById("active-tasks"),
        overdueTasks: document.getElementById("overdue-tasks")
    };

    Object.entries(metricElements).forEach(([key, element]) => {

        if (element) {
            element.textContent = String(metrics[key]);
        }

    });

}


/* 5. GENERATE A FALLBACK EMPLOYEE IMAGE */

function createAvatarDataUri(name) {

    const initials = String(name || "Employee")
        .trim()
        .split(/\s+/)
        .map(part => part.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();

    /*
       The initials come from demo employee data.
       Escape XML-sensitive characters before building SVG.
    */

    const safeInitials = initials.replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&apos;"
        })[character]
    );

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="400"
             height="300"
             viewBox="0 0 400 300">

            <rect width="400" height="300" fill="#083D91"/>

            <text x="200"
                  y="165"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  font-family="Arial, sans-serif"
                  font-size="76"
                  font-weight="600"
                  fill="#FFFFFF">${safeInitials}</text>

        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

}


/* 6. CREATE AN EMPLOYEE CARD */

function createEmployeeCard(employee) {

    const article = document.createElement("article");

    article.className = "employee-card";


    /* Employee image */

    const image = document.createElement("img");

    image.className = "employee-card-image";
    image.src = employee.photo;
    image.alt = `Portrait of ${employee.name}`;
    image.width = 400;
    image.height = 300;
    image.loading = "lazy";
    image.decoding = "async";

    /*
       Demo image files may not exist yet.
       Replace a missing image with initials.
    */

    image.addEventListener("error", () => {

        if (image.dataset.fallbackApplied === "true") {
            image.hidden = true;
            return;
        }

        image.dataset.fallbackApplied = "true";

        image.src = createAvatarDataUri(employee.name);

    });


    /* Card content */

    const content = document.createElement("div");

    content.className = "employee-card-content";


    /* Employee name */

    const name = document.createElement("h3");

    name.className = "employee-card-name";
    name.textContent = employee.name;


    /* Employee designation */

    const designation = document.createElement("p");

    designation.className = "employee-card-designation";
    designation.textContent = employee.designation;


    /* Employee department */

    const department = document.createElement("p");

    department.className = "employee-card-department";
    department.textContent = getDepartmentName(
        employee.departmentId
    );


    /* Profile action */

    const actions = document.createElement("div");

    actions.className = "employee-card-actions";

    const profileLink = document.createElement("a");

    profileLink.className = "button button-primary";

    profileLink.textContent = "View Profile";

    profileLink.href =
        `pages/employee-profile.html?id=${encodeURIComponent(employee.id)}`;


    /* Assemble the card */

    actions.append(profileLink);

    content.append(
        name,
        designation,
        department,
        actions
    );

    article.append(
        image,
        content
    );

    return article;

}


/* 7. RENDER EMPLOYEE CARDS */

function renderEmployeeCards(
    employeeList,
    title = "Meet Our Team",
    description = "Explore employee profiles and their professional information."
) {

    if (!employeeGrid) {
        return;
    }

    employeeGrid.replaceChildren();

    if (employeeSectionTitle) {
        employeeSectionTitle.textContent = title;
    }

    if (employeeGridHelp) {
        employeeGridHelp.textContent = description;
    }


    /* Handle empty results */

    if (employeeList.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-state";

        emptyMessage.textContent =
            "No employees found. Try another search.";

        employeeGrid.append(emptyMessage);

        return;

    }


    /* Render each employee */

    const fragment = document.createDocumentFragment();

    employeeList.forEach(employee => {

        const card = createEmployeeCard(employee);

        fragment.append(card);

    });

    employeeGrid.append(fragment);

}


/* 8. FIND MATCHING DEPARTMENTS */

function searchDepartments(query) {

    const searchTerm = normalizeText(query);

    if (!searchTerm) {
        return [];
    }

    return departments.filter(department => {

        return (
            normalizeText(department.name).includes(searchTerm) ||
            normalizeText(department.id).includes(searchTerm)
        );

    });

}


/* 9. HIDE SEARCH RESULTS */

function hideSearchResults() {

    if (!searchResultsContainer) {
        return;
    }

    searchResultsContainer.hidden = true;
    searchResultsContainer.replaceChildren();

}


/* 10. CREATE A SEARCH RESULT HEADING */

function createSearchGroupHeading(text) {

    const heading = document.createElement("p");

    heading.className = "search-result-heading";
    heading.textContent = text;

    return heading;

}


/* 11. DISPLAY LIVE SEARCH RESULTS */

function renderSearchResults(query) {

    if (!searchResultsContainer) {
        return;
    }

    const searchTerm = query.trim();

    if (!searchTerm) {
        hideSearchResults();
        return;
    }

    const employeeMatches = searchEmployees(searchTerm);

    const departmentMatches = searchDepartments(searchTerm);

    searchResultsContainer.replaceChildren();


    /* Department suggestions */

    if (departmentMatches.length > 0) {

        searchResultsContainer.append(
            createSearchGroupHeading("Departments")
        );

        departmentMatches.slice(0, 4).forEach(department => {

            const resultButton = document.createElement("button");

            resultButton.type = "button";
            resultButton.className = "button button-secondary";
            resultButton.textContent = department.name;

            resultButton.addEventListener("click", () => {

                const departmentEmployees = employees.filter(
                    employee =>
                        employee.departmentId === department.id
                );

                renderEmployeeCards(
                    departmentEmployees,
                    `${department.name} Department`,
                    `${departmentEmployees.length} employee(s) found in this department.`
                );

                hideSearchResults();

                employeeSearchInput.value = department.name;

                document.getElementById("employees")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            });

            searchResultsContainer.append(resultButton);

        });

    }


    /* Employee suggestions */

    if (employeeMatches.length > 0) {

        searchResultsContainer.append(
            createSearchGroupHeading("Employees")
        );

        employeeMatches.slice(0, 5).forEach(employee => {

            const resultLink = document.createElement("a");

            resultLink.className = "search-result-item";

            resultLink.href =
                `pages/employee-profile.html?id=${encodeURIComponent(employee.id)}`;

            resultLink.textContent =
                `${employee.name} — ${employee.designation}`;

            searchResultsContainer.append(resultLink);

        });

    }


    /* No matching results */

    if (
        employeeMatches.length === 0 &&
        departmentMatches.length === 0
    ) {

        const message = document.createElement("p");

        message.className = "search-result-empty";
        message.textContent = "No employees or departments found.";

        searchResultsContainer.append(message);

    }

    searchResultsContainer.hidden = false;

}


/* 12. NAVIGATE TO AN EMPLOYEE PROFILE */

function navigateToEmployeeProfile(employee) {

    window.location.href =
        `pages/employee-profile.html?id=${encodeURIComponent(employee.id)}`;

}


/* 13. HANDLE SEARCH SUBMISSION */

function handleSearchSubmit(event) {

    event.preventDefault();

    const rawQuery = employeeSearchInput?.value ?? "";

    const query = normalizeText(rawQuery);


    /* Empty query restores all employee cards */

    if (!query) {

        renderEmployeeCards(employees);

        hideSearchResults();

        return;

    }


    /* Give priority to an exact employee name or ID */

    const exactEmployee = employees.find(employee => {

        return (
            normalizeText(employee.name) === query ||
            normalizeText(employee.id) === query
        );

    });

    if (exactEmployee) {

        navigateToEmployeeProfile(exactEmployee);

        return;

    }


    /* An exact department query filters the employee cards */

    const exactDepartment = departments.find(department => {

        return (
            normalizeText(department.name) === query ||
            normalizeText(department.id) === query
        );

    });

    if (exactDepartment) {

        const departmentEmployees = employees.filter(
            employee =>
                employee.departmentId === exactDepartment.id
        );

        renderEmployeeCards(
            departmentEmployees,
            `${exactDepartment.name} Department`,
            `${departmentEmployees.length} employee(s) found in this department.`
        );

        hideSearchResults();

        document.getElementById("employees")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        return;

    }


    /* Navigate when a partial query has one employee match */

    const employeeMatches = searchEmployees(query);

    if (employeeMatches.length === 1) {

        navigateToEmployeeProfile(employeeMatches[0]);

        return;

    }


    /* Otherwise, show suggestions */

    renderSearchResults(rawQuery);

}


/* 14. CONNECT SEARCH EVENTS */

function initializeEmployeeSearch() {

    if (!employeeSearchForm || !employeeSearchInput) {
        return;
    }

    employeeSearchForm.addEventListener(
        "submit",
        handleSearchSubmit
    );

    employeeSearchInput.addEventListener("input", () => {

        renderSearchResults(employeeSearchInput.value);

    });


    /* Close results when clicking outside the search form */

    document.addEventListener("click", event => {

        if (!employeeSearchForm.contains(event.target)) {
            hideSearchResults();
        }

    });


    /* Allow the user to dismiss results with Escape */

    employeeSearchInput.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            hideSearchResults();

            employeeSearchInput.blur();

        }

    });

}


/* 15. INITIALIZE THE HOME PAGE */

function initializeHomePage() {

    initializeCommonUI();

    renderDashboardMetrics();

    renderEmployeeCards(employees);

    initializeEmployeeSearch();

}


/* 16. START WHEN THE DOCUMENT IS READY */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeHomePage,
        { once: true }
    );

} else {

    initializeHomePage();

}