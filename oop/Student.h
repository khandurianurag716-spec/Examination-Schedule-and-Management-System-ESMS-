#ifndef ESMS_STUDENT_H
#define ESMS_STUDENT_H

#include "User.h"

// Derived Class: Student inherits from User
class Student : public User {
private:
    std::string rollNumber;
    std::string course;
    int semester;

public:
    Student(const std::string& id,
            const std::string& name,
            const std::string& mail,
            const std::string& roll,
            const std::string& courseName,
            int sem);

    std::string getRollNumber() const;
    int getSemester() const;

    // Overridden methods
    void displayRoleDashboard() const override;
    std::string getRoleName() const override;
};

#endif
