import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
 
@Injectable({ providedIn: 'root' })
export class ChatbotService {
  constructor(private http: HttpClient) {}
 
  sendMessage(message: string) {
    return this.http.post<{ reply: string }>('http://localhost:5172/api/Chatbot/send', { message });
  }
 
}