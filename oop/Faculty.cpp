#include "Faculty.h"
#include <iostream>

Faculty::Faculty(const std::string& id,
                 const std::string& name,
                 const std::string& mail,
                 const std::string& code,
                 const std::string& dept,
                 int subjectsCount)
    : User(id, name, mail), facultyCode(code), department(dept), assignedSubjectsCount(subjectsCount) {}

std::string Faculty::getFacultyCode() const {
    return facultyCode;
}

void Faculty::displayRoleDashboard() const {
    std::cout << "[Faculty Dashboard] " << fullName
              << " | Code: " << facultyCode
              << " | Dept: " << department
              << " | Subjects: " << assignedSubjectsCount << "\n"
              << "  Permissions: Schedule Subject Exams, Enter Marks, Review Revaluation.\n";
}

std::string Faculty::getRoleName() const {
    return "Faculty";
}
