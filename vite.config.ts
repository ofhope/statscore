import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Statcore',
      fileName: 'statcore',
    },
    rollupOptions: {
      external: [],
      output: {
        exports: 'named', 
      },
    },
    minify: true,
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      logLevel: 'info',
      exclude: [
        '**/*.test.ts'
      ],
    })
  ],
});