/* ==================================================
   Feedback - Task Management Logic
   File: js/tasks.js

   Responsibilities:
   1. Load employees and tasks from localStorage
   2. Populate the employee assignment dropdown
   3. Validate and create new tasks
   4. Save tasks through the storage service
   5. Calculate task summary metrics
   6. Search, filter, sort, and paginate tasks
   7. Update task status and progress
   8. Support shared navbar employee search
   ================================================== */


/* 1. IMPORT STORAGE FUNCTIONS */

import {
    getEmployees,
    getDepartments,
    getTasks,
    addTask,
    updateTask
} from "./storage.js";


/* 2. IMPORT SHARED UTILITIES */

import {
    normalizeText,
    getEmployeeById,
    searchEmployees,
    getDepartmentName,
    isTaskOverdue,
    formatDate,
    getLocalDateString,
    initializeCommonUI
} from "./common.js";


/* 3. SELECT TASK FORM ELEMENTS */

const taskForm = document.getElementById("task-form");

const taskTitleInput = document.getElementById("task-title");

const taskDescriptionInput = document.getElementById(
    "task-description"
);

const taskAssigneeInput = document.getElementById(
    "task-assignee"
);

const taskDueDateInput = document.getElementById(
    "task-due-date"
);

const taskPriorityInput = document.getElementById(
    "task-priority"
);

const taskReferenceInput = document.getElementById(
    "task-reference"
);

const taskFormMessage = document.getElementById(
    "task-form-message"
);

const createTaskButton = document.getElementById(
    "create-task-button"
);


/* 4. SELECT TASK FILTER ELEMENTS */

const taskFilterForm = document.getElementById(
    "task-filter-form"
);

const taskSearchInput = document.getElementById(
    "task-search"
);

const taskStatusFilter = document.getElementById(
    "task-status-filter"
);

const taskPriorityFilter = document.getElementById(
    "task-priority-filter"
);

const taskSortInput = document.getElementById(
    "task-sort"
);

const clearTaskFiltersButton = document.getElementById(
    "clear-task-filters"
);


/* 5. SELECT TASK TABLE ELEMENTS */

const taskTableBody = document.getElementById(
    "task-table-body"
);

const taskResultCount = document.getElementById(
    "task-result-count"
);

const previousTaskPageButton = document.getElementById(
    "previous-task-page"
);

const nextTaskPageButton = document.getElementById(
    "next-task-page"
);

const taskPaginationStatus = document.getElementById(
    "task-pagination-status"
);


/* 6. SELECT DASHBOARD METRICS */

const totalTasksElement = document.getElementById(
    "total-tasks"
);

const inProgressTasksElement = document.getElementById(
    "tasks-in-progress"
);

const inReviewTasksElement = document.getElementById(
    "tasks-in-review"
);

const overdueTasksElement = document.getElementById(
    "tasks-overdue"
);


/* 7. SELECT SHARED NAVBAR SEARCH ELEMENTS */

const headerSearchForm = document.getElementById(
    "employee-search-form"
);

const headerSearchInput = document.getElementById(
    "employee-search"
);

const headerSearchResults = document.getElementById(
    "employee-search-results"
);


/* 8. TASK REGISTER SETTINGS */

const TASKS_PER_PAGE = 5;

let currentTaskPage = 1;


/* ==================================================
   9. SHARED TASK HELPERS
   ================================================== */


/* Always read the latest saved data */

function getCurrentTasks() {
    return getTasks();
}

function getCurrentEmployees() {
    return getEmployees();
}


/* Format task status for display */

function getTaskStatusLabel(status) {

    const labels = {
        "assigned": "Assigned",
        "in-progress": "In Progress",
        "review": "Awaiting Review",
        "completed": "Completed",
        "cancelled": "Cancelled"
    };

    return labels[status] || "Unknown";

}


/* Escape the display of optional values using textContent */

function createTextElement(tagName, className, text) {

    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    element.textContent = String(text ?? "");

    return element;

}


/* ==================================================
   10. TASK SUMMARY METRICS
   ================================================== */

