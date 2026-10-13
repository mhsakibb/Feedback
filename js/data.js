/* ==================================================
   Feedback - Mock Database
   File: js/data.js

   Purpose:
   1. Store demo employee information
   2. Store department information
   3. Store sample task information

   NOTE:
   This is demo data, not real company data.
   ================================================== */


/* 1. HELPER: GENERATE DATES RELATIVE TO TODAY */

/*
   Negative value = past date
   Zero           = today's date
   Positive value = future date

   This keeps demo task deadlines relevant when
   the project is opened on different dates.
*/

export function getDateOffset(days) {

    const date = new Date();

    date.setDate(date.getDate() + days);

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* 2. DEPARTMENT DATA */

export const departments = [

    {
        id: "DEPT001",
        name: "Engineering",
        description: "Software development and engineering.",
        managerId: "EMP001"
    },

    {
        id: "DEPT002",
        name: "Design",
        description: "User experience and interface design.",
        managerId: "EMP003"
    },

    {
        id: "DEPT003",
        name: "Marketing",
        description: "Marketing strategy and digital campaigns.",
        managerId: "EMP005"
    },

    {
        id: "DEPT004",
        name: "Human Resources",
        description: "Employee relations and recruitment.",
        managerId: "EMP007"
    }

];


/* 3. EMPLOYEE DATA */

export const employees = [

    {
        id: "EMP001",
        name: "Rahim Ahmed",
        designation: "Engineering Lead",
        departmentId: "DEPT001",
        photo: "images/employee-01.jpg",
        email: "rahim.ahmed@example.com",
        joiningDate: "2022-03-15",
        status: "Active",
        skills: ["JavaScript", "Python", "System Design"],
        summary: "Leads engineering projects and supports the development team."
    },

    {
        id: "EMP002",
        name: "Nusrat Jahan",
        designation: "Software Engineer",
        departmentId: "DEPT001",
        photo: "images/employee-02.jpg",
        email: "nusrat.jahan@example.com",
        joiningDate: "2023-06-10",
        status: "Active",
        skills: ["HTML", "CSS", "JavaScript"],
        summary: "Develops and maintains web application features."
    },

    {
        id: "EMP003",
        name: "Tanvir Hasan",
        designation: "UI/UX Design Lead",
        departmentId: "DEPT002",
        photo: "images/employee-03.jpg",
        email: "tanvir.hasan@example.com",
        joiningDate: "2022-08-20",
        status: "Active",
        skills: ["UI Design", "UX Research", "Figma"],
        summary: "Leads user experience research and interface design."
    },

    {
        id: "EMP004",
        name: "Sabiha Islam",
        designation: "Product Designer",
        departmentId: "DEPT002",
        photo: "images/employee-04.jpg",
        email: "sabiha.islam@example.com",
        joiningDate: "2024-01-08",
        status: "Active",
        skills: ["Wireframing", "Prototyping", "Accessibility"],
        summary: "Designs clear and accessible digital experiences."
    },

    {
        id: "EMP005",
        name: "Farhan Karim",
        designation: "Marketing Lead",
        departmentId: "DEPT003",
        photo: "images/employee-05.jpg",
        email: "farhan.karim@example.com",
        joiningDate: "2021-11-01",
        status: "Active",
        skills: ["Marketing Strategy", "SEO", "Analytics"],
        summary: "Coordinates marketing initiatives and campaign performance."
    },

    {
        id: "EMP006",
        name: "Ayesha Rahman",
        designation: "Digital Marketing Executive",
        departmentId: "DEPT003",
        photo: "images/employee-06.jpg",
        email: "ayesha.rahman@example.com",
        joiningDate: "2024-04-12",
        status: "Active",
        skills: ["Content Marketing", "SEO", "Social Media"],
        summary: "Supports digital campaigns and content planning."
    },

    {
        id: "EMP007",
        name: "Imran Hossain",
        designation: "HR Manager",
        departmentId: "DEPT004",
        photo: "images/employee-07.jpg",
        email: "imran.hossain@example.com",
        joiningDate: "2021-07-05",
        status: "Active",
        skills: ["Recruitment", "Employee Relations", "Planning"],
        summary: "Coordinates recruitment and employee development."
    },

    {
        id: "EMP008",
        name: "Sadia Akter",
        designation: "HR Executive",
        departmentId: "DEPT004",
        photo: "images/employee-08.jpg",
        email: "sadia.akter@example.com",
        joiningDate: "2023-09-18",
        status: "Active",
        skills: ["Recruitment Support", "Documentation", "Communication"],
        summary: "Supports recruitment activities and employee records."
    }

];


/* 4. TASK DATA */

export const tasks = [

    {
        id: "TASK001",
        title: "Develop Dashboard Interface",
        description: "Implement the initial dashboard layout and components.",
        employeeId: "EMP001",
        assignedBy: "ADMIN001",
        createdAt: getDateOffset(-7),
        dueDate: getDateOffset(4),
        priority: "High",
        status: "in-progress",
        progress: 55,
        updates: [],
        feedback: ""
    },

    {
        id: "TASK002",
        title: "Build Employee Directory",
        description: "Create a searchable and filterable employee directory.",
        employeeId: "EMP002",
        assignedBy: "ADMIN001",
        createdAt: getDateOffset(-5),
        dueDate: getDateOffset(6),
        priority: "Medium",
        status: "assigned",
        progress: 0,
        updates: [],
        feedback: ""
    },

    {
        id: "TASK003",
        title: "Review Design Prototype",
        description: "Review the prototype and submit requested changes.",
        employeeId: "EMP003",
        assignedBy: "ADMIN001",
        createdAt: getDateOffset(-9),
        dueDate: getDateOffset(-2),
        priority: "High",
        status: "review",
        progress: 100,
        updates: [],
        feedback: "Awaiting manager review."
    },

    {
        id: "TASK004",
        title: "Prepare Design Guidelines",
        description: "Document the interface styles and reusable components.",
        employeeId: "EMP004",
        assignedBy: "ADMIN001",
        createdAt: getDateOffset(-12),
        dueDate: getDateOffset(-3),
        priority: "Medium",
        status: "completed",
        progress: 100,
        updates: [],
        feedback: "Approved."
    },

    {
        id: "TASK005",
        title: "Prepare Marketing Campaign",
        description: "Prepare campaign content and a delivery plan.",
        employeeId: "EMP005",
        assignedBy: "ADMIN001",
        createdAt: getDateOffset(-8),
        dueDate: getDateOffset(-1),
        priority: "High",
        status: "in-progress",
        progress: 70,
        updates: [],
        feedback: ""
    },

    {
        id: "TASK006",
        title: "Create Social Media Content",
        description: "Prepare scheduled content for the upcoming campaign.",
        employeeId: "EMP006",
        assignedBy: "ADMIN001",
        createdAt: getDateOffset(-3),
        dueDate: getDateOffset(2),
        priority: "Medium",
        status: "assigned",
        progress: 0,
        updates: [],
        feedback: ""
    },

    {
        id: "TASK007",
        title: "Update Recruitment Records",
        description: "Review and update the demo recruitment records.",
        employeeId: "EMP007",
        assignedBy: "ADMIN001",
        createdAt: getDateOffset(-14),
        dueDate: getDateOffset(-6),
        priority: "Low",
        status: "completed",
        progress: 100,
        updates: [],
        feedback: "Completed."
    },

    {
        id: "TASK008",
        title: "Prepare Employee Onboarding Guide",
        description: "Prepare a guide for new employee onboarding.",
        employeeId: "EMP008",
        assignedBy: "ADMIN001",
        createdAt: getDateOffset(-4),
        dueDate: getDateOffset(1),
        priority: "Medium",
        status: "review",
        progress: 100,
        updates: [],
        feedback: "Awaiting review."
    }

];