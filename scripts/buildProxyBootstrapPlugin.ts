import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

import type { Plugin } from 'vite';
import { build as viteBuild } from 'vite';

interface BuildProxyBootstrapPluginOptions {
  dependencies: string[];
  isProd: boolean;
  rootDir: string;
}

export const buildProxyBootstrapPlugin = ({
  dependencies,
  isProd,
  rootDir,
}: BuildProxyBootstrapPluginOptions): Plugin => {
  return {
    name: 'build-proxy-bootstrap',
    apply: 'build',
    async closeBundle() {
      await viteBuild({
        configFile: false,
        publicDir: false,
        resolve: {
          mainFields: ['module', 'jsnext:main', 'jsnext'],
          conditions: ['node'],
        },
        build: {
          outDir: resolve(rootDir, 'out/proxy'),
          target: 'node22',
          minify: false,
          reportCompressedSize: false,
          copyPublicDir: false,
          lib: {
            entry: resolve(rootDir, 'src/main/services/ProxyManager/bootstrap.ts'),
            formats: ['cjs'],
            fileName: () => 'index.js',
          },
          rollupOptions: {
            external: [
              'electron',
              /^electron\/.+/,
              ...builtinModules.flatMap((moduleName) => [moduleName, `node:${moduleName}`]),
              ...dependencies,
            ],
          },
        },
        esbuild: isProd ? { legalComments: 'none' } : {},
      });
    },
  };
};
