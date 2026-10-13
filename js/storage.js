/* ==================================================
   Feedback - Local Storage Service
   File: js/storage.js

   Responsibilities:
   1. Read and save employee data
   2. Read and save department data
   3. Read and save task data
   4. Update individual employees and tasks
   5. Add new tasks
   6. Reset demo data
   7. Handle unavailable or invalid storage safely

   IMPORTANT:
   localStorage is for frontend prototyping only.
   It is not a secure database.
   ================================================== */


/* 1. IMPORT DEFAULT DEMO DATA */

import {
    employees as defaultEmployees,
    departments as defaultDepartments,
    tasks as defaultTasks
} from "./data.js";


/* 2. STORAGE KEYS */

/*
   Keep all application data under one namespace.

   The version allows us to introduce a new storage
   format later without confusing it with older data.
*/

const STORAGE_KEYS = Object.freeze({

    employees: "feedback.v1.employees",

    departments: "feedback.v1.departments",

    tasks: "feedback.v1.tasks"

});


/* 3. GENERAL HELPERS */

function isObject(value) {

    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}


/*
   Demo records contain JSON-compatible values.

   JSON cloning gives us a separate copy of the
   original data, so editing it does not modify
   the exported arrays in data.js.
*/

function cloneData(value) {

    return JSON.parse(JSON.stringify(value));

}


function hasUniqueIds(records) {

    const ids = records.map(record => record.id);

    return new Set(ids).size === ids.length;

}


/* 4. DATA VALIDATION */

/*
   These checks catch common structural problems.
   They are not a replacement for backend validation.
*/

function isValidEmployees(value) {

    return (
        Array.isArray(value) &&
        value.every(employee => {

            return (
                isObject(employee) &&
                typeof employee.id === "string" &&
                employee.id.trim().length > 0 &&
                typeof employee.name === "string" &&
                employee.name.trim().length > 0 &&
                typeof employee.departmentId === "string"
            );

        }) &&
        hasUniqueIds(value)
    );

}


function isValidDepartments(value) {

    return (
        Array.isArray(value) &&
        value.every(department => {

            return (
                isObject(department) &&
                typeof department.id === "string" &&
                department.id.trim().length > 0 &&
                typeof department.name === "string" &&
                department.name.trim().length > 0
            );

        }) &&
        hasUniqueIds(value)
    );

}


function isValidTasks(value) {

    const validStatuses = [
        "assigned",
        "in-progress",
        "review",
        "completed",
        "cancelled"
    ];

    return (
        Array.isArray(value) &&
        value.every(task => {

            return (
                isObject(task) &&
                typeof task.id === "string" &&
                task.id.trim().length > 0 &&
                typeof task.title === "string" &&
                task.title.trim().length > 0 &&
                typeof task.employeeId === "string" &&
                validStatuses.includes(task.status) &&
                typeof task.dueDate === "string" &&
                Number.isFinite(task.progress) &&
                task.progress >= 0 &&
                task.progress <= 100
            );

        }) &&
        hasUniqueIds(value)
    );

}


/* 5. GET BROWSER STORAGE SAFELY */

/*
   Accessing localStorage can throw an error in
   some browser privacy or security settings.
*/

function getBrowserStorage() {

    try {

        if (typeof window === "undefined") {
            return null;
        }

        return window.localStorage;

    } catch (error) {

        console.warn(
            "Feedback: Browser storage is unavailable.",
            error
        );

        return null;

    }

}


/* 6. INTERNAL READ FUNCTION */

function readCollection(key, defaults, validator) {

    const storage = getBrowserStorage();

    /*
       If browser storage is unavailable, return
       fresh copies of the default demo records.
    */

    if (!storage) {
        return cloneData(defaults);
    }

    try {

        const storedValue = storage.getItem(key);

        /*
           First visit: initialize storage with demo data.
        */

        if (storedValue === null) {

            const initialData = cloneData(defaults);

            try {

                storage.setItem(
                    key,
                    JSON.stringify(initialData)
                );

            } catch (error) {

                console.warn(
                    `Feedback: Could not initialize ${key}.`,
                    error
                );

            }

            return initialData;

        }


        /* Parse stored JSON */

        const parsedData = JSON.parse(storedValue);


        /*
           Return stored records only when their
           structure passes the relevant validation.
        */

        if (validator(parsedData)) {
            return parsedData;
        }


        /*
           If stored data is invalid, use demo defaults
           and attempt to repair this collection.
        */

        console.warn(
            `Feedback: Invalid stored data found for ${key}.`
        );

        const fallbackData = cloneData(defaults);

        try {

            storage.setItem(
                key,
                JSON.stringify(fallbackData)
            );

        } catch (error) {

            console.warn(
                `Feedback: Could not repair ${key}.`,
                error
            );

        }

        return fallbackData;

    } catch (error) {

        console.error(
            `Feedback: Could not read ${key}.`,
            error
        );

        return cloneData(defaults);

    }

}


/* 7. INTERNAL WRITE FUNCTION */

