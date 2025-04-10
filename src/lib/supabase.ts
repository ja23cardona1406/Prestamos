import { createClient } from '@supabase/supabase-js';
import type { Database, FileEvidence, Loan } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function fetchLoans() {
  const { data, error } = await supabase
    .from('loans')
    .select(`
      *,
      equipment:equipment_id (
        id,
        type,
        serial_number,
        model,
        status,
        imagenes
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createLoan(loanData: Omit<Database['public']['Tables']['loans']['Insert'], 'id' | 'created_at' | 'updated_at'> & { fi_1557_evidence?: File | null }) {
  const { fi_1557_evidence: fileEvidence, ...loanDataWithoutFile } = loanData;

  const { data: loan, error } = await supabase
    .from('loans')
    .insert({
      ...loanDataWithoutFile,
      status: 'active',
      user_id: (await supabase.auth.getUser()).data.user?.id,
      fi_1557_evidence: null
    })
    .select(`
      *,
      equipment:equipment_id (
        id,
        type,
        serial_number,
        model,
        status,
        imagenes
      )
    `)
    .single();

  if (error) throw error;

  if (fileEvidence && loan.id) {
    const evidence = await uploadFI1557Evidence(loan.id, fileEvidence);
    return { ...loan, fi_1557_evidence: [evidence] };
  }

  return loan;
}

export async function updateLoan(
  loanId: string, 
  loanData: Partial<Omit<Database['public']['Tables']['loans']['Update'], 'id' | 'created_at'>>
) {
  const { data: updatedLoan, error } = await supabase
    .from('loans')
    .update({
      ...loanData,
      updated_at: new Date().toISOString()
    })
    .eq('id', loanId)
    .select(`
      *,
      equipment:equipment_id (
        id,
        type,
        serial_number,
        model,
        status,
        imagenes
      )
    `)
    .single();

  if (error) throw error;
  return updatedLoan;
}

export async function updateLoanStatus(loanId: string, status: Loan['status'], actualReturnDate?: string) {
  const { data: updatedLoan, error } = await supabase
    .from('loans')
    .update({ 
      status, 
      actual_return_date: actualReturnDate,
      updated_at: new Date().toISOString()
    })
    .eq('id', loanId)
    .select(`
      *,
      equipment:equipment_id (
        id,
        type,
        serial_number,
        model,
        status,
        imagenes
      )
    `)
    .single();

  if (error) throw error;
  return updatedLoan;
}

export async function uploadFI1557Evidence(loanId: string, file: File): Promise<FileEvidence> {
  try {
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    // Get loan and equipment details for the folder name
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select(`
        *,
        equipment:equipment_id (
          serial_number,
          type
        )
      `)
      .eq('id', loanId)
      .single();

    if (loanError) throw loanError;

    const timestamp = new Date().getTime();
    const sanitizedBorrowerName = loan.borrower_name.replace(/\s+/g, '').toLowerCase();
    const serialNumber = loan.equipment?.serial_number || 'unknown';
    
    // Create a folder structure: prestamo_portatil_<serial>_<funcionario>
    const folderName = `prestamo_${loan.equipment?.type || 'equipo'}_${serialNumber}_${sanitizedBorrowerName}`;
    const fileName = `FI-1557-${timestamp}.${file.type.split('/')[1]}`;
    const filePath = `evidencias/${folderName}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('imagenes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('imagenes')
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Error al obtener la URL pública');
    }

    const evidence: FileEvidence = {
      url: publicUrlData.publicUrl,
      filename: fileName,
      uploaded_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('loans')
      .update({
        fi_1557_evidence: [evidence],
        fi_1557_filled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', loanId);

    if (updateError) throw updateError;

    return evidence;
  } catch (error) {
    console.error('Error en uploadFI1557Evidence:', error);
    throw error;
  }
}

export async function fetchEquipment() {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createEquipment(
  equipmentData: Omit<Database['public']['Tables']['equipment']['Insert'], 'id' | 'created_at' | 'updated_at'>
) {
  const defaultStatus = equipmentData.status ?? (
    equipmentData.type === 'desktop' ? 'inactive' : 'available'
  );

  const { data, error } = await supabase
    .from('equipment')
    .insert({
      ...equipmentData,
      status: defaultStatus
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEquipment(
  equipmentId: string,
  equipmentData: Partial<Omit<Database['public']['Tables']['equipment']['Update'], 'id' | 'created_at'>>
) {
  const defaultStatus = equipmentData.status ?? (
    equipmentData.type === 'desktop' ? 'inactive' : 'available'
  );

  const { data, error } = await supabase
    .from('equipment')
    .update({
      ...equipmentData,
      status: defaultStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', equipmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}