import {
  classifyActivityBookingRequirement,
  generateActivityBookingLinks,
} from './activity-booking.service';

export const classifyActivity = (title: string, city?: string) => ({
  bookingRequired: classifyActivityBookingRequirement(title),
  bookingOptions: generateActivityBookingLinks(title, city),
});
