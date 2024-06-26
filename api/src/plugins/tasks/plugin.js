import Plugin from '../../lib/PluginBase.js';

/**
 * Tasks Plugin class
 */
class TasksPlugin extends Plugin {
    /**
     * Setup database for the tasks plugin
     */
    setupDatabase() {
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                completed BOOLEAN DEFAULT FALSE
            )
        `;

        this.db.query(createTableSql)
            .then(() => console.log('Tasks table created/verified successfully'))
            .catch(err => console.error('Error creating investments table', err));
    }

    /**
     * Tear down database for the tasks plugin
     */
    tearDownDatabase() {
        const dropTableSql = 'DROP TABLE IF EXISTS tasks;';
        this.db.query(dropTableSql)
            .then(() => console.log('Tasks table dropped successfully'))
            .catch(err => console.error('Error dropping tasks table', err));
    }
}

export default TasksPlugin;
