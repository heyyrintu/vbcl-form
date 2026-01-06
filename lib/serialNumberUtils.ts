import { prisma } from "@/lib/db";

/**
 * Generates a serial number in the format: Month/Day/Sequence
 * Example: Jan/05/001, Feb/15/123
 * 
 * @param date - The date for which to generate the serial number (YYYY-MM-DD format)
 * @returns A promise that resolves to the generated serial number
 */
export async function generateSerialNumber(date: string): Promise<string> {
  try {
    // Parse the date
    const recordDate = new Date(date);
    
    // Get month abbreviation (Jan, Feb, etc.)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[recordDate.getMonth()];
    
    // Get day with leading zero if needed
    const day = String(recordDate.getDate()).padStart(2, '0');
    
    // Find the highest sequence number for this day
    const dateStr = date; // Already in YYYY-MM-DD format
    
    // Get all records for this date that have serial numbers
    const existingRecords = await prisma.record.findMany({
      where: {
        date: dateStr,
        serialNo: {
          not: null
        }
      },
      select: {
        serialNo: true
      }
    });
    
    // Extract sequence numbers from existing serial numbers for this day
    const sequenceNumbers: number[] = [];
    const prefix = `${month}/${day}/`;
    
    for (const record of existingRecords) {
      if (record.serialNo && record.serialNo.startsWith(prefix)) {
        const seqPart = record.serialNo.split('/')[2];
        const seqNum = parseInt(seqPart, 10);
        if (!isNaN(seqNum)) {
          sequenceNumbers.push(seqNum);
        }
      }
    }
    
    // Calculate next sequence number
    const nextSequence = sequenceNumbers.length > 0 
      ? Math.max(...sequenceNumbers) + 1 
      : 1;
    
    // Format sequence with leading zeros (3 digits)
    const sequence = String(nextSequence).padStart(3, '0');
    
    // Return formatted serial number
    return `${month}/${day}/${sequence}`;
  } catch (error) {
    console.error("Error generating serial number:", error);
    throw new Error("Failed to generate serial number");
  }
}

/**
 * Generates serial numbers for all records that don't have one
 * Useful for backfilling existing records
 */
export async function backfillSerialNumbers(): Promise<number> {
  try {
    const recordsWithoutSerial = await prisma.record.findMany({
      where: {
        serialNo: null,
        date: {
          not: null
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    let updated = 0;
    
    for (const record of recordsWithoutSerial) {
      if (record.date) {
        const serialNo = await generateSerialNumber(record.date);
        await prisma.record.update({
          where: { id: record.id },
          data: { serialNo }
        });
        updated++;
      }
    }
    
    return updated;
  } catch (error) {
    console.error("Error backfilling serial numbers:", error);
    throw new Error("Failed to backfill serial numbers");
  }
}
