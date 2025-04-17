export class IssueStatusTransitionService {
  isValidTransition(currentStatusId: number, targetStatusId: number): boolean {
    switch (currentStatusId) {
      case 11: // To Do
        return targetStatusId === 21; // In Progress
      case 21: // In Progress
        return targetStatusId === 11 || targetStatusId === 31; // To Do or Done
      case 31: // Done
        return targetStatusId === 11 || targetStatusId === 21; // To Do or In Progress
      default:
        return false;
    }
  }
}
