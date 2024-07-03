export default (plugin) => {
    plugin.router.post('/unload', async (req, res) => {
        const { pluginID } = req.body;
        try {
            plugin.unloadPlugin(pluginID);
            res.status(200).json({ message: `Plugin ${pluginID} unloaded successfully` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}