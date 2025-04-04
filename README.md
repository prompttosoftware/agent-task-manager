## Setup and Deployment

### Prerequisites

*   Node.js (version X.X.X or higher)
*   npm or yarn
*   A database (PostgreSQL) - The application uses a PostgreSQL database.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd agent-task-manager
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Database Setup

1.  Create the PostgreSQL database and run the schema initialization script:
    ```bash
    psql -U <username> -d <database_name> -f create_tables.sql
    psql -U <username> -d <database_name> -f init.sql
    ```

### Environment Variables

Create a `.env` file in the root directory with the following environment variables:

```
DATABASE_URL=<your_database_url>
PORT=3000
# Add other environment variables as needed.
```

### Running the Application

1.  Start the application:
    ```bash
    npm start
    ```
    or
    ```bash
    pm2 start pm2.config.js
    ```

### API Documentation

See the [API Documentation](docs/api-documentation.md) for detailed information about the API endpoints.

### Deployment

Follow the steps in `docs/pm2-setup.md` for deployment using PM2.