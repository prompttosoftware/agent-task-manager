import { AppDataSource } from "../data-source";
import { User } from "./entities/user.entity";
import { IssueLinkType } from "./entities/issue_link_type.entity";
import { Transition } from "./entities/transition.entity";

export async function seedDatabase() {
    const dataSource = AppDataSource;

    const userRepository = dataSource.getRepository(User);
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
