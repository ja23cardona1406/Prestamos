import { format, parseISO, parse } from 'date-fns';

/**
 * Convierte una fecha de input (yyyy-MM-dd) a formato ISO para guardar en BD
 * sin problemas de zona horaria
 * 
 * @param dateString Fecha del input en formato yyyy-MM-dd
 * @returns Fecha en formato ISO para la base de datos
 */
export const dateInputToISO = (dateString: string): string => {
  if (!dateString) return '';
  
  // Crear fecha en hora local para evitar cambios de zona horaria
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar cambios de día
  
  return date.toISOString();
};

/**
 * Convierte una fecha ISO de la BD a formato yyyy-MM-dd para inputs
 * 
 * @param isoString Fecha en formato ISO de la base de datos
 * @returns Fecha en formato yyyy-MM-dd para inputs
 */
export const isoToDateInput = (isoString: string): string => {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  return format(date, 'yyyy-MM-dd');
};

/**
 * Formatea una fecha para mostrar al usuario
 * 
 * @param dateString Fecha en formato ISO o yyyy-MM-dd
 * @param formatStr Formato de salida (default: dd/MM/yyyy)
 * @returns Fecha formateada para mostrar
 */
export const formatDisplayDate = (
  dateString: string, 
  formatStr: string = 'dd/MM/yyyy'
): string => {
  if (!dateString) return '';
  
  try {
    // Intentar parsear como ISO primero
    if (dateString.includes('T')) {
      const date = parseISO(dateString);
      return format(date, formatStr);
    }
    
    // Si es formato yyyy-MM-dd, parsearlo correctamente
    const date = parse(dateString, 'yyyy-MM-dd', new Date());
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Crea un objeto Date seguro desde un string
 * 
 * @param dateString Fecha en formato ISO o yyyy-MM-dd
 * @returns Objeto Date
 */
export const createSafeDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  try {
    if (dateString.includes('T')) {
      return parseISO(dateString);
    }
    
    return parse(dateString, 'yyyy-MM-dd', new Date());
  } catch (error) {
    console.error('Error creating date:', error);
    return new Date();
  }
};

/**
 * Obtiene la fecha actual en formato yyyy-MM-dd
 * 
 * @returns Fecha actual en formato yyyy-MM-dd
 */
export const getCurrentDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Verifica si una fecha está vencida (es anterior a hoy)
 * 
 * @param dateString Fecha a verificar
 * @returns true si la fecha está vencida
 */
export const isDateOverdue = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const date = createSafeDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date < today;
};

// Mantener compatibilidad con código existente
export const adjustDateOffset = dateInputToISO;
export const formatDateWithOffset = formatDisplayDate;