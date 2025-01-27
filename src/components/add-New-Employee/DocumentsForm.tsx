import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@heroicons/react/24/outline";
import { v4 as uuidv4 } from 'uuid';

export interface UploadedDocument {
  id: string;
  file: File;
  displayName: string;
}

export interface UploadedDocuments {
  // **Identity Documents**
  aadhaar_card: UploadedDocument[];
  pan_card: UploadedDocument[];
  passport: UploadedDocument[];
  voter_id: UploadedDocument[];
  driving_license: UploadedDocument[];
  other_identity_documents: UploadedDocument[];

  // **Educational Documents**
  tenth_marksheet: UploadedDocument[];
  twelfth_marksheet: UploadedDocument[];
  graduation_degree: UploadedDocument[];
  masters_degree: UploadedDocument[];
  postgraduate_degree: UploadedDocument[];
  diploma_certificate: UploadedDocument[];
  educational_transcript: UploadedDocument[];
  other_educational_documents: UploadedDocument[];

  // **Employment Documents**
  resume: UploadedDocument[];
  previous_employment_certificate: UploadedDocument[];
  experience_letter: UploadedDocument[];
  relieving_letter: UploadedDocument[];
  salary_slip: UploadedDocument[];
  offer_letter: UploadedDocument[];
  appointment_letter: UploadedDocument[];
  employment_contract: UploadedDocument[];
  other_employment_documents: UploadedDocument[];

  // **Certification Documents**
  professional_certifications: UploadedDocument[];
  language_certifications: UploadedDocument[];
  technical_certifications: UploadedDocument[];
  industry_specific_certifications: UploadedDocument[];
  other_certifications: UploadedDocument[];

  // **Address Proof Documents**
  utility_bill: UploadedDocument[];
  rental_agreement: UploadedDocument[];
  bank_statement: UploadedDocument[];
  passport_copy: UploadedDocument[];
  ration_card: UploadedDocument[];
  lease_agreement: UploadedDocument[];
  other_address_proof: UploadedDocument[];

  // **Skills Documents**
  portfolio: UploadedDocument[];
  project_documents: UploadedDocument[];
  skill_certificates: UploadedDocument[];
  training_completion_certificates: UploadedDocument[];
  other_skills_documents: UploadedDocument[];

  // **Financial Documents**
  form_16: UploadedDocument[];
  it_return: UploadedDocument[];
  bank_passbook: UploadedDocument[];
  canceled_cheque: UploadedDocument[];
  salary_certificate: UploadedDocument[];
  other_financial_documents: UploadedDocument[];

  // **Insurance Documents**
  health_insurance_policy: UploadedDocument[];
  life_insurance_policy: UploadedDocument[];
  motor_insurance: UploadedDocument[];
  other_insurance_documents: UploadedDocument[];

  // **Legal Documents**
  nda_agreement: UploadedDocument[];
  legal_contracts: UploadedDocument[];
  court_clearance_certificate: UploadedDocument[];
  police_clearance_certificate: UploadedDocument[];
  other_legal_documents: UploadedDocument[];

  // **Professional Licenses**
  engineering_license: UploadedDocument[];
  medical_license: UploadedDocument[];
  teaching_license: UploadedDocument[];
  other_professional_licenses: UploadedDocument[];

  // **Company-Specific Documents**
  signed_policies: UploadedDocument[];
  employee_handbook: UploadedDocument[];
  non_disclosure_agreement: UploadedDocument[];
  non_compete_agreement: UploadedDocument[];
  other_company_documents: UploadedDocument[];

  // **Dependents' Documents**
  spouse_aadhaar_card: UploadedDocument[];
  spouse_pan_card: UploadedDocument[];
  child_birth_certificate: UploadedDocument[];
  child_school_certificate: UploadedDocument[];
  other_dependents_documents: UploadedDocument[];

  // **Additional Documents**
  photo: UploadedDocument[];
  medical_certificate: UploadedDocument[];
  reference_letters: UploadedDocument[];
  birth_certificate: UploadedDocument[];
  marriage_certificate: UploadedDocument[];
  resignation_letter: UploadedDocument[];
  other_documents: UploadedDocument[];
}

