import { google } from "googleapis";
import { prisma } from "@/lib/db";

// Initialize Google Sheets API client
function getGoogleSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !sheetId) {
    console.warn("Google Sheets credentials not configured");
    return null;
  }

  // Fix private key formatting - handle various newline formats
  // Replace escaped newlines with actual newlines
  privateKey = privateKey.replace(/\\n/g, "\n");
  // If the key doesn't have proper line breaks, try to format it
  if (!privateKey.includes("\n") && privateKey.includes("-----")) {
    // If it's all on one line, try to add newlines around the key content
    privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, "-----BEGIN PRIVATE KEY-----\n");
    privateKey = privateKey.replace(/-----END PRIVATE KEY-----/, "\n-----END PRIVATE KEY-----");
  }

  // Ensure the private key has proper BEGIN/END markers
  if (!privateKey.includes("BEGIN PRIVATE KEY") || !privateKey.includes("END PRIVATE KEY")) {
    console.error("Google Sheets: Invalid private key format - missing BEGIN/END markers");
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return { sheets: google.sheets({ version: "v4", auth }), sheetId };
  } catch (error) {
    console.error("Google Sheets: Error initializing auth client:", error instanceof Error ? error.message : error);
    return null;
  }
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
export async function syncRecordToSheet(record: RecordData): Promise<{ success: boolean; error?: string; notConfigured?: boolean }> {
  try {
    const client = getGoogleSheetsClient();
    
    if (!client) {
      return { success: false, error: "Google Sheets not configured", notConfigured: true };
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
        range: "Sheet1!A1:W1",
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
            "Employees (with split counts)",
          ]],
        },
      });
    }

    // Fetch employee assignments for this record
    const employeeAssignments = await prisma.employeeAssignment.findMany({
      where: {
        recordId: record.id,
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            name: true,
          },
        },
      },
    });

    // Format employee data as "Name [EmployeeID] (splitCount), Name [EmployeeID] (splitCount)"
    const employeeData = employeeAssignments
      .map((assignment) => `${assignment.employee.name} [${assignment.employee.employeeId}] (${assignment.splitCount.toFixed(2)})`)
      .join(", ");

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
      employeeData,
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
        range: `Sheet1!A${rowIndex + 1}:W${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [rowData],
        },
      });
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Sheet1!A:W",
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

