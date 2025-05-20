import { BaseIssue } from './baseIssue';
import { EpicSpecifics } from './epicSpecifics';

/**
 * Represents an epic issue and extends {@link BaseIssue}.
 */
export interface Epic extends BaseIssue, EpicSpecifics {}
