import Plugin from '../../lib/PluginBase.js';

import { readdirSync } from 'fs';
import { join } from 'path';

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

    /**
     * List all widgets of a specific plugin.
     * @param {string} pluginID - The ID of the plugin whose widgets are to be listed.
     * @returns {Array} - An array of objects representing the widgets, each with a name and path.
     */
    listWidgets(pluginID) {
        // Retrieve the plugin instance from the plugin manager using the plugin ID.
        const plugin = this.app.pluginManager.plugins.get(pluginID);

        // Check if the plugin exists and has a 'widget_directory' specified in its manifest.
        if (plugin && plugin.manifest.widget_directory) {
            // Construct the absolute path to the plugin's widget directory.
            const widgetDir = join(plugin.rootPath, plugin.manifest.widget_directory);

            // Read the contents of the widget directory and map each widget to an object with its name and path.
            const widgets = readdirSync(widgetDir).map(widget => ({
                name: widget, // The name of the widget file.
                path: `/widgets/${pluginID}/${widget}` // The path to access the widget.
            }));

            // Return the array of widget objects.
            return widgets;
        }

        // If the plugin doesn't exist or has no widget directory, return an empty array.
        return [];
    }

}

export default PluginManager;
