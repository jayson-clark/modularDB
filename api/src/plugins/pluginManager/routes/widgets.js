export default (plugin) => {
    plugin.router.get('/widgets/:pluginID', (req, res) => {
        const { pluginID } = req.params;
        try {
            const widgets = plugin.listWidgets(pluginID);
            res.status(200).json(widgets);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}