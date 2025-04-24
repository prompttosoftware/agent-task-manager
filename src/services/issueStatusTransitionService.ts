import { DatabaseService } from './databaseService'; // Import needed for the method argument type

export class IssueStatusTransitionService {

  // No constructor defined, fulfilling the requirement to remove constructor arguments.

  /**
   * Checks if transitioning from the current status to the target status is valid.
   * This implementation uses hardcoded status IDs based on a simple workflow:
   * To Do (11) -> In Progress (21)
   * In Progress (21) -> To Do (11) | Done (31)
   * Done (31) -> To Do (11) | In Progress (21)
   *
   * In the future, this method could use the provided DatabaseService instance
   * to load and validate transition rules dynamically from the database.
   *
   * @param currentStatusId The ID of the current issue status.
   * @param targetStatusId The ID of the target issue status.
   * @param databaseService An instance of DatabaseService, available for potential future use
   *                        (e.g., loading dynamic transition rules). Currently unused in the hardcoded logic.
   * @returns True if the transition is valid, false otherwise.
   */
  isValidTransition(currentStatusId: number, targetStatusId: number, databaseService: DatabaseService): boolean {
    // Note: The databaseService parameter is available here if needed for future enhancements,
    // such as fetching allowed transitions from a database table.
    // Example:
    // const allowedTransitions = await databaseService.query(
    //   'SELECT target_status_id FROM allowed_status_transitions WHERE current_status_id = ?',
    //   [currentStatusId]
    // );
    // return allowedTransitions.some(t => t.target_status_id === targetStatusId);

    // Current implementation uses hardcoded logic:
    switch (currentStatusId) {
      case 11: // To Do
        return targetStatusId === 21; // -> In Progress
      case 21: // In Progress
        return targetStatusId === 11 || targetStatusId === 31; // -> To Do or Done
      case 31: // Done
        return targetStatusId === 11 || targetStatusId === 21; // -> To Do or In Progress
      default:
        // Unknown current status ID implies an invalid transition start point
        console.warn(`isValidTransition called with unknown currentStatusId: ${currentStatusId}`);
        return false;
    }
  }

  /**
    * Retrieves the numeric ID for a given status name.
    * In a real application, this might fetch from a database table.
    * Returns undefined if the status name is not found.
    */
   getStatusId(statusName: string): number | undefined {
       switch (statusName?.toLowerCase()) {
           case 'to do': return 11;
           case 'in progress': return 21;
           case 'done': return 31;
           default: return undefined;
       }
   }

   /**
    * Retrieves the name for a given status ID.
    * In a real application, this might fetch from a database table.
    * Returns undefined if the status ID is not found.
    */
   getStatusName(statusId: number): string | undefined {
       switch (statusId) {
           case 11: return 'To Do';
           case 21: return 'In Progress';
           case 31: return 'Done';
           default: return undefined;
       }
   }

   // Previous commented-out example of setter injection remains commented.
   // Passing DatabaseService directly to methods that need it (like isValidTransition)
   // is another common pattern, especially for stateless services.
   // private databaseService: DatabaseService | undefined;
   //
   // setDatabaseService(dbService: DatabaseService) {
   //   this.databaseService = dbService;
   // }
   //
   // async loadTransitionsFromDb() {
   //   if (!this.databaseService) {
   //     throw new Error("DatabaseService not set for IssueStatusTransitionService");
   //   }
   //   // const transitions = await this.databaseService.query('SELECT * FROM status_transitions');
   //   // Process and store transitions...
   // }
}