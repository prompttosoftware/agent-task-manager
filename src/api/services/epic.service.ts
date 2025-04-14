import { Epic } from '../types/epic.d.ts';

export class EpicService {
    private epics: Epic[] = [];

    getEpic(epicKey: string): Epic | undefined {
        return this.epics.find(epic => epic.key === epicKey);
    }

    listEpics(): Epic[] {
        return this.epics;
    }

    createEpic(epic: Epic): Epic {
        this.epics.push(epic);
        return epic;
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
