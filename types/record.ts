export interface EmployeeRef {
  id: string;
  employeeId: string;
  name: string;
  role: string;
}

export interface EmployeeAssignment {
  employee: EmployeeRef;
  splitCount: number;
}

export interface ProductionRecord {
  id: string;
  status: "PENDING" | "COMPLETED";
  dronaSupervisor: string;
  shift: string;
  date: string | null;
  inTime: string | null;
  outTime: string | null;
  binNo: string;
  modelNo: string;
  chassisNo: string;
  type: string;
  electrician: number;
  fitter: number;
  painter: number;
  helper: number;
  productionInchargeFromVBCL?: string | null;
  remarks?: string | null;
  employeeAssignments?: EmployeeAssignment[];
  srNoVehicleCount?: number | null;
  updatedAt: string;
  createdAt: string;
}