function renderTaskMetrics() {

    const currentTasks = getCurrentTasks();

    const metrics = {

        total: currentTasks.length,

        inProgress: currentTasks.filter(
            task => task.status === "in-progress"
        ).length,

        inReview: currentTasks.filter(
            task => task.status === "review"
        ).length,

        overdue: currentTasks.filter(
            task => isTaskOverdue(task)
        ).length

    };


    if (totalTasksElement) {
        totalTasksElement.textContent = String(metrics.total);
    }

    if (inProgressTasksElement) {
        inProgressTasksElement.textContent =
            String(metrics.inProgress);
    }

    if (inReviewTasksElement) {
        inReviewTasksElement.textContent =
            String(metrics.inReview);
    }

    if (overdueTasksElement) {
        overdueTasksElement.textContent =
            String(metrics.overdue);
    }

}


/* ==================================================
   11. POPULATE EMPLOYEE ASSIGNMENT DROPDOWN
   ================================================== */

function populateEmployeeDropdown() {

    if (!taskAssigneeInput) {
        return;
    }

    const previouslySelectedEmployee = taskAssigneeInput.value;

    taskAssigneeInput.replaceChildren();


    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "Select an employee";

    taskAssigneeInput.append(placeholder);


    const activeEmployees = getCurrentEmployees()
        .filter(employee =>
            normalizeText(employee.status) === "active"
        )
        .sort((a, b) =>
            a.name.localeCompare(b.name)
        );


    activeEmployees.forEach(employee => {

        const option = document.createElement("option");

        option.value = employee.id;

        option.textContent =
            `${employee.name} — ${employee.designation}`;

        taskAssigneeInput.append(option);

    });


    /*
       Retain the previous selection where possible.
       Useful when the dropdown is refreshed.
    */

    if (
        activeEmployees.some(
            employee => employee.id === previouslySelectedEmployee
        )
    ) {
        taskAssigneeInput.value = previouslySelectedEmployee;
    }


    /*
       Support the employee profile's Assign Task link:

       tasks.html?employeeId=EMP001#assign-task
    */

    const parameters = new URLSearchParams(
        window.location.search
    );

    const requestedEmployeeId = parameters.get("employeeId");

    if (requestedEmployeeId) {

        const requestedEmployee = activeEmployees.find(
            employee => employee.id === requestedEmployeeId
        );

        if (requestedEmployee) {
            taskAssigneeInput.value = requestedEmployee.id;
        }

    }


    if (activeEmployees.length === 0) {

        const option = document.createElement("option");

        option.value = "";
        option.textContent = "No active employees available";
        option.disabled = true;

        taskAssigneeInput.append(option);

    }

}


/* ==================================================
   12. TASK FORM MESSAGES
   ================================================== */

function showTaskFormMessage(message) {

    if (!taskFormMessage) {
        return;
    }

    taskFormMessage.textContent = message;

    taskFormMessage.hidden = !message;

}


/* ==================================================
   13. GENERATE A UNIQUE TASK ID
   ================================================== */

function generateTaskId() {

    const existingTasks = getCurrentTasks();

    let highestNumber = 0;


    existingTasks.forEach(task => {

        const match = String(task.id).match(/^TASK(\d+)$/i);

        if (match) {

            highestNumber = Math.max(
                highestNumber,
                Number(match[1])
            );

        }

    });


    let nextNumber = highestNumber + 1;

    let newId = `TASK${String(nextNumber).padStart(3, "0")}`;


    /*
       Check for collisions even if existing records use
       an unexpected or nonsequential identifier pattern.
    */

    while (
        existingTasks.some(task => task.id === newId)
    ) {

        nextNumber++;

        newId = `TASK${String(nextNumber).padStart(3, "0")}`;

    }

    return newId;

}


/* ==================================================
   14. VALIDATE TASK FORM
   ================================================== */

