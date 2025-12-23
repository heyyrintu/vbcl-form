"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { convertTo12Hour } from "@/lib/utils";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import EmployeeSelector from "@/components/EmployeeSelector";
import type { ProductionRecord } from "@/types/record";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  role: string;
}

interface RecordFormData {
  dronaSupervisor: string;
  shift: string;
  date: string;
  inTime: string;
  outTime: string;
  binNo: string;
  modelNo: string;
  chassisNo: string;
  type: string;
  electrician: number;
  fitter: number;
  painter: number;
  helper: number;
  productionInchargeFromVBCL: string;
  remarks: string;
}

interface RecordFormProps {
  existingRecord?: ProductionRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordForm({ existingRecord, onClose, onSuccess }: RecordFormProps) {
  const [formData, setFormData] = useState<RecordFormData>({
    dronaSupervisor: "",
    shift: "Day Shift",
    date: "",
    inTime: "",
    outTime: "",
    binNo: "",
    modelNo: "",
    chassisNo: "",
    type: "PTS",
    electrician: 0,
    fitter: 0,
    painter: 0,
    helper: 0,
    productionInchargeFromVBCL: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [dateValue, setDateValue] = useState<Dayjs | null>(null);
  const [inTimeValue, setInTimeValue] = useState<Dayjs | null>(null);
  const [outTimeValue, setOutTimeValue] = useState<Dayjs | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (existingRecord) {
      setFormData({
        dronaSupervisor: existingRecord.dronaSupervisor || "",
        shift: existingRecord.shift || "Day Shift",
        date: existingRecord.date || "",
        inTime: existingRecord.inTime ? convertTo12Hour(existingRecord.inTime) : "",
        outTime: existingRecord.outTime ? convertTo12Hour(existingRecord.outTime) : "",
        binNo: existingRecord.binNo || "",
        modelNo: existingRecord.modelNo || "",
        chassisNo: existingRecord.chassisNo || "",
        type: existingRecord.type || "PTS",
        electrician: existingRecord.electrician || 0,
        fitter: existingRecord.fitter || 0,
        painter: existingRecord.painter || 0,
        helper: existingRecord.helper || 0,
        productionInchargeFromVBCL: existingRecord.productionInchargeFromVBCL || "",
        remarks: existingRecord.remarks || "",
      });

      // Set DatePicker value from existing record
      if (existingRecord.date) {
        setDateValue(dayjs(existingRecord.date));
      }

      // Set TimePicker values from existing record
      if (existingRecord.inTime) {
        const time24 = existingRecord.inTime;
        const [hours, minutes] = time24.split(':');
        if (hours && minutes) {
          setInTimeValue(dayjs().hour(parseInt(hours)).minute(parseInt(minutes)));
        }
      }
      if (existingRecord.outTime) {
        const time24 = existingRecord.outTime;
        const [hours, minutes] = time24.split(':');
        if (hours && minutes) {
          setOutTimeValue(dayjs().hour(parseInt(hours)).minute(parseInt(minutes)));
        }
      }
    }
  }, [existingRecord]);

  // Fetch employees for existing record
  useEffect(() => {
    const fetchEmployees = async () => {
      if (existingRecord?.id) {
        try {
          const response = await fetch(`/api/records/${existingRecord.id}/employees`);
          if (response.ok) {
            const employees = await response.json();
            setSelectedEmployees(employees);
          }
        } catch {
          console.error("Failed to fetch employees for record:");
        }
      }
    };

    fetchEmployees();
  }, [existingRecord?.id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user selects
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.dronaSupervisor.trim()) {
      errors.dronaSupervisor = "Drona Supervisor is required";
    }
    if (!formData.binNo.trim()) {
      errors.binNo = "Bin No is required";
    }
    if (!formData.modelNo.trim()) {
      errors.modelNo = "Model No is required";
    }
    if (!formData.chassisNo.trim()) {
      errors.chassisNo = "Chassis No is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = existingRecord
        ? `/api/records/${existingRecord.id}`
        : "/api/records";

      const method = existingRecord ? "PATCH" : "POST";

      // Convert Dayjs date and time values to format before sending
      const dataToSend = {
        ...formData,
        date: dateValue ? dateValue.format('YYYY-MM-DD') : null,
        inTime: inTimeValue ? inTimeValue.format('HH:mm') : null,
        outTime: outTimeValue ? outTimeValue.format('HH:mm') : null,
        employeeIds: selectedEmployees.map(e => e.id),
        action: "save"
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("Failed to save record");
      }

      onSuccess();
      onClose();
    } catch {
      setError("Failed to save record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      // First save the record if it's new
      let recordId = existingRecord?.id;

      if (!existingRecord) {
        // Convert Dayjs date and time values to format before sending
        const dataToCreate = {
          ...formData,
          date: dateValue ? dateValue.format('YYYY-MM-DD') : null,
          inTime: inTimeValue ? inTimeValue.format('HH:mm') : null,
          outTime: outTimeValue ? outTimeValue.format('HH:mm') : null,
          employeeIds: selectedEmployees.map(e => e.id),
        };

        const createResponse = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToCreate),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create record");
        }

        const newRecord = await createResponse.json();
        recordId = newRecord.id;
      }

      // Then submit it - convert Dayjs date and time values to format
      const dataToSubmit = {
        ...formData,
        date: dateValue ? dateValue.format('YYYY-MM-DD') : null,
        inTime: inTimeValue ? inTimeValue.format('HH:mm') : null,
        outTime: outTimeValue ? outTimeValue.format('HH:mm') : null,
        employeeIds: selectedEmployees.map(e => e.id),
        action: "submit"
      };

      const response = await fetch(`/api/records/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        throw new Error("Failed to submit record");
      }

      const result = await response.json();

      // Only show error if it's an actual sync failure, not just not configured
      if (!result.sheetSyncSuccess && result.sheetSyncError && !result.sheetSyncNotConfigured) {
        setError(`Record submitted but Google Sheets sync failed: ${result.sheetSyncError}`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Failed to submit record. Please try again.");
    } finally {
      setLoading(false);
      setShowSubmitConfirm(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-[#DE1C1C]/20 to-slate-800 flex items-center justify-center p-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white rounded-none sm:rounded-xl shadow-2xl max-w-5xl w-full h-full sm:h-auto sm:max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header - Fixed */}
          <div className="bg-gradient-to-r from-[#DE1C1C] to-[#C01818] text-white px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {existingRecord ? "Edit Entry" : "New Entry"}
                </h2>
                <p className="text-white/90 text-sm mt-1">
                  {existingRecord ? "Update production record details" : "Create a new production record"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={loading}
                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md shadow-sm">
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <form className="space-y-6 sm:space-y-8">
                <FieldSet className="bg-gray-50/50 rounded-lg p-3 sm:p-6 border border-gray-200">
                  <FieldGroup className="space-y-4">
                    <Field data-invalid={!!fieldErrors.dronaSupervisor}>
                      <FieldLabel htmlFor="dronaSupervisor" className="text-gray-900 font-semibold">
                        Drona Supervisor
                      </FieldLabel>
                      <Input
                        id="dronaSupervisor"
                        name="dronaSupervisor"
                        value={formData.dronaSupervisor}
                        onChange={handleInputChange}
                        placeholder="Enter supervisor name"
                        required
                        aria-invalid={!!fieldErrors.dronaSupervisor}
                      />
                      {fieldErrors.dronaSupervisor && (
                        <FieldError>{fieldErrors.dronaSupervisor}</FieldError>
                      )}
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Field data-invalid={!!fieldErrors.shift}>
                        <FieldLabel htmlFor="shift" className="text-gray-900 font-semibold">Shift</FieldLabel>
                        <Select
                          value={formData.shift}
                          onValueChange={(value) => handleSelectChange("shift", value)}
                        >
                          <SelectTrigger id="shift" className="w-full">
                            <SelectValue placeholder="Select shift" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Day Shift">Day Shift</SelectItem>
                            <SelectItem value="Night Shift">Night Shift</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="date" className="text-gray-900 font-semibold">Date</FieldLabel>
                        <div className="flex gap-2">
                          <DatePicker
                            value={dateValue}
                            onChange={(newValue) => setDateValue(newValue)}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                  },
                                },
                              },
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => setDateValue(dayjs())}
                            variant="outline"
                            size="sm"
                            className="shrink-0 px-3 whitespace-nowrap"
                          >
                            Now
                          </Button>
                        </div>
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Field>
                        <FieldLabel htmlFor="inTime" className="text-gray-900 font-semibold">In Time</FieldLabel>
                        <div className="flex gap-2">
                          <TimePicker
                            value={inTimeValue}
                            onChange={(newValue) => setInTimeValue(newValue)}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                  },
                                },
                              },
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => setInTimeValue(dayjs())}
                            variant="outline"
                            size="sm"
                            className="shrink-0 px-3 whitespace-nowrap"
                          >
                            Now
                          </Button>
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="outTime" className="text-gray-900 font-semibold">Out Time</FieldLabel>
                        <div className="flex gap-2">
                          <TimePicker
                            value={outTimeValue}
                            onChange={(newValue) => setOutTimeValue(newValue)}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                  },
                                },
                              },
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => setOutTimeValue(dayjs())}
                            variant="outline"
                            size="sm"
                            className="shrink-0 px-3 whitespace-nowrap"
                          >
                            Now
                          </Button>
                        </div>
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Field data-invalid={!!fieldErrors.binNo}>
                        <FieldLabel htmlFor="binNo" className="text-gray-900 font-semibold">Bin No</FieldLabel>
                        <Input
                          id="binNo"
                          name="binNo"
                          value={formData.binNo}
                          onChange={handleInputChange}
                          placeholder="Enter bin number"
                          required
                          aria-invalid={!!fieldErrors.binNo}
                        />
                        {fieldErrors.binNo && (
                          <FieldError>{fieldErrors.binNo}</FieldError>
                        )}
                      </Field>

                      <Field data-invalid={!!fieldErrors.modelNo}>
                        <FieldLabel htmlFor="modelNo" className="text-gray-900 font-semibold">Model No</FieldLabel>
                        <Input
                          id="modelNo"
                          name="modelNo"
                          value={formData.modelNo}
                          onChange={handleInputChange}
                          placeholder="Enter model number"
                          required
                          aria-invalid={!!fieldErrors.modelNo}
                        />
                        {fieldErrors.modelNo && (
                          <FieldError>{fieldErrors.modelNo}</FieldError>
                        )}
                      </Field>
                    </div>

                    <Field data-invalid={!!fieldErrors.chassisNo}>
                      <FieldLabel htmlFor="chassisNo" className="text-gray-900 font-semibold">Chassis No</FieldLabel>
                      <Input
                        id="chassisNo"
                        name="chassisNo"
                        value={formData.chassisNo}
                        onChange={handleInputChange}
                        placeholder="Enter chassis number"
                        required
                        aria-invalid={!!fieldErrors.chassisNo}
                      />
                      {fieldErrors.chassisNo && (
                        <FieldError>{fieldErrors.chassisNo}</FieldError>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="type" className="text-gray-900 font-semibold">Type</FieldLabel>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => handleSelectChange("type", value)}
                      >
                        <SelectTrigger id="type" className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PTS">PTS</SelectItem>
                          <SelectItem value="PDI">PDI</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="productionInchargeFromVBCL" className="text-gray-900 font-semibold">
                        Production incharge name from VBCL
                      </FieldLabel>
                      <Input
                        id="productionInchargeFromVBCL"
                        name="productionInchargeFromVBCL"
                        value={formData.productionInchargeFromVBCL}
                        onChange={handleInputChange}
                        placeholder="Enter production incharge name"
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>

                {/* Man Power Details - Hidden for now, will be used in future
                <FieldSeparator className="my-6" />

                <FieldSet className="bg-gradient-to-br from-[#FEA418]/10 to-[#FEA418]/20 rounded-lg p-3 sm:p-6 border border-[#FEA418]/30">
                  <FieldLegend className="text-[#FEA418] font-bold text-lg mb-2">Man Power Details</FieldLegend>
                  <FieldDescription className="text-[#FEA418]/80 mb-4">
                    Enter the number of personnel for each role
                  </FieldDescription>
                  <FieldGroup className="space-y-4">
                    <Field>
                      <FieldLabel>Employees</FieldLabel>
                      <FieldDescription>
                        Select employees working on this vehicle entry. Employee counts will be automatically split if assigned to multiple entries on the same date/shift.
                      </FieldDescription>
                      <EmployeeSelector
                        selectedEmployees={selectedEmployees}
                        onEmployeesChange={setSelectedEmployees}
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>

                <FieldSeparator className="my-6" />
                */}

                <FieldSet className="bg-gray-50/50 rounded-lg p-3 sm:p-6 border border-gray-200">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="remarks" className="text-gray-900 font-semibold">Remarks</FieldLabel>
                      <Textarea
                        id="remarks"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        placeholder="Add any additional comments or notes"
                        rows={3}
                        className="resize-none"
                      />
                      <FieldDescription>
                        Optional notes or comments about this entry
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </FieldSet>

              </form>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                onClick={onClose}
                disabled={loading}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={loading}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                disabled={loading}
                variant="gradient"
                className="w-full sm:w-auto"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {
        showSubmitConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[60]">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 mx-2 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Submit</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to submit this entry? Once submitted, it will be marked as completed and synced to Google Sheets.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowSubmitConfirm(false)}
                  variant="outline"
                  className="flex-1 w-full sm:w-auto"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Confirm Submit"}
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </LocalizationProvider >
  );
}
