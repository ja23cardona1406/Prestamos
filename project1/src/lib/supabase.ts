import { createClient } from '@supabase/supabase-js';
import type { Database, FileEvidence, Loan } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Función para obtener URL firmada (signed URL) como fallback
async function getSignedUrl(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('imagenes')
      .createSignedUrl(filePath, 3600); // URL válida por 1 hora

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return null;
  }
}

// Función para verificar si una URL de imagen es accesible
async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error verifying image URL:', error);
    return false;
  }
}

// Función mejorada para obtener URL pública con fallback a signed URL
async function getAccessibleImageUrl(filePath: string): Promise<string | null> {
  try {
    // Primero intentar URL pública
    const { data: publicUrlData } = supabase.storage
      .from('imagenes')
      .getPublicUrl(filePath);

    if (publicUrlData?.publicUrl) {
      // Verificar si la URL pública es accesible
      const isAccessible = await verifyImageUrl(publicUrlData.publicUrl);
      if (isAccessible) {
        return publicUrlData.publicUrl;
      }
      
      console.warn('Public URL not accessible, trying signed URL:', publicUrlData.publicUrl);
    }

    // Si la URL pública no funciona, usar signed URL
    const signedUrl = await getSignedUrl(filePath);
    if (signedUrl) {
      const isSignedAccessible = await verifyImageUrl(signedUrl);
      if (isSignedAccessible) {
        return signedUrl;
      }
    }

    console.error('Neither public nor signed URL is accessible for:', filePath);
    return null;
  } catch (error) {
    console.error('Error getting accessible image URL:', error);
    return null;
  }
}

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
  
  // Procesar evidencias para asegurar URLs accesibles
  if (data) {
    for (const loan of data) {
      if (loan.fi_1557_evidence && Array.isArray(loan.fi_1557_evidence)) {
        for (const evidence of loan.fi_1557_evidence) {
          if (evidence.url && !evidence.url.startsWith('http')) {
            // Si la URL no es completa, construir el path y obtener URL accesible
            const accessibleUrl = await getAccessibleImageUrl(evidence.url);
            if (accessibleUrl) {
              evidence.url = accessibleUrl;
            }
          }
        }
      }
    }
  }
  
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

    // Verificar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 10MB permitido.');
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
    const sanitizedBorrowerName = loan.borrower_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const serialNumber = loan.equipment?.serial_number?.replace(/[^a-zA-Z0-9]/g, '') || 'unknown';
    
    // Create a folder structure: prestamo_<tipo>_<serial>_<funcionario>
    const equipmentType = loan.equipment?.type || 'equipo';
    const folderName = `prestamo_${equipmentType}_${serialNumber}_${sanitizedBorrowerName}`;
    const fileExtension = file.type.split('/')[1] || 'jpg';
    const fileName = `FI-1557-${timestamp}.${fileExtension}`;
    const filePath = `evidencias/${folderName}/${fileName}`;

    console.log('Uploading file to path:', filePath);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('imagenes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Error al subir el archivo: ${uploadError.message}`);
    }

    console.log('File uploaded successfully:', uploadData);

    // Intentar obtener URL accesible
    let accessibleUrl = await getAccessibleImageUrl(filePath);
    
    if (!accessibleUrl) {
      // Como último recurso, usar la URL pública directa
      const { data: publicUrlData } = supabase.storage
        .from('imagenes')
        .getPublicUrl(filePath);
      
      accessibleUrl = publicUrlData?.publicUrl || null;
    }

    if (!accessibleUrl) {
      throw new Error('No se pudo obtener una URL accesible para la imagen');
    }

    console.log('Accessible URL obtained:', accessibleUrl);

    const evidence: FileEvidence = {
      url: accessibleUrl,
      filename: fileName,
      uploaded_at: new Date().toISOString()
    };

    // Update loan record with evidence
    const { error: updateError } = await supabase
      .from('loans')
      .update({
        fi_1557_evidence: [evidence],
        fi_1557_filled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', loanId);

    if (updateError) {
      console.error('Error updating loan with evidence:', updateError);
      throw new Error(`Error al actualizar el préstamo: ${updateError.message}`);
    }

    console.log('Loan updated successfully with evidence');
    return evidence;
  } catch (error) {
    console.error('Error en uploadFI1557Evidence:', error);
    throw error;
  }
}

// Función para regenerar URLs de evidencias existentes
export async function refreshEvidenceUrls(loanId: string): Promise<void> {
  try {
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select('fi_1557_evidence')
      .eq('id', loanId)
      .single();

    if (loanError || !loan.fi_1557_evidence) return;

    const evidences = Array.isArray(loan.fi_1557_evidence) ? loan.fi_1557_evidence : [];
    const updatedEvidences: FileEvidence[] = [];

    for (const evidence of evidences) {
      if (evidence.url) {
        // Extraer el path del archivo desde la URL
        let filePath = evidence.url;
        
        // Si es una URL completa, extraer solo el path
        if (filePath.includes('/storage/v1/object/public/imagenes/')) {
          filePath = filePath.split('/storage/v1/object/public/imagenes/')[1];
        } else if (filePath.includes('/storage/v1/object/sign/imagenes/')) {
          filePath = filePath.split('/storage/v1/object/sign/imagenes/')[1].split('?')[0];
        }

        // Obtener nueva URL accesible
        const newUrl = await getAccessibleImageUrl(filePath);
        
        updatedEvidences.push({
          ...evidence,
          url: newUrl || evidence.url
        });
      } else {
        updatedEvidences.push(evidence);
      }
    }

    // Actualizar el préstamo con las nuevas URLs
    const { error: updateError } = await supabase
      .from('loans')
      .update({
        fi_1557_evidence: updatedEvidences,
        updated_at: new Date().toISOString()
      })
      .eq('id', loanId);

    if (updateError) {
      console.error('Error updating evidence URLs:', updateError);
    }
  } catch (error) {
    console.error('Error refreshing evidence URLs:', error);
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