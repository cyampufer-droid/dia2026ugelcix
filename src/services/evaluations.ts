// src/services/evaluations.ts

// Functions to manage evaluations for Mathematics, Communication, and Socioemotional Skills

// Evaluation interface
interface Evaluation {
    id: string;
    subject: 'Mathematics' | 'Communication' | 'Socioemotional';
    score: number;
    date: Date;
}

// In-memory evaluation storage
const evaluations: Evaluation[] = [];

// Create a new evaluation
export function createEvaluation(subject: 'Mathematics' | 'Communication' | 'Socioemotional', score: number, date: Date): Evaluation {
    const newEvaluation: Evaluation = {
        id: `${subject}-${new Date().getTime()}`, // Unique ID based on subject and timestamp
        subject,
        score,
        date,
    };
    evaluations.push(newEvaluation);
    return newEvaluation;
}

// Read all evaluations
export function getAllEvaluations(): Evaluation[] {
    return evaluations;
}

// Read evaluations by subject
export function getEvaluationsBySubject(subject: 'Mathematics' | 'Communication' | 'Socioemotional'): Evaluation[] {
    return evaluations.filter(evaluation => evaluation.subject === subject);
}

// Update an evaluation
export function updateEvaluation(id: string, score: number): Evaluation | null {
    const evaluation = evaluations.find(e => e.id === id);
    if (evaluation) {
        evaluation.score = score;
        return evaluation;
    }
    return null;
}

// Delete an evaluation
export function deleteEvaluation(id: string): boolean {
    const index = evaluations.findIndex(e => e.id === id);
    if (index !== -1) {
        evaluations.splice(index, 1);
        return true;
    }
    return false;
}