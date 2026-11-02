import { z } from 'zod';

export const LatitudeSchema = z.number().min(-90).max(90);
export const LongitudeSchema = z.number().min(-180).max(180);

export const CoordinatesSchema = z.object({
  lat: LatitudeSchema,
  lon: LongitudeSchema,
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;
