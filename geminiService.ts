
import { GoogleGenAI } from "@google/genai";
import { AppData } from "./types";

// Moved the GoogleGenAI instance creation inside the functions to ensure 
// it always uses the most up-to-date API key from the environment.

export const generateSchoolReport = async (data: AppData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const stats = {
    totalStudents: data.students.length,
    inMora: data.students.filter(s => s.paymentStatus === 'IN_ARREARS').length,
    totalIncome: data.transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0),
    totalExpenses: data.transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0),
  };

  const prompt = `Actúa como un experto en gestión deportiva. Analiza los siguientes datos de una escuela de fútbol y genera un informe ejecutivo corto (máximo 300 palabras) en español con recomendaciones estratégicas.
  
  Datos Actuales:
  - Estudiantes totales: ${stats.totalStudents}
  - Estudiantes en mora: ${stats.inMora}
  - Ingresos totales: ${stats.totalIncome}
  - Gastos totales: ${stats.totalExpenses}
  - Saldo Caja Menor: ${data.pettyCashBalance}
  
  Estructura del informe:
  1. Estado Financiero
  2. Gestión de Alumnos
  3. Recomendaciones`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating report:", error);
    return "No se pudo generar el informe.";
  }
};

export const generateTrainingPlan = async (category: string, objective: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Eres un entrenador de fútbol profesional con licencia UEFA Pro. 
  Crea un plan de entrenamiento detallado para la categoría ${category} con el objetivo de: "${objective}".
  
  El plan debe incluir:
  1. Calentamiento (15 min)
  2. Parte Principal - 3 ejercicios técnicos/tácticos progresivos (45 min)
  3. Vuelta a la calma y estiramientos (10 min)
  4. Consejos específicos para la edad.
  
  Usa un tono motivador y profesional. Responde en formato Markdown limpio.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating plan:", error);
    return "Error al generar el plan de entrenamiento.";
  }
};
