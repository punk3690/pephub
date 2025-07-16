import { HubSpotCompany } from '@/types/hubspot';
import { recommandService } from './recommandService';

export interface PeppolLookupResult {
  peppolId?: string;
  found: boolean;
  source: 'hubspot' | 'peppol_directory' | 'recommand_api';
  confidence: 'high' | 'medium' | 'low';
  metadata?: {
    vatNumber?: string;
    registrationNumber?: string;
    companyName?: string;
    country?: string;
  };
}

export interface PeppolDirectorySearchParams {
  companyName: string;
  vatNumber?: string;
  registrationNumber?: string;
  country?: string;
  address?: string;
  city?: string;
}

export class PeppolLookupService {
  private readonly baseUrl = '/api/peppol/lookup'; // Backend endpoint
  
  /**
   * Main lookup function that tries multiple sources
   */
  async lookupPeppolId(searchParams: PeppolDirectorySearchParams): Promise<PeppolLookupResult> {
    // First, check if we already have it from HubSpot
    if (searchParams.vatNumber) {
      const hubspotResult = await this.lookupFromHubSpot(searchParams);
      if (hubspotResult.found) {
        return hubspotResult;
      }
    }

    // Try Peppol directory lookup
    const directoryResult = await this.lookupFromPeppolDirectory(searchParams);
    if (directoryResult.found) {
      return directoryResult;
    }

    // Try Recommand API lookup as fallback
    const recommandResult = await this.lookupFromRecommandAPI(searchParams);
    if (recommandResult.found) {
      return recommandResult;
    }

    return {
      found: false,
      source: 'peppol_directory',
      confidence: 'low'
    };
  }

  /**
   * Lookup from cached HubSpot properties
   */
  private async lookupFromHubSpot(searchParams: PeppolDirectorySearchParams): Promise<PeppolLookupResult> {
    // This would check HubSpot custom properties for previously found Peppol IDs
    // For now, mock some cached results
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mockCachedResults: Record<string, string> = {
      'NL123456789B01': '0088:7318900000000',
      'NL987654321B02': '0088:7318900000001',
      'DE123456789': '0088:7318900000002'
    };

    const peppolId = searchParams.vatNumber ? mockCachedResults[searchParams.vatNumber] : undefined;
    
    if (peppolId) {
      return {
        peppolId,
        found: true,
        source: 'hubspot',
        confidence: 'high',
        metadata: {
          vatNumber: searchParams.vatNumber,
          companyName: searchParams.companyName,
          country: searchParams.country
        }
      };
    }

    return { found: false, source: 'hubspot', confidence: 'low' };
  }

  /**
   * Lookup from official Peppol directory
   */
  private async lookupFromPeppolDirectory(searchParams: PeppolDirectorySearchParams): Promise<PeppolLookupResult> {
    try {
      // Mock Peppol directory API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate different scenarios based on input
      const random = Math.random();
      
      if (searchParams.vatNumber?.startsWith('NL') && random > 0.3) {
        // Higher success rate for Dutch companies
        const peppolId = `0088:${searchParams.vatNumber.replace(/[^0-9]/g, '')}`;
        return {
          peppolId,
          found: true,
          source: 'peppol_directory',
          confidence: 'high',
          metadata: {
            vatNumber: searchParams.vatNumber,
            companyName: searchParams.companyName,
            country: searchParams.country
          }
        };
      }
      
      if (random > 0.7) {
        // Some success for other countries
        const peppolId = `0088:${Math.random().toString().slice(2, 15)}`;
        return {
          peppolId,
          found: true,
          source: 'peppol_directory',
          confidence: 'medium',
          metadata: {
            vatNumber: searchParams.vatNumber,
            companyName: searchParams.companyName,
            country: searchParams.country
          }
        };
      }

      return { found: false, source: 'peppol_directory', confidence: 'low' };
      
    } catch (error) {
      console.error('Fout bij Peppol directory lookup:', error);
      return { found: false, source: 'peppol_directory', confidence: 'low' };
    }
  }

  /**
   * Lookup via Recommand API
   */
  private async lookupFromRecommandAPI(searchParams: PeppolDirectorySearchParams): Promise<PeppolLookupResult> {
    return await recommandService.lookupPeppolId(searchParams);
  }

  /**
   * Batch lookup for multiple companies
   */
  async batchLookupPeppolIds(companies: PeppolDirectorySearchParams[]): Promise<PeppolLookupResult[]> {
    const results: PeppolLookupResult[] = [];
    
    // Process in parallel for better performance
    const promises = companies.map(company => this.lookupPeppolId(company));
    const lookupResults = await Promise.all(promises);
    
    return lookupResults;
  }

  /**
   * Validate if a Peppol ID exists in the network
   */
  async validatePeppolIdInNetwork(peppolId: string): Promise<boolean> {
    return await recommandService.validatePeppolIdInNetwork(peppolId);
  }
}

export const peppolLookupService = new PeppolLookupService();