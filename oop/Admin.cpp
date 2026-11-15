#include "Admin.h"
#include <iostream>

Admin::Admin(const std::string& id,
             const std::string& name,
             const std::string& mail,
             const std::string& office)
    : User(id, name, mail), officeTitle(office) {}

void Admin::displayRoleDashboard() const {
    std::cout << "[Admin Dashboard] " << fullName
              << " | Office: " << officeTitle << "\n"
              << "  Permissions: Manage Users/Subjects, Publish Results, Approve Revaluations.\n";
}

std::string Admin::getRoleName() const {
    return "Admin";
}
