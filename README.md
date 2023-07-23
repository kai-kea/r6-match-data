# R6 Match Data
A tool that converts match replay files into useful data and allows users to explore that data dynamically.

Our frontend uses Nuxt and is deployed with Vercel. The backend uses various Google Cloud Platform services, with Firestore as our Database.

## Nuxt Deployment instructions

Deploy by pushing code.
Look at the [Nuxt 3 documentation](https://v3.nuxtjs.org) to learn more.

### Setup

Make sure to install the dependencies:

```bash
yarn
```

Alternatively, for npm:
```bash
npm install
```

### Development Server

Start the development server on http://localhost:3000

```bash
yarn run dev
```

```bash
npm run dev -- -o
```

### Production

Build the application for production:

```bash
yarn run build
```

Locally preview production build:

```bash
yarn run preview
```

Checkout the [deployment documentation](https://v3.nuxtjs.org/guide/deploy/presets) for more information.

## Commits Style
Using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and [SemVer](https://semver.org/) for versioning. Using commitlint to test for this formatting.
