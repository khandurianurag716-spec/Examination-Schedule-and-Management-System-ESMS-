#ifndef ESMS_DSA_H
#define ESMS_DSA_H

#define MAX_CODE_LEN 20
#define MAX_NAME_LEN 80

/* Structure representing a Student record for Array & Linear Search operations */
typedef struct {
    char roll_number[MAX_CODE_LEN];
    char name[MAX_NAME_LEN];
    int semester;
    float marks;
} StudentRecord;

/* Structure representing a Subject record for Array, Linear Search & Bubble Sort */
typedef struct {
    char subject_code[MAX_CODE_LEN];
    char subject_name[MAX_NAME_LEN];
    int credits;
} SubjectRecord;

/* Singly Linked List Node for dynamic Examination Schedule / Revaluation Queue */
typedef struct ExamNode {
    int exam_id;
    char subject_code[MAX_CODE_LEN];
    char exam_date[20];
    char room_number[20];
    struct ExamNode* next;
} ExamNode;

/* Array & Search Functions */
void displayStudentsArray(const StudentRecord students[], int count);
int linearSearchStudentByRoll(const StudentRecord students[], int count, const char* target_roll);

void displaySubjectsArray(const SubjectRecord subjects[], int count);
int linearSearchSubjectByCode(const SubjectRecord subjects[], int count, const char* target_code);

/* Sorting Function (Bubble Sort) */
void bubbleSortSubjectsByCode(SubjectRecord subjects[], int count);

/* Singly Linked List Functions */
ExamNode* createExamNode(int exam_id, const char* subject_code, const char* exam_date, const char* room_number);
void insertExamAtEnd(ExamNode** head, int exam_id, const char* subject_code, const char* exam_date, const char* room_number);
void traverseExamList(const ExamNode* head);
void freeExamList(ExamNode** head);

#endif
