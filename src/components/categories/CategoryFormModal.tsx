"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CldUploadWidget } from 'next-cloudinary';
import { Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useFormEnterNavigation } from '@/hooks/useFormEnterNavigation';
import { FormKeyboardHints } from '@/components/ui/FormKeyboardHints';

const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormValues) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

export function CategoryFormModal({ isOpen, onClose, onSubmit, initialData, isLoading }: CategoryFormModalProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const { handleFormKeyDown, submitBtnRef } = useFormEnterNavigation();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', imageUrl: '' }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          description: initialData.description || '',
          imageUrl: initialData.imageUrl || '',
        });
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
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Category" : "Add Category"}>
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-4">
        <FormKeyboardHints />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category Name <span className="text-red-500">*</span></label>
          <input
            {...register('name')}
            placeholder="e.g. FABRIC"
            className={`mt-1 block w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm bg-gray-50 focus:bg-white transition-colors`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Category description"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:text-sm bg-gray-50 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
          {!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME === 'your_cloud_name' ? (
             <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200">
               Cloudinary is not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to .env.local to enable image uploads on the frontend.
             </div>
          ) : (
            <div className="mt-1 flex items-center gap-4">
              {imageUrl ? (
                <div className="relative h-32 w-32 rounded-lg border border-[var(--color-border)] overflow-hidden bg-gray-50 shadow-sm group">
                  <Image src={imageUrl} alt="Category" fill className="object-cover transition-transform group-hover:scale-105" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setValue('imageUrl', '');
                    }}
                    className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-500 transition-colors shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <CldUploadWidget uploadPreset="ml_default" onSuccess={handleUploadSuccess}>
                  {({ open }) => {
                    return (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); open(); }}
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-[var(--color-border)] border-dashed rounded-lg cursor-pointer bg-gray-50/50 hover:bg-gray-50 hover:border-gray-400 transition-all group"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400 group-hover:text-gray-500">
                          <ImageIcon className="w-8 h-8 mb-2 transition-transform group-hover:scale-110" />
                          <p className="text-sm font-medium">Click to upload image</p>
                          <p className="text-xs mt-1">SVG, PNG, JPG or GIF</p>
                        </div>
                      </button>
                    );
                  }}
                </CldUploadWidget>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-[var(--color-border)]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" ref={submitBtnRef} isLoading={isLoading}>
            {initialData ? "Save Changes" : "Add Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
