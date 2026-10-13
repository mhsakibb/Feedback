/* ==================================================
   Feedback - Employee Profile Logic
   File: js/employee-profile.js

   Responsibilities:
   1. Read employee ID from the URL
   2. Load employee information from storage
   3. Render professional profile details
   4. Display assigned tasks and task metrics
   5. Render recorded work updates and feedback
   6. Handle missing employees and photos
   7. Support the shared navbar search
   ================================================== */


/* 1. IMPORT STORAGE AND SHARED UTILITIES */

import {
    getDepartments
} from "./storage.js";

import {
    normalizeText,
    getEmployeeById,
    getTasksForEmployee,
    getDepartmentName,
    isTaskOverdue,
    formatDate,
    searchEmployees,
    initializeCommonUI
} from "./common.js";


/* 2. SELECT PROFILE ELEMENTS */

const loadingSection = document.getElementById(
    "profile-loading"
);

const notFoundSection = document.getElementById(
    "profile-not-found"
);

const profileContent = document.getElementById(
    "employee-profile-content"
);

const profilePhoto = document.getElementById(
    "profile-photo"
);

const profileName = document.getElementById(
    "profile-employee-name"
);

const profileDesignation = document.getElementById(
    "profile-designation"
);

const profileDepartment = document.getElementById(
    "profile-department"
);

const profileEmployeeId = document.getElementById(
    "profile-employee-id"
);

const profileStatus = document.getElementById(
    "profile-status"
);

const assignTaskLink = document.getElementById(
    "assign-task-link"
);

const profileSummary = document.getElementById(
    "profile-summary"
);

const profileSkills = document.getElementById(
    "profile-skills"
);

const profileEmail = document.getElementById(
    "profile-email"
);

const taskTableBody = document.getElementById(
    "profile-task-table-body"
);

const activityList = document.getElementById(
    "profile-activity-list"
);


/* 3. READ EMPLOYEE ID FROM THE URL */

function getRequestedEmployeeId() {

    const parameters = new URLSearchParams(
        window.location.search
    );

    return (parameters.get("id") || "").trim();

}


/* 4. CREATE FALLBACK AVATAR */

function createAvatarDataUri(name) {

    const initials = String(name || "Employee")
        .trim()
        .split(/\s+/)
        .map(part => part.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();

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
             width="220"
             height="220"
             viewBox="0 0 220 220">

            <rect width="220" height="220" fill="#083D91"/>

            <text x="110"
                  y="118"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  font-family="Arial, sans-serif"
                  font-size="64"
                  font-weight="600"
                  fill="#FFFFFF">${safeInitials}</text>

        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

}


/* 5. SET EMPLOYEE PHOTO */

function renderProfilePhoto(employee) {

    if (!profilePhoto) {
        return;
    }

    profilePhoto.alt = `Portrait of ${employee.name}`;

    profilePhoto.width = 220;
    profilePhoto.height = 220;

    profilePhoto.dataset.fallbackApplied = "false";

    profilePhoto.onerror = () => {

        if (profilePhoto.dataset.fallbackApplied === "true") {
            profilePhoto.onerror = null;
            return;
        }

        profilePhoto.dataset.fallbackApplied = "true";

        profilePhoto.src = createAvatarDataUri(employee.name);

    };

    profilePhoto.src = employee.photo || createAvatarDataUri(
        employee.name
    );

}


/* 6. FORMAT STATUS LABELS */

function formatStatus(status) {

    const labels = {
        "assigned": "Assigned",
        "in-progress": "In Progress",
        "review": "Awaiting Review",
        "completed": "Completed",
        "cancelled": "Cancelled"
    };

    return labels[status] || "Unknown";

}


/* 7. RENDER EMPLOYEE STATUS */

function renderEmployeeStatus(status) {

    if (!profileStatus) {
        return;
    }

    const normalizedStatus = normalizeText(status);

    profileStatus.textContent = status || "Unknown";

    profileStatus.classList.toggle(
        "status-inactive",
        normalizedStatus === "inactive"
    );

}


/* 8. RENDER EMPLOYMENT INFORMATION */

function renderEmploymentDetails(employee) {

    profileName.textContent = employee.name;

    profileDesignation.textContent =
        employee.designation || "Not specified";

    profileDepartment.textContent = getDepartmentName(
        employee.departmentId
    );

    profileEmployeeId.textContent =
        `Employee ID: ${employee.id}`;

    document.getElementById(
        "detail-employee-id"
    ).textContent = employee.id;

    document.getElementById(
        "detail-designation"
    ).textContent = employee.designation || "Not specified";

    document.getElementById(
        "detail-department"
    ).textContent = getDepartmentName(
        employee.departmentId
    );

    document.getElementById(
        "detail-joining-date"
    ).textContent = employee.joiningDate
        ? formatDate(employee.joiningDate)
        : "Not available";

    document.getElementById(
        "detail-employment-status"
    ).textContent = employee.status || "Unknown";

    renderEmployeeStatus(employee.status);

}


/* 9. RENDER PROFESSIONAL SUMMARY AND SKILLS */

function renderProfessionalInformation(employee) {

    profileSummary.textContent =
        employee.summary || "No professional summary available.";

    profileSkills.replaceChildren();

    const skills = Array.isArray(employee.skills)
        ? employee.skills
        : [];

    if (skills.length === 0) {

        const item = document.createElement("li");

        item.textContent = "No skills have been added.";

        profileSkills.append(item);

        return;

    }

    skills.forEach(skill => {

        const item = document.createElement("li");

        item.textContent = String(skill);

        profileSkills.append(item);

    });

}


/* 10. RENDER CONTACT INFORMATION */

function renderContactInformation(employee) {

    profileEmail.replaceChildren();

    const email = String(employee.email || "").trim();

    /*
       Only create a mailto link when the email resembles
       a valid basic email address.
    */

    const isValidEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail) {

        profileEmail.textContent = email || "Not available";

        return;

    }

    const emailLink = document.createElement("a");

    emailLink.href = `mailto:${email}`;

    emailLink.textContent = email;

    profileEmail.append(emailLink);

}


