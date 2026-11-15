#include <iostream>
#include "User.h"
#include "Student.h"
#include "Faculty.h"
#include "Admin.h"

int main() {
    std::cout << "==================================================================\n";
    std::cout << "  GEHU Examination Schedule & Management System - C++ OOP Module\n";
    std::cout << "==================================================================\n\n";

    // Create objects of derived classes (Constructors & Encapsulation)
    Student s1("U101", "Aarav Bisht", "aarav.bisht@student.gehu.ac.in", "GEHU2024001", "B.Tech CSE", 4);
    Faculty f1("U201", "Dr. Rajesh Sharma", "rajesh.sharma@gehu.ac.in", "FAC101", "CSE", 3);
    Admin a1("U001", "Controller of Examinations", "coe@gehu.ac.in", "Examination Cell");

    // Demonstrate Runtime Polymorphism using base class pointers (User*)
    User* portalUsers[3] = { &s1, &f1, &a1 };

    for (int i = 0; i < 3; i++) {
        std::cout << "Logged in as Role: " << portalUsers[i]->getRoleName() << "\n";
        portalUsers[i]->displayRoleDashboard();
        std::cout << "\n";
    }

    return 0;
}
