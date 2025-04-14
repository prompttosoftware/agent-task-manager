import { Epic } from '../types/epic.d.ts';
import Joi from 'joi';

const epicSchema = Joi.object({
    key: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    status: Joi.string().required(),
    startDate: Joi.string(),
    endDate: Joi.string()
});

export class EpicService {
    private epics: Epic[] = [];

    getEpic(epicKey: string): Epic | undefined {
        return this.epics.find(epic => epic.key === epicKey);
    }

    listEpics(): Epic[] {
        return this.epics;
    }

    createEpic(epic: Epic): Epic {
        const { error, value } = epicSchema.validate(epic);

        if (error) {
            throw new Error(`Invalid epic data: ${error.message}`);
        }

        this.epics.push(value);
        return value;
    }

    updateEpic(epicKey: string, updatedEpic: Partial<Epic>): Epic | undefined {
        const index = this.epics.findIndex(epic => epic.key === epicKey);
        if (index === -1) {
            return undefined;
        }
        this.epics[index] = { ...this.epics[index], ...updatedEpic };
        return this.epics[index];
    }

    deleteEpic(epicKey: string): void {
        this.epics = this.epics.filter(epic => epic.key !== epicKey);
    }
}