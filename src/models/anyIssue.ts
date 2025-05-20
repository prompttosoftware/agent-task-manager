import { Task } from './task';
import { Story } from './story';
import { Epic } from './epic';
import { Bug } from './bug';
import { Subtask } from './subtask';

/**
 * Represents any type of issue within the system.
 * This is a union of all specific issue types: {@link Task}, {@link Story}, {@link Epic}, {@link Bug}, and {@link Subtask}.
 * Each of these types extends {@link BaseIssue}.
 */
export type AnyIssue = Task | Story | Epic | Bug | Subtask;
