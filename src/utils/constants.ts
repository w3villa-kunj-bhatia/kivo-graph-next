export const COLORS: Record<string, string> = {
  HRMS: "#f97316",
  ATS: "#10b981",
  CRM: "#3b82f6",
  Projects: "#ec4899",
  AI: "#8b5cf6",
  Core: "#eab308",
  Comm: "#6366f1",
  Utils: "#64748b",
  Other: "#94a3b8",
};

export const COMPLEXITY_TYPES = {
  high: { label: "High Risk", color: "#ef4444" },
  normal: { label: "Normal", color: "#94a3b8" },
};

export const ARCHETYPES = {
  Controller: { label: "Controllers", icon: "gamepad" },
  Service: { label: "Services", icon: "cogs" },
  Model: { label: "Models / Entities", icon: "database" },
  Feature: { label: "Sub-Modules / Features", icon: "list" },
};

export const TOPOLOGY_TYPES = {
  orphan: { label: "Orphans (Unused)", icon: "unlink" },
  hub: { label: "Hubs (>5 Links)", icon: "network" },
  normal: { label: "Standard Nodes", icon: "circle" },
};

export const PRESET_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#6366f1",
  "#84cc16",
  "#a855f7",
  "#64748b",
  "#d946ef",
  "#fbbf24",
  "#22c55e",
  "#0ea5e9",
  "#e11d48",
  "#7c3aed",
  "#f43f5e",
];

export const MODULE_FEATURES: Record<string, string[]> = {
  HRMS: [
    "Dashboard",
    "Employee List",
    "Employee Offered Candidates",
    "Employee Import",
    "Onboarding",
    "Offboarding",
    "Projects Module",
    "Resource Matrix",
    "Attendance",
    "Settings Module",
    "Company Settings",
    "Advance Settings",
    "Timesheet Settings",
    "Leaves-modules",
    "Leave Account",
    "Holidays List",
    "List",
    "Awards",
    "On Duty",
    "Statutory Compliance",
    "Manpower Thresholds",
    "Shift Assignment",
    "Attendance Regularization",
    "Medical Certificate",
    "Employee Branch Transfer",
    "Exit Interview",
    "EL Encashment",
    "Time Specific leave requests",
    "Missed Punch Workflow",
    "Department clearence and document upload",
  ],

  Inventory: ["Inventory"],

  AI: ["CV", "HRMS Bot", "Product Inventory"],

  Projects: ["Project Listing"],

  ATS: [
    "Dashboard",
    "ATS_Job_Applicants",
    "Import_Applicants",
    "Job_Profiles",
    "Hiring_Request",
    "Pre_Boarding",
    "Recent_Activity",
    "Clients",
    "Reports",
    "Pipeline",
    "Interview_Process",
    "Salary_Breakup",
    "Tags",
    "Recruiters",
    "Recruiter_List",
    "Add_Recruiter",
    "E_Sign",
    "Assign_Recruiters_to_Candidates",
    "Upload_Document_by_Recruiters",
    "Pre_&_Post_Document",
    "Job_Roles_Reports",
    "Dynamic_Dashboard",
    "AI_Keywords_Extraction_from_JD",
    "Master_Job_Profile_Link",
    "Job_Profile_Sourcing_Link",
    "Applicant_Progress_Timeline",
  ],

  PMS: [
    "My Courses",
    "Tasks",
    "My Account",
    "Change Password",
    "Evaluation Dashboard",
  ],

  Kivo_Calendar: [
    "Events",
    "Bookings",
    "Availability",
    "Teams",
    "View Public Page",
    "Copy Public page",
    "Settings",
  ],

  CRM: [
    "Reports",
    "Conversations",
    "Contacts",
    "Board",
    "Campaign",
    "Help Center",
    "Settings",
  ],

  Payroll: ["Payroll"],

  Test: [
    "Test0",
    "Test1",
    "Test2",
    "Test3",],
};
