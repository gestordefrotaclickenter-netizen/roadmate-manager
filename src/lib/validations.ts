import { z } from "zod";

// Shared field helpers
const requiredText = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} é obrigatório` })
    .max(max, { message: `${label} deve ter no máximo ${max} caracteres` });

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, { message: `Deve ter no máximo ${max} caracteres` })
    .optional()
    .or(z.literal(""));

// Drivers
export const driverSchema = z.object({
  name: requiredText("Nome", 100),
  license_number: requiredText("CNH", 30),
  license_category: requiredText("Categoria", 10),
  phone: z
    .string()
    .trim()
    .max(20, { message: "Telefone deve ter no máximo 20 caracteres" })
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(255, { message: "Email deve ter no máximo 255 caracteres" })
    .email({ message: "Email inválido" })
    .optional()
    .or(z.literal("")),
  status: z.enum(["active", "inactive"], { message: "Status inválido" }),
});

// Vehicles
export const vehicleSchema = z.object({
  plate: requiredText("Placa", 10),
  brand: requiredText("Marca", 50),
  model: requiredText("Modelo", 50),
  color: optionalText(30),
  year: z
    .number({ message: "Ano inválido" })
    .int()
    .min(1900, { message: "Ano inválido" })
    .max(new Date().getFullYear() + 1, { message: "Ano inválido" }),
  odometer: z
    .number({ message: "Odômetro inválido" })
    .int()
    .min(0, { message: "Odômetro não pode ser negativo" })
    .max(10000000, { message: "Odômetro inválido" }),
  status: requiredText("Status", 20),
});

// Maintenances
export const maintenanceSchema = z.object({
  maintenance_type: requiredText("Tipo", 50),
  description: optionalText(1000),
  cost: z
    .number({ message: "Custo inválido" })
    .min(0, { message: "Custo não pode ser negativo" })
    .max(100000000, { message: "Custo inválido" }),
  odometer: z
    .number({ message: "Odômetro inválido" })
    .int()
    .min(0, { message: "Odômetro não pode ser negativo" })
    .max(10000000, { message: "Odômetro inválido" })
    .optional()
    .nullable(),
  vehicle_id: requiredText("Veículo", 100),
  maintenance_date: requiredText("Data", 30),
});

// Refuelings
export const refuelingSchema = z.object({
  fuel_type: requiredText("Tipo de combustível", 30),
  liters: z
    .number({ message: "Litros inválido" })
    .min(0, { message: "Litros não pode ser negativo" })
    .max(100000, { message: "Litros inválido" }),
  cost: z
    .number({ message: "Custo inválido" })
    .min(0, { message: "Custo não pode ser negativo" })
    .max(100000000, { message: "Custo inválido" }),
  odometer: z
    .number({ message: "Odômetro inválido" })
    .int()
    .min(0, { message: "Odômetro não pode ser negativo" })
    .max(10000000, { message: "Odômetro inválido" }),
  vehicle_id: requiredText("Veículo", 100),
  refuel_date: requiredText("Data", 30),
});

// Tires
export const tireSchema = z.object({
  vehicle_id: requiredText("Veículo", 100),
  brand: optionalText(50),
  position: requiredText("Posição", 30),
  change_date: requiredText("Data da troca", 30),
  install_odometer: z
    .number({ message: "Km de instalação inválido" })
    .int()
    .min(0, { message: "Km de instalação não pode ser negativo" })
    .max(10000000, { message: "Km de instalação inválido" }),
  removal_odometer: z
    .number({ message: "Km de remoção inválido" })
    .int()
    .min(0, { message: "Km de remoção não pode ser negativo" })
    .max(10000000, { message: "Km de remoção inválido" })
    .optional()
    .nullable(),
  purchase_price: z
    .number({ message: "Preço inválido" })
    .min(0, { message: "Preço não pode ser negativo" })
    .max(100000000, { message: "Preço inválido" }),
});

// Checklists
export const checklistSchema = z.object({
  title: requiredText("Título", 150),
  description: optionalText(1000),
});

export const checklistItemSchema = z.object({
  item_text: requiredText("Item", 300),
});

export function getZodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos";
}
