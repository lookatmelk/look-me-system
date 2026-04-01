'use client';

import React, { useEffect, useState } from 'react';
import { useForm as useHookForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { X, Store, MapPin, User, Phone, Mail, Loader2, Save } from 'lucide-react';
import { showToast } from '@/components/ui/Toaster';
import axios from 'axios';

const shopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100, 'Max 100 characters'),
  location: z.string().max(200).optional().or(z.literal('')),
  manager: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  color: z.enum(['blue', 'violet', 'emerald', 'amber', 'rose', 'cyan', 'indigo', 'teal', 'orange', 'pink', 'lime', 'sky']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type ShopFormData = z.infer<typeof shopSchema>;

interface ShopDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shop: any | null; // The shop being edited, null if creating
  onSave: () => void;
}

const COLORS = [
  { name: 'blue', bg: 'bg-blue-500', border: 'hover:border-blue-400' },
  { name: 'violet', bg: 'bg-violet-500', border: 'hover:border-violet-400' },
  { name: 'emerald', bg: 'bg-emerald-500', border: 'hover:border-emerald-400' },
  { name: 'amber', bg: 'bg-amber-500', border: 'hover:border-amber-400' },
  { name: 'rose', bg: 'bg-rose-500', border: 'hover:border-rose-400' },
  { name: 'cyan', bg: 'bg-cyan-500', border: 'hover:border-cyan-400' },
  { name: 'indigo', bg: 'bg-indigo-500', border: 'hover:border-indigo-400' },
  { name: 'teal', bg: 'bg-teal-500', border: 'hover:border-teal-400' },
  { name: 'orange', bg: 'bg-orange-500', border: 'hover:border-orange-400' },
  { name: 'pink', bg: 'bg-pink-500', border: 'hover:border-pink-400' },
  { name: 'lime', bg: 'bg-lime-500', border: 'hover:border-lime-400' },
  { name: 'sky', bg: 'bg-sky-500', border: 'hover:border-sky-400' },
];

export default function ShopDrawer({ isOpen, onClose, shop, onSave }: ShopDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useHookForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: '',
      location: '',
      manager: '',
      phone: '',
      email: '',
      color: 'blue',
      status: 'ACTIVE',
    },
  });

  const selectedColor = watch('color');
  const selectedStatus = watch('status');

  useEffect(() => {
    if (shop) {
      reset({
        name: shop.name || '',
        location: shop.location || '',
        manager: shop.manager || '',
        phone: shop.phone || '',
        email: shop.email || '',
        color: shop.color || 'blue',
        status: shop.status || 'ACTIVE',
      });
    } else {
      reset({
        name: '',
        location: '',
        manager: '',
        phone: '',
        email: '',
        color: 'blue',
        status: 'ACTIVE',
      });
    }
  }, [shop, isOpen, reset]);

  const onSubmit = async (data: ShopFormData) => {
    setIsSubmitting(true);
    try {
      if (shop?._id) {
        // Update
        const res = await axios.put(`/api/shops/${shop._id}`, data);
        if (res.data.success) {
          showToast('success', 'Shop updated successfully');
          onSave();
          onClose();
        }
      } else {
        // Create
        const res = await axios.post('/api/shops', data);
        if (res.data.success) {
          showToast('success', 'Shop created successfully');
          onSave();
          onClose();
        }
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to save shop');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-sm bg-white shadow-2xl animate-fade-in-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Store className="h-4 w-4 text-green-500" />
              {shop ? 'Edit Shop' : 'Add New Shop'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {shop ? `Manage details for ${shop.name}` : 'Enter details for the new retail location'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form id="shop-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          
          <div className="space-y-4">
            {/* Status Toggle */}
            <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Status</label>
              <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm relative overflow-hidden">
                <button
                  type="button"
                  onClick={() => setValue('status', 'ACTIVE')}
                  className={clsx(
                    'flex-1 text-xs font-bold rounded-md py-2 transition-all duration-200 z-10 relative',
                    selectedStatus === 'ACTIVE'
                      ? 'text-green-700'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  ACTIVE
                </button>
                <button
                  type="button"
                  onClick={() => setValue('status', 'INACTIVE')}
                  className={clsx(
                    'flex-1 text-xs font-bold rounded-md py-2 transition-all duration-200 z-10 relative',
                    selectedStatus === 'INACTIVE'
                      ? 'text-slate-700'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  INACTIVE
                </button>
                {/* Animated pill background */}
                <div 
                  className={clsx(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md transition-all duration-300 ease-spring",
                    selectedStatus === 'ACTIVE' ? "left-1 bg-green-100 border border-green-200" : "left-[calc(50%+2px)] bg-slate-100 border border-slate-200"
                  )}
                />
              </div>
              {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 pl-1">Shop Name *</label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. LOOK@ME Kandy"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-slate-900"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1.5 pl-1 font-medium">{errors.name.message}</p>}
            </div>

            {/* Color Picker */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-700 mb-2 pl-1">Theme Color *</label>
              <div className="flex flex-wrap gap-2.5 px-1">
                {COLORS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => setValue('color', c.name as any)}
                    className={clsx(
                      'h-6 w-6 rounded-full transition-all duration-200 relative focus:outline-none',
                      c.bg,
                      selectedColor === c.name
                        ? `ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-sm`
                        : 'opacity-60 hover:opacity-100 hover:scale-110'
                    )}
                  />
                ))}
              </div>
              {errors.color && <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.color.message}</p>}
            </div>

            {/* Location */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 pl-1">Location / Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  type="text"
                  {...register('location')}
                  placeholder="Street address..."
                  className="w-full h-10 pl-[38px] pr-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700"
                />
              </div>
              {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
            </div>

            {/* Manager */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 pl-1">Manager Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  type="text"
                  {...register('manager')}
                  placeholder="e.g. Samantha P."
                  className="w-full h-10 pl-[38px] pr-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700"
                />
              </div>
              {errors.manager && <p className="text-xs text-red-500 mt-1">{errors.manager.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 pl-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="e.g. 077 123 4567"
                  className="w-full h-10 pl-[38px] pr-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 font-mono"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 pl-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="e.g. shop@lookatme.lk"
                  className="w-full h-10 pl-[38px] pr-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3 shrink-0 rounded-b-xl z-20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-[1.5] h-11 rounded-xl font-bold text-sm bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="shop-form"
            disabled={isSubmitting}
            className="flex-[2.5] h-11 rounded-xl font-bold text-sm bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all focus:ring-4 focus:ring-green-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-green-200" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {shop ? 'Save Changes' : 'Create Shop'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
