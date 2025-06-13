import { AppDataSource } from "../data-source";
import { User } from "./entities/user.entity";
import { Issue } from "./entities/issue.entity";
import { IssueLink } from "./entities/issue_link.entity";
import { IssueLinkType } from "./entities/issue_link_type.entity"; // Import IssueLinkType

export async function seedDatabase() {
    const dataSource = AppDataSource;

    const userRepository = dataSource.getRepository(User);
    const issueRepository = dataSource.getRepository(Issue);
    const issueLinkRepository = dataSource.getRepository(IssueLink);
    const issueLinkTypeRepository = dataSource.getRepository(IssueLinkType); // Get IssueLinkType repository

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

    // Create a sample issue
    const existingIssue1 = await issueRepository.findOneBy({ issueKey: "ISSUE-1" });
    if (!existingIssue1) {
        const issue1 = issueRepository.create({
            issueKey: "ISSUE-1",
            title: "Sample Issue",
            description: "This is a sample issue.",
            reporter: user1,
            statusId: 1,
            issueTypeId: 1,
            priority: "1",
        });
        await issueRepository.save(issue1);
    }

    const existingIssue2 = await issueRepository.findOneBy({ issueKey: "ISSUE-2" });
    if (!existingIssue2) {
        const issue2 = issueRepository.create({
            issueKey: "ISSUE-2",
            title: "Sample Issue 2",
            description: "This is a sample issue 2.",
            reporter: user1,
            statusId: 1,
            issueTypeId: 1,
            priority: "1",
        });
        await issueRepository.save(issue2);
    }

    // Create link type "Relates"
    let relatesLinkType: IssueLinkType;
    const existingLinkType = await issueLinkTypeRepository.findOneBy({ name: "Relates" });
    if (!existingLinkType) {
        relatesLinkType = issueLinkTypeRepository.create({ name: "Relates" });
        await issueLinkTypeRepository.save(relatesLinkType);
    } else {
        relatesLinkType = existingLinkType;
    }

    // Create IssueLink
    // Assuming issue1 and issue2 were created successfully
    const issue1 = await issueRepository.findOneBy({ issueKey: "ISSUE-1" });
    const issue2 = await issueRepository.findOneBy({ issueKey: "ISSUE-2" });

    if (issue1 && issue2 && relatesLinkType) {
        const existingIssueLink = await issueLinkRepository.findOneBy({
            inwardIssueId: issue1.id,
            outwardIssueId: issue2.id,
            linkTypeId: relatesLinkType.id,
        });

        if (!existingIssueLink) {
            const issueLink = issueLinkRepository.create({
                inwardIssueId: issue1.id,
                outwardIssueId: issue2.id,
                linkTypeId: relatesLinkType.id,
            });
            await issueLinkRepository.save(issueLink);
        }
    }

    console.log("Database seeded successfully!");
}


