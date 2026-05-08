import { Router, Request, Response } from 'express';

const contactRouter = Router();

contactRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body as {
      name: string; email: string; subject?: string; message: string;
    };

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const apiKey = process.env.ORIA_CONTACT_FORM;
    if (!apiKey) throw new Error('Brevo API key not configured');

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'Oria Contact Form', email: 'support@oriacompass.com' },
        to: [{ email: 'support@oriacompass.com', name: 'Oria Support' }],
        replyTo: { email, name },
        subject: subject ? `[Oria Contact] ${subject}` : `[Oria Contact] Message from ${name}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C9A84C;">New message from Oria Contact Form</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold; color: #555;">Name</td><td style="padding: 8px;">${name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #555;">Email</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
              ${subject ? `<tr><td style="padding: 8px; font-weight: bold; color: #555;">Subject</td><td style="padding: 8px;">${subject}</td></tr>` : ''}
            </table>
            <div style="margin-top: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
              <p style="font-weight: bold; color: #555; margin: 0 0 8px;">Message</p>
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json() as { message?: string };
      throw new Error(JSON.stringify(err));
    }

    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Contact form error:', message);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

export default contactRouter;
