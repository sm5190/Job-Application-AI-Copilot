
import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { WORK_AUTHORIZATION_OPTIONS, RELOCATION_OPTIONS } from '../constants';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

const InputField: React.FC<{
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}> = ({ label, id, name, value, onChange, type = 'text', placeholder }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-dark border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
    />
  </div>
);

const SelectField: React.FC<{
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}> = ({ label, id, name, value, onChange, options }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-dark border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);


export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
      return;
    }

    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-medium rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">
        <h2 className="text-2xl font-bold text-white mb-6">User Profile Defaults</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Legal Name" id="legalName" name="legalName" value={formData.legalName} onChange={handleChange} />
            <InputField label="Email" id="email" name="email" value={formData.email} onChange={handleChange} type="email" />
            <InputField label="Phone" id="phone" name="phone" value={formData.phone} onChange={handleChange} type="tel" />
            <InputField label="LinkedIn URL" id="linkedin" name="linkedin" value={formData.linkedin} onChange={handleChange} />
            <InputField label="GitHub URL" id="githubUrl" name="githubUrl" value={formData.githubUrl} onChange={handleChange} />
            <InputField label="Portfolio URL" id="portfolioUrl" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleChange} />
          </div>

          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-600 pt-4">
              <legend className="text-lg font-medium text-white mb-2 md:col-span-2">Address</legend>
              <div className="md:col-span-2">
                <InputField label="Address Line 1" id="address.line1" name="address.line1" value={formData.address.line1} onChange={handleChange} />
              </div>
              <InputField label="City" id="address.city" name="address.city" value={formData.address.city} onChange={handleChange} />
              <InputField label="State / Province" id="address.state" name="address.state" value={formData.address.state} onChange={handleChange} />
              <InputField label="Zip / Postal Code" id="address.zipCode" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} />
              <InputField label="Country" id="address.country" name="address.country" value={formData.address.country} onChange={handleChange} />
          </fieldset>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-600 pt-4">
            <SelectField label="Work Authorization" id="workAuthorization" name="workAuthorization" value={formData.workAuthorization} onChange={handleChange} options={WORK_AUTHORIZATION_OPTIONS} />
            <SelectField label="Willing to Relocate" id="willingToRelocate" name="willingToRelocate" value={formData.willingToRelocate} onChange={handleChange} options={RELOCATION_OPTIONS} />
          </div>
          <InputField label="Earliest Start Date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} type="date" />
          <div className="flex items-center space-x-8 pt-2">
            <div className="flex items-center">
              <input type="checkbox" id="sponsorshipNow" name="sponsorshipNow" checked={formData.sponsorshipNow} onChange={handleChange} className="h-4 w-4 text-brand-secondary bg-gray-dark border-gray-600 rounded focus:ring-brand-secondary" />
              <label htmlFor="sponsorshipNow" className="ml-2 block text-sm text-gray-300">Need sponsorship now?</label>
            </div>
             <div className="flex items-center">
              <input type="checkbox" id="sponsorshipFuture" name="sponsorshipFuture" checked={formData.sponsorshipFuture} onChange={handleChange} className="h-4 w-4 text-brand-secondary bg-gray-dark border-gray-600 rounded focus:ring-brand-secondary" />
              <label htmlFor="sponsorshipFuture" className="ml-2 block text-sm text-gray-300">Need sponsorship in future?</label>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="py-2 px-4 rounded-md text-sm font-medium text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
          <button onClick={handleSave} className="py-2 px-6 rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-blue-800">Save Profile</button>
        </div>
      </div>
    </div>
  );
};