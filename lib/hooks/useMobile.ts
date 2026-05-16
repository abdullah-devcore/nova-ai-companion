"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if we're on a mobile device
 */
export function useMobileDevice() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook to manage safe areas (notches, etc.) on mobile
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue("--safe-area-inset-top") || "0"),
        bottom: parseInt(
          style.getPropertyValue("--safe-area-inset-bottom") || "0"
        ),
        left: parseInt(style.getPropertyValue("--safe-area-inset-left") || "0"),
        right: parseInt(
          style.getPropertyValue("--safe-area-inset-right") || "0"
        ),
      });
    };

    updateInsets();
    window.addEventListener("orientationchange", updateInsets);
    return () => window.removeEventListener("orientationchange", updateInsets);
  }, []);

  return insets;
}

/**
 * Hook to detect virtual keyboard on mobile
 */
export function useVirtualKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      // Estimate keyboard height based on viewport changes
      const screenHeight = window.screen.height;
      const viewportHeight = window.innerHeight;
      const estimatedKeyboardHeight = screenHeight - viewportHeight;

      if (estimatedKeyboardHeight > 50) {
        // Only set if significant change
        setKeyboardHeight(estimatedKeyboardHeight);
      } else {
        setKeyboardHeight(0);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return keyboardHeight;
}

/**
 * Hook for touch optimization
 */
export function useTouchOptimized() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch =
      () => {
        setIsTouchDevice(
          () => {
            return (
              (navigator.maxTouchPoints > 0) ||
              (navigator.msMaxTouchPoints > 0) ||
              matchMedia("(pointer:coarse)").matches
            );
          }
        );
      };

    checkTouch();
  }, []);

  return isTouchDevice;
}
