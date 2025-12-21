
import { GoogleGenAI } from "@google/genai";
import { AppData } from "./types";

export const generateSchoolReport = async (data: AppData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const stats = {
    totalStudents: data.students.length,
    paidStudents: data.students.filter(s => (s.paidMonths || []).includes(currentMonth)).length,
    totalIncomeMonth: data.transactions
      .filter(t => t.type === 'INCOME' && t.date.startsWith(currentMonth))
      .reduce((acc, t) => acc + t.amount, 0),
    totalExpensesMonth: data.transactions
      .filter(t => t.type === 'EXPENSE' && t.date.startsWith(currentMonth))
      .reduce((acc, t) => acc + t.amount, 0),
    pettyCash: data.pettyCashBalance,
    lowStockItems: data.products.filter(p => p.stock < 5).length
  };

  const prompt = `Como consultor experto en gestión deportiva, analiza estos datos de la escuela de fútbol "${data.school.name}":
  - Estudiantes: ${stats.totalStudents} (${stats.paidStudents} han pagado este mes).
  - Ingresos este mes: ${stats.totalIncomeMonth} COP.
  - Gastos este mes: ${stats.totalExpensesMonth} COP.
  - Saldo en Caja Física: ${stats.pettyCash} COP.
  - Inventario: ${stats.lowStockItems} productos con stock bajo.
  
  Genera un informe ejecutivo conciso dividido en:
  1. ESTATUS FINANCIERO: (Analiza flujo de caja y rentabilidad).
  2. NIVEL DE RECAUDO: (Análisis de morosidad y recomendaciones).
  3. GESTIÓN OPERATIVA: (Recomendaciones de inventario y personal).
  Usa un tono profesional y motivador.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Error al conectar con la inteligencia artificial. Verifique su API Key.";
  }
};

export const generateTrainingPlan = async (category: string, objective: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Actúa como un Director Técnico profesional nivel UEFA Pro. Diseña un plan de entrenamiento detallado para la categoría ${category}. 
  OBJETIVO DE LA SESIÓN: ${objective}.
  
  Incluye:
  - Calentamiento Dinámico (15 min).
  - Bloque Técnico: 2 ejercicios con variantes.
  - Bloque Táctico: Aplicación al juego real.
  - Vuelta a la calma y Feedback.
  
  Usa formato Markdown con viñetas y negritas para resaltar conceptos clave.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 2000 } }
    });
    return response.text;
  } catch (error) {
    console.error("AI Training Error:", error);
    return "No se pudo generar el plan en este momento.";
  }
};
