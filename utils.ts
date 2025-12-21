
import { differenceInYears, parseISO } from 'date-fns';

export const calculateBMI = (weight: number, heightCm: number): number => {
  if (!weight || !heightCm) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(2));
};

export const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  return differenceInYears(new Date(), parseISO(dob));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

export const getBMIStatus = (bmi: number): string => {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
};

export const exportToCSV = (filename: string, data: any[]) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => {
      let stringVal = String(val);
      if (typeof val === 'object' && val !== null) stringVal = JSON.stringify(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    }).join(',')
  ).join('\n');
  
  // Agregar BOM para compatibilidad con Excel (UTF-8)
  const csvContent = `\uFEFF${headers}\n${rows}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadCSVTemplate = (type: 'STUDENTS' | 'COACHES' | 'PRODUCTS') => {
  let headers = '';
  let filename = '';

  switch (type) {
    case 'STUDENTS':
      headers = 'firstName,lastName,document,bloodType,weight,height,school,grade,dob,position,category,coachId,fatherName,motherName,phone,address,observations';
      filename = 'Plantilla_Alumnos';
      break;
    case 'COACHES':
      headers = 'firstName,lastName,category,phone,address,baseSalary,entryDate';
      filename = 'Plantilla_Entrenadores';
      break;
    case 'PRODUCTS':
      headers = 'code,description,buyPrice,sellPrice,stock,category';
      filename = 'Plantilla_Productos';
      break;
  }

  const csvContent = `\uFEFF${headers}\n`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];
  
  const headers = lines[0].replace(/^\uFEFF/, '').split(',');
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Regex para manejar valores con comas dentro de comillas
    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const obj: any = {};
    
    headers.forEach((header, index) => {
      let val = values[index] ? values[index].trim() : '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      obj[header.trim()] = val;
    });
    result.push(obj);
  }
  return result;
};

export const printReceipt = (transaction: any, schoolName: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Recibo - ${schoolName}</title>
        <style>
          body { font-family: 'Inter', sans-serif; width: 80mm; margin: 0 auto; padding: 20px; font-size: 11px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
          .title { font-size: 14px; font-weight: 800; color: #10b981; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .total-box { background: #f8fafc; padding: 10px; border-radius: 8px; margin-top: 15px; border: 1px solid #e2e8f0; }
          .total-row { display: flex; justify-content: space-between; font-weight: 800; font-size: 12px; }
          .footer { text-align: center; margin-top: 20px; color: #94a3b8; font-size: 9px; }
          @media print { body { width: 100%; margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${schoolName.toUpperCase()}</div>
          <div style="font-weight: 600; margin-top: 4px;">COMPROBANTE #${String(transaction.orderNumber).padStart(6, '0')}</div>
        </div>
        <div class="info-row"><span>Fecha:</span> <span>${transaction.date}</span></div>
        <div class="info-row"><span>Tipo:</span> <span>${transaction.type === 'INCOME' ? 'INGRESO' : 'EGRESO'}</span></div>
        <div class="info-row"><span>Concepto:</span> <span>${transaction.category || 'Varios'}</span></div>
        <div class="info-row"><span>Método:</span> <span>${transaction.paymentMethod}</span></div>
        <div style="margin: 10px 0; border-top: 1px dashed #eee; padding-top: 10px;">
          <strong>DETALLE:</strong><br/>
          ${transaction.description}
        </div>
        <div class="total-box">
          <div class="total-row"><span>TOTAL:</span> <span>${formatCurrency(transaction.amount)}</span></div>
        </div>
        <div class="footer">
          <p>Gracias por ser parte de nuestra escuela.</p>
          <p>Sistema FutManager Cloud Pro v6.5</p>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

export const printPayrollStub = (record: any, schoolName: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Desprendible Nómina - ${schoolName}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
          .stub-card { border: 2px solid #e2e8f0; border-radius: 24px; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
          .school-name { font-size: 24px; font-weight: 900; color: #10b981; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
          .value { font-size: 14px; font-weight: 600; margin-top: 4px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { text-align: left; padding: 12px; background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #64748b; }
          .table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .net-total { margin-top: 30px; display: flex; justify-content: flex-end; }
          .net-box { background: #0f172a; color: white; padding: 20px 40px; border-radius: 16px; text-align: right; }
          .signature-area { margin-top: 60px; display: flex; gap: 100px; }
          .sig-line { border-top: 1px solid #cbd5e1; width: 200px; margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="stub-card">
          <div class="header">
            <div>
              <div class="school-name">${schoolName}</div>
              <div style="font-weight: 600; color: #64748b; margin-top: 5px;">DESPRENDIBLE DE PAGO DE NÓMINA</div>
            </div>
            <div style="text-align: right;">
              <div class="label">Comprobante</div>
              <div class="value">#${String(record.orderNumber).padStart(6, '0')}</div>
            </div>
          </div>
          
          <div class="grid">
            <div><div class="label">Empleado</div><div class="value">${record.coachName}</div></div>
            <div><div class="label">Periodo</div><div class="value">${record.month}</div></div>
            <div><div class="label">Fecha de Pago</div><div class="value">${record.date}</div></div>
            <div><div class="label">Método</div><div class="value">${record.paymentMethod}</div></div>
          </div>

          <table class="table">
            <thead>
              <tr><th>Descripción</th><th style="text-align: right;">Devengado</th><th style="text-align: right;">Deducido</th></tr>
            </thead>
            <tbody>
              <tr><td>Sueldo Básico Mensual</td><td style="text-align: right;">${formatCurrency(record.baseSalary)}</td><td style="text-align: right;">$0</td></tr>
              <tr><td>Descuentos de Nómina</td><td style="text-align: right;">$0</td><td style="text-align: right; color: #ef4444;">${formatCurrency(record.discounts)}</td></tr>
            </tbody>
          </table>

          <div class="net-total">
            <div class="net-box">
              <div style="font-size: 10px; font-weight: 800; opacity: 0.7; margin-bottom: 5px;">NETO PAGADO</div>
              <div style="font-size: 24px; font-weight: 900;">${formatCurrency(record.netPaid)}</div>
            </div>
          </div>

          <div class="signature-area">
            <div class="sig-line">Firma Empleador</div>
            <div class="sig-line">Firma Empleado</div>
          </div>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

export const printMonthlyReceipt = (record: any, schoolName: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Recibo Mensualidad - ${schoolName}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; }
          .receipt { border: 2px solid #10b981; border-radius: 20px; padding: 30px; position: relative; overflow: hidden; }
          .receipt::before { content: 'PAGADO'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; font-weight: 900; color: #10b98115; pointer-events: none; }
          .header { text-align: center; margin-bottom: 30px; }
          .school-name { font-size: 20px; font-weight: 900; color: #10b981; }
          .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px; }
          .label { color: #64748b; font-weight: 600; }
          .value { font-weight: 700; color: #0f172a; }
          .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; margin-top: 20px; text-align: center; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="school-name">${schoolName.toUpperCase()}</div>
            <div style="font-weight: 700; font-size: 12px; color: #64748b;">RECIBO DE MENSUALIDAD #${String(record.orderNumber).padStart(6, '0')}</div>
          </div>
          
          <div class="row"><span class="label">Alumno:</span><span class="value">${record.studentName}</span></div>
          <div class="row"><span class="label">Mes de Cobertura:</span><span class="value">${record.month}</span></div>
          <div class="row"><span class="label">Fecha de Pago:</span><span class="value">${record.date}</span></div>
          <div class="row"><span class="label">Método:</span><span class="value">${record.paymentMethod}</span></div>
          
          <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 15px;">
            <div class="row"><span class="label">Base Mensual:</span><span class="value">${formatCurrency(record.baseAmount)}</span></div>
            <div class="row"><span class="label">Descuento aplicado:</span><span class="value" style="color: #ef4444;">- ${formatCurrency(record.discount)}</span></div>
          </div>

          <div class="amount-box">
            <div style="font-size: 10px; font-weight: 800; color: #166534; margin-bottom: 4px;">MONTO TOTAL RECIBIDO</div>
            <div style="font-size: 28px; font-weight: 900; color: #166534;">${formatCurrency(record.paidAmount)}</div>
          </div>

          <div class="footer">
            Soporte FutManager Cloud Pro<br/>
            Este documento es un comprobante oficial de pago.<br/>
            © ${new Date().getFullYear()} ${schoolName}
          </div>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};
