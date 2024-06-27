export default (plugin) => {
    plugin.router.get('/loadLayout', (req, res) => {
        try {
            const layout = plugin.loadLayout();
            res.status(200).json(layout);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
