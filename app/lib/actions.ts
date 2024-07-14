'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// schema will validate the formData before saving it to a database
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),              
    status: z.enum(['pending', 'paid']),
    date: z.string(),
})


// Use Zod to create the expected types
const CreateInvoice = FormSchema.omit({ id: true, date: true });

// Create Invoice
export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({            //pass your rawFormData to CreateInvoice to validate the types
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100;         // storing values in cents
    const date = new Date().toISOString().split('T')[0];        // create new dates: format "YYYY-MM-DD"
    
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    revalidatePath('/dashboard/invoices');      // once the database has been updated, the /dashboard/invoices path will be revalidated, and fresh data will be fetched from the server
    redirect('/dashboard/invoices');        // redirect the user back to the /dashboard/invoices
    
    // const rawFormData = {
    //     customerId: formData.get('customerId'),
    //     amount: formData.get('amount'),
    //     status: formData.get('status'),
    // };
    // const rawFormData = Object.fromEntries(formData.entries());  // same result with the above
    // console.log(typeof rawFormData.amount);
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// Update Invoice
export async function updateInvoice(id:string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

// Delete Invoice
export async function deleteInvoice(id:string) {
    await sql`
    DELETE FROM invoices
    WHERE id = ${id}
    `;
    revalidatePath('/dashboard/invoices');
}