function writeCollection(key, records, validator, collectionName) {

    /*
       Never save invalid collection structures.
    */

    if (!validator(records)) {

        console.error(
            `Feedback: Invalid ${collectionName} data. Save cancelled.`
        );

        return false;

    }

    const storage = getBrowserStorage();

    if (!storage) {
        return false;
    }

    try {

        storage.setItem(
            key,
            JSON.stringify(records)
        );

        /*
           Notify other modules in the same page that
           this collection has changed.
        */

        if (typeof window.CustomEvent === "function") {

            window.dispatchEvent(
                new CustomEvent("feedback:storage-updated", {
                    detail: {
                        collection: collectionName
                    }
                })
            );

        }

        return true;

    } catch (error) {

        console.error(
            `Feedback: Could not save ${collectionName}.`,
            error
        );

        return false;

    }

}


/* 8. EMPLOYEE STORAGE API */

export function getEmployees() {

    return readCollection(
        STORAGE_KEYS.employees,
        defaultEmployees,
        isValidEmployees
    );

}


export function saveEmployees(employeeList) {

    return writeCollection(
        STORAGE_KEYS.employees,
        employeeList,
        isValidEmployees,
        "employees"
    );

}


/*
   Update an existing employee without changing
   their unique ID.
*/

export function updateEmployee(employeeId, updates) {

    if (!isObject(updates)) {
        return false;
    }

    const currentEmployees = getEmployees();

    const employeeIndex = currentEmployees.findIndex(
        employee => employee.id === employeeId
    );

    if (employeeIndex === -1) {
        return false;
    }

    const updatedEmployees = cloneData(currentEmployees);

    updatedEmployees[employeeIndex] = {
        ...updatedEmployees[employeeIndex],
        ...updates,

        // Employee IDs must remain stable.
        id: employeeId
    };

    return saveEmployees(updatedEmployees);

}


/* 9. DEPARTMENT STORAGE API */

export function getDepartments() {

    return readCollection(
        STORAGE_KEYS.departments,
        defaultDepartments,
        isValidDepartments
    );

}


export function saveDepartments(departmentList) {

    return writeCollection(
        STORAGE_KEYS.departments,
        departmentList,
        isValidDepartments,
        "departments"
    );

}


/* 10. TASK STORAGE API */

export function getTasks() {

    return readCollection(
        STORAGE_KEYS.tasks,
        defaultTasks,
        isValidTasks
    );

}


export function saveTasks(taskList) {

    return writeCollection(
        STORAGE_KEYS.tasks,
        taskList,
        isValidTasks,
        "tasks"
    );

}


/*
   Add a new task.
   Reject duplicate task IDs and unknown employee IDs.
*/

export function addTask(newTask) {

    if (!isObject(newTask)) {
        return false;
    }

    const currentTasks = getTasks();

    const duplicateId = currentTasks.some(
        task => task.id === newTask.id
    );

    if (duplicateId) {

        console.warn(
            "Feedback: A task with this ID already exists."
        );

        return false;

    }


    const currentEmployees = getEmployees();

    const employeeExists = currentEmployees.some(
        employee => employee.id === newTask.employeeId
    );

    if (!employeeExists) {

        console.warn(
            "Feedback: The assigned employee does not exist."
        );

        return false;

    }


    const updatedTasks = [
        ...currentTasks,
        newTask
    ];

    return saveTasks(updatedTasks);

}


/*
   Update an existing task without changing its ID.
*/

export function updateTask(taskId, updates) {

    if (!isObject(updates)) {
        return false;
    }

    const currentTasks = getTasks();

    const taskIndex = currentTasks.findIndex(
        task => task.id === taskId
    );

    if (taskIndex === -1) {
        return false;
    }

    const updatedTasks = cloneData(currentTasks);

    updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        ...updates,

        // Task IDs must remain stable.
        id: taskId
    };

    return saveTasks(updatedTasks);

}


/* 11. RESET DEMO DATA */

/*
   WARNING:
   This replaces all three stored collections with
   their original demo data.

   Do not call this unless a demo reset is intended.
*/

export function resetDemoData() {

    const employeesSaved = saveEmployees(
        cloneData(defaultEmployees)
    );

    const departmentsSaved = saveDepartments(
        cloneData(defaultDepartments)
    );

    const tasksSaved = saveTasks(
        cloneData(defaultTasks)
    );

    return (
        employeesSaved &&
        departmentsSaved &&
        tasksSaved
    );

}


/* 12. CHECK STORAGE AVAILABILITY */

export function isStorageAvailable() {

    const storage = getBrowserStorage();

    if (!storage) {
        return false;
    }

    const testKey = "feedback.v1.storage-test";

    try {

        storage.setItem(testKey, "ok");

        const testPassed = storage.getItem(testKey) === "ok";

        storage.removeItem(testKey);

        return testPassed;

    } catch (error) {

        console.warn(
            "Feedback: Storage availability test failed.",
            error
        );

        try {
            storage.removeItem(testKey);
        } catch {
            // Ignore cleanup errors.
        }

        return false;

    }

}