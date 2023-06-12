import { createFilter } from '@rollup/pluginutils';
import mime from 'mime';

export default function contentTypePlugin(options = {}) {
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'content-type',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          if (filter(req.url)) {
            const mimeType = mime.getType(req.url) || 'application/octet-stream';
            const charset = mimeType.startsWith('text/') || mimeType === 'application/javascript' ? 'utf-8' : '';
            res.setHeader('Content-Type', `${mimeType}${charset ? `; charset=${charset}` : ''}`);
          }
          next();
        });
      };
    },
  };
}