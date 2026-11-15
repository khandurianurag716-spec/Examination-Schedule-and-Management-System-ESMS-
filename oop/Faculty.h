#ifndef ESMS_FACULTY_H
#define ESMS_FACULTY_H

#include "User.h"

// Derived Class: Faculty inherits from User
class Faculty : public User {
private:
    std::string facultyCode;
    std::string department;
    int assignedSubjectsCount;

public:
    Faculty(const std::string& id,
            const std::string& name,
            const std::string& mail,
            const std::string& code,
            const std::string& dept,
            int subjectsCount);

    std::string getFacultyCode() const;

    // Overridden methods
    void displayRoleDashboard() const override;
    std::string getRoleName() const override;
};

#endif
