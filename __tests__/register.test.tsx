import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterPage from '@/app/(auth)/register/page'

jest.mock('@/lib/appwrite')

import { account as rawAccount } from '@/lib/appwrite'

const account = jest.mocked(rawAccount, {shallow: true})

describe('RegisterPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a new account with email + password', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'StrongPass1' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongPass1' },
    })

    const [googleBtn, submitBtn] = screen.getAllByRole('button', {
      name: /create account/i,
    })
    fireEvent.click(submitBtn)

    expect(submitBtn).toBeDisabled()

    await waitFor(() =>
      expect(
        screen.getByText(/account created successfully/i),
      ).toBeInTheDocument(),
    )

    expect(account.create).toHaveBeenCalledTimes(1)
    const [uid, email, pwd] = account.create.mock.calls[0]

    expect(uid).toMatch(/^user_/)
    expect(email).toBe('test@example.com')
    expect(pwd).toBe('StrongPass1')
  })
})
