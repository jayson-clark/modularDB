export default (plugin) => {
    const router = plugin.router;

    // Get all tasks
    router.get('/tasks', async (req, res) => {
        try {
            const result = await plugin.db.query('SELECT * FROM tasks');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Create a new task
    router.post('/tasks', async (req, res) => {
        const { title, description } = req.body;
        try {
            const result = await plugin.db.query(
                'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
                [title, description]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Update a task
    router.put('/tasks/:id', async (req, res) => {
        const { id } = req.params;
        const { title, description, completed } = req.body;
        try {
            const result = await plugin.db.query(
                'UPDATE tasks SET title = $1, description = $2, completed = $3 WHERE id = $4 RETURNING *',
                [title, description, completed, id]
            );
            res.json(result.rows[0]);
        } catch (err) {
            console.log(err.message)
            res.status(500).json({ error: err.message });
        }
    });

    // Delete a task
    router.delete('/tasks/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await plugin.db.query('DELETE FROM tasks WHERE id = $1', [id]);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
