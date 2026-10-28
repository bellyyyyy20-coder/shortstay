import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import auth from 'auth-astro';

export default defineConfig({
  integrations: [tailwind(), auth()],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  })
});
