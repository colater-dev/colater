import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Firestore,
  CollectionReference,
  DocumentReference,
  Query,
  query,
  orderBy
} from 'firebase/firestore';

/**
 * Service layer for tagline-related operations.
 */
export class TaglineService {
  constructor(private firestore: Firestore) {}

  /**
   * Get the tagline generations collection for a brand
   */
  getTaglinesCollection(userId: string, brandId: string): CollectionReference {
    return collection(
      this.firestore,
      `users/${userId}/brands/${brandId}/taglineGenerations`
    );
  }

  /**
   * Get a query for all taglines of a brand, ordered by creation date
   */
  getTaglinesQuery(userId: string, brandId: string): Query {
    return query(
      this.getTaglinesCollection(userId, brandId),
      orderBy('createdAt', 'desc')
    );
  }

  /**
   * Get a tagline document reference
   */
  getTaglineDoc(
    userId: string,
    brandId: string,
    taglineId: string
  ): DocumentReference {
    return doc(
      this.firestore,
      `users/${userId}/brands/${brandId}/taglineGenerations/${taglineId}`
    );
  }

  /**
   * Create a new tagline generation
   */
  async createTagline(
    userId: string,
    brandId: string,
    tagline: string
  ): Promise<string> {
    const taglinesCollection = this.getTaglinesCollection(userId, brandId);

    const docData = {
      userId,
      brandId,
      tagline,
      createdAt: serverTimestamp(),
      status: 'generated' as const,
    };

    const docRef = await addDoc(taglinesCollection, docData);
    return docRef.id;
  }

  /**
   * Create multiple tagline generations at once
   */
  async createMultipleTaglines(
    userId: string,
    brandId: string,
    taglines: string[]
  ): Promise<string[]> {
    const promises = taglines.map(tagline =>
      this.createTagline(userId, brandId, tagline)
    );
    return Promise.all(promises);
  }

  /**
   * Update a tagline's status
   */
  async updateTaglineStatus(
    userId: string,
    brandId: string,
    taglineId: string,
    status: 'generated' | 'liked' | 'disliked'
  ): Promise<void> {
    const taglineDoc = this.getTaglineDoc(userId, brandId, taglineId);
    await updateDoc(taglineDoc, { status });
  }

  /**
   * Delete a tagline
   */
  async deleteTagline(
    userId: string,
    brandId: string,
    taglineId: string
  ): Promise<void> {
    const taglineDoc = this.getTaglineDoc(userId, brandId, taglineId);
    await deleteDoc(taglineDoc);
  }
}

/**
 * Factory function to create a TaglineService instance
 */
export function createTaglineService(firestore: Firestore): TaglineService {
  return new TaglineService(firestore);
}
