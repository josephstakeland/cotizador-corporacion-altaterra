export type Role = "admin" | "asesor";
export type LotStatus = "disponible" | "vendido";

export type Point = { x: number; y: number };

export type Company = {
  id: string;
  name: string;
  ruc: string;
  phone: string;
  logoUrl: string;
};

export type Project = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  logoUrl: string;
  planUrl: string;
};

export type Lot = {
  id: string;
  projectId: string;
  manzana: string;
  numero: number;
  areaM2: number;
  price: number;
  status: LotStatus;
  polygon: Point[] | null;
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

export type QuoteItem = {
  lotId: string;
  manzana: string;
  numero: number;
  areaM2: number;
  price: number;
  discount: number;
};

export type Quote = {
  id: string;
  projectId: string;
  advisorId: string;
  advisorName: string;
  clientName: string;
  clientPhone: string;
  clientDni: string;
  downPayment: number;
  items: QuoteItem[];
  totalList: number;
  totalDiscount: number;
  totalFinal: number;
  balance: number;
  createdAt: string;
};

export type AuthUser = Profile;
