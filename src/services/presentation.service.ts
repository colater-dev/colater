import { Firestore, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, Timestamp, limit } from 'firebase/firestore';
import { Presentation } from '@/lib/types';

export class PresentationService {
    constructor(private firestore: Firestore) { }

    private getPresentationsCollection(userId: string, brandId: string) {
        return collection(this.firestore, `users/${userId}/brands/${brandId}/presentations`);
    }

    async getPresentation(userId: string, brandId: string, presentationId: string): Promise<Presentation | null> {
        const docRef = doc(this.firestore, `users/${userId}/brands/${brandId}/presentations/${presentationId}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Presentation;
        }
        return null;
    }

    async getLatestPresentation(userId: string, brandId: string): Promise<Presentation | null> {
        const q = query(this.getPresentationsCollection(userId, brandId), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            return { id: firstDoc.id, ...firstDoc.data() } as Presentation;
        }
        return null;
    }

    async savePresentation(userId: string, brandId: string, presentation: Partial<Presentation>): Promise<string> {
        const id = presentation.id || doc(this.getPresentationsCollection(userId, brandId)).id;
        const docRef = doc(this.firestore, `users/${userId}/brands/${brandId}/presentations/${id}`);

        const data = {
            ...presentation,
            id,
            brandId,
            userId,
            lastEdited: Timestamp.now(),
            version: (presentation.version || 0) + 1,
            createdAt: presentation.createdAt || Timestamp.now()
        };

        await setDoc(docRef, data, { merge: true });
        return id;
    }

    async generateShareToken(userId: string, brandId: string, presentationId: string): Promise<string> {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const docRef = doc(this.firestore, `users/${userId}/brands/${brandId}/presentations/${presentationId}`);
        await updateDoc(docRef, { shareToken: token, isPublic: true });
        return token;
    }

    async getPresentationByShareToken(token: string): Promise<Presentation | null> {
        const publicRef = doc(this.firestore, `public_presentations/${token}`);
        const publicSnap = await getDoc(publicRef);
        if (publicSnap.exists()) {
            const { userId, brandId, presentationId } = publicSnap.data() as { userId: string; brandId: string; presentationId: string };
            return this.getPresentation(userId, brandId, presentationId);
        }
        return null;
    }

    async makePublic(userId: string, brandId: string, presentationId: string): Promise<string> {
        const token = Math.random().toString(36).substring(2, 15);
        const presentationRef = doc(this.firestore, `users/${userId}/brands/${brandId}/presentations/${presentationId}`);

        await updateDoc(presentationRef, {
            shareToken: token,
            isPublic: true
        });

        // Create lookup
        const lookupRef = doc(this.firestore, `public_presentations/${token}`);
        await setDoc(lookupRef, { userId, brandId, presentationId, createdAt: Timestamp.now() });

        return token;
    }

    async updateSlide(userId: string, brandId: string, presentationId: string, slideId: string, content: Record<string, unknown>): Promise<void> {
        const presentation = await this.getPresentation(userId, brandId, presentationId);
        if (!presentation) return;

        const newSlides = presentation.slides.map(slide =>
            slide.slideId === slideId ? { ...slide, content: { ...slide.content, ...content } } : slide
        );

        await this.savePresentation(userId, brandId, {
            id: presentationId,
            slides: newSlides,
            version: presentation.version
        });
    }
}

export const createPresentationService = (firestore: Firestore) => new PresentationService(firestore);
