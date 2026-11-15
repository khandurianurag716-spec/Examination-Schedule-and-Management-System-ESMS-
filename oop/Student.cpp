#include "Student.h"
#include <iostream>

Student::Student(const std::string& id,
                 const std::string& name,
                 const std::string& mail,
                 const std::string& roll,
                 const std::string& courseName,
                 int sem)
    : User(id, name, mail), rollNumber(roll), course(courseName), semester(sem) {}

std::string Student::getRollNumber() const {
    return rollNumber;
}

int Student::getSemester() const {
    return semester;
}

void Student::displayRoleDashboard() const {
    std::cout << "[Student Dashboard] " << fullName
              << " | Roll: " << rollNumber
              << " | Course: " << course
              << " | Semester: " << semester << "\n"
              << "  Permissions: View Timetable, View Published Results, Submit Revaluation.\n";
}

std::string Student::getRoleName() const {
    return "Student";
}
