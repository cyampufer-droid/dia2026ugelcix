// src/services/users.ts

// Enum for user roles
export enum UserRole {
  Admin = 'admin',
  Director = 'director',
  Teacher = 'teacher',
  Student = 'student'
}

// User interface
export interface User {
  id: number;
  name: string;
  role: UserRole;
}

// Sample data
const users: User[] = [];

// Function to add a user
export function addUser(user: User): void {
  users.push(user);
}

// Function to get users by role
export function getUsersByRole(role: UserRole): User[] {
  return users.filter(user => user.role === role);
}

// Function to remove a user by ID
export function removeUserById(id: number): void {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    users.splice(index, 1);
  }
}

// Function to update a user's role
export function updateUserRole(id: number, newRole: UserRole): void {
  const user = users.find(user => user.id === id);
  if (user) {
    user.role = newRole;
  }
}