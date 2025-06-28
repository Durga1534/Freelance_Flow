import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ClientForm from '@/app/(dashboard)/clients/ClientForm'
import '@testing-library/jest-dom'

jest.mock('next/navigation', () => ({ useRouter: () => ({}) }))

jest.mock('@/lib/appwrite', () => {
  const createDocument = jest.fn()
  const get            = jest.fn().mockResolvedValue({ $id: 'user_123' })
  return {
    account:   { get },
    databases: { createDocument },
    ID:        { unique: () => 'cid_999' },
  }
})

const {
  account,
  databases,
  ID,
} = jest.requireMock('@/lib/appwrite') as {
  account:   { get: jest.Mock }
  databases: { createDocument: jest.Mock }
  ID:        { unique: () => string }
}

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}))
afterAll (() => (console.error as jest.Mock).mockRestore())

const fillForm = () => {
  fireEvent.change(screen.getByLabelText(/name/i),    { target: { value: 'Acme Inc.' } })
  fireEvent.change(screen.getByLabelText(/email/i),   { target: { value: 'info@acme.com' } })
  fireEvent.change(screen.getByLabelText(/phone/i),   { target: { value: '555-5555' } })
  fireEvent.change(screen.getByLabelText(/company/i), { target: { value: 'Acme' } })
}

describe('ClientForm', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a client and resets the form', async () => {
    const onAdded = jest.fn()

    databases.createDocument.mockResolvedValueOnce({ $id: 'cid_999' })

    render(<ClientForm onClientAdded={onAdded} />)
    fillForm()

    const btn = screen.getByRole('button', { name: /add client/i })
    fireEvent.click(btn)

    await waitFor(() => expect(btn).toBeDisabled())

    expect(databases.createDocument).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_COLLECTION_CLIENTS_ID,
      ID.unique(),                                   
      {
        name:    'Acme Inc.',
        email:   'info@acme.com',
        phone:   '555-5555',
        company: 'Acme',
        notes:   '',
        userId:  'user_123',
      },
    )

    await waitFor(() => expect(onAdded).toHaveBeenCalled())
    expect(screen.getByLabelText(/name/i)).toHaveValue('')
  })

  it('keeps “Add Client” disabled until required fields are filled', () => {
    render(<ClientForm onClientAdded={() => {}} />)

    const btn = screen.getByRole('button', { name: /add client/i })
    fillForm()
    expect(btn).toBeEnabled()
  })

  it('shows an error message when save fails', async () => {
    databases.createDocument.mockRejectedValueOnce(new Error('boom!'))

    render(<ClientForm onClientAdded={() => {}} />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /add client/i }))

    await waitFor(() =>
      expect(screen.getByText(/failed to add client/i)).toBeInTheDocument(),
    )
  })
})
