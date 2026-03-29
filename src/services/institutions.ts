// src/services/institutions.ts

export interface Institution {
    id: number;
    name: string;
    address: string;
    establishedYear: number;
}

export class InstitutionService {
    private institutions: Institution[] = [];

    // Create a new institution
    create(institution: Institution): Institution {
        this.institutions.push(institution);
        return institution;
    }

    // Read all institutions
    readAll(): Institution[] {
        return this.institutions;
    }

    // Read a single institution by ID
    readById(id: number): Institution | undefined {
        return this.institutions.find(inst => inst.id === id);
    }

    // Update an existing institution
    update(id: number, updatedInstitution: Partial<Institution>): Institution | undefined {
        const institution = this.readById(id);
        if (institution) {
            Object.assign(institution, updatedInstitution);
            return institution;
        }
        return undefined;
    }

    // Delete an institution
    delete(id: number): Institution | undefined {
        const index = this.institutions.findIndex(inst => inst.id === id);
        if (index >= 0) {
            return this.institutions.splice(index, 1)[0];
        }
        return undefined;
    }
}