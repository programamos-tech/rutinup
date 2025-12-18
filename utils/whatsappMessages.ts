import { Class, Client, Trainer } from '@/types';
import { format } from 'date-fns';

export function generateClassReminderMessage(
  classItem: Class,
  client: Client,
  trainer: Trainer | undefined,
  classDate: Date
): string {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[classDate.getDay()];
  const today = new Date();
  const isTomorrow = classDate.getDate() === today.getDate() + 1 && 
                     classDate.getMonth() === today.getMonth() &&
                     classDate.getFullYear() === today.getFullYear();
  
  let message = `Hola ${client.name.split(' ')[0]},\n\n`;
  message += `📅 *Recordatorio de Clase*\n\n`;
  message += `Tienes clase de *${classItem.name}* ${isTomorrow ? 'mañana' : `el ${dayName}`} (${format(classDate, 'dd/MM/yyyy')}) a las ${classItem.startTime}.\n\n`;
  
  if (trainer) {
    message += `Entrenador: ${trainer.name}\n`;
  }
  
  if (classItem.description) {
    message += `\n${classItem.description}\n`;
  }
  
  message += `\n¡Te esperamos! 💪`;
  
  return message;
}

export function generateClassCancellationMessage(
  classItem: Class,
  client: Client,
  trainer: Trainer | undefined,
  classDate: Date,
  reason?: string
): string {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[classDate.getDay()];
  
  let message = `Hola ${client.name.split(' ')[0]},\n\n`;
  message += `⚠️ *Cancelación de Clase*\n\n`;
  message += `Lamentamos informarte que la clase de *${classItem.name}* del ${dayName} ${format(classDate, 'dd/MM/yyyy')} a las ${classItem.startTime} ha sido cancelada.\n\n`;
  
  if (reason) {
    message += `Motivo: ${reason}\n\n`;
  }
  
  message += `Te notificaremos cuando se reprograme o cuando haya nuevas clases disponibles.\n\n`;
  message += `Disculpa las molestias. 🙏`;
  
  return message;
}

export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}

