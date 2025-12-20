
import { GoogleGenAI } from "@google/genai";
import { AppData } from "./types";

export const generateSchoolReport = async (data: AppData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const stats = {
    totalStudents: data.students.length,
    inMora: data.students.filter(s => s.paymentStatus === 'IN_ARREARS').length,
    totalIncomeMonth: data.transactions
      .filter(t => t.type === 'INCOME' && t.date.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((acc, t) => acc + t.amount, 0),
    inventoryValue: data.products.reduce((acc, p) => acc + (p.stock * p.buyPrice), 0),
  };

  const prompt = `Analiza los datos de esta escuela de fútbol:
  - Estudiantes: ${stats.totalStudents} (${stats.inMora} en mora).
  - Ingresos este mes: ${stats.totalIncomeMonth} COP.
  - Saldo Caja: ${data.pettyCashBalance} COP.
  - Valor Inventario: ${stats.inventoryValue} COP.
  
  Genera un informe corto con:
  1. Salud Financiera (Basado en caja e ingresos).
  2. Alerta de Morosidad.
  3. Sugerencia de Venta de Inventario.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Error al conectar con la IA.";
  }
};

export const generateTrainingPlan = async (category: string, objective: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Plan de entrenamiento para categoría ${category}. Objetivo: ${objective}. 
  Estructura: Calentamiento, Parte Principal (3 ejercicios), Vuelta a la calma. Formato Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 2000 } }
    });
    return response.text;
  } catch (error) {
    return "Error generando entrenamiento.";
  }
};
