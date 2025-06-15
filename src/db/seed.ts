import { AppDataSource } from "../data-source";
import { User } from "./entities/user.entity";
import { Issue } from "./entities/issue.entity";
import { IssueLink } from "./entities/issue_link.entity";
import { IssueLinkType } from "./entities/issue_link_type.entity";
import { Transition } from "./entities/transition.entity";

export async function seedDatabase() {
    const dataSource = AppDataSource;

    const userRepository = dataSource.getRepository(User);
    const issueRepository = dataSource.getRepository(Issue);
    const issueLinkRepository = dataSource.getRepository(IssueLink);
    const issueLinkTypeRepository = dataSource.getRepository(IssueLinkType);

    // Create sample users
    let user1: User;
    const existingUser1 = await userRepository.findOneBy({ userKey: "user-1" });
    if (!existingUser1) {
        user1 = userRepository.create({
            userKey: "user-1",
            displayName: "John Doe",
            emailAddress: "john.doe@example.com",
        });
        await userRepository.save(user1);
    } else {
        user1 = existingUser1;
    }

    // Create issue for createmeta and other sample issues
    let issue4: Issue;
    const existingIssue4 = await issueRepository.findOneBy({ issueKey: "TASK-4" });
    if (!existingIssue4) {
        issue4 = issueRepository.create({
            issueKey: "SEED-1",
            title: "Task 4",
            description: "This is task 4.",
            reporter: user1,
            statusId: 1,
            issueTypeId: 1,
            priority: "1",
        });
        await issueRepository.save(issue4);
    } else {
        issue4 = existingIssue4;
    }

    let issue5: Issue;
    const existingIssue5 = await issueRepository.findOneBy({ issueKey: "TASK-5" });
    if (!existingIssue5) {
        issue5 = issueRepository.create({
            issueKey: "SEED-2",
            title: "Task 5",
            description: "This is task 5.",
            reporter: user1,
            statusId: 1,
            issueTypeId: 1,
            priority: "1",
        });
        await issueRepository.save(issue5);
    } else {
        issue5 = existingIssue5;
    }

    


    // Create link type "Blocks"
    let blocksLinkType: IssueLinkType;
    const existingBlocksLinkType = await issueLinkTypeRepository.findOneBy({ name: "Blocks" });
    if (!existingBlocksLinkType) {
        blocksLinkType = issueLinkTypeRepository.create({
            name: "Blocks",
            inward: "is blocked by",
            outward: "blocks",
        });
        await issueLinkTypeRepository.save(blocksLinkType);
    } else {
        blocksLinkType = existingBlocksLinkType;
    }

    // Create link type "Relates"
    let relatesLinkType: IssueLinkType;
    const existingRelatesLinkType = await issueLinkTypeRepository.findOneBy({ name: "Relates" });
    if (!existingRelatesLinkType) {
        relatesLinkType = issueLinkTypeRepository.create({
            name: "Relates",
            inward: "relates to",
            outward: "relates to",
        });
        await issueLinkTypeRepository.save(relatesLinkType);
    } else {
        relatesLinkType = existingRelatesLinkType;
    }

    // Create IssueLink
    if (issue4 && issue5 && blocksLinkType) {
        const existingIssueLink = await issueLinkRepository.findOneBy({
            inwardIssueId: issue4.id,
            outwardIssueId: issue5.id,
            linkTypeId: blocksLinkType.id,
        });

        if (!existingIssueLink) {
            const issueLink = issueLinkRepository.create({
                inwardIssueId: issue4.id,
                outwardIssueId: issue5.id,
                linkTypeId: blocksLinkType.id,
            });
            await issueLinkRepository.save(issueLink);
        }
    }

    // Create a transition from status 11 to 12
    const transitionRepository = dataSource.getRepository(Transition);
    const existingTransition = await transitionRepository.findOneBy({ fromStatusId: 11, toStatusId: 12 });
    if (!existingTransition) {
        const transition = transitionRepository.create({
            fromStatusId: 11,
            toStatusId: 12,
        });
        await transitionRepository.save(transition);
    }

    // Create sample user 2
    let user2: User;
    const existingUser2 = await userRepository.findOneBy({ userKey: "user-2" });
    if (!existingUser2) {
        user2 = userRepository.create({
            userKey: "user-2",
            displayName: "Jane Smith",
            emailAddress: "jane.smith@example.com",
        });
        await userRepository.save(user2);
    } else {
        user2 = existingUser2;
    }

    console.log("Database seeded successfully!");
}
