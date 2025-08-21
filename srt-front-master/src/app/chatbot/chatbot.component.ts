import { Component,NgZone} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatbotService } from '../services/chatbot.service';
 
 
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
 
export class ChatbotComponent {
  userInput = '';
  messages: { from: 'user' | 'bot'; text: string }[] = [];
  isOpen = false;
  isTyping = false;
  recognition: any; 
  isListening = false;
  toggleChat() {
    this.isOpen = !this.isOpen;
  }
 
 
  constructor(private chatbotService: ChatbotService,private zone:NgZone) {}
  ngOnInit() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
 
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Run inside Angular zone to update bindings
        this.zone.run(() => {
          this.userInput = transcript;
          this.isListening = false;
          this.sendMessage();
        });
      };
 
      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        this.zone.run(() => {
          this.isListening = false;
        });
      };
 
      this.recognition.onend = () => {
        this.zone.run(() => {
          this.isListening = false;
        });
      };
    }
  }
 
  startListening() {
    if (!this.recognition) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }
    this.isListening = true;
    this.recognition.start();
  }
 
  speak(text: string) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }
   
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Change if needed
    window.speechSynthesis.speak(utterance);
  }
 
  sendMessage() {
    if (!this.userInput.trim()) return;
 
    const message = this.userInput;
    this.messages.push({ from: 'user', text: message });
    console.log('User message pushed:', this.messages);
 
    this.userInput = '';
    this.isTyping = true;
 
    this.chatbotService.sendMessage(message).subscribe({
      next: (res: { reply: string }) => {
        console.log('Bot reply:', res);
 
        setTimeout(() => {
          this.isTyping = false;
          this.messages.push({ from: 'bot', text: res.reply });
          this.speak(res.reply);  
          setTimeout(() => this.scrollToBottom(), 100);
        }, 1000); // simulate delay for typing effect
      },
      error: (err) => {
        console.error('Chatbot API error:', err);
        this.isTyping = false;
        this.messages.push({ from: 'bot', text: 'Error communicating with chatbot.' });
        this.speak(err);  
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }
 
  scrollToBottom() {
    const container = document.querySelector('.chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }  
 
}
 
 