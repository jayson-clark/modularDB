export default (plugin) => {
    plugin.router.get('/list', (req, res) => {
        try {
            const plugins = plugin.listPlugins();
            res.status(200).json(plugins);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}