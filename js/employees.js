/* ==================================================
   Feedback - Employee Directory Logic
   File: js/employees.js

   Responsibilities:
   1. Load employee and department data
   2. Render the employee directory table
   3. Search and filter employee records
   4. Sort directory results
   5. Handle pagination
   6. Support the shared navbar search
   ================================================== */


/* 1. IMPORT STORAGE FUNCTIONS */

import {
    getEmployees,
    getDepartments
} from "./storage.js";


/* 2. IMPORT SHARED UTILITIES */

import {
    normalizeText,
    getDepartmentName,
    searchEmployees,
    formatDate,
    initializeCommonUI
} from "./common.js";


/* 3. SELECT DIRECTORY ELEMENTS */

const filterForm = document.getElementById(
    "directory-filter-form"
);

const directorySearch = document.getElementById(
    "directory-search"
);

const departmentFilter = document.getElementById(
    "department-filter"
);

const statusFilter = document.getElementById(
    "status-filter"
);

const sortFilter = document.getElementById(
    "sort-filter"
);

const tableBody = document.getElementById(
    "employee-table-body"
);

const resultCount = document.getElementById(
    "directory-result-count"
);

const previousPageButton = document.getElementById(
    "previous-page"
);

const nextPageButton = document.getElementById(
    "next-page"
);

const paginationStatus = document.getElementById(
    "pagination-status"
);


/* 4. SELECT NAVBAR SEARCH ELEMENTS */

const headerSearchForm = document.getElementById(
    "employee-search-form"
);

const headerSearchInput = document.getElementById(
    "employee-search"
);

const headerSearchResults = document.getElementById(
    "employee-search-results"
);


/* 5. DIRECTORY SETTINGS */

const PAGE_SIZE = 5;

let currentPage = 1;


/* 6. GET CURRENT DATA */

function getCurrentEmployees() {
    return getEmployees();
}

function getCurrentDepartments() {
    return getDepartments();
}


/* 7. POPULATE DEPARTMENT FILTER */

function populateDepartmentFilter() {

    if (!departmentFilter) {
        return;
    }

    const selectedDepartment = departmentFilter.value;

    departmentFilter.replaceChildren();

    const allOption = document.createElement("option");

    allOption.value = "";
    allOption.textContent = "All Departments";

    departmentFilter.append(allOption);


    getCurrentDepartments().forEach(department => {

        const option = document.createElement("option");

        option.value = department.id;
        option.textContent = department.name;

        departmentFilter.append(option);

    });


    // Preserve the selected department when possible.
    const selectionExists = Array.from(
        departmentFilter.options
    ).some(option => option.value === selectedDepartment);

    if (selectionExists) {
        departmentFilter.value = selectedDepartment;
    }

}


/* 8. FILTER EMPLOYEES */

function getFilteredEmployees() {

    const query = normalizeText(
        directorySearch?.value ?? ""
    );

    const selectedDepartment =
        departmentFilter?.value ?? "";

    const selectedStatus =
        statusFilter?.value ?? "";

    const selectedSort =
        sortFilter?.value ?? "name-asc";


    /* Apply search and filters */

    let filteredEmployees = getCurrentEmployees().filter(
        employee => {

            const departmentName = getDepartmentName(
                employee.departmentId
            );

            const matchesSearch = !query || [
                employee.name,
                employee.id,
                employee.designation,
                employee.email,
                departmentName
            ].some(value =>
                normalizeText(value).includes(query)
            );


            const matchesDepartment =
                !selectedDepartment ||
                employee.departmentId === selectedDepartment;


            const matchesStatus =
                !selectedStatus ||
                employee.status === selectedStatus;


            return (
                matchesSearch &&
                matchesDepartment &&
                matchesStatus
            );

        }
    );


    /* Sort filtered results */

    filteredEmployees.sort((a, b) => {

        const nameA = normalizeText(a.name);
        const nameB = normalizeText(b.name);

        const departmentA = normalizeText(
            getDepartmentName(a.departmentId)
        );

        const departmentB = normalizeText(
            getDepartmentName(b.departmentId)
        );

        const dateA = a.joiningDate || "";
        const dateB = b.joiningDate || "";


        switch (selectedSort) {

            case "name-desc":
                return nameB.localeCompare(nameA);

            case "department-asc":
                return (
                    departmentA.localeCompare(departmentB) ||
                    nameA.localeCompare(nameB)
                );

            case "joining-newest":
                return (
                    dateB.localeCompare(dateA) ||
                    nameA.localeCompare(nameB)
                );

            case "joining-oldest":
                return (
                    dateA.localeCompare(dateB) ||
                    nameA.localeCompare(nameB)
                );

            case "name-asc":
            default:
                return nameA.localeCompare(nameB);

        }

    });


    return filteredEmployees;

}


