import { AppDataSource } from "../data-source";
import { User } from "./entities/user.entity";
import { Issue } from "./entities/issue.entity";

export async function seedDatabase() {
    const dataSource = AppDataSource;

    const userRepository = dataSource.getRepository(User);
    const issueRepository = dataSource.getRepository(Issue);

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
    const existingIssue1 = await issueRepository.findOneBy({ issueKey: "issue-1" });
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

    console.log("Database seeded successfully!");
}


