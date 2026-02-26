import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Firestore,
  CollectionReference,
  DocumentReference,
  Query,
  query,
  orderBy
} from 'firebase/firestore';
import type { Logo } from '@/lib/types';

/**
 * Service layer for logo-related operations.
 */
export class LogoService {
  constructor(private firestore: Firestore) { }

  /**
   * Get the logo generations collection for a brand
   */
  getLogosCollection(userId: string, brandId: string): CollectionReference {
    return collection(
      this.firestore,
      `users/${userId}/brands/${brandId}/logoGenerations`
    );
  }

  /**
   * Get a query for all logos of a brand, ordered by creation date
   */
  getLogosQuery(userId: string, brandId: string): Query {
    return query(
      this.getLogosCollection(userId, brandId),
      orderBy('createdAt', 'desc')
    );
  }

  /**
   * Get a logo document reference
   */
  getLogoDoc(
    userId: string,
    brandId: string,
    logoId: string
  ): DocumentReference {
    return doc(
      this.firestore,
      `users/${userId}/brands/${brandId}/logoGenerations/${logoId}`
    );
  }

  /**
   * Create a new logo generation
   */
  async createLogo(
    userId: string,
    brandId: string,
    logoUrl: string
  ): Promise<string> {
    const logosCollection = this.getLogosCollection(userId, brandId);

    const docData = {
      userId,
      brandId,
      logoUrl,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(logosCollection, docData);
    return docRef.id;
  }

  /**
   * Update a logo with colorized version and palette
   */
  async updateLogoWithColor(
    userId: string,
    brandId: string,
    logoId: string,
    colorLogoUrl: string,
    palette: string[]
  ): Promise<void> {
    const logoDoc = this.getLogoDoc(userId, brandId, logoId);
    await updateDoc(logoDoc, {
      colorLogoUrl,
      palette,
    });
  }

  /**
   * Update a logo with crop details
   */
  async updateLogoCropDetails(
    userId: string,
    brandId: string,
    logoId: string,
    cropDetails: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    const logoDoc = this.getLogoDoc(userId, brandId, logoId);
    await updateDoc(logoDoc, {
      cropDetails,
    });
  }

  /**
   * Soft delete a logo generation
   */
  async deleteLogo(
    userId: string,
    brandId: string,
    logoId: string
  ): Promise<void> {
    const logoDoc = this.getLogoDoc(userId, brandId, logoId);
    await updateDoc(logoDoc, {
      isDeleted: true
    });
  }

  /**
   * Update logo rating and feedback
   */
  async updateLogoRating(
    userId: string,
    brandId: string,
    logoId: string,
    rating: number,
    feedback?: string
  ): Promise<void> {
    const logoDoc = this.getLogoDoc(userId, brandId, logoId);
    const updates: Partial<Logo> = { rating };
    if (feedback !== undefined) {
      updates.feedback = feedback;
    }
    await updateDoc(logoDoc, updates);
  }
}

/**
 * Factory function to create a LogoService instance
 */
export function createLogoService(firestore: Firestore): LogoService {
  return new LogoService(firestore);
}