function validateTaskForm() {

    if (!taskForm) {
        return false;
    }


    const title = taskTitleInput.value.trim();

    const description = taskDescriptionInput.value.trim();

    const employeeId = taskAssigneeInput.value;

    const dueDate = taskDueDateInput.value;

    const priority = taskPriorityInput.value;


    /* Clear previous custom errors */

    taskTitleInput.setCustomValidity("");

    taskDescriptionInput.setCustomValidity("");

    taskDueDateInput.setCustomValidity("");


    /* Reject titles containing only spaces */

    if (title.length < 3) {

        taskTitleInput.setCustomValidity(
            "Enter a task title containing at least 3 characters."
        );

    }


    /* Validate the task description */

    if (description.length < 10) {

        taskDescriptionInput.setCustomValidity(
            "Enter a task description containing at least 10 characters."
        );

    }


    /* Do not accept past deadlines for newly created tasks */

    if (dueDate && dueDate < getLocalDateString()) {

        taskDueDateInput.setCustomValidity(
            "The deadline cannot be earlier than today."
        );

    }


    /* Validate employee existence and current eligibility */

    const selectedEmployee = getEmployeeById(employeeId);

    const employeeIsActive =
        selectedEmployee &&
        normalizeText(selectedEmployee.status) === "active";


    if (!employeeIsActive) {

        showTaskFormMessage(
            "Please select a valid active employee."
        );

        taskAssigneeInput.focus();

        return false;

    }


    /* Validate priority against the supported options */

    const allowedPriorities = [
        "Low",
        "Medium",
        "High",
        "Critical"
    ];

    if (!allowedPriorities.includes(priority)) {

        showTaskFormMessage(
            "Please select a valid task priority."
        );

        taskPriorityInput.focus();

        return false;

    }


    /*
       Explicitly trigger browser validation even though
       the HTML form uses novalidate.
    */

    const isValid = taskForm.reportValidity();

    if (!isValid) {

        showTaskFormMessage(
            "Please correct the highlighted fields before assigning the task."
        );

        return false;

    }


    showTaskFormMessage("");

    return true;

}


/* ==================================================
   15. CREATE AND SAVE A NEW TASK
   ================================================== */

function handleTaskFormSubmit(event) {

    event.preventDefault();

    if (!taskForm) {
        return;
    }

    showTaskFormMessage("");


    if (!validateTaskForm()) {
        return;
    }


    const title = taskTitleInput.value.trim();

    const description = taskDescriptionInput.value.trim();

    const employeeId = taskAssigneeInput.value;

    const dueDate = taskDueDateInput.value;

    const priority = taskPriorityInput.value;

    const reference = taskReferenceInput.value.trim();


    /*
       Build a new task record.

       New tasks begin as "assigned" with zero progress.
       The admin can update the status later.
    */

    const newTask = {

        id: generateTaskId(),

        title,

        description,

        employeeId,

        assignedBy: "ADMIN001",

        createdAt: getLocalDateString(),

        dueDate,

        priority,

        status: "assigned",

        progress: 0,

        updates: [],

        feedback: "",

        ...(reference ? { reference } : {})

    };


    if (createTaskButton) {
        createTaskButton.disabled = true;
        createTaskButton.textContent = "Saving...";
    }


    try {

        const saved = addTask(newTask);


        if (!saved) {

            showTaskFormMessage(
                "The task could not be saved. Check browser storage availability and try again."
            );

            return;

        }


        /*
           Clear the current table filters so the newly
           assigned task is visible in the task register.
        */

        taskFilterForm?.reset();

        currentTaskPage = 1;

        renderTaskMetrics();

        renderTaskRegister();


        /* Reset the assignment form */

        taskForm.reset();

        taskDueDateInput.min = getLocalDateString();


        showTaskFormMessage(
            `Task ${newTask.id} was saved successfully and assigned to ${getEmployeeById(employeeId).name}.`
        );


        /*
           Keep the newly assigned employee selected when
           arriving from that employee's profile.
        */

        const parameters = new URLSearchParams(
            window.location.search
        );

        const requestedEmployeeId = parameters.get("employeeId");

        if (
            requestedEmployeeId &&
            requestedEmployeeId === employeeId
        ) {

            taskAssigneeInput.value = requestedEmployeeId;

        }


    } catch (error) {

        console.error("Feedback: Task creation failed.", error);

        showTaskFormMessage(
            "An unexpected error occurred while creating the task."
        );

    } finally {

        if (createTaskButton) {

            createTaskButton.disabled = false;

            createTaskButton.textContent = "Assign Task";

        }

    }

}


