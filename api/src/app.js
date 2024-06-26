import express, { json } from 'express';
import cors from 'cors';
import db from './lib/db.js';
import PluginManager from './lib/PluginManager.js';

const app = express();
app.use(cors());
app.use(json());

// Initialize Plugin Manager
app.pluginManager = new PluginManager(app, db);
app.pluginManager.init();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
