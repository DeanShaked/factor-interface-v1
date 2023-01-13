import { defineConfig } from 'cypress'

// TODO: update projectId to factor projectId
export default defineConfig({
  projectId: 'yp82ef',
  e2e: {
    specPattern: 'cypress/release.ts',
  },
})
