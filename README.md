# R6 Match Data
A tool that converts match replay files into useful data and allows users to explore that data dynamically.

Our frontend uses [Nuxt](https://v3.nuxtjs.org) and is deployed with Vercel. The backend uses various Google Cloud Platform (GCP) services, with Firestore as our database.

## Deployment Info

### Frontend
Code in the `app` directory is deployed by Vercel to https://r6-match-data-dev.vercel.app/ when code is pushed to `main`.

Checkout the [deployment documentation](https://v3.nuxtjs.org/guide/deploy/presets) for more information.

### Backend
Backend code in the `svc` directory is currently deployed to GCP manually.

## Dev Setup

Install dependencies:
```bash
npm install
```

Start the development server on http://localhost:3000
```bash
npm run dev
```

Locally preview production build:
```bash
npm run preview
```

## Style
Using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and [SemVer](https://semver.org/) for versioning (although our API is not public). Using commitlint to test for this formatting.