/* 11. RENDER PROFILE ACTIONS */

function configureProfileActions(employee) {

    if (!assignTaskLink) {
        return;
    }

    const parameters = new URLSearchParams({
        employeeId: employee.id
    });

    assignTaskLink.href =
        `tasks.html?${parameters.toString()}#assign-task`;

}


/* 12. CREATE A TASK TABLE CELL */

function createTaskCell(value, className = "") {

    const cell = document.createElement("td");

    cell.textContent = String(value ?? "Not available");

    if (className) {
        cell.className = className;
    }

    return cell;

}


/* 13. CREATE A TASK BADGE */

function createTaskBadge(label, neutral = false) {

    const badge = document.createElement("span");

    badge.className = "profile-task-badge";

    if (neutral) {
        badge.classList.add("is-neutral");
    }

    badge.textContent = label;

    return badge;

}


/* 14. CREATE A TASK PROGRESS BAR */

function createTaskProgress(task) {

    const wrapper = document.createElement("div");

    wrapper.className = "profile-task-progress";

    const numericProgress = Number(task.progress);

    const progress = Number.isFinite(numericProgress)
        ? Math.min(100, Math.max(0, numericProgress))
        : 0;


    const label = document.createElement("span");

    label.className = "profile-task-progress-value";

    label.textContent = `${progress}%`;


    const track = document.createElement("div");

    track.className = "profile-task-progress-track";

    track.setAttribute("role", "progressbar");

    track.setAttribute(
        "aria-label",
        `Progress for ${task.title}`
    );

    track.setAttribute("aria-valuemin", "0");

    track.setAttribute("aria-valuemax", "100");

    track.setAttribute("aria-valuenow", String(progress));


    const fill = document.createElement("span");

    fill.className = "profile-task-progress-fill";

    fill.style.width = `${progress}%`;

    track.append(fill);

    wrapper.append(label, track);

    return wrapper;

}


/* 15. CREATE AN ASSIGNED TASK ROW */

function createTaskRow(task) {

    const row = document.createElement("tr");


    /* Task title and description */

    const taskCell = document.createElement("td");

    const title = document.createElement("span");

    title.className = "profile-task-title";

    title.textContent = task.title;


    taskCell.append(title);

    if (task.description) {

        const description = document.createElement("span");

        description.className = "profile-task-description";

        description.textContent = task.description;

        taskCell.append(description);

    }

    row.append(taskCell);


    /* Priority */

    const priority = String(
        task.priority || "Not set"
    );

    const priorityCell = document.createElement("td");

    priorityCell.append(
        createTaskBadge(
            priority,
            normalizeText(priority) === "low"
        )
    );

    row.append(priorityCell);


    /* Deadline */

    const dueDateCell = createTaskCell(
        task.dueDate ? formatDate(task.dueDate) : "Not set"
    );

    row.append(dueDateCell);


    /* Task status */

    const statusCell = document.createElement("td");

    const overdue = isTaskOverdue(task);

    const statusLabel = formatStatus(task.status);

    statusCell.append(
        createTaskBadge(
            statusLabel,
            task.status === "completed" ||
            task.status === "cancelled"
        )
    );

    if (overdue) {

        const overdueLabel = document.createElement("span");

        overdueLabel.className = "profile-task-badge is-neutral";

        overdueLabel.textContent = "Overdue";

        overdueLabel.style.marginTop = "4px";

        overdueLabel.style.display = "inline-flex";

        statusCell.append(
            document.createElement("br"),
            overdueLabel
        );

    }

    row.append(statusCell);


    /* Progress */

    const progressCell = document.createElement("td");

    progressCell.append(createTaskProgress(task));

    row.append(progressCell);

    return row;

}


