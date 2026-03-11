# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## RPG Tabletop específico

Scripts adicionados:

- `npm run dev` - frontend Vite
- `npm run server` - backend Node/Express + SQLite em modo dev (nodemon)
- `npm run server:start` - backend Node/Express sem reinício automática

Rode:

1. `cd server && npm install`
2. `npm run server` (no terminal 1)
3. `npm install` (na raiz, se ainda não tiver instalado)
4. `npm run dev` (no terminal 2)

API endpoints expostos:

- `GET /api/campaigns`
- `POST /api/campaigns`
- `GET /api/campaigns/:campaignId/sessions`
- `POST /api/campaigns/:campaignId/sessions`
- `GET /api/characters?campaignId=&sessionId=`
- `POST /api/characters`
- `PUT /api/characters/:id`
- `PATCH /api/characters/:id/active`
- `DELETE /api/characters/:id`
- `GET /api/monsters`

> O SQLite local é armazenado em `server/rpg_master.db` e foi projetado para uso local do mestre.
>
> O frontend gera atributos no estilo D&D 3.5 (4d6 descartando o menor) e já aplica HP/MP iniciais baseados na classe selecionada.