interface DocumentsFormProps {
  setUploadedDocuments: React.Dispatch<React.SetStateAction<UploadedDocuments>>;
  uploadedDocuments: UploadedDocuments;
}

const documentTypes: { key: keyof UploadedDocuments; label: string }[] = [
  // **Identity Documents**
  { key: 'aadhaar_card', label: 'Aadhaar Card' },
  { key: 'pan_card', label: 'PAN Card' },
  { key: 'passport', label: 'Passport' },
  { key: 'voter_id', label: 'Voter ID' },
  { key: 'driving_license', label: 'Driving License' },
  { key: 'other_identity_documents', label: 'Other Identity Documents' },

  // **Educational Documents**
  { key: 'tenth_marksheet', label: '10th Marksheet' },
  { key: 'twelfth_marksheet', label: '12th Marksheet' },
  { key: 'graduation_degree', label: 'Graduation Degree' },
  { key: 'masters_degree', label: 'Masters Degree' },
  { key: 'postgraduate_degree', label: 'Postgraduate Degree' },
  { key: 'diploma_certificate', label: 'Diploma Certificate' },
  { key: 'educational_transcript', label: 'Educational Transcript' },
  { key: 'other_educational_documents', label: 'Other Educational Documents' },

  // **Employment Documents**
  { key: 'resume', label: 'Resume' },
  { key: 'previous_employment_certificate', label: 'Previous Employment Certificate' },
  { key: 'experience_letter', label: 'Experience Letter' },
  { key: 'relieving_letter', label: 'Relieving Letter' },
  { key: 'salary_slip', label: 'Salary Slip' },
  { key: 'offer_letter', label: 'Offer Letter' },
  { key: 'appointment_letter', label: 'Appointment Letter' },
  { key: 'employment_contract', label: 'Employment Contract' },
  { key: 'other_employment_documents', label: 'Other Employment Documents' },

  // **Certification Documents**
  { key: 'professional_certifications', label: 'Professional Certifications' },
  { key: 'language_certifications', label: 'Language Certifications' },
  { key: 'technical_certifications', label: 'Technical Certifications' },
  { key: 'industry_specific_certifications', label: 'Industry Specific Certifications' },
  { key: 'other_certifications', label: 'Other Certifications' },

  // **Address Proof Documents**
  { key: 'utility_bill', label: 'Utility Bill' },
  { key: 'rental_agreement', label: 'Rental Agreement' },
  { key: 'bank_statement', label: 'Bank Statement' },
  { key: 'passport_copy', label: 'Passport Copy' },
  { key: 'ration_card', label: 'Ration Card' },
  { key: 'lease_agreement', label: 'Lease Agreement' },
  { key: 'other_address_proof', label: 'Other Address Proof' },

  // **Skills Documents**
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'project_documents', label: 'Project Documents' },
  { key: 'skill_certificates', label: 'Skill Certificates' },
  { key: 'training_completion_certificates', label: 'Training Completion Certificates' },
  { key: 'other_skills_documents', label: 'Other Skills Documents' },

  // **Financial Documents**
  { key: 'form_16', label: 'Form 16' },
  { key: 'it_return', label: 'IT Return' },
  { key: 'bank_passbook', label: 'Bank Passbook' },
  { key: 'canceled_cheque', label: 'Canceled Cheque' },
  { key: 'salary_certificate', label: 'Salary Certificate' },
  { key: 'other_financial_documents', label: 'Other Financial Documents' },

  // **Insurance Documents**
  { key: 'health_insurance_policy', label: 'Health Insurance Policy' },
  { key: 'life_insurance_policy', label: 'Life Insurance Policy' },
  { key: 'motor_insurance', label: 'Motor Insurance' },
  { key: 'other_insurance_documents', label: 'Other Insurance Documents' },

  // **Legal Documents**
  { key: 'nda_agreement', label: 'NDA Agreement' },
  { key: 'legal_contracts', label: 'Legal Contracts' },
  { key: 'court_clearance_certificate', label: 'Court Clearance Certificate' },
  { key: 'police_clearance_certificate', label: 'Police Clearance Certificate' },
  { key: 'other_legal_documents', label: 'Other Legal Documents' },

  // **Professional Licenses**
  { key: 'engineering_license', label: 'Engineering License' },
  { key: 'medical_license', label: 'Medical License' },
  { key: 'teaching_license', label: 'Teaching License' },
  { key: 'other_professional_licenses', label: 'Other Professional Licenses' },

  // **Company-Specific Documents**
  { key: 'signed_policies', label: 'Signed Policies' },
  { key: 'employee_handbook', label: 'Employee Handbook' },
  { key: 'non_disclosure_agreement', label: 'Non-Disclosure Agreement' },
  { key: 'non_compete_agreement', label: 'Non-Compete Agreement' },
  { key: 'other_company_documents', label: 'Other Company Documents' },

  // **Dependents' Documents**
  { key: 'spouse_aadhaar_card', label: 'Spouse Aadhaar Card' },
  { key: 'spouse_pan_card', label: 'Spouse PAN Card' },
  { key: 'child_birth_certificate', label: 'Child Birth Certificate' },
  { key: 'child_school_certificate', label: 'Child School Certificate' },
  { key: 'other_dependents_documents', label: 'Other Dependents Documents' },

  // **Additional Documents**
  { key: 'photo', label: 'Photo' },
  { key: 'medical_certificate', label: 'Medical Certificate' },
  { key: 'reference_letters', label: 'Reference Letters' },
  { key: 'birth_certificate', label: 'Birth Certificate' },
  { key: 'marriage_certificate', label: 'Marriage Certificate' },
  { key: 'resignation_letter', label: 'Resignation Letter' },
  { key: 'other_documents', label: 'Other Documents' },
];

