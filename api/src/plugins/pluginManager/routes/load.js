export default (plugin) => {
    plugin.router.post('/load', async (req, res) => {
        const { pluginDir } = req.body;
        try {
            await plugin.loadPlugin(pluginDir);
            res.status(200).json({ message: `Plugin ${pluginDir} loaded successfully` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}