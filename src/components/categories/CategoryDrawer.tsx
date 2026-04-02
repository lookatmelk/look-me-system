"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { CldUploadWidget } from 'next-cloudinary';
import { Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useFormEnterNavigation } from '@/hooks/useFormEnterNavigation';
import { FormKeyboardHints } from '@/components/ui/FormKeyboardHints';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormValues) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

const inputClass = (error?: boolean) =>
  `mt-1 block w-full rounded-lg border ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
  } px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:bg-white transition-all`;

export function CategoryDrawer({ isOpen, onClose, onSubmit, initialData, isLoading }: CategoryDrawerProps) {
  const [imageUrl, setImageUrl] = useState('');
  const { handleFormKeyDown, submitBtnRef } = useFormEnterNavigation();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', imageUrl: '' },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({ name: initialData.name, description: initialData.description || '', imageUrl: initialData.imageUrl || '' });
        setImageUrl(initialData.imageUrl || '');
      } else {
        reset({ name: '', description: '', imageUrl: '' });
        setImageUrl('');
      }
    }
  }, [isOpen, initialData, reset]);

  const handleUploadSuccess = (result: any) => {
    const url = result.info.secure_url;
    setImageUrl(url);
    setValue('imageUrl', url);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Category' : 'Add Category'}
      subtitle={initialData ? 'Update the category details below.' : 'Fill in the details to add a new category.'}
    >
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-5" id="category-form">
        <FormKeyboardHints />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            placeholder="e.g. FABRIC"
            className={inputClass(!!errors.name)}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Category description"
            className={inputClass()}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category Image</label>
          {!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME === 'your_cloud_name' ? (
            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800 border border-amber-200">
              Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to .env.local.
            </div>
          ) : (
            <div className="mt-1">
              {imageUrl ? (
                <div className="relative h-36 w-full rounded-xl border border-[var(--color-border)] overflow-hidden bg-gray-50 shadow-sm group">
                  <Image src={imageUrl} alt="Category preview" fill className="object-cover transition-transform group-hover:scale-105" />
                  <button
                    type="button"
                    onClick={() => { setImageUrl(''); setValue('imageUrl', ''); }}
                    className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-500 transition-colors shadow-sm"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <CldUploadWidget uploadPreset="ml_default" onSuccess={handleUploadSuccess}>
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); open(); }}
                      className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-gray-50/50 hover:bg-gray-50 hover:border-[var(--color-primary)] transition-all group"
                    >
                      <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-[var(--color-primary)]">
                        <ImageIcon className="w-8 h-8 mb-2 transition-colors" />
                        <p className="text-sm font-medium">Click to upload image</p>
                        <p className="text-xs mt-1 text-gray-400">SVG, PNG, JPG or GIF</p>
                      </div>
                    </button>
                  )}
                </CldUploadWidget>
              )}
            </div>
          )}
        </div>

        <div className="pt-5 border-t border-gray-100 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" ref={submitBtnRef} isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Add Category'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
