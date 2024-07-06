export default (plugin) => {
    plugin.router.post('/saveLayout', (req, res) => {
        try {
            const layout = req.body;
            plugin.saveLayout(layout);
            res.status(200).json({ message: 'Layout saved successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
