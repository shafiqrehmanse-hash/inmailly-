/**
 * Response screenshots for the landing page showcase.
 *
 * To add your own image:
 * 1. Save PNG to public/screenshots/reply-1.png
 * 2. Set src: "/screenshots/reply-1.png" and useMock: false
 *
 * Or paste base64:
 * imageBase64: "data:image/png;base64,...."
 * useMock: false
 */

export type ResponseScreenshot = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  src?: string;
  imageBase64?: string;
  useMock: boolean;
};

export const RESPONSE_SCREENSHOTS: ResponseScreenshot[] = [
  {
    id: "1",
    title: "VP Sales — same-day reply",
    subtitle: "Real InMail response captured from live campaign",
    tag: "Interested",
    useMock: true,
  },
  {
    id: "2",
    title: "Founder asks for pricing",
    subtitle: "Qualified lead requesting volume quote",
    tag: "Hot lead",
    useMock: true,
  },
  {
    id: "3",
    title: "Meeting booked",
    subtitle: "Discovery call scheduled from outreach thread",
    tag: "Meeting set",
    useMock: true,
  },
];
