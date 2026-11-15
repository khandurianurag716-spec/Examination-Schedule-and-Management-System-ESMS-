#ifndef ESMS_ADMIN_H
#define ESMS_ADMIN_H

#include "User.h"

// Derived Class: Admin inherits from User
class Admin : public User {
private:
    std::string officeTitle;

public:
    Admin(const std::string& id,
          const std::string& name,
          const std::string& mail,
          const std::string& office);

    // Overridden methods
    void displayRoleDashboard() const override;
    std::string getRoleName() const override;
};

#endif
