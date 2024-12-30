import axios from 'axios';

// BERT service endpoint
const BERT_URL = 'http://37.27.142.148:5000/process_email';

async function testBert() {
  try {
    // Test email data
    const testEmail = {
      subject: "New Booking Notification < Mizingani Seafront Hotel > - Booking Ref No: [ MISH6768 ]",
      text: `Dear Hotel Partner,

We are pleased to inform you that you have received a new booking. Please find the booking details below:

Hotel: Mizingani Seafront Hotel
Guest Name: John Smith
Check-in: 2024-01-15
Check-out: 2024-01-20
Room Type: Deluxe Ocean View
Number of Rooms: 1
Number of Guests: 2
Total Amount: USD 750

Please confirm this booking as soon as possible.

Best regards,
Booking Team`,
      from_email: "bookings@hotelonline.co"
    };

    // Combine fields into a single email string in standard email format
    const emailContent = `Subject: ${testEmail.subject}\nFrom: ${testEmail.from_email}\nBody: ${testEmail.text}`;
    
    // Format request data as expected by the API
    const requestData = {
      email: emailContent
    };

    console.log('Sending test request to BERT service...');
    console.log('Test data:', JSON.stringify(requestData, null, 2));

    // Send POST request to BERT service
    const response = await axios.post(BERT_URL, requestData);
    
    console.log('\nBERT Analysis Results:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error calling BERT service:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } else {
      console.error('Error:', error);
    }
  }
}

// Run if called directly
if (require.main === module) {
  testBert()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
} 