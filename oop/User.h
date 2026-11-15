#ifndef ESMS_USER_H
#define ESMS_USER_H

#include <string>

// Base Class: User
// Demonstrates Encapsulation (private/protected members), Constructors, and Virtual Functions
class User {
protected:
    std::string userId;
    std::string fullName;
    std::string email;

public:
    User(const std::string& id, const std::string& name, const std::string& mail);
    virtual ~User();

    // Getters (Encapsulation)
    std::string getUserId() const;
    std::string getFullName() const;
    std::string getEmail() const;

    // Virtual function overridden by Student, Faculty, and Admin (Runtime Polymorphism)
    virtual void displayRoleDashboard() const;
    virtual std::string getRoleName() const;
};

#endif