/* ==================================================
   16. TASK FILTERING AND SORTING
   ================================================== */

function getFilteredTasks() {

    const searchTerm = normalizeText(
        taskSearchInput?.value ?? ""
    );

    const selectedStatus = taskStatusFilter?.value ?? "";

    const selectedPriority = taskPriorityFilter?.value ?? "";

    const selectedSort = taskSortInput?.value ?? "due-asc";


    let filteredTasks = getCurrentTasks().filter(task => {

        const employee = getEmployeeById(task.employeeId);

        const employeeName = employee
            ? employee.name
            : "Unknown Employee";

        const searchableValues = [
            task.id,
            task.title,
            task.description,
            task.employeeId,
            employeeName,
            task.reference
        ];


        const matchesSearch =
            !searchTerm ||
            searchableValues.some(value =>
                normalizeText(value).includes(searchTerm)
            );


        const matchesStatus =
            !selectedStatus ||
            task.status === selectedStatus;


        const matchesPriority =
            !selectedPriority ||
            task.priority === selectedPriority;


        return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority
        );

    });


    /* Sort the filtered task list */

    const priorityRank = {
        "Low": 1,
        "Medium": 2,
        "High": 3,
        "Critical": 4
    };


    filteredTasks.sort((a, b) => {

        switch (selectedSort) {

            case "due-desc":
                return (
                    String(b.dueDate || "").localeCompare(
                        String(a.dueDate || "")
                    )
                );

            case "priority-desc":
                return (
                    (priorityRank[b.priority] || 0) -
                    (priorityRank[a.priority] || 0)
                );

            case "title-asc":
                return String(a.title).localeCompare(
                    String(b.title)
                );

            case "due-asc":
            default: {

                const dateA = a.dueDate || "9999-12-31";

                const dateB = b.dueDate || "9999-12-31";

                return dateA.localeCompare(dateB);

            }

        }

    });


    return filteredTasks;

}


/* ==================================================
   17. CREATE TASK STATUS SELECT
   ================================================== */

function createTaskStatusSelect(task) {

    const select = document.createElement("select");

    select.className = "task-inline-control";

    select.setAttribute(
        "aria-label",
        `Update status for ${task.title}`
    );


    const statuses = [
        ["assigned", "Assigned"],
        ["in-progress", "In Progress"],
        ["review", "Awaiting Review"],
        ["completed", "Completed"],
        ["cancelled", "Cancelled"]
    ];


    statuses.forEach(([value, label]) => {

        const option = document.createElement("option");

        option.value = value;

        option.textContent = label;

        select.append(option);

    });


    select.value = task.status;

    return select;

}


/* ==================================================
   18. CREATE TASK PROGRESS INPUT
   ================================================== */

function createTaskProgressInput(task) {

    const input = document.createElement("input");

    input.type = "number";

    input.className = "task-inline-control";

    input.min = "0";

    input.max = "100";

    input.step = "1";

    input.value = String(task.progress);

    input.inputMode = "numeric";

    input.setAttribute(
        "aria-label",
        `Update progress percentage for ${task.title}`
    );

    return input;

}


/* ==================================================
   19. CREATE A TASK BADGE
   ================================================== */

function createTaskBadge(label, neutral = false) {

    const badge = document.createElement("span");

    badge.className = "task-badge";

    if (neutral) {
        badge.classList.add("task-badge-neutral");
    }

    badge.textContent = label;

    return badge;

}


/* ==================================================
   20. CREATE TASK PROGRESS DISPLAY
   ================================================== */

function createTaskProgressDisplay(task) {

    const container = document.createElement("div");

    container.className = "task-progress";


    const numericProgress = Number(task.progress);

    const progress = Number.isFinite(numericProgress)
        ? Math.min(100, Math.max(0, numericProgress))
        : 0;


    const label = createTextElement(
        "span",
        "task-progress-label",
        `${progress}%`
    );


    const track = document.createElement("div");

    track.className = "task-progress-track";

    track.setAttribute("role", "progressbar");

    track.setAttribute(
        "aria-label",
        `Progress for ${task.title}`
    );

    track.setAttribute("aria-valuemin", "0");

    track.setAttribute("aria-valuemax", "100");

    track.setAttribute("aria-valuenow", String(progress));


    const fill = document.createElement("span");

    fill.className = "task-progress-fill";

    fill.style.width = `${progress}%`;


    track.append(fill);

    container.append(label, track);

    return container;

}


