/**
 * Analytics tracking utility
 *
 * This is a simple abstraction layer for analytics tracking.
 * It can be easily integrated with:
 * - Google Analytics 4 (gtag)
 * - PostHog
 * - Mixpanel
 * - Segment
 * - Or any other analytics service
 *
 * Usage:
 * import { trackEvent, gaEvents } from '@/lib/analytics';
 * trackEvent('Button_Clicked', { button_name: 'CTA', position: 'hero' });
 * gaEvents.trialSignupClick('hero');
 */

// Google Analytics 4 Measurement ID
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export type AnalyticsEvent = {
  event: string;
  properties?: Record<string, any>;
};

/**
 * Track an analytics event
 * @param event - The event name (e.g., 'CTA_Clicked', 'Page_Viewed')
 * @param properties - Additional properties about the event
 */
export function trackEvent(event: string, properties?: Record<string, any>) {
  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event, properties);
  }

  // TODO: Integrate with your analytics service
  // Examples:

  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, properties);
  }

  // PostHog
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(event, properties);
  }

  // Mixpanel
  if (typeof window !== 'undefined' && (window as any).mixpanel) {
    (window as any).mixpanel.track(event, properties);
  }

  // Segment
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.track(event, properties);
  }
}

/**
 * Track a page view
 * @param pageName - The name of the page
 * @param properties - Additional properties about the page view
 */
export function trackPageView(pageName: string, properties?: Record<string, any>) {
  trackEvent('Page_Viewed', { page: pageName, ...properties });
}

/**
 * Track a CTA click
 * @param ctaName - The name of the CTA
 * @param position - Where the CTA is located (e.g., 'hero', 'pricing', 'footer')
 * @param properties - Additional properties
 */
export function trackCTAClick(
  ctaName: string,
  position: string,
  properties?: Record<string, any>
) {
  trackEvent('CTA_Clicked', {
    cta_name: ctaName,
    position,
    ...properties,
  });
}

/**
 * Track a form submission
 * @param formName - The name of the form
 * @param properties - Additional properties
 */
export function trackFormSubmission(
  formName: string,
  properties?: Record<string, any>
) {
  trackEvent('Form_Submitted', { form_name: formName, ...properties });
}

/**
 * Track a user signup
 * @param method - The signup method (e.g., 'email', 'google')
 * @param properties - Additional properties
 */
export function trackSignup(method: string, properties?: Record<string, any>) {
  trackEvent('User_Signed_Up', { method, ...properties });
}

/**
 * Identify a user for analytics
 * @param userId - The user ID
 * @param properties - User properties
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 User Identified:', userId, properties);
  }

  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('set', { user_id: userId });
    if (properties) {
      (window as any).gtag('set', 'user_properties', properties);
    }
  }

  // PostHog
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.identify(userId, properties);
  }

  // Mixpanel
  if (typeof window !== 'undefined' && (window as any).mixpanel) {
    (window as any).mixpanel.identify(userId);
    if (properties) {
      (window as any).mixpanel.people.set(properties);
    }
  }

  // Segment
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.identify(userId, properties);
  }
}

// =============================================================================
// Predefined GA4 Events for easy tracking
// =============================================================================

type GTagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

const sendGAEvent = ({ action, category, label, value }: GTagEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export const gaEvents = {
  // Landing page events
  trialSignupClick: (location: string) => {
    sendGAEvent({
      action: 'trial_signup_click',
      category: 'engagement',
      label: location, // 'hero', 'pricing', 'footer'
    });
  },

  // Auth events
  signupComplete: () => {
    sendGAEvent({
      action: 'signup_complete',
      category: 'conversion',
    });
  },

  loginComplete: () => {
    sendGAEvent({
      action: 'login_complete',
      category: 'engagement',
    });
  },

  // Document events
  documentCreated: () => {
    sendGAEvent({
      action: 'document_created',
      category: 'engagement',
    });
  },

  videoUploaded: () => {
    sendGAEvent({
      action: 'video_uploaded',
      category: 'engagement',
    });
  },

  imageUploaded: () => {
    sendGAEvent({
      action: 'image_uploaded',
      category: 'engagement',
    });
  },

  // Upgrade events
  upgradeClick: (plan: string) => {
    sendGAEvent({
      action: 'upgrade_click',
      category: 'conversion',
      label: plan, // 'basic', 'pro'
    });
  },

  checkoutStarted: (plan: string, price: number) => {
    sendGAEvent({
      action: 'checkout_started',
      category: 'conversion',
      label: plan,
      value: price,
    });
  },

  purchaseComplete: (plan: string, price: number) => {
    sendGAEvent({
      action: 'purchase',
      category: 'conversion',
      label: plan,
      value: price,
    });
  },

  // Export events
  pdfExport: () => {
    sendGAEvent({
      action: 'pdf_export',
      category: 'engagement',
    });
  },
};
