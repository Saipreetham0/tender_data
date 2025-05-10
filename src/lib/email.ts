// src/lib/email.ts
import { Resend } from 'resend';
import { Tender } from './types';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Recipients for tender notifications
const notificationRecipients = (process.env.NOTIFICATION_EMAILS || '').split(',').filter(Boolean);

// Function to send email notifications for new tenders
export async function sendNewTenderNotifications(
  newTenders: Tender[],
  source: string
): Promise<void> {
  if (newTenders.length === 0 || notificationRecipients.length === 0) {
    return;
  }

  try {
    // Create HTML content for the email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Tenders Notification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #3b82f6;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 20px;
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background-color: #f3f4f6;
              padding: 10px;
              text-align: left;
              border: 1px solid #d1d5db;
            }
            td {
              padding: 10px;
              border: 1px solid #d1d5db;
            }
            .link {
              color: #3b82f6;
              text-decoration: none;
            }
            .link:hover {
              text-decoration: underline;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Tenders Published - ${source}</h1>
            </div>
            <div class="content">
              <p>The following ${newTenders.length} new tender(s) have been published:</p>
              <table>
                <tr>
                  <th>Tender Name</th>
                  <th>Posted Date</th>
                  <th>Closing Date</th>
                  <th>Links</th>
                </tr>
                ${newTenders.map(tender => `
                  <tr>
                    <td>${tender.name}</td>
                    <td>${tender.postedDate}</td>
                    <td>${tender.closingDate || 'Not specified'}</td>
                    <td>
                      ${tender.downloadLinks.map(link =>
                        `<a href="${link.url}" target="_blank" class="link">${link.text}</a><br/>`
                      ).join('')}
                    </td>
                  </tr>
                `).join('')}
              </table>
              <p>Be sure to review these tenders promptly, especially if the closing date is approaching.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from the RGUKT Tenders Portal. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: `RGUKT Tenders <${process.env.RESEND_FROM_EMAIL || 'notifications@resend.dev'}>`,
      to: notificationRecipients,
      subject: `🔔 New Tenders Published - ${source} (${newTenders.length})`,
      html: htmlContent,
    });

    if (error) {
      console.error('Error sending email with Resend:', error);
      return;
    }

    console.log(`Email notification sent successfully for ${newTenders.length} new tenders from ${source}. Email ID: ${data?.id}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
    // We don't throw here, as we don't want to stop the process if email fails
  }
}