/* ==================================================
   21. CREATE A TASK TABLE ROW
   ================================================== */

function createTaskRow(task) {

    const row = document.createElement("tr");


    /* Task title and description */

    const taskCell = document.createElement("td");

    taskCell.className = "task-title-cell";

    taskCell.append(
        createTextElement("span", "", task.title)
    );

    const description = createTextElement(
        "span",
        "task-description-cell",
        task.description || "No description available."
    );

    taskCell.append(description);


    if (task.reference) {

        taskCell.append(
            createTextElement(
                "span",
                "task-description-cell",
                `Project: ${task.reference}`
            )
        );

    }

    row.append(taskCell);


    /* Employee */

    const assigneeCell = document.createElement("td");

    assigneeCell.className = "task-assignee-cell";

    const employee = getEmployeeById(task.employeeId);

    if (employee) {

        const employeeLink = document.createElement("a");

        employeeLink.href =
            `employee-profile.html?id=${encodeURIComponent(employee.id)}`;

        employeeLink.textContent = employee.name;

        assigneeCell.append(employeeLink);

    } else {

        assigneeCell.textContent = "Unknown Employee";

    }

    row.append(assigneeCell);


    /* Deadline */

    const deadlineCell = document.createElement("td");

    deadlineCell.className = "task-date-cell";

    deadlineCell.textContent = task.dueDate
        ? formatDate(task.dueDate)
        : "Not set";


    if (isTaskOverdue(task)) {

        deadlineCell.append(
            document.createElement("br"),
            createTextElement(
                "span",
                "task-overdue-label",
                "Overdue"
            )
        );

    }

    row.append(deadlineCell);


    /* Priority */

    const priorityCell = document.createElement("td");

    priorityCell.append(
        createTaskBadge(
            task.priority || "Not set",
            task.priority === "Low"
        )
    );

    row.append(priorityCell);


    /* Status */

    const statusCell = document.createElement("td");

    statusCell.append(
        createTaskBadge(
            getTaskStatusLabel(task.status),
            task.status === "completed" ||
            task.status === "cancelled"
        )
    );

    row.append(statusCell);


    /* Progress */

    const progressCell = document.createElement("td");

    progressCell.append(
        createTaskProgressDisplay(task)
    );

    row.append(progressCell);


    /* Task actions */

    const actionsCell = document.createElement("td");

    const actions = document.createElement("div");

    actions.className = "task-actions";


    const statusSelect = createTaskStatusSelect(task);

    const progressInput = createTaskProgressInput(task);


    const saveButton = document.createElement("button");

    saveButton.type = "button";

    saveButton.className = "button button-primary";

    saveButton.textContent = "Save Update";

    saveButton.addEventListener("click", () => {

        saveButton.disabled = true;

        try {

            const newStatus = statusSelect.value;

            const rawProgress = progressInput.value.trim();

            const progress = Number(rawProgress);


            /* Validate progress */

            if (
                rawProgress === "" ||
                !Number.isInteger(progress) ||
                progress < 0 ||
                progress > 100
            ) {

                alert(
                    "Progress must be a whole number between 0 and 100."
                );

                progressInput.focus();

                return;

            }


            /* Validate status */

            const allowedStatuses = [
                "assigned",
                "in-progress",
                "review",
                "completed",
                "cancelled"
            ];

            if (!allowedStatuses.includes(newStatus)) {

                alert("Please choose a valid task status.");

                statusSelect.focus();

                return;

            }


            let finalStatus = newStatus;

            let finalProgress = progress;


            /*
               A completed task is always 100% complete.
               A task sent for review is treated as submitted.
            */

            if (
                finalStatus === "completed" ||
                finalStatus === "review"
            ) {

                finalProgress = 100;

            }


            /*
               A task with recorded progress should not remain
               "Assigned". Promote it to "In Progress".
            */

            if (
                finalStatus === "assigned" &&
                finalProgress > 0
            ) {

                finalStatus = "in-progress";

            }


            const saved = updateTask(task.id, {

                status: finalStatus,

                progress: finalProgress,

                updatedAt: getLocalDateString()

            });


            if (!saved) {

                alert(
                    "The task update could not be saved. Check browser storage availability."
                );

                return;

            }


            renderTaskMetrics();

            renderTaskRegister();


        } catch (error) {

            console.error(
                "Feedback: Task update failed.",
                error
            );

            alert(
                "An unexpected error occurred while updating the task."
            );

        } finally {

            saveButton.disabled = false;

        }

    });


    actions.append(
        statusSelect,
        progressInput,
        saveButton
    );

    actionsCell.append(actions);

    row.append(actionsCell);


    return row;

}