/* 9. CREATE A TABLE CELL SAFELY */

function createTableCell(
    value,
    className = ""
) {

    const cell = document.createElement("td");

    cell.textContent = String(value ?? "Not available");

    if (className) {
        cell.className = className;
    }

    return cell;

}


/* 10. CREATE AN EMPLOYEE TABLE ROW */

function createEmployeeRow(employee) {

    const row = document.createElement("tr");


    /* Employee ID */

    row.append(
        createTableCell(
            employee.id,
            "employee-id-cell"
        )
    );


    /* Employee name */

    row.append(
        createTableCell(
            employee.name,
            "employee-name-cell"
        )
    );


    /* Designation */

    row.append(
        createTableCell(
            employee.designation,
            "employee-designation-cell"
        )
    );


    /* Department */

    row.append(
        createTableCell(
            getDepartmentName(employee.departmentId),
            "employee-department-cell"
        )
    );


    /* Employee status */

    const statusCell = document.createElement("td");

    const statusBadge = document.createElement("span");

    statusBadge.className = "status-badge";

    const status = employee.status || "Unknown";

    statusBadge.textContent = status;

    if (status.toLowerCase() === "inactive") {
        statusBadge.classList.add("status-inactive");
    }

    statusCell.append(statusBadge);

    row.append(statusCell);


    /* Joining date */

    const joiningDateCell = createTableCell(
        employee.joiningDate
            ? formatDate(employee.joiningDate)
            : "Not available",
        "employee-date-cell"
    );

    row.append(joiningDateCell);


    /* Profile action */

    const actionCell = document.createElement("td");

    const profileLink = document.createElement("a");

    profileLink.className = "table-action";

    profileLink.textContent = "View Profile";

    profileLink.href =
        `employee-profile.html?id=${encodeURIComponent(employee.id)}`;

    profileLink.setAttribute(
        "aria-label",
        `View profile of ${employee.name}`
    );

    actionCell.append(profileLink);

    row.append(actionCell);


    return row;

}


/* 11. RENDER EMPTY STATE */

function renderEmptyState() {

    const row = document.createElement("tr");

    row.className = "empty-row";

    const cell = document.createElement("td");

    cell.colSpan = 7;

    cell.textContent =
        "No employees found. Try changing your search or filters.";

    row.append(cell);

    tableBody.append(row);

}


/* 12. UPDATE PAGINATION CONTROLS */

function updatePagination(totalRecords, totalPages) {

    const safeTotalPages = Math.max(1, totalPages);

    if (paginationStatus) {

        paginationStatus.textContent =
            `Page ${currentPage} of ${safeTotalPages}`;

    }

    if (previousPageButton) {

        previousPageButton.disabled =
            currentPage <= 1 || totalRecords === 0;

    }

    if (nextPageButton) {

        nextPageButton.disabled =
            currentPage >= safeTotalPages ||
            totalRecords === 0;

    }

}


/* 13. RENDER THE EMPLOYEE DIRECTORY */

