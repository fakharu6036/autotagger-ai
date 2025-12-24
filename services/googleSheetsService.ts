// This service has been decommissioned for production security. 
// Standard CSV exports should be used instead.
export const googleSheetsService = {
  exportToSheets: async () => {
    throw new Error("Google Sheets export is disabled in this production build.");
  }
};