import DataSource from './data-source';
import { User } from './entities/user.entity';
import { Issue } from './entities/issue.entity';

async function seedDatabase() {
  const dataSource = await DataSource.initialize();

  try {
    const userRepository = dataSource.getRepository(User);
    const issueRepository = dataSource.getRepository(Issue);

    // Create sample users
    const user1 = userRepository.create({
      userKey: 'johndoe',
      displayName: 'John Doe',
      emailAddress: 'john.doe@example.com',
    });

    const user2 = userRepository.create({
      userKey: 'janedoe',
      displayName: 'Jane Doe',
      emailAddress: 'jane.doe@example.com',
    });

    const savedUser1 = await userRepository.save(user1);
    const savedUser2 = await userRepository.save(user2);

    // Create a sample Epic (Issue with type 'epic')
    const epic = issueRepository.create({
      issueKey: 'PROJECT-1',
      summary: 'Implement user authentication',
      description: 'As a user, I want to be able to log in to the application.',
      statusId: 1,
      issueTypeId: 1,
    });
    const savedEpic = await issueRepository.save(epic);

    // Create a sample Story (Issue with type 'story')
    const story = issueRepository.create({
      issueKey: 'PROJECT-2',
      summary: 'User can reset password',
      description: 'As a user, I want to be able to reset my password.',
      statusId: 1,
      issueTypeId: 2,
      epic: savedEpic,
    });
    await issueRepository.save(story);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await dataSource.destroy();
  }
}

seedDatabase()
  .then(() => console.log('Seeding completed.'))
  .catch(err => console.error('Seeding failed:', err));
