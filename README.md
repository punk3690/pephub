# PepHub - HubSpot Peppol Integration

A React application that integrates with HubSpot to send invoices via the Peppol network using the Recommand API.

## Features

- **HubSpot OAuth Integration**: Secure authentication with HubSpot using OAuth 2.0
- **Dual Mode Operation**: 
  - Standard mode for individual invoice sending
  - Bulk mode for processing multiple invoices at once
- **Peppol Network Integration**: Send invoices electronically via the Peppol network
- **Automatic Peppol ID Lookup**: Uses Recommand API to find Peppol participant IDs
- **Real-time Status Tracking**: Track invoice delivery status in real-time
- **HubSpot Timeline Integration**: Automatic timeline events for sent invoices
- **Custom Properties**: Automatically updates deal properties with Peppol status
- **Audit Trail**: Complete audit logging for compliance
- **Retry Functionality**: Retry failed invoice deliveries

## Setup

### Prerequisites

1. HubSpot Developer Account
2. Recommand API Access
3. Node.js and npm/yarn

### HubSpot OAuth Configuration

1. Create a HubSpot app in your HubSpot Developer Portal
2. Configure OAuth settings:
   - **Redirect URI**: `https://yourdomain.com/oauth/callback`
   - **Scopes**: 
     - `crm.objects.companies.read`
     - `crm.objects.deals.read`
     - `crm.objects.contacts.read`
     - `timeline`

3. Update the OAuth credentials in `src/services/hubspotService.ts`:
   ```typescript
   private readonly clientId = 'YOUR_HUBSPOT_CLIENT_ID';
   private readonly clientSecret = 'YOUR_HUBSPOT_CLIENT_SECRET';
   ```

   **Security Note**: In production, the client secret should be handled server-side. For frontend-only implementations, consider using HubSpot's Client Credentials flow or implement a backend proxy.

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Standard Mode
1. Authenticate with HubSpot using OAuth
2. Select a deal from the deal selector
3. Review invoice details and Peppol ID
4. Send invoice via Peppol network

### Bulk Mode
1. Switch to bulk mode using the toggle
2. Select multiple deals using checkboxes
3. Review the bulk sending summary
4. Process all selected invoices in batch

## OAuth Flow

1. User clicks "Autoriseer met HubSpot"
2. User is redirected to HubSpot's OAuth authorization page
3. After approval, HubSpot redirects back to `/oauth/callback`
4. The app exchanges the authorization code for access tokens
5. Tokens are stored securely in localStorage
6. User gains access to the application

## API Integration

### HubSpot API
- Fetches deals, companies, and contacts
- Creates timeline events
- Updates custom properties
- Maintains audit trail

### Recommand API (Peppol)
- Validates Peppol participant IDs
- Sends invoices via Peppol network
- Provides delivery status updates

## Security Considerations

- OAuth tokens are stored in localStorage (consider more secure storage for production)
- Client secret exposure (implement backend proxy for production)
- HTTPS required for OAuth callbacks
- Input validation for all user data

## Development

The application is built with:
- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Router
- Radix UI components

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy to your hosting provider
3. Ensure the OAuth redirect URI matches your deployed domain
4. Configure environment variables if using server-side components

## License

This project is licensed under the MIT License.