/* 16. RENDER ASSIGNED TASKS */

function renderAssignedTasks(employeeTasks) {

    if (!taskTableBody) {
        return;
    }

    taskTableBody.replaceChildren();

    if (employeeTasks.length === 0) {

        const row = document.createElement("tr");

        row.className = "empty-row";

        const cell = document.createElement("td");

        cell.colSpan = 5;

        cell.textContent =
            "No tasks have been assigned to this employee.";

        row.append(cell);

        taskTableBody.append(row);

        return;

    }


    /*
       Display unfinished tasks first, then sort by deadline.
    */

    const orderedTasks = [...employeeTasks].sort((a, b) => {

        const aCompleted =
            a.status === "completed" ||
            a.status === "cancelled";

        const bCompleted =
            b.status === "completed" ||
            b.status === "cancelled";

        if (aCompleted !== bCompleted) {
            return Number(aCompleted) - Number(bCompleted);
        }

        return String(a.dueDate || "")
            .localeCompare(String(b.dueDate || ""));

    });


    const fragment = document.createDocumentFragment();

    orderedTasks.forEach(task => {

        fragment.append(
            createTaskRow(task)
        );

    });

    taskTableBody.append(fragment);

}


/* 17. RENDER TASK METRICS */

function renderTaskMetrics(employeeTasks) {

    const metrics = {

        total: employeeTasks.length,

        inProgress: employeeTasks.filter(
            task => task.status === "in-progress"
        ).length,

        review: employeeTasks.filter(
            task => task.status === "review"
        ).length,

        overdue: employeeTasks.filter(
            task => isTaskOverdue(task)
        ).length

    };


    document.getElementById(
        "profile-total-tasks"
    ).textContent = String(metrics.total);

    document.getElementById(
        "profile-in-progress-tasks"
    ).textContent = String(metrics.inProgress);

    document.getElementById(
        "profile-review-tasks"
    ).textContent = String(metrics.review);

    document.getElementById(
        "profile-overdue-tasks"
    ).textContent = String(metrics.overdue);

}


/* 18. CREATE AN ACTIVITY CARD */

function createActivityCard({
    title,
    message,
    author,
    date,
    type
}) {

    const article = document.createElement("article");

    article.className = "profile-activity-card";


    const heading = document.createElement("h3");

    heading.textContent = title;

    article.append(heading);


    const messageParagraph = document.createElement("p");

    messageParagraph.textContent = message;

    article.append(messageParagraph);


    const metadata = document.createElement("div");

    metadata.className = "profile-activity-meta";


    if (author) {

        const authorElement = document.createElement("span");

        authorElement.textContent = `By: ${author}`;

        metadata.append(authorElement);

    }


    if (date) {

        const dateElement = document.createElement("span");

        dateElement.textContent = `Date: ${formatDate(
            String(date).slice(0, 10)
        )}`;

        metadata.append(dateElement);

    }


    if (type) {

        const typeElement = document.createElement("span");

        typeElement.textContent = type;

        metadata.append(typeElement);

    }


    if (metadata.childElementCount > 0) {
        article.append(metadata);
    }

    return article;

}


/* 19. RENDER WORK UPDATES AND FEEDBACK */

function renderActivity(employeeTasks) {

    if (!activityList) {
        return;
    }

    activityList.replaceChildren();

    const fragment = document.createDocumentFragment();

    let activityCount = 0;


    employeeTasks.forEach(task => {

        /* Recorded employee updates */

        const updates = Array.isArray(task.updates)
            ? task.updates
            : [];

        updates.forEach(update => {

            if (!update || typeof update !== "object") {
                return;
            }

            const message = String(
                update.message ||
                update.text ||
                update.description ||
                ""
            ).trim();

            if (!message) {
                return;
            }

            const activityDate =
                update.date ||
                update.createdAt ||
                update.timestamp ||
                "";

            fragment.append(
                createActivityCard({
                    title: task.title,
                    message,
                    author: update.author || update.updatedBy || "",
                    date: activityDate,
                    type: "Work Update"
                })
            );

            activityCount++;

        });


        /* Manager feedback stored against the task */

        const feedback = String(
            task.feedback || ""
        ).trim();

        if (feedback) {

            fragment.append(
                createActivityCard({
                    title: `Feedback: ${task.title}`,
                    message: feedback,
                    author: "",
                    date: task.updatedAt || "",
                    type: "Task Feedback"
                })
            );

            activityCount++;

        }

    });


    if (activityCount === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-state";

        emptyMessage.textContent =
            "No work updates or feedback have been recorded yet.";

        activityList.append(emptyMessage);

        return;

    }

    activityList.append(fragment);

}


