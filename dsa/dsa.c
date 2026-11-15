#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "dsa.h"

/* ============================================================================
 * 1. ARRAY TRAVERSAL OPERATIONS
 * ============================================================================ */

void displayStudentsArray(const StudentRecord students[], int count) {
    printf("\n--- Student Records (Array Traversal) ---\n");
    for (int i = 0; i < count; i++) {
        printf("[%d] Roll: %-12s | Name: %-18s | Sem: %d | Marks: %.1f\n",
               i + 1,
               students[i].roll_number,
               students[i].name,
               students[i].semester,
               students[i].marks);
    }
}

void displaySubjectsArray(const SubjectRecord subjects[], int count) {
    printf("\n--- Subject Records (Array Traversal) ---\n");
    for (int i = 0; i < count; i++) {
        printf("[%d] Code: %-10s | Name: %-38s | Credits: %d\n",
               i + 1,
               subjects[i].subject_code,
               subjects[i].subject_name,
               subjects[i].credits);
    }
}

/* ============================================================================
 * 2. LINEAR SEARCH OPERATIONS
 * Time Complexity: O(n)
 * ============================================================================ */

int linearSearchStudentByRoll(const StudentRecord students[], int count, const char* target_roll) {
    for (int i = 0; i < count; i++) {
        if (strcmp(students[i].roll_number, target_roll) == 0) {
            return i; /* Found at index i */
        }
    }
    return -1; /* Not found */
}

int linearSearchSubjectByCode(const SubjectRecord subjects[], int count, const char* target_code) {
    for (int i = 0; i < count; i++) {
        if (strcmp(subjects[i].subject_code, target_code) == 0) {
            return i; /* Found at index i */
        }
    }
    return -1; /* Not found */
}

/* ============================================================================
 * 3. BUBBLE SORT OPERATION (Sort subjects alphabetically by subject_code)
 * Time Complexity: O(n^2)
 * ============================================================================ */

void bubbleSortSubjectsByCode(SubjectRecord subjects[], int count) {
    for (int i = 0; i < count - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < count - i - 1; j++) {
            if (strcmp(subjects[j].subject_code, subjects[j + 1].subject_code) > 0) {
                SubjectRecord temp = subjects[j];
                subjects[j] = subjects[j + 1];
                subjects[j + 1] = temp;
                swapped = 1;
            }
        }
        if (!swapped) {
            break; /* Array is already sorted */
        }
    }
}

/* ============================================================================
 * 4. SINGLY LINKED LIST OPERATIONS (Dynamic Examination Schedule List)
 * ============================================================================ */

ExamNode* createExamNode(int exam_id, const char* subject_code, const char* exam_date, const char* room_number) {
    ExamNode* newNode = (ExamNode*)malloc(sizeof(ExamNode));
    if (newNode == NULL) {
        fprintf(stderr, "Memory allocation failed for ExamNode.\n");
        exit(1);
    }
    newNode->exam_id = exam_id;
    snprintf(newNode->subject_code, MAX_CODE_LEN, "%s", subject_code);
    snprintf(newNode->exam_date, 20, "%s", exam_date);
    snprintf(newNode->room_number, 20, "%s", room_number);
    newNode->next = NULL;
    return newNode;
}

void insertExamAtEnd(ExamNode** head, int exam_id, const char* subject_code, const char* exam_date, const char* room_number) {
    ExamNode* newNode = createExamNode(exam_id, subject_code, exam_date, room_number);
    if (*head == NULL) {
        *head = newNode;
        return;
    }
    ExamNode* temp = *head;
    while (temp->next != NULL) {
        temp = temp->next;
    }
    temp->next = newNode;
}

void traverseExamList(const ExamNode* head) {
    printf("\n--- Examination Timetable (Singly Linked List Traversal) ---\n");
    const ExamNode* temp = head;
    int index = 1;
    while (temp != NULL) {
        printf("[%d] Exam #%d | Subject: %-10s | Date: %-12s | Room: %s\n",
               index++, temp->exam_id, temp->subject_code, temp->exam_date, temp->room_number);
        temp = temp->next;
    }
}

void freeExamList(ExamNode** head) {
    ExamNode* current = *head;
    while (current != NULL) {
        ExamNode* nextNode = current->next;
        free(current);
        current = nextNode;
    }
    *head = NULL;
}

/* ============================================================================
 * DEMONSTRATION DRIVER (main)
 * ============================================================================ */

int main(void) {
    printf("==================================================================\n");
    printf("  GEHU Examination Schedule & Management System - C DSA Module\n");
    printf("==================================================================\n");

    /* 1. Array of Students & Traversal */
    StudentRecord students[3] = {
        {"GEHU2024001", "Aarav Bisht", 4, 78.0f},
        {"GEHU2024002", "Priya Negi", 4, 88.0f},
        {"GEHU2024003", "Rohan Joshi", 4, 72.0f}
    };
    displayStudentsArray(students, 3);

    /* 2. Linear Search for Student by Roll Number */
    const char* searchRoll = "GEHU2024002";
    int stuIndex = linearSearchStudentByRoll(students, 3, searchRoll);
    if (stuIndex != -1) {
        printf("\n[Linear Search] Found Student %s -> %s (Marks: %.1f)\n",
               searchRoll, students[stuIndex].name, students[stuIndex].marks);
    } else {
        printf("\n[Linear Search] Student %s not found.\n", searchRoll);
    }

    /* 3. Unsorted Array of Subjects, Linear Search, and Bubble Sort */
    SubjectRecord subjects[4] = {
        {"TCS-404", "Object Oriented Programming with C++", 3},
        {"TCS-401", "Design and Analysis of Algorithms", 4},
        {"TCS-403", "Operating Systems", 4},
        {"TCS-402", "Database Management Systems", 4}
    };

    printf("\nBefore Bubble Sort:");
    displaySubjectsArray(subjects, 4);

    const char* searchCode = "TCS-402";
    int subIndex = linearSearchSubjectByCode(subjects, 4, searchCode);
    if (subIndex != -1) {
        printf("\n[Linear Search] Found Subject %s -> %s\n",
               searchCode, subjects[subIndex].subject_name);
    }

    bubbleSortSubjectsByCode(subjects, 4);
    printf("\nAfter Bubble Sort (Sorted by Subject Code):");
    displaySubjectsArray(subjects, 4);

    /* 4. Singly Linked List for Dynamic Examination Schedule */
    ExamNode* examHead = NULL;
    insertExamAtEnd(&examHead, 101, "TCS-401", "2026-10-12", "LT-201");
    insertExamAtEnd(&examHead, 102, "TCS-402", "2026-10-14", "LT-202");
    insertExamAtEnd(&examHead, 103, "TCS-403", "2026-11-24", "CR-304");

    traverseExamList(examHead);

    /* Always free dynamically allocated memory */
    freeExamList(&examHead);
    printf("\n[Memory Cleanup] Linked list memory freed successfully.\n");

    return 0;
}
