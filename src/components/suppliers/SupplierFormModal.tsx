"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useFormEnterNavigation } from '@/hooks/useFormEnterNavigation';
import { FormKeyboardHints } from '@/components/ui/FormKeyboardHints';

const supplierSchema = z.object({
  name: z.string().min(2, "Name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormValues) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

export function SupplierFormModal({ isOpen, onClose, onSubmit, initialData, isLoading }: SupplierFormModalProps) {
  const { handleFormKeyDown, submitBtnRef } = useFormEnterNavigation();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          contactPerson: initialData.contactPerson || '',
          phone: initialData.phone,
          email: initialData.email,
          address: initialData.address || '',
        });
      } else {
        reset({ name: '', contactPerson: '', phone: '', email: '', address: '' });
      }
    }
  }, [isOpen, initialData, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Supplier" : "Add Supplier"}
    >
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-4">
        <FormKeyboardHints />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name <span className="text-red-500">*</span></label>
          <input
            {...register('name')}
            placeholder="e.g. ABC Textiles"
            className={`mt-1 block w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm bg-gray-50 focus:bg-white transition-colors`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
          <input
            {...register('contactPerson')}
            placeholder="e.g. John Doe"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm bg-gray-50 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
          <input
            {...register('phone')}
            placeholder="e.g. +94 77 123 4567"
            className={`mt-1 block w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm bg-gray-50 focus:bg-white transition-colors`}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            {...register('email')}
            placeholder="e.g. contact@abctextiles.com"
            className={`mt-1 block w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm bg-gray-50 focus:bg-white transition-colors`}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            {...register('address')}
            rows={3}
            placeholder="Full physical address"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm bg-gray-50 focus:bg-white transition-colors"
          />
        </div>

        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" ref={submitBtnRef} isLoading={isLoading}>
            {initialData ? "Save Changes" : "Add Supplier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
