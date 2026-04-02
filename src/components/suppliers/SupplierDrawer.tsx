"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useFormEnterNavigation } from '@/hooks/useFormEnterNavigation';
import { FormKeyboardHints } from '@/components/ui/FormKeyboardHints';

const supplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  contactPerson: z.string().optional(),
  phone: z.string().min(5, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormValues) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

const inputClass = (error?: boolean) =>
  `mt-1 block w-full rounded-lg border ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
  } px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:bg-white transition-all`;

export function SupplierDrawer({ isOpen, onClose, onSubmit, initialData, isLoading }: SupplierDrawerProps) {
  const { handleFormKeyDown, submitBtnRef } = useFormEnterNavigation();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', contactPerson: '', phone: '', email: '', address: '' },
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
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Supplier' : 'Add Supplier'}
      subtitle={initialData ? 'Update the supplier details below.' : 'Fill in the details to add a new supplier.'}
    >
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-5" id="supplier-form">
        <FormKeyboardHints />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Supplier Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            placeholder="e.g. ABC Textiles"
            className={inputClass(!!errors.name)}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person</label>
          <input
            {...register('contactPerson')}
            placeholder="e.g. John Doe"
            className={inputClass()}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            {...register('phone')}
            placeholder="e.g. +94 77 123 4567"
            className={inputClass(!!errors.phone)}
          />
          {errors.phone && <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="e.g. contact@abctextiles.com"
            className={inputClass(!!errors.email)}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
          <textarea
            {...register('address')}
            rows={3}
            placeholder="Full physical address"
            className={inputClass()}
          />
        </div>

        <div className="pt-5 border-t border-gray-100 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" ref={submitBtnRef} isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
