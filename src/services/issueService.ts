// src/services/issueService.ts

export async function getIssueTransitions(issueKey: string) {
    // Mock issue data and workflow
    const issue = {
        'TASK-1': { status: 'To Do' },
        'TASK-2': { status: 'In Progress' },
        'TASK-3': { status: 'Done' }
    };

    if (!issue[issueKey]) {
        throw new Error('Issue not found');
    }

    const currentStatus = issue[issueKey].status;
    let transitions: any[] = [];

    switch (currentStatus) {
        case 'To Do':
            transitions = [
                { id: '21', name: 'In Progress' }
            ];
            break;
        case 'In Progress':
            transitions = [
                { id: '31', name: 'Done' }
            ];
            break;
        case 'Done':
            transitions = []; // No transitions from Done
            break;
        default:
            transitions = []; // Default case, no transitions
    }

    return transitions;
}
