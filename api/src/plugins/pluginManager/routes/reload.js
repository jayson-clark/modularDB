export default (plugin) => {
    plugin.router.post('/reload', async (req, res) => {
        const { pluginID } = req.body;
        try {
            await plugin.reloadPlugin(pluginID);
            res.status(200).json({ message: `Plugin ${pluginID} reloaded successfully` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}