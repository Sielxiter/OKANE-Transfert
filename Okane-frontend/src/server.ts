import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Des points d'entrée Express pour API REST peuvent être définis ici.
 * Décommenter et définir les points d'entrée si nécessaire.
 *
 * Exemple :
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Traiter la requête API
 * });
 * ```
 */

/**
 * Servir les fichiers statiques depuis /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Traiter les autres requêtes en rendant l'application Angular.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Démarrer le serveur si ce module est le point d'entrée principal ou s'il est lancé via PM2.
 * Le serveur écoute sur le port défini par la variable d'environnement `PORT`, ou sur 4000 par défaut.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Serveur Node Express en écoute sur http://localhost:${port}`);
  });
}

/**
 * Gestionnaire de requêtes utilisé par Angular CLI ou Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
