
import { GoogleGenAI, Type } from "@google/genai";
import { Gender, PensionType, LoanType, MaritalStatus, InterestType, RepaymentType } from "../types";

// Always use named parameter for apiKey and obtain from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseCustomerData = async (inputText: string) => {
  try {
    // Use gemini-3-pro-preview for complex text extraction tasks as per coding guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Extract customer information from the following unstructured text for a Cooperative Loan Application.
      
      Text to process:
      "${inputText}"
      
      Instructions:
      1. Extract personal, pension, and loan details.
      2. 'salaryAmount' is the Pension Salary (Gaji Pensiun).
      3. 'loanType' should be inferred (Baru, Top Up, or Take Over).
      4. Look for fees like Admin, Provisi, Marketing, Cadangan Resiko (Risk Reserve/CR), and Flagging (Biaya Flagging).
      5. Look for 'Simpanan Pokok' and 'Simpanan Wajib'.
      6. Look for 'Pelunasan', 'Tutup Hutang', 'Sisa Hutang', 'Takeover Amount', or 'PKA' -> repaymentAmount.
      7. Determine 'repaymentType' (TO, TOPUP, PKA) if repayment amount exists.
      8. Look for marital status (Menikah, Janda, Duda, etc).
      9. Look for Interest Rate (Bunga). If explicitly monthly (per bulan), assume 'FLAT'. If yearly (per tahun) or unspecified, assume 'ANNUITY'.
      10. Look for 'Tanggal Pinjaman' or 'Tanggal Pengajuan' (loanDate).
      11. Look for 'Mutasi' or 'Pindah Kantor Bayar' -> mutationOffice.
      12. Provide best guesses if data is implicit.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            nik: { type: Type.STRING },
            birthDate: { type: Type.STRING, description: "YYYY-MM-DD" },
            gender: { type: Type.STRING, enum: [Gender.MALE, Gender.FEMALE] },
            maritalStatus: { 
              type: Type.STRING, 
              enum: [
                MaritalStatus.MARRIED, 
                MaritalStatus.SINGLE, 
                MaritalStatus.DIVORCED_DEATH, 
                MaritalStatus.WIDOW, 
                MaritalStatus.WIDOWER
              ] 
            },
            address: { type: Type.STRING },
            phoneNumber: { type: Type.STRING },
            
            pensionNumber: { type: Type.STRING },
            formerInstitution: { type: Type.STRING },
            mutationOffice: { type: Type.STRING, description: "Kantor Bayar Tujuan (Mutasi)" },
            pensionType: { type: Type.STRING, enum: [PensionType.TASPEN, PensionType.ASABRI] },
            skNumber: { type: Type.STRING },
            skIssuanceDate: { type: Type.STRING, description: "YYYY-MM-DD" },
            salaryAmount: { type: Type.NUMBER, description: "Monthly Pension Salary" },
            
            loanType: { type: Type.STRING, enum: [LoanType.NEW, LoanType.TOPUP, LoanType.TAKEOVER] },
            loanDate: { type: Type.STRING, description: "YYYY-MM-DD" },
            loanAmount: { type: Type.NUMBER },
            interestType: { type: Type.STRING, enum: [InterestType.ANNUITY, InterestType.FLAT] },
            interestRate: { type: Type.NUMBER, description: "Interest value" },
            tenureMonths: { type: Type.NUMBER },
            
            adminFee: { type: Type.NUMBER },
            provisionFee: { type: Type.NUMBER },
            marketingFee: { type: Type.NUMBER },
            riskReserve: { type: Type.NUMBER, description: "Cadangan Resiko" },
            flaggingFee: { type: Type.NUMBER, description: "Biaya Flagging" },
            principalSavings: { type: Type.NUMBER },
            mandatorySavings: { type: Type.NUMBER },
            
            repaymentType: { type: Type.STRING, enum: [RepaymentType.TOPUP, RepaymentType.TAKEOVER, RepaymentType.PKA, RepaymentType.OTHERS] },
            repaymentAmount: { type: Type.NUMBER, description: "Pelunasan / Takeover Amount" },
          }
        }
      }
    });

    // Access text property directly from GenerateContentResponse
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error parsing with Gemini:", error);
    throw error;
  }
};
