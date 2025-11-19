import { google } from "googleapis";

// Initialize Google Sheets API client
function getGoogleSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !sheetId) {
    console.warn("Google Sheets credentials not configured");
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return { sheets: google.sheets({ version: "v4", auth }), sheetId };
}

export interface RecordData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  dronaSupervisor: string;
  shift: string;
  date: string | null;
  inTime: string | null;
  outTime: string | null;
  srNoVehicleCount: number | null;
  binNo: string;
  modelNo: string;
  chassisNo: string;
  type: string;
  electrician: number;
  fitter: number;
  painter: number;
  helper: number;
  productionInchargeFromVBCL: string;
  remarks: string | null;
  completedAt: Date | null;
}

// Sync record to Google Sheets
export async function syncRecordToSheet(record: RecordData): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getGoogleSheetsClient();
    
    if (!client) {
      return { success: false, error: "Google Sheets not configured" };
    }

    const { sheets, sheetId } = client;

    // Check if headers exist, if not create them
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A1:V1",
    });

    if (!response.data.values || response.data.values.length === 0) {
      // Create headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Sheet1!A1:V1",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            "ID",
            "Created At",
            "Updated At",
            "Status",
            "Drona Supervisor",
            "Shift",
            "Date",
            "In Time",
            "Out Time",
            "Sr No / Vehicle Count",
            "Bin No",
            "Model No",
            "Chassis No",
            "Type",
            "Electrician",
            "Fitter",
            "Painter",
            "Helper",
            "Production incharge name from VBCL",
            "Remarks",
            "Completed At",
          ]],
        },
      });
    }

    // Prepare row data
    const rowData = [
      record.id,
      record.createdAt.toISOString(),
      record.updatedAt.toISOString(),
      record.status,
      record.dronaSupervisor,
      record.shift,
      record.date || "",
      record.inTime || "",
      record.outTime || "",
      record.srNoVehicleCount?.toString() || "",
      record.binNo,
      record.modelNo,
      record.chassisNo,
      record.type,
      record.electrician.toString(),
      record.fitter.toString(),
      record.painter.toString(),
      record.helper.toString(),
      record.productionInchargeFromVBCL,
      record.remarks || "",
      record.completedAt ? record.completedAt.toISOString() : "",
    ];

    // Check if record already exists in sheet
    const allRecords = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A:A",
    });

    const rowIndex = allRecords.data.values?.findIndex(
      (row, index) => index > 0 && row[0] === record.id
    );

    if (rowIndex && rowIndex >= 0) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Sheet1!A${rowIndex + 1}:V${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [rowData],
        },
      });
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Sheet1!A:V",
        valueInputOption: "RAW",
        requestBody: {
          values: [rowData],
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing to Google Sheets:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to sync to Google Sheets" 
    };
  }
}