function renderDirectory() {

    if (!tableBody) {
        return;
    }


    /* Calculate filtered and sorted records */

    const filteredEmployees = getFilteredEmployees();

    const totalRecords = filteredEmployees.length;

    const totalPages = Math.max(
        1,
        Math.ceil(totalRecords / PAGE_SIZE)
    );


    /*
       Prevent invalid page selection when a filter
       reduces the number of results.
    */

    currentPage = Math.min(
        currentPage,
        totalPages
    );


    /* Get the records belonging to the current page */

    const startIndex = (currentPage - 1) * PAGE_SIZE;

    const visibleEmployees = filteredEmployees.slice(
        startIndex,
        startIndex + PAGE_SIZE
    );


    /* Remove previous table rows */

    tableBody.replaceChildren();


    /* Handle empty results */

    if (totalRecords === 0) {

        renderEmptyState();

        if (resultCount) {
            resultCount.textContent = "No employees found.";
        }

        updatePagination(0, 1);

        return;

    }


    /* Render rows using a document fragment */

    const fragment = document.createDocumentFragment();

    visibleEmployees.forEach(employee => {

        fragment.append(
            createEmployeeRow(employee)
        );

    });

    tableBody.append(fragment);


    /* Update result count */

    if (resultCount) {

        const firstRecord = startIndex + 1;

        const lastRecord = Math.min(
            startIndex + visibleEmployees.length,
            totalRecords
        );

        resultCount.textContent =
            `Showing ${firstRecord}–${lastRecord} of ${totalRecords} employees`;

    }


    /* Update pagination buttons */

    updatePagination(totalRecords, totalPages);

}


/* 14. RESET DIRECTORY FILTERS */

function resetDirectoryFilters() {

    filterForm?.reset();

    currentPage = 1;

    renderDirectory();

}


/* 15. APPLY DIRECTORY FILTERS */

function initializeDirectoryFilters() {

    if (!filterForm) {
        return;
    }


    /* Apply button */

    filterForm.addEventListener("submit", event => {

        event.preventDefault();

        currentPage = 1;

        renderDirectory();

    });


    /* Search as the user types */

    directorySearch?.addEventListener("input", () => {

        currentPage = 1;

        renderDirectory();

    });


    /* Apply dropdown selections immediately */

    departmentFilter?.addEventListener("change", () => {

        currentPage = 1;

        renderDirectory();

    });


    statusFilter?.addEventListener("change", () => {

        currentPage = 1;

        renderDirectory();

    });


    sortFilter?.addEventListener("change", () => {

        currentPage = 1;

        renderDirectory();

    });


    /* Clear button */

    const clearButton = document.getElementById(
        "clear-directory-filters"
    );

    clearButton?.addEventListener("click", event => {

        event.preventDefault();

        resetDirectoryFilters();

    });

}


/* 16. INITIALIZE PAGINATION */

function initializePagination() {

    previousPageButton?.addEventListener("click", () => {

        if (currentPage > 1) {

            currentPage--;

            renderDirectory();

        }

    });


    nextPageButton?.addEventListener("click", () => {

        const totalRecords = getFilteredEmployees().length;

        const totalPages = Math.max(
            1,
            Math.ceil(totalRecords / PAGE_SIZE)
        );

        if (currentPage < totalPages) {

            currentPage++;

            renderDirectory();

        }

    });

}


/* 17. HEADER SEARCH: HIDE RESULTS */

function hideHeaderSearchResults() {

    if (!headerSearchResults) {
        return;
    }

    headerSearchResults.hidden = true;

    headerSearchResults.replaceChildren();

}


/* 18. CREATE HEADER SEARCH GROUP HEADING */

function createSearchHeading(text) {

    const heading = document.createElement("p");

    heading.className = "search-result-heading";

    heading.textContent = text;

    return heading;

}


/* 19. HEADER SEARCH: SHOW SUGGESTIONS */

