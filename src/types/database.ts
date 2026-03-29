// src/types/database.ts

type User = {
    id: string;
    name: string;
    email: string;
    password: string;
};

interface Institution {
    id: string;
    name: string;
    address: string;
    contactNumber: string;
}

interface Director {
    id: string;
    name: string;
    institutionId: string;
}

interface Teacher {
    id: string;
    name: string;
    subject: string;
    institutionId: string;
}

interface Student {
    id: string;
    name: string;
    institutionId: string;
    grade: number;
}

interface Grade {
    id: string;
    studentId: string;
    subject: string;
    score: number;
}

interface Section {
    id: string;
    name: string;
    gradeId: string;
}

interface Evaluation {
    id: string;
    title: string;
    description: string;
    date: string;
    sectionId: string;
}

interface EvaluationResponse {
    id: string;
    evaluationId: string;
    studentId: string;
    response: string;
}

interface ConsolidatedResults {
    studentId: string;
    evaluations: Record<string, string>;
    totalScore: number;
}
