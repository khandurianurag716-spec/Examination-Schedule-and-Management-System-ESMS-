#include "User.h"
#include <iostream>

User::User(const std::string& id, const std::string& name, const std::string& mail)
    : userId(id), fullName(name), email(mail) {}

User::~User() {}

std::string User::getUserId() const {
    return userId;
}

std::string User::getFullName() const {
    return fullName;
}

std::string User::getEmail() const {
    return email;
}

void User::displayRoleDashboard() const {
    std::cout << "[User] " << fullName << " (" << userId << ") - General Portal Access\n";
}

std::string User::getRoleName() const {
    return "User";
}
