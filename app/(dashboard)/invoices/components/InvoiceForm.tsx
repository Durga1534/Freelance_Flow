"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { account, databases, ID } from "@/lib/appwrite";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Zod validation schema
const invoiceSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  client_email: z.string().email("Invalid email address"),
  client_address: z.string().optional(),
  client_phone: z.string().optional(),
  client_company: z.string().optional(),
  business_name: z.string().min(1, "Business name is required"),
  business_email: z.string().email("Invalid business email"),
  business_address: z.string().optional(),
  business_phone: z.string().optional(),
  business_logo: z.string().url().optional().or(z.literal("")),
  business_tax_id: z.string().optional(),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  currency: z.enum(["USD", "EUR", "INR"]),
  subtotal: z.number().min(0, "Subtotal must be positive"),
  tax_rate: z.number().min(0).max(100, "Tax rate must be between 0-100"),
  tax_amount: z.number().min(0),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().min(0),
  discount_amount: z.number().min(0),
  total_amount: z.number().min(0),
  paid_amount: z.number().min(0),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.enum(["monthly", "quarterly", "yearly"]).optional(),
  recurring_end_date: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    rate: z.number().min(0, "Rate must be positive"),
    amount: z.number().min(0)
  })).min(1, "At least one item is required"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

type Client = {
  $id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ID!;
const clientsId = process.env.NEXT_PUBLIC_COLLECTION_CLIENTS_ID!;
const invoiceItemsId = process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ITEMS_ID!;

const InvoiceForm = ({ onClose }: { onClose?: () => void }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
    watch,
    reset,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      invoice_number: `INV-${Date.now()}`,
      invoice_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      status: "draft",
      currency: "USD",
      subtotal: 0,
      tax_rate: 0,
      tax_amount: 0,
      discount_type: "percentage",
      discount_value: 0,
      discount_amount: 0,
      total_amount: 0,
      paid_amount: 0,
      is_recurring: false,
      items: [{ id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0 }],
    },
  });

  // Watch form values for auto-calculation
  const watchedValues = useWatch({ control });
  const { items, subtotal, tax_rate, discount_type, discount_value } = watchedValues;

  // Auto-calculate totals
  useEffect(() => {
  if (!items || items.length === 0) return;

  let newSubtotal = 0;
  const newItems = items.map((item) => {
    const amount = (item.quantity ?? 0) * (item.rate ?? 0);
    newSubtotal += amount;
    return { ...item, 
      id: item.id ?? crypto.randomUUID(), 
      description: item.description ?? '', 
      quantity: item.quantity ?? 0, 
      rate: item.rate ?? 0, 
      amount 
    };
  });

  const discountAmount = discount_type === "percentage"
    ? (newSubtotal * (discount_value || 0)) / 100
    : (discount_value || 0);

  const taxableAmount = newSubtotal - discountAmount;
  const taxAmount = (taxableAmount * (tax_rate || 0)) / 100;
  const totalAmount = taxableAmount + taxAmount;

  // Only update if values changed (prevents infinite loop)
  const valuesToSet: Partial<InvoiceFormData> = {};
  if (newSubtotal !== subtotal) valuesToSet.subtotal = newSubtotal;
  if (discountAmount !== watchedValues.discount_amount) valuesToSet.discount_amount = discountAmount;
  if (taxAmount !== watchedValues.tax_amount) valuesToSet.tax_amount = taxAmount;
  if (totalAmount !== watchedValues.total_amount) valuesToSet.total_amount = totalAmount;

  if (JSON.stringify(newItems) !== JSON.stringify(items)) {
    valuesToSet.items = newItems;
  }

  if (Object.keys(valuesToSet).length > 0) {
    for (const [key, value] of Object.entries(valuesToSet)) {
      setValue(key as keyof InvoiceFormData, value as any);
    }
  }
}, [items, tax_rate, discount_type, discount_value]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await databases.listDocuments(databaseId, clientsId);
        setClients(response.documents as unknown as Client[]);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      }
    };
    fetchClients();
  }, []);

  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find((c) => c.$id === clientId);
    if (selectedClient) {
      setValue("client_email", selectedClient.email);
      setValue("client_phone", selectedClient.phone);
      setValue("client_company", selectedClient.company);
    }
  };

  const addItem = () => {
    const currentItems = watch("items") || [];
    setValue("items", [
      ...currentItems,
      { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0 }
    ]);
  };

  const removeItem = (index: number) => {
    const currentItems = watch("items") || [];
    if (currentItems.length > 1) {
      setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  const createInvoiceMutation = useMutation({
  mutationFn: async (data: InvoiceFormData) => {
    const user = await account.get();
    const { items, ...invoiceDataWithoutItems } = {
      ...data,
      subtotal: Math.round(data.subtotal * 100) / 100,
      tax_amount: Math.round(data.tax_amount * 100) / 100,
      discount_amount: Math.round(data.discount_amount * 100) / 100,
      total_amount: Math.round(data.total_amount * 100) / 100,
      paid_amount: Math.round(data.paid_amount * 100) / 100,
    };

    const newInvoice = await databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      {
        ...invoiceDataWithoutItems,
        userId: user.$id,
      }
    );

    await Promise.all(
      items.map((item, index) =>
        databases.createDocument(
          databaseId,
          invoiceItemsId,
          ID.unique(),
          {
            invoice_id: newInvoice.$id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.rate,
            total_price: item.amount,
            item_order: index + 1,
          }
        )
      )
    );

    return newInvoice;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    onClose?.();
    router.push("/invoices");
  },
});

  const onSubmit = async (data: InvoiceFormData) => {
    //prevents from creating duplicates
    if(createInvoiceMutation.isPending) return;
    createInvoiceMutation.mutate(data);
};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Create Invoice</h2>

      {/* Client Selection */}
      <div>
        <label className="block mb-1 font-medium text-foreground">Select Client</label>
        <select
          className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          onChange={(e) => handleClientSelect(e.target.value)}
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.$id} value={client.$id}>
              {client.name} {client.company && `(${client.company})`}
            </option>
          ))}
        </select>
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-foreground">Client Email *</label>
          <input
            {...register("client_email")}
            type="email"
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
          {errors.client_email && (
            <p className="text-red-500 text-sm mt-1">{errors.client_email.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-foreground">Client Phone</label>
          <input
            {...register("client_phone")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
        </div>

        <div>
          <label className="block mb-1 text-foreground">Client Company</label>
          <input
            {...register("client_company")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
        </div>

        <div>
          <label className="block mb-1 text-foreground">Client Address</label>
          <input
            {...register("client_address")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
        </div>
      </div>

      {/* Business Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-foreground">Business Name *</label>
          <input
            {...register("business_name")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
          {errors.business_name && (
            <p className="text-red-500 text-sm mt-1">{errors.business_name.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-foreground">Business Email *</label>
          <input
            {...register("business_email")}
            type="email"
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
          {errors.business_email && (
            <p className="text-red-500 text-sm mt-1">{errors.business_email.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-foreground">Business Phone</label>
          <input
            {...register("business_phone")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
        </div>

        <div>
          <label className="block mb-1 text-foreground">Business Address</label>
          <input
            {...register("business_address")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
        </div>

        <div>
          <label className="block mb-1 text-foreground">Business Logo URL</label>
          <input
            {...register("business_logo")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
            placeholder="https://..."
          />
          {errors.business_logo && (
            <p className="text-red-500 text-sm mt-1">{errors.business_logo.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-foreground">Business Tax ID</label>
          <input
            {...register("business_tax_id")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-foreground">Invoice Number *</label>
          <input
            {...register("invoice_number")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
          {errors.invoice_number && (
            <p className="text-red-500 text-sm mt-1">{errors.invoice_number.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-foreground">Currency</label>
          <select
            {...register("currency")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="INR">INR</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-foreground">Invoice Date *</label>
          <input
            {...register("invoice_date")}
            type="date"
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
          {errors.invoice_date && (
            <p className="text-red-500 text-sm mt-1">{errors.invoice_date.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-foreground">Due Date *</label>
          <input
            {...register("due_date")}
            type="date"
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          />
          {errors.due_date && (
            <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-foreground">Status</label>
          <select
            {...register("status")}
            className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Recurring Invoice Options */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            {...register("is_recurring")}
            type="checkbox"
            id="is_recurring"
            className="rounded border-border"
          />
          <label htmlFor="is_recurring" className="text-foreground">
            Make this a recurring invoice
          </label>
        </div>

        {watch("is_recurring") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-foreground">Recurring Interval</label>
              <select
                {...register("recurring_interval")}
                className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-foreground">End Date (Optional)</label>
              <input
                {...register("recurring_end_date")}
                type="date"
                className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
              />
            </div>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">Invoice Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="px-3 py-1 bg-purple-400 text-white rounded hover:bg-purple-700"
          >
            Add Item
          </button>
        </div>

        {watch("items")?.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded">
            <div className="md:col-span-2">
              <label className="block mb-1 text-foreground">Description *</label>
              <input
                {...register(`items.${index}.description`)}
                className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
                placeholder="Service description"
              />
              {errors.items?.[index]?.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.items[index]?.description?.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-foreground">Quantity *</label>
              <input
                {...register(`items.${index}.quantity`, {
                  valueAsNumber: true,
                })}
                type="number"
                min="1"
                className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
              />
            </div>

            <div>
              <label className="block mb-1 text-foreground">Rate *</label>
              <input
                {...register(`items.${index}.rate`, {
                  valueAsNumber: true,
                })}
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
              />
            </div>

            <div className="flex items-end">
              <div className="flex-1">
                <label className="block mb-1 text-foreground">Amount</label>
                <input
                  {...register(`items.${index}.amount`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  readOnly
                  className="w-full border border-border rounded px-3 py-2 bg-gray-100 text-foreground"
                />
              </div>
              {watch("items")?.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="ml-2 p-2 text-red-600 hover:bg-red-100 rounded"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}

        {errors.items && (
          <p className="text-red-500 text-sm">{errors.items.message}</p>
        )}
      </div>

      {/* Totals Section */}
      <div className="space-y-4 bg-gray-50 p-4 rounded">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-foreground">Tax Rate (%)</label>
            <input
              {...register("tax_rate", { valueAsNumber: true })}
              type="number"
              min="0"
              max="100"
              className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
            />
          </div>

          <div>
            <label className="block mb-1 text-foreground">Discount Type</label>
            <select
              {...register("discount_type")}
              className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-foreground">
              Discount {watch("discount_type") === "percentage" ? "(%)" : `(${watch("currency")})`}
            </label>
            <input
              {...register("discount_value", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-border rounded px-3 py-2 bg-input text-foreground"
            />
          </div>
        </div>

        {/* Calculated Totals Display */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{watch("currency")} {watch("subtotal")?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{watch("currency")} {watch("discount_amount")?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{watch("currency")} {watch("tax_amount")?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>{watch("currency")} {watch("total_amount")?.toFixed(2) || "0.00"}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Invoice"}
        </button>
        
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default InvoiceForm;
