import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'Revel Baby <noreply@revel.baby>';

/**
 * Send a co-owner invitation email
 */
export async function sendOwnerInvitation({ toEmail, babyName, inviterName, token }) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `You've been invited to manage ${babyName} on Revel Baby!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #a855f7, #ec4899, #ef4444); padding: 30px; border-radius: 16px; text-align: center; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px;">Revel Baby</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">You're invited!</p>
        </div>
        <div style="padding: 30px 0;">
          <p style="font-size: 16px; color: #333;">Hi there!</p>
          <p style="font-size: 16px; color: #333;">
            <strong>${inviterName || 'Someone special'}</strong> has invited you to co-manage the baby page for 
            <strong>${babyName}</strong> on Revel Baby.
          </p>
          <p style="font-size: 16px; color: #333;">
            As a co-owner, you'll be able to manage the gift registry, pregnancy tracker, and birth date betting pool together.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" 
               style="background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size: 14px; color: #999; text-align: center;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('Error sending invitation email:', error);
    throw new Error('Failed to send invitation email');
  }

  return data;
}

/**
 * Send a bet notification to owners (new bet placed, needs approval)
 */
export async function sendBetNotification({ ownerEmails, babyName, betterName, betDate, babyId }) {
  const manageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/baby/${babyId}/bets`;

  const promises = ownerEmails.map((email) =>
    resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New bet placed for ${babyName}'s birth date!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #22c55e, #eab308, #10b981); padding: 30px; border-radius: 16px; text-align: center; color: white;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">New Bet!</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">${babyName}</p>
          </div>
          <div style="padding: 30px 0;">
            <p style="font-size: 16px; color: #333;">
              <strong>${betterName}</strong> has placed a bet on 
              <strong>${new Date(betDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> 
              for ${babyName}'s birth date.
            </p>
            <p style="font-size: 16px; color: #333;">
              Please review and approve the bet once you've confirmed payment.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${manageUrl}" 
                 style="background: linear-gradient(135deg, #22c55e, #10b981); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                Review Bets
              </a>
            </div>
          </div>
        </div>
      `,
    })
  );

  const results = await Promise.allSettled(promises);
  const errors = results.filter((r) => r.status === 'rejected');
  if (errors.length > 0) {
    console.error('Some bet notification emails failed:', errors);
  }

  return results;
}

/**
 * Send bet approval/rejection notification to the bettor
 */
export async function sendBetApproval({ toEmail, babyName, betDate, approved }) {
  const status = approved ? 'approved' : 'declined';
  const color = approved ? '#22c55e' : '#ef4444';

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Your bet for ${babyName} has been ${status}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${color}; padding: 30px; border-radius: 16px; text-align: center; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px;">Bet ${approved ? 'Approved!' : 'Declined'}</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">${babyName}</p>
        </div>
        <div style="padding: 30px 0;">
          <p style="font-size: 16px; color: #333;">
            Your bet on <strong>${new Date(betDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> 
            for ${babyName}'s birth date has been <strong>${status}</strong> by the parents.
          </p>
          ${approved 
            ? '<p style="font-size: 16px; color: #333;">Your bet is now visible on the calendar. Good luck!</p>' 
            : '<p style="font-size: 16px; color: #333;">Please contact the parents if you have any questions.</p>'}
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('Error sending bet approval email:', error);
  }

  return data;
}
