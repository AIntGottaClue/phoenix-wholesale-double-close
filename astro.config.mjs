import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
export default defineConfig({ site: 'https://phoenix.wholesaledoubleclose.click', output: 'server', adapter: cloudflare(), trailingSlash: 'always' });
