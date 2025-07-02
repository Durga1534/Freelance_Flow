/* __tests__/invoice‑form.test.tsx */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import InvoiceForm from '@/app/(dashboard)/invoices/components/InvoiceForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom'

const renderWithClient = (ui: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      {ui}
    </QueryClientProvider>,
  )
}

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

jest.mock('@/lib/appwrite', () => {
  const listDocuments  = jest.fn().mockResolvedValue({ documents: [] })
  const createDocument = jest.fn()
  const get            = jest.fn().mockResolvedValue({ $id: 'user_123' })
  const unique         = () => 'uid_999'

  return {
    databases: { listDocuments, createDocument },
    account:   { get },
    ID:        { unique },
  }
})

const { databases } = jest.requireMock('@/lib/appwrite') as {
  databases: { createDocument: jest.Mock }
}

/* helpers ----------------------------------------------------------------- */
const type = (label: RegExp, value: string | number) =>
  fireEvent.change(screen.getByLabelText(label), {
    target: { value: value.toString() },
  })

/* tests ------------------------------------------------------------------- */
describe('InvoiceForm', () => {
  beforeEach(() => jest.clearAllMocks())

  it('re‑calculates amounts when item data changes', () => {
    renderWithClient(<InvoiceForm onClose={() => {}} />)

    type(/description/i, 'Design')
    type(/quantity/i,     2)
    type(/^rate \*$/i,    50)
    type(/discount \(%\)/i, 10)
    type(/tax rate/i, 5)

    expect(screen.getByText(/subtotal:/i).nextSibling)
      .toHaveTextContent('100.00')
    expect(screen.getByText(/discount:/i).nextSibling)
      .toHaveTextContent('-10.00')
    expect(screen.getByText(/^tax:/i).nextSibling)
      .toHaveTextContent('4.50')
    expect(screen.getByText(/^total:/i).nextSibling)
      .toHaveTextContent('94.50')
  })

  it('adds and removes line‑items', () => {
    renderWithClient(<InvoiceForm onClose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /add item/i }))
    expect(screen.getAllByLabelText(/description/i)).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: /×/i })[0])
    expect(screen.getAllByLabelText(/description/i)).toHaveLength(1)
  })

  it('creates invoice + items then redirects', async () => {
    const onClose = jest.fn()
    const push    = jest.fn()
    ;(jest.requireMock('next/navigation').useRouter).mockReturnValue({ push })

    databases.createDocument
      .mockResolvedValueOnce({ $id: 'inv_123' })
      .mockResolvedValue({})                     

    renderWithClient(<InvoiceForm onClose={onClose} />)

    type(/description/i, 'Logo')
    type(/quantity/i,     1)
    type(/^rate \*$/i,    250)

    fireEvent.click(screen.getByRole('button', { name: /create invoice/i }))

    await waitFor(() => expect(databases.createDocument).toHaveBeenCalled())

    /** first call – invoice header */
    expect(databases.createDocument).toHaveBeenNthCalledWith(
      1,
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ID,
      'uid_999',
      expect.objectContaining({
        subtotal:     250,
        total_amount: 250,
        userId:       'user_123',
      }),
    )

    /** second call – first line‑item */
    expect(databases.createDocument).toHaveBeenNthCalledWith(
      2,
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ITEMS_ID,
      'uid_999',
      expect.objectContaining({
        invoice_id:  'inv_123',
        description: 'Logo',
        quantity:    1,
        unit_price:  250,
        total_price: 250,
        item_order:  1,
      }),
    )

    expect(onClose).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/invoices')
  })
})
