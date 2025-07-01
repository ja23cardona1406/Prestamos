export type User = {
  id: string;
  email: string;
  role: 'super_user' | 'viewer';
  created_at: string;
};

export type EquipmentType = 'laptop' | 'printer' | 'desktop';

export type EquipmentStatus = 'available' | 'loaned' | 'maintenance' | 'lost' | 'damaged' | 'inactive' | 'unavailable';

export type Equipment = {
  id: string;
  type: EquipmentType;
  serial_number: string;
  model: string;
  status: EquipmentStatus;
  created_at: string;
  updated_at: string;
  imagenes: string[];
};

export type FileEvidence = {
  url: string;
  filename: string;
  uploaded_at?: string;
};

export type Loan = {
  id: string;
  equipment_id: string;
  user_id: string;
  borrower_name: string;
  borrower_department: string;
  start_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  status: 'active' | 'returned' | 'delayed' | 'lost' | 'damaged';
  accessories: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  equipment?: Equipment;
  fi_1557_filled: boolean;
  fi_1557_evidence: FileEvidence[] | null;
};

export interface CreateLoanData {
  borrower_name: string;
  borrower_department: string;
  equipment_id: string;
  start_date: string;
  expected_return_date: string;
  accessories: string[];
  notes: string;
  status: 'active';
  fi_1557_filled: boolean;
  fi_1557_evidence?: File;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      equipment: {
        Row: Equipment;
        Insert: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Equipment, 'id' | 'created_at'>>;
      };
      loans: {
        Row: Loan;
        Insert: Omit<Loan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Loan, 'id' | 'created_at'>>;
      };
    };
  };
};