/* ==================================================
   22. RENDER TASK REGISTER EMPTY STATE
   ================================================== */

function renderEmptyTaskState() {

    const row = document.createElement("tr");

    row.className = "empty-row";


    const cell = document.createElement("td");

    cell.colSpan = 7;

    cell.textContent =
        "No tasks found. Try changing your search or filters.";


    row.append(cell);

    taskTableBody.append(row);

}


/* ==================================================
   23. UPDATE TASK PAGINATION
   ================================================== */

function updateTaskPagination(totalRecords, totalPages) {

    const safeTotalPages = Math.max(1, totalPages);


    if (taskPaginationStatus) {

        taskPaginationStatus.textContent =
            `Page ${currentTaskPage} of ${safeTotalPages}`;

    }


    if (previousTaskPageButton) {

        previousTaskPageButton.disabled =
            totalRecords === 0 ||
            currentTaskPage <= 1;

    }


    if (nextTaskPageButton) {

        nextTaskPageButton.disabled =
            totalRecords === 0 ||
            currentTaskPage >= safeTotalPages;

    }

}


/* ==================================================
   24. RENDER TASK REGISTER
   ================================================== */

function renderTaskRegister() {

    if (!taskTableBody) {
        return;
    }


    const filteredTasks = getFilteredTasks();

    const totalRecords = filteredTasks.length;

    const totalPages = Math.max(
        1,
        Math.ceil(totalRecords / TASKS_PER_PAGE)
    );


    /* Keep the current page within valid bounds */

    currentTaskPage = Math.min(
        currentTaskPage,
        totalPages
    );


    const startIndex =
        (currentTaskPage - 1) * TASKS_PER_PAGE;

    const visibleTasks = filteredTasks.slice(
        startIndex,
        startIndex + TASKS_PER_PAGE
    );


    taskTableBody.replaceChildren();


    if (totalRecords === 0) {

        renderEmptyTaskState();

        if (taskResultCount) {
            taskResultCount.textContent = "No tasks found.";
        }

        updateTaskPagination(0, 1);

        return;

    }


    const fragment = document.createDocumentFragment();

    visibleTasks.forEach(task => {

        fragment.append(
            createTaskRow(task)
        );

    });

    taskTableBody.append(fragment);


    if (taskResultCount) {

        const firstRecord = startIndex + 1;

        const lastRecord = Math.min(
            startIndex + visibleTasks.length,
            totalRecords
        );

        taskResultCount.textContent =
            `Showing ${firstRecord}–${lastRecord} of ${totalRecords} tasks`;

    }


    updateTaskPagination(totalRecords, totalPages);

}


/* ==================================================
   25. INITIALIZE TASK FILTERS
   ================================================== */

function resetTaskFilters() {

    taskFilterForm?.reset();

    currentTaskPage = 1;

    renderTaskRegister();

}


function initializeTaskFilters() {

    if (!taskFilterForm) {
        return;
    }


    /* Search while typing */

    taskSearchInput?.addEventListener("input", () => {

        currentTaskPage = 1;

        renderTaskRegister();

    });


    /* Apply filters */

    taskFilterForm.addEventListener("submit", event => {

        event.preventDefault();

        currentTaskPage = 1;

        renderTaskRegister();

    });


    /* Update results as dropdown filters change */

    taskStatusFilter?.addEventListener("change", () => {

        currentTaskPage = 1;

        renderTaskRegister();

    });


    taskPriorityFilter?.addEventListener("change", () => {

        currentTaskPage = 1;

        renderTaskRegister();

    });


    taskSortInput?.addEventListener("change", () => {

        currentTaskPage = 1;

        renderTaskRegister();

    });


    /* Clear filters */

    clearTaskFiltersButton?.addEventListener("click", event => {

        event.preventDefault();

        resetTaskFilters();

    });

}


