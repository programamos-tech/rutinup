import { Payment, Client, Membership, MembershipType, Gym } from '@/types';
import { format } from 'date-fns';

interface ReceiptData {
  payment: Payment;
  client: Client;
  membership?: Membership;
  membershipType?: MembershipType;
  gym: Gym;
}

export async function generateReceiptPDF(data: ReceiptData): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const { payment, client, membership, membershipType, gym } = data;
  
  // Dynamic import to avoid SSR issues - using string literal to prevent static analysis
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(gym.name, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  if (gym.address) {
    doc.text(gym.address, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }
  if (gym.phone) {
    doc.text(`Tel: ${gym.phone}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }
  if (gym.email) {
    doc.text(gym.email, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  }

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Payment details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const leftCol = margin;
  const rightCol = pageWidth - margin - 60;

  // Client info
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(client.name, leftCol + 30, yPos);
  yPos += 7;

  if (client.documentId) {
    doc.setFont('helvetica', 'bold');
    doc.text('Cédula:', leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(client.documentId, leftCol + 30, yPos);
    yPos += 7;
  }

  if (client.phone) {
    doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(client.phone, leftCol + 30, yPos);
    yPos += 7;
  }

  yPos += 5;

  // Payment info
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de pago:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(payment.paymentDate), 'dd/MM/yyyy'), leftCol + 40, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Referencia:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(payment.id.substring(0, 12).toUpperCase(), leftCol + 40, yPos);
  yPos += 7;

  if (membershipType) {
    doc.setFont('helvetica', 'bold');
    doc.text('Membresía:', leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(membershipType.name, leftCol + 35, yPos);
    yPos += 7;

    if (membership) {
      doc.setFont('helvetica', 'bold');
      doc.text('Vigencia:', leftCol, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${format(new Date(membership.startDate), 'dd/MM/yyyy')} - ${format(new Date(membership.endDate), 'dd/MM/yyyy')}`,
        leftCol + 35,
        yPos
      );
      yPos += 7;
    }
  }

  yPos += 5;

  // Payment method
  const methodNames: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
    other: 'Otro',
  };

  doc.setFont('helvetica', 'bold');
  doc.text('Método de pago:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(methodNames[payment.method] || payment.method, leftCol + 45, yPos);
  yPos += 10;

  // Amount
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTO PAGADO:', leftCol, yPos);
  doc.setFontSize(18);
  doc.text(`$${payment.amount.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 15;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Comprobante generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 15,
    { align: 'center' }
  );

  // Save PDF
  const fileName = `comprobante_${payment.id.substring(0, 8)}_${format(new Date(payment.paymentDate), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
}

export function generateWhatsAppMessage(data: ReceiptData): string {
  const { payment, client, membershipType, gym } = data;
  
  const methodNames: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
    other: 'Otro',
  };

  let message = `Hola ${client.name.split(' ')[0]},\n\n`;
  message += `Tu pago de *$${payment.amount.toLocaleString()}* por ${membershipType?.name || 'membresía'} ha sido registrado exitosamente.\n\n`;
  message += `📅 Fecha: ${format(new Date(payment.paymentDate), 'dd/MM/yyyy')}\n`;
  message += `💳 Método: ${methodNames[payment.method] || payment.method}\n`;
  message += `🔖 Referencia: ${payment.id.substring(0, 12).toUpperCase()}\n\n`;
  message += `Adjunto encontrarás tu comprobante de pago.\n\n`;
  message += `¡Gracias por confiar en ${gym.name}! 💪`;

  return message;
}

export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}

