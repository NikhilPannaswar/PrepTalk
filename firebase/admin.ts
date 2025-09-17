import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv"
dotenv.config()

const initFirebaseAdmin = () => {
    const apps = getApps();

    if(!apps.length){
        // Check if Firebase credentials are available
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

        // Only initialize if all required credentials are present
        if (projectId && clientEmail && privateKey) {
            try {
                initializeApp({
                    credential: cert({
                        projectId,
                        clientEmail,
                        privateKey
                    })
                });
                
                return {
                    auth: getAuth(),
                    db: getFirestore()
                };
            } catch (error) {
                console.warn("Firebase Admin initialization failed:", error);
                return createMockFirebase();
            }
        } else {
            console.warn("Firebase credentials not found, using mock implementation for demo");
            return createMockFirebase();
        }
    }
    
    return {
        auth: getAuth(),
        db: getFirestore()
    };
}

// Mock Firebase implementation for demo mode
const createMockFirebase = () => {
    const mockCollection = {
        doc: (id?: string) => ({
            get: async () => ({ exists: false, data: () => null }),
            set: async (data: any) => console.log("Mock Firebase: Would save", data),
            id: id || `mock-${Date.now()}`
        }),
        add: async (data: any) => {
            console.log("Mock Firebase: Would add", data);
            return { id: `mock-${Date.now()}` };
        },
        where: () => mockCollection,
        orderBy: () => mockCollection,
        limit: () => mockCollection,
        get: async () => ({ empty: true, docs: [] })
    };

    return {
        auth: {
            getUserByEmail: async () => null,
            verifySessionCookie: async () => null
        },
        db: {
            collection: () => mockCollection
        }
    };
};

export const { auth, db } = initFirebaseAdmin();
