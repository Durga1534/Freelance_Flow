import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/(auth)/login/page'
import '@testing-library/jest-dom'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/lib/appwrite', () => {
  const createEmailPasswordSession = jest.fn().mockResolvedValue({ $id: 'sess_123' })
  const createOAuth2Session         = jest.fn()

  return {
    account: { createEmailPasswordSession, createOAuth2Session },
  }
})

const { account } = jest.requireMock('@/lib/appwrite') as typeof import('@/lib/appwrite')

describe('LoginPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('logs the user in with email + password', async () => {
    render(<LoginPage />)

   
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'StrongPass1' },
    })

    const submitBtn = screen.getByRole('button', { name: /sign in with email/i })
    fireEvent.click(submitBtn)

   
    await waitFor(() => {
        expect(submitBtn).toBeDisabled()
        expect(submitBtn).toHaveTextContent(/logging in/i)
    })
   
    expect(account.createEmailPasswordSession).toHaveBeenCalledWith(
      'test@example.com',
      'StrongPass1',
    )
  })

  it('starts Google OAuth when the Google button is clicked', async () => {
    render(<LoginPage />)

    fireEvent.click(
      screen.getByRole('button', { name: /sign in with google/i }),
    )

    await waitFor(() =>
      expect(account.createOAuth2Session).toHaveBeenCalledTimes(1),
    )
  })
})