function renderHeaderSearchResults(query) {

    if (!headerSearchResults) {
        return;
    }

    if (!query.trim()) {

        hideHeaderSearchResults();

        return;

    }


    const employeeMatches = searchEmployees(query);

    const normalizedQuery = normalizeText(query);

    const departmentMatches = getCurrentDepartments().filter(
        department => {

            return (
                normalizeText(department.name).includes(normalizedQuery) ||
                normalizeText(department.id).includes(normalizedQuery)
            );

        }
    );


    headerSearchResults.replaceChildren();


    /* Department suggestions */

    if (departmentMatches.length > 0) {

        headerSearchResults.append(
            createSearchHeading("Departments")
        );

        departmentMatches.slice(0, 4).forEach(department => {

            const button = document.createElement("button");

            button.type = "button";

            button.className = "button button-secondary";

            button.textContent = department.name;

            button.addEventListener("click", () => {

                if (departmentFilter) {
                    departmentFilter.value = department.id;
                }

                if (directorySearch) {
                    directorySearch.value = "";
                }

                currentPage = 1;

                renderDirectory();

                hideHeaderSearchResults();

                if (headerSearchInput) {
                    headerSearchInput.value = department.name;
                }

                document.getElementById("employee-table-body")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

            });

            headerSearchResults.append(button);

        });

    }


    /* Employee suggestions */

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


    /* No results */

    if (
        employeeMatches.length === 0 &&
        departmentMatches.length === 0
    ) {

        const message = document.createElement("p");

        message.className = "search-result-empty";

        message.textContent =
            "No employees or departments found.";

        headerSearchResults.append(message);

    }


    headerSearchResults.hidden = false;

}


/* 20. HEADER SEARCH: SUBMIT */

function handleHeaderSearchSubmit(event) {

    event.preventDefault();

    if (!headerSearchInput) {
        return;
    }

    const query = normalizeText(headerSearchInput.value);


    /* Empty query clears all directory filters */

    if (!query) {

        resetDirectoryFilters();

        hideHeaderSearchResults();

        return;

    }


    const employeeList = getCurrentEmployees();


    /* Exact employee ID or name */

    const exactEmployee = employeeList.find(employee => {

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


    /* Exact department name or ID */

    const exactDepartment = getCurrentDepartments().find(
        department => {

            return (
                normalizeText(department.name) === query ||
                normalizeText(department.id) === query
            );

        }
    );

    if (exactDepartment) {

        if (departmentFilter) {
            departmentFilter.value = exactDepartment.id;
        }

        if (directorySearch) {
            directorySearch.value = "";
        }

        currentPage = 1;

        renderDirectory();

        hideHeaderSearchResults();

        document.getElementById("employee-table-body")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        return;

    }


    /* Submit a unique partial employee match */

    const employeeMatches = searchEmployees(query);

    if (employeeMatches.length === 1) {

        window.location.href =
            `employee-profile.html?id=${encodeURIComponent(employeeMatches[0].id)}`;

        return;

    }


    /* Show choices when multiple matches exist */

    renderHeaderSearchResults(headerSearchInput.value);

}


/* 21. INITIALIZE HEADER SEARCH */

function initializeHeaderSearch() {

    if (!headerSearchForm || !headerSearchInput) {
        return;
    }

    headerSearchForm.addEventListener(
        "submit",
        handleHeaderSearchSubmit
    );

    headerSearchInput.addEventListener("input", () => {

        renderHeaderSearchResults(headerSearchInput.value);

    });


    /* Close search results when clicking outside */

    document.addEventListener("click", event => {

        if (!headerSearchForm.contains(event.target)) {

            hideHeaderSearchResults();

        }

    });


    /* Escape closes search suggestions */

    headerSearchInput.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            hideHeaderSearchResults();

            headerSearchInput.blur();

        }

    });

}


/* 22. INITIALIZE DIRECTORY PAGE */

function initializeEmployeeDirectory() {

    initializeCommonUI();

    populateDepartmentFilter();

    initializeDirectoryFilters();

    initializePagination();

    initializeHeaderSearch();


    /*
       Preserve a query passed in the page URL.
       Example: all-employees.html?q=engineering
    */

    const urlParameters = new URLSearchParams(
        window.location.search
    );

    const initialQuery = urlParameters.get("q");

    if (initialQuery && directorySearch) {

        directorySearch.value = initialQuery;

    }


    /* Render the first page */

    renderDirectory();

}


/* 23. START WHEN THE DOCUMENT IS READY */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeEmployeeDirectory,
        { once: true }
    );

} else {

    initializeEmployeeDirectory();

}