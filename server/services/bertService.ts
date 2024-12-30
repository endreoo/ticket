import axios from 'axios';

interface BertApiResponse {
  analysis: {
    booking_info: {
      booking_number: string | null;
      channel: string | null;
      check_in: string | null;
      check_out: string | null;
      guest_email: string | null;
      guest_name: string | null;
      guest_phone: string | null;
      hotel_name: string | null;
      num_adults: number | null;
      num_children: number | null;
      num_nights: number | null;
      payment_status: string | null;
      price: number | null;
      rate_type: string | null;
      room_type: string | null;
    };
    category: string;
    category_confidence: number;
    sentiment: string;
    sentiment_confidence: number;
  };
  email: {
    body: string;
    from_email: string;
    subject: string;
  };
}

export class BertService {
  private readonly apiUrl = 'http://37.27.142.148:5000/api/process_email';

  async analyzeTicket(message: string, subject: string, fromEmail: string): Promise<BertApiResponse> {
    try {
      const response = await axios.post<BertApiResponse>(this.apiUrl, {
        body: message,
        subject: subject,
        from_email: fromEmail
      });

      return response.data;
    } catch (error) {
      console.error('Error calling BERT service:', error);
      throw error;
    }
  }
} 