export default function DocumentsForm({ uploadedDocuments, setUploadedDocuments }: DocumentsFormProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type: keyof UploadedDocuments = 'other_documents'; // Default category for initial upload
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: uuidv4(),
        file,
        displayName: file.name.split('.').slice(0, -1).join('.'),
      }));
      setUploadedDocuments((prev) => ({
        ...prev,
        [type]: [...prev[type], ...newFiles],
      }));
      e.target.value = '';
    }
  };

  const removeFile = (type: keyof UploadedDocuments, id: string) => {
    setUploadedDocuments((prev) => ({
      ...prev,
      [type]: prev[type].filter((doc) => doc.id !== id),
    }));
  };

  const handleCategoryChange = (
    currentType: keyof UploadedDocuments,
    fileId: string,
    newType: keyof UploadedDocuments
  ) => {
    setUploadedDocuments((prev) => {
      const fileToMove = prev[currentType].find((doc) => doc.id === fileId);
      if (!fileToMove) return prev;

      return {
        ...prev,
        [currentType]: prev[currentType].filter((doc) => doc.id !== fileId),
        [newType]: [...prev[newType], fileToMove],
      };
    });
  };

  const addDocumentInput = () => {
    const input = document.getElementById(`file-upload`) as HTMLInputElement | null;
    if (input) {
      input.click();
    }
  };

  // Aggregate all documents for display
  const allDocuments: Array<{
    id: string;
    file: File;
    displayName: string;
    category: keyof UploadedDocuments;
  }> = [];

  documentTypes.forEach(({ key }) => {
    uploadedDocuments[key].forEach((doc) => {
      allDocuments.push({ ...doc, category: key });
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-lg font-semibold">Uploaded Documents</Label>
        <Button type="button" size="sm" onClick={addDocumentInput}>
          Add Document
        </Button>
      </div>
      <Input
        id="file-upload"
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {allDocuments.length > 0 && (
        <ul className="space-y-2">
          {allDocuments.map(({ id, file, displayName, category }) => (
            <li key={id} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center space-x-2">
                <span className="w-48 truncate" title={displayName}>{displayName}</span>
                <span className="text-gray-500 text-sm">.{file.name.split('.').pop()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={category}
                  onChange={(e) => {
                    const newType = e.target.value as keyof UploadedDocuments;
                    handleCategoryChange(category, id, newType);
                  }}
                  className="border rounded-md px-2 py-1"
                >
                  {documentTypes.map(({ key: optionKey, label: optionLabel }) => (
                    <option key={optionKey} value={optionKey}>
                      {optionLabel}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeFile(category, id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