/* ==================================================
   26. INITIALIZE TASK PAGINATION
   ================================================== */

function initializeTaskPagination() {

    previousTaskPageButton?.addEventListener(
        "click",
        () => {

            if (currentTaskPage > 1) {

                currentTaskPage--;

                renderTaskRegister();

            }

        }
    );


    nextTaskPageButton?.addEventListener(
        "click",
        () => {

            const totalPages = Math.max(
                1,
                Math.ceil(
                    getFilteredTasks().length / TASKS_PER_PAGE
                )
            );

            if (currentTaskPage < totalPages) {

                currentTaskPage++;

                renderTaskRegister();

            }

        }
    );

}


/* ==================================================
   27. INITIALIZE TASK FORM
   ================================================== */

function initializeTaskForm() {

    if (!taskForm) {
        return;
    }


    /* Prevent newly assigned tasks from using past dates */

    if (taskDueDateInput) {

        taskDueDateInput.min = getLocalDateString();

    }


    /* Submit assignment */

    taskForm.addEventListener(
        "submit",
        handleTaskFormSubmit
    );


    /* Clear the form and its validation messages */

    taskForm.addEventListener("reset", () => {

        showTaskFormMessage("");

        if (taskTitleInput) {
            taskTitleInput.setCustomValidity("");
        }

        if (taskDescriptionInput) {
            taskDescriptionInput.setCustomValidity("");
        }

        if (taskDueDateInput) {
            taskDueDateInput.setCustomValidity("");
        }

    });

}


/* ==================================================
   28. SHARED NAVBAR SEARCH
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

    const departmentMatches = getDepartments().filter(
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

            const link = document.createElement("a");

            link.className = "search-result-item";

            link.href =
                `all-employees.html?q=${encodeURIComponent(department.name)}`;

            link.textContent = department.name;

            headerSearchResults.append(link);

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


/* Handle navbar search submission */

function handleHeaderSearchSubmit(event) {

    event.preventDefault();

    const query = normalizeText(
        headerSearchInput?.value ?? ""
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


    const exactDepartment = getDepartments().find(department => {

        return (
            normalizeText(department.name) === query ||
            normalizeText(department.id) === query
        );

    });


    if (exactDepartment) {

        window.location.href =
            `all-employees.html?q=${encodeURIComponent(exactDepartment.name)}`;

        return;

    }


    /* One partial employee result */

    if (employeeMatches.length === 1) {

        window.location.href =
            `employee-profile.html?id=${encodeURIComponent(employeeMatches[0].id)}`;

        return;

    }


    /* Multiple matches or no employee match */

    window.location.href =
        `all-employees.html?q=${encodeURIComponent(query)}`;

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


    headerSearchForm.addEventListener(
        "submit",
        handleHeaderSearchSubmit
    );


    /* Close suggestions outside the search area */

    document.addEventListener("click", event => {

        if (!headerSearchForm.contains(event.target)) {

            hideHeaderSearchResults();

        }

    });


    /* Escape key */

    headerSearchInput.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            hideHeaderSearchResults();

            headerSearchInput.blur();

        }

    });

}


/* ==================================================
   29. INITIALIZE TASK MANAGEMENT PAGE
   ================================================== */

function initializeTaskManagement() {

    initializeCommonUI();

    populateEmployeeDropdown();

    initializeTaskForm();

    initializeTaskFilters();

    initializeTaskPagination();

    initializeHeaderSearch();


    renderTaskMetrics();

    renderTaskRegister();

}


/* ==================================================
   30. START WHEN THE DOCUMENT IS READY
   ================================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeTaskManagement,
        { once: true }
    );

} else {

    initializeTaskManagement();

}