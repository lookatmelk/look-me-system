"use client";

import { useCallback, useRef } from 'react';
import type React from 'react';

type EnterNavigationOptions = {
  allowTextareaEnter?: boolean;
  onBeforeSubmit?: () => Promise<boolean> | boolean;
};

const NAVIGABLE_FIELD_SELECTOR = [
  'input:not([type="hidden"]):not([disabled]):not([readonly])',
  'select:not([disabled])',
  'textarea:not([disabled]):not([readonly])',
  'button[data-navigable="true"]',
].join(',');

function isVisible(element: HTMLElement) {
  return !element.hasAttribute('hidden') && element.getClientRects().length > 0;
}

function getNavigableFields(form: HTMLFormElement) {
  return Array.from(form.querySelectorAll<HTMLElement>(NAVIGABLE_FIELD_SELECTOR)).filter(
    (field) => isVisible(field) && field.tabIndex !== -1,
  );
}

export function useFormEnterNavigation(options: EnterNavigationOptions = {}) {
  const { allowTextareaEnter = false, onBeforeSubmit } = options;
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);

  const submitFromKeyboard = useCallback(async (form: HTMLFormElement) => {
    if (onBeforeSubmit) {
      const canSubmit = await onBeforeSubmit();
      if (!canSubmit) return;
    }

    const submitButton =
      submitBtnRef.current ?? form.querySelector<HTMLButtonElement>('button[type="submit"]:not([disabled])');

    if (submitButton) {
      // Small delay to ensure any blur/change events have fired
      setTimeout(() => {
        submitButton.focus();
        submitButton.click();
      }, 10);
      return;
    }

    form.requestSubmit();
  }, [onBeforeSubmit]);

  const handleFormKeyDown = useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.isComposing) return;

    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const form = e.currentTarget;

    // Check for Ctrl+Enter or Cmd+Enter (for Mac)
    // We use e.code === 'Enter' as well for better compatibility
    const isEnter = e.key === 'Enter' || e.code === 'Enter';
    const isModifierKey = e.ctrlKey || e.metaKey;

    if (isModifierKey && isEnter) {
      e.preventDefault();
      e.stopPropagation();
      void submitFromKeyboard(form);
      return;
    }

    if (!isEnter) return;

    // Don't navigate if it's a button (unless it's marked as navigable)
    if (target instanceof HTMLButtonElement && target.type !== 'submit' && target.dataset.navigable !== 'true') {
      return;
    }

    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLSelectElement) &&
      !(target instanceof HTMLTextAreaElement) &&
      !(target instanceof HTMLButtonElement)
    ) {
      return;
    }

    if (target.closest('[data-skip-enter-nav="true"]')) {
      return;
    }

    if (target instanceof HTMLTextAreaElement && !allowTextareaEnter && !e.shiftKey) {
      return;
    }

    // Special case for submitting on Enter in certain inputs if requested
    // but usually we want Enter to move to next field
    
    e.preventDefault();
    e.stopPropagation();

    const fields = getNavigableFields(form);
    const currentIndex = fields.findIndex((field) => field === target);
    
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + (e.shiftKey ? -1 : 1);
    
    if (nextIndex < 0) return;
    
    if (nextIndex >= fields.length) {
      void submitFromKeyboard(form);
      return;
    }

    const nextField = fields[nextIndex];
    nextField.focus();
    if (nextField instanceof HTMLInputElement) {
      nextField.select();
    }
  }, [allowTextareaEnter, submitFromKeyboard]);

  return {
    submitBtnRef,
    handleFormKeyDown,
    submitFromKeyboard,
  };
}
