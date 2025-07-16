export const validatePeppolId = (peppolId: string): boolean => {
  // Peppol ID format: iso6523-actorid-upis::scheme::value
  // Example: iso6523-actorid-upis::0088::5790000436057
  const peppolRegex = /^iso6523-actorid-upis::[0-9]{4}::[0-9A-Za-z]+$/;
  return peppolRegex.test(peppolId);
};

export const validateVatNumber = (vatNumber: string, countryCode: string = 'NL'): boolean => {
  // Remove spaces and convert to uppercase
  const cleanVat = vatNumber.replace(/\s/g, '').toUpperCase();
  
  // Dutch VAT number validation (NL + 9 digits + B + 2 digits)
  if (countryCode === 'NL') {
    const nlVatRegex = /^NL[0-9]{9}B[0-9]{2}$/;
    return nlVatRegex.test(cleanVat);
  }
  
  // Basic EU VAT format validation (2 letters + alphanumeric)
  const euVatRegex = /^[A-Z]{2}[0-9A-Z]+$/;
  return euVatRegex.test(cleanVat) && cleanVat.length >= 8 && cleanVat.length <= 15;
};

export const formatVatNumber = (vatNumber: string): string => {
  // Remove spaces and convert to uppercase
  return vatNumber.replace(/\s/g, '').toUpperCase();
};

export const formatPeppolId = (peppolId: string): string => {
  // Basic formatting - remove extra spaces
  return peppolId.trim();
};