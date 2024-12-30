import imaplib
import email
from email.header import decode_header
import datetime

mail = imaplib.IMAP4_SSL('imappro.zoho.com', 993)
mail.login('bookings@hotelonline.co', '5Kmij548t3N5')
mail.select('INBOX')

date = (datetime.date.today()).strftime('%d-%b-%Y')
result, data = mail.search(None, f'(SINCE {date})')
if data[0]:
    latest_email_ids = data[0].split()
    latest_email_id = latest_email_ids[-1]
    result, email_data = mail.fetch(latest_email_id, '(RFC822)')
    email_body = email_data[0][1]
    email_message = email.message_from_bytes(email_body)
    subject = decode_header(email_message['subject'])[0][0]
    if isinstance(subject, bytes):
        subject = subject.decode()
    from_addr = email_message['from']
    date = email_message['date']
    print(f'Latest email:\nFrom: {from_addr}\nSubject: {subject}\nDate: {date}')
    print(f'\nTotal new emails today: {len(latest_email_ids)}') 