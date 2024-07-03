import Plugin from '../../lib/PluginBase.js';

class PluginManager extends Plugin {
    /**
     * Unload a plugin by ID.
     * @param {string} pluginID - The ID of the plugin to unload.
     */
    unloadPlugin(pluginID) {
        this.app.pluginManager.unloadPlugin(pluginID);
    }

    /**
     * Load a plugin by directory name.
     * @param {string} pluginDir - The directory name of the plugin to load.
     */
    async loadPlugin(pluginDir) {
        await this.app.pluginManager.loadPlugin(pluginDir);
    }

    /**
     * Reload a plugin by ID.
     * @param {string} pluginID - The ID of the plugin to reload.
     */
    async reloadPlugin(pluginID) {
        await this.app.pluginManager.reloadPlugin(pluginID);
    }

    /**
     * List all loaded plugins and their widgets.
     * @returns {Array} - An array of plugin objects with their widget details.
     */
    listPlugins() {
        return this.app.pluginManager.listPlugins();
    }
}

export default PluginManager;