/* 20. SHOW THE PROFILE NOT-FOUND STATE */

function renderNotFound() {

    if (loadingSection) {
        loadingSection.hidden = true;
    }

    if (profileContent) {
        profileContent.hidden = true;
    }

    if (notFoundSection) {
        notFoundSection.hidden = false;
    }

    document.title = "Employee Not Found | Feedback";

}


/* 21. RENDER A COMPLETE EMPLOYEE PROFILE */

function renderEmployeeProfile(employee) {

    const employeeTasks = getTasksForEmployee(employee.id);

    renderProfilePhoto(employee);

    renderEmploymentDetails(employee);

    renderProfessionalInformation(employee);

    renderContactInformation(employee);

    configureProfileActions(employee);

    renderTaskMetrics(employeeTasks);

    renderAssignedTasks(employeeTasks);

    renderActivity(employeeTasks);


    /* Show profile after successful rendering */

    if (loadingSection) {
        loadingSection.hidden = true;
    }

    if (notFoundSection) {
        notFoundSection.hidden = true;
    }

    if (profileContent) {
        profileContent.hidden = false;
    }


    document.title = `${employee.name} | Employee Profile | Feedback`;

}


/* 22. SHARED NAVBAR SEARCH */

const headerSearchForm = document.getElementById(
    "employee-search-form"
);

const headerSearchInput = document.getElementById(
    "employee-search"
);

const headerSearchResults = document.getElementById(
    "employee-search-results"
);


function hideHeaderSearchResults() {

    if (!headerSearchResults) {
        return;
    }

    headerSearchResults.hidden = true;

    headerSearchResults.replaceChildren();

}


function createHeaderSearchHeading(text) {

    const heading = document.createElement("p");

    heading.className = "search-result-heading";

    heading.textContent = text;

    return heading;

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


    /* Departments */

    if (departmentMatches.length > 0) {

        headerSearchResults.append(
            createHeaderSearchHeading("Departments")
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


    /* Employees */

    if (employeeMatches.length > 0) {

        headerSearchResults.append(
            createHeaderSearchHeading("Employees")
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


    /* Empty search results */

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


function initializeHeaderSearch() {

    if (!headerSearchForm || !headerSearchInput) {
        return;
    }


    /* Live suggestions */

    headerSearchInput.addEventListener("input", () => {

        renderHeaderSearchResults(
            headerSearchInput.value
        );

    });


    /* Submit search */

    headerSearchForm.addEventListener("submit", event => {

        event.preventDefault();

        const query = headerSearchInput.value.trim();

        if (!query) {

            window.location.href = "../index.html";

            return;

        }


        const normalizedQuery = normalizeText(query);

        const employeeMatches = searchEmployees(query);

        const exactEmployee = employeeMatches.find(employee => {

            return (
                normalizeText(employee.id) === normalizedQuery ||
                normalizeText(employee.name) === normalizedQuery
            );

        });


        if (exactEmployee) {

            window.location.href =
                `employee-profile.html?id=${encodeURIComponent(exactEmployee.id)}`;

            return;

        }


        const exactDepartment = getDepartments().find(
            department => {

                return (
                    normalizeText(department.name) === normalizedQuery ||
                    normalizeText(department.id) === normalizedQuery
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


    /* Close dropdown outside search area */

    document.addEventListener("click", event => {

        if (!headerSearchForm.contains(event.target)) {
            hideHeaderSearchResults();
        }

    });


    /* Escape closes dropdown */

    headerSearchInput.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            hideHeaderSearchResults();

            headerSearchInput.blur();

        }

    });

}


/* 23. INITIALIZE PROFILE PAGE */

function initializeProfilePage() {

    initializeCommonUI();

    initializeHeaderSearch();


    const requestedEmployeeId = getRequestedEmployeeId();

    const employee = requestedEmployeeId
        ? getEmployeeById(requestedEmployeeId)
        : null;


    if (!employee) {

        renderNotFound();

        return;

    }


    renderEmployeeProfile(employee);

}


/* 24. START WHEN THE DOCUMENT IS READY */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeProfilePage,
        { once: true }
    );

} else {

    initializeProfilePage();

}