// src/signoff/signoff.ts

import { IssueService } from '../services/issue.service';
import { EpicService } from '../services/epic.service';
import ConfigService from '../services/config.service';
import { DatabaseService } from '../services/database.service';

interface CheckResult {
    checkName: string;
    passed: boolean;
    details?: any;
}

export class ProjectSignOff {
    private issueService: IssueService;
    private epicService: EpicService;
    private configService: ConfigService;
    private databaseService: DatabaseService;

    constructor() {
        this.issueService = new IssueService();
        this.epicService = new EpicService();
        this.configService = ConfigService.getInstance();
        this.databaseService = new DatabaseService();
    }

    async runChecks(): Promise<boolean> {
        try {
            // Load state from database
            let loadedState = await this.databaseService.loadState();
            let allChecksPassed = loadedState?.allChecksPassed !== undefined ? loadedState.allChecksPassed : true;
            let checkResults: CheckResult[] = loadedState?.checkResults || [];

            // 1. Verify that all tasks in Epic 18 (or the last epic) are done.
            const lastEpicNumber = this.configService.getLastEpicNumber();
            let epic18Check: boolean = true; // Default to true if no epic is found.
            if (lastEpicNumber !== null && lastEpicNumber !== undefined) {
                epic18Check = await this.verifyEpicTasks(this.configService.getEpicKey(lastEpicNumber)!);
                checkResults.push({ checkName: `Epic ${lastEpicNumber} Tasks Completed`, passed: epic18Check });
                console.log(`Epic ${lastEpicNumber} Tasks Completed: ${epic18Check}`);
                allChecksPassed = allChecksPassed && epic18Check;
            } else {
                console.warn('Last epic number not configured. Skipping Epic task verification.');
            }

            // 2. Verify that all tasks in Epics 1-17 are done.
            const epics1to17Check = await this.verifyEpicsTasks();
            checkResults.push({ checkName: 'Epics 1-17 Tasks Completed', passed: epics1to17Check });
            console.log(`Epics 1-17 Tasks Completed: ${epics1to17Check}`);
            allChecksPassed = allChecksPassed && epics1to17Check;

            // 3. Verify successful final testing.
            const finalTestingCheck = this.configService.isFinalTestingPassed();
            checkResults.push({ checkName: 'Final Testing', passed: finalTestingCheck });
            console.log(`Final Testing: ${finalTestingCheck}`);
            allChecksPassed = allChecksPassed && finalTestingCheck;

            // 4. Verify code review completion.
            const codeReviewCheck = this.configService.isCodeReviewApproved();
            checkResults.push({ checkName: 'Code Review', passed: codeReviewCheck });
            console.log(`Code Review: ${codeReviewCheck}`);
            allChecksPassed = allChecksPassed && codeReviewCheck;

            // 5. Verify documentation finalization.
            const documentationCheck = this.configService.isDocumentationFinalized();
            checkResults.push({ checkName: 'Documentation Finalized', passed: documentationCheck });
            console.log(`Documentation Finalized: ${documentationCheck}`);
            allChecksPassed = allChecksPassed && documentationCheck;

            // 6. Verify project cleanup.
            const cleanupCheck = this.configService.isProjectCleaned();
            checkResults.push({ checkName: 'Project Cleanup', passed: cleanupCheck });
            console.log(`Project Cleanup: ${cleanupCheck}`);
            allChecksPassed = allChecksPassed && cleanupCheck;

            // Save state to database
            await this.databaseService.saveState({
                checkResults: checkResults,
                allChecksPassed: allChecksPassed,
            });

            return allChecksPassed;
        } catch (error: any) {
            console.error('Error during runChecks:', error);
            // Consider logging the error to a more persistent location.
            return false;
        }
    }

    async verifyEpicTasks(epicKey: string): Promise<boolean> {
        try {
            const issues = await this.epicService.getIssuesForEpic(epicKey);
            if (!issues || issues.length === 0) {
                console.log(`No issues found for epic ${epicKey}`);
                return true; // Consider no issues as done
            } 
            const issueDetails = await Promise.all(issues.map(issueKey => this.issueService.getIssue(issueKey)));
            const allDone = issueDetails.every(issue => issue?.status === 'Done'); // Assuming 'Done' is the status
            console.log(`Verifying tasks for Epic ${epicKey}... ${allDone ? 'All done' : 'Not all done'}`);
            return allDone;
        } catch (error: any) {
            console.error(`Error verifying tasks for Epic ${epicKey}:`, error);
            return false;
        }
    }

    async verifyEpicsTasks(): Promise<boolean> {
        let allEpicsPassed = true;
        for (let i = 1; i <= 17; i++) {
            try {
                const epicKey = this.configService.getEpicKey(i);
                if (!epicKey) {
                    console.warn(`Epic key not found for epic number: ${i}`);
                    allEpicsPassed = false;
                    break;
                }
                const epicPassed = await this.verifyEpicTasks(epicKey);
                if (!epicPassed) {
                    allEpicsPassed = false;
                    break;
                }
            } catch (error: any) {
                console.error(`Error verifying epic ${i}:`, error);
                allEpicsPassed = false;
                break;
            }
        }
        return allEpicsPassed;
    }

    async getCheckResults(): Promise<CheckResult[]> {
        try {
            const loadedState = await this.databaseService.loadState();
            return loadedState?.checkResults || [];
        } catch (error: any) {
            console.error('Error loading check results:', error);
            return []; // Or handle the error as appropriate for your application
        }
    }

    async generateReport(): Promise<string> {
        let report = 'Project Sign-Off Report\n';
        const checkResults = await this.getCheckResults();

        checkResults.forEach(result => {
            report += `  - ${result.checkName}: ${result.passed ? 'Passed' : 'Failed'}\n`;
        });

        // Suggest obtaining necessary approvals from stakeholders.
        report += '\nObtain necessary approvals from stakeholders before sign-off.';
        // Include a section for documenting the sign-off process.
        report += '\nDocument the sign-off process and store it for project records.';
        return report;
    }

    async documentSignOff(details: string, signOffDocument?: any): Promise<void> {
        try {
            await this.databaseService.saveSignOff(details, signOffDocument);
            console.log(`Sign-off documented: ${details}`);
        } catch (error: any) {
            console.error('Error documenting sign-off:', error);
        }
    }
}
