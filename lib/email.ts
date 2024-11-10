import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type BudgetItem = {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  recurrence: string;
};

export async function sendRecurringBudgetEmail(
  userEmail: string,
  items: BudgetItem[]
) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(amount);
  };

  const itemsList = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">IDR ${formatAmount(
          item.amount
        )}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${
          item.type === 'income' 
            ? '<span style="color: #16a34a;">Income</span>' 
            : '<span style="color: #dc2626;">Expense</span>'
        }</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.category}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.recurrence}</td>
      </tr>
    `
    )
    .join('');

  const totalAmount = items.reduce((sum, item) => {
    return item.type === 'income' ? sum + item.amount : sum - item.amount;
  }, 0);

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Recurring Budget Items Added</h2>
      <p>The following recurring budget items have been automatically added to your budget:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; border: 1px solid #ddd;">Name</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Amount</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Type</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Category</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Recurrence</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>

      <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
        <p style="margin: 0; font-weight: bold;">
          Net Impact: 
          <span style="color: ${totalAmount >= 0 ? '#16a34a' : '#dc2626'}">
            IDR ${formatAmount(Math.abs(totalAmount))}
            ${totalAmount >= 0 ? '(Positive)' : '(Negative)'}
          </span>
        </p>
      </div>

      <p style="margin-top: 20px; color: #666;">
        This is an automated notification from your budget management system.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'Personal Budget <noreply@personalbudget.com>',
      to: userEmail,
      subject: 'New Recurring Budget Items Added',
      html: emailHtml,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}
