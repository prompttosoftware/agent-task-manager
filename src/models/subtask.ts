import { BaseIssue } from './baseIssue';
import { SubtaskSpecifics } from './subtaskSpecifics';

/**
 * Represents a subtask issue, extending both the {@link BaseIssue} interface
 * and the {@link SubtaskSpecifics} interface.
 * Subtasks are typically child issues linked to a parent task, story, bug, or epic.
 */
export interface Subtask extends BaseIssue, SubtaskSpecifics {}
