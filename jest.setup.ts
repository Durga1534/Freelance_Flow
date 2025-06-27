import '@testing-library/jest-dom'

// ---------- mock Appwrite ----------
jest.mock('@/lib/appwrite', () => ({
  account: {
    create:              jest.fn(),
    createOAuth2Session: jest.fn(),
  },
}))

// ---------- mock next/navigation ----------
jest.mock('next/navigation', () => {
  return {
    useRouter() {
      return {
        push:    jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
      }
    },
  }
})
