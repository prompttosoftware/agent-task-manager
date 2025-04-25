import { DatabaseService } from '../services/databaseService';

export async function initializeDatabaseSchema(databaseService: DatabaseService): Promise<void> {
    try {
        await databaseService.ensureTableExists('statuses', [
            { column: 'id', type: 'INTEGER PRIMARY KEY' },
            { column: 'name', type: 'TEXT' }
        ]);
        console.log('Statuses table created/verified successfully.');

        await databaseService.ensureTableExists('status_transitions', [
            { column: 'current_status_id', type: 'INTEGER REFERENCES statuses(id)' },
            { column: 'target_status_id', type: 'INTEGER REFERENCES statuses(id)' }
        ]);
        console.log('Status transitions table created/verified successfully.');

        // Add a default set of statuses and transitions (example data)
        const initialStatuses = [
            { id: 1, name: 'Open' },
            { id: 2, name: 'In Progress' },
            { id: 3, name: 'Resolved' },
            { id: 4, name: 'Closed' },
            { id: 5, name: 'Reopened' }
        ];

        for (const status of initialStatuses) {
            const existingStatus = await databaseService.get<{ id: number }>('SELECT id FROM statuses WHERE id = ?', [status.id]);
            if (!existingStatus) {
                await databaseService.run('INSERT INTO statuses (id, name) VALUES (?, ?)', [status.id, status.name]);
                console.log(`Inserted status: ${status.name}`);
            }
        }

        const initialTransitions = [
            { current_status_id: 1, target_status_id: 2 }, // Open -> In Progress
            { current_status_id: 2, target_status_id: 3 }, // In Progress -> Resolved
            { current_status_id: 3, target_status_id: 4 }, // Resolved -> Closed
            { current_status_id: 3, target_status_id: 5 }, // Resolved -> Reopened
            { current_status_id: 5, target_status_id: 2 }  // Reopened -> In Progress
        ];

        for (const transition of initialTransitions) {
            const existingTransition = await databaseService.get<{ current_status_id: number, target_status_id: number }>(
                'SELECT current_status_id, target_status_id FROM status_transitions WHERE current_status_id = ? AND target_status_id = ?',
                [transition.current_status_id, transition.target_status_id]
            );
            if (!existingTransition) {
                await databaseService.run(
                    'INSERT INTO status_transitions (current_status_id, target_status_id) VALUES (?, ?)',
                    [transition.current_status_id, transition.target_status_id]
                );
                console.log(`Inserted transition: ${transition.current_status_id} -> ${transition.target_status_id}`);
            }
        }

    } catch (error) {
        console.error('Error initializing database schema:', error);
    